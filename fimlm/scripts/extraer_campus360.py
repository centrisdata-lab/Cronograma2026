"""
Extrae los datos del dashboard Campus 360 Live conectandose a una ventana de
Chrome ya autenticada (perfil separado, lanzada con iniciar_chrome_debug.ps1
y puerto de depuracion remota 9222), y regenera el CSV consolidado que usa
build_report.ps1.

No navega la interfaz: llama directamente al endpoint que el propio dashboard
usa para cargar sus datos (POST /api/campus/dashboard), reutilizando la sesion
de la pestana ya abierta. Requiere que esa ventana de Chrome siga abierta.

Uso:  py scripts\\extraer_campus360.py
"""
import asyncio
import csv
import json
import re
import sys
import unicodedata
from datetime import datetime, timezone, timedelta
from pathlib import Path

from playwright.async_api import async_playwright

BOGOTA_TZ = timezone(timedelta(hours=-5))
HISTORIAL_HORAS = 24

ROOT = Path(__file__).resolve().parent.parent
OUT_CSV = ROOT / "data" / "FIMLM_Colombia_6_zonas_completo.csv"
PREV_CSV = ROOT / "data" / "FIMLM_Colombia_6_zonas_anterior.csv"
BOLETINES_DIR = ROOT / "data" / "boletines"
DEBUG_URL = "http://localhost:9222"

EDAD_LABELS = {18: "18-25", 26: "26-35", 36: "36-45", 46: "46-60", 61: "61+"}

# Zona a usar cuando un departamento no esta en la tabla de zonas. No deberia
# pasar, pero si el dashboard empieza a reportar un departamento nuevo es
# preferible mostrarlo agrupado aparte que perderlo o romper el informe.
ZONA_DESCONOCIDA = "Sin zona asignada"

# Cursos que no se van a ofertar y por eso se excluyen por completo del
# informe (KPIs, alertas, tabla de zonas) aunque el dashboard los siga
# reportando. Formato "C-<codigo>", igual al que arma build_csv().
CURSOS_EXCLUIDOS = {
    "C-2579",  # Sistemas e Informatica | Nivel basico, Bogota & Cundinamarca -- 7 grupos, 0 matriculados, no se ofertara
    "C-2519",  # Bonsai en Alambre y Pedreria, Antioquia & Eje Cafetero -- no se ofertara
    "C-2542",  # English Leasing a Conversacion, Antioquia & Eje Cafetero -- no se ofertara
    "C-2538",  # Huertas Caseras, Antioquia & Eje Cafetero -- no se ofertara
    "C-2541",  # Sistemas e Informatica - Sistema Basico, Antioquia & Eje Cafetero -- no se ofertara
}

# Fuente unica de zonas y departamentos, compartida con la app y el Informe
# Nacional. Si hay que corregir a que zona pertenece un departamento, se edita
# alli y no aqui.
ZONAS_JSON = ROOT.parent / "data" / "zonas.json"


def strip_accents(s):
    if s is None:
        return ""
    formD = unicodedata.normalize("NFD", s)
    stripped = "".join(c for c in formD if unicodedata.category(c) != "Mn")
    return stripped.replace("Ñ", "N").replace("ñ", "n")


def _cargar_zonas():
    """Lee data/zonas.json y arma las tablas que usa el resto del script.

    Los nombres se guardan sin tildes porque asi es como viajan por todo el
    pipeline de FIMLM (ver strip_accents): el CSV se escribe sin ellas para
    que no se corrompa segun la codificacion con que se abra."""
    datos = json.loads(ZONAS_JSON.read_text(encoding="utf-8"))
    zona_map = {}
    dep_a_zona = {}
    for z in datos["zonas"]:
        nombre = strip_accents(z["nombre"])
        zona_map[z["nombreDashboard"]] = nombre
        for dep in z["departamentos"]:
            dep_a_zona[strip_accents(dep)] = nombre
    # Variantes con las que el dashboard nombra un mismo departamento.
    for variante, real in datos.get("aliasDepartamento", {}).items():
        zona = dep_a_zona.get(strip_accents(real))
        if zona:
            dep_a_zona[strip_accents(variante)] = zona
    return zona_map, dep_a_zona


# ZONA_MAP: nombre tal como lo envia el dashboard -> nombre a mostrar.
ZONA_MAP, _DEP_A_ZONA_RAW = _cargar_zonas()


def _dep_key(nombre):
    """Clave normalizada para comparar departamentos sin que estorben
    tildes, mayusculas ni signos: el dashboard manda 'Narino'/'Boyaca'
    mientras que la tabla de zonas se escribe 'Nariño'/'Boyacá'."""
    return "".join(c for c in strip_accents(nombre or "").lower() if c.isalnum())


_DEP_A_ZONA = {_dep_key(dep): zona for dep, zona in _DEP_A_ZONA_RAW.items()}


def zona_de_departamento(departamento):
    clave = _dep_key(departamento)
    if not clave:
        return ZONA_DESCONOCIDA
    zona = _DEP_A_ZONA.get(clave)
    if zona:
        return zona
    # Coincidencia por prefijo: el dashboard a veces alarga el nombre de un
    # departamento ("Archipielago de San Andres" -> "... , Providencia y Santa
    # Catalina"). Sin esto, una variante nueva quedaria sin zona asignada.
    for dep_clave, dep_zona in _DEP_A_ZONA.items():
        if clave.startswith(dep_clave) or dep_clave.startswith(clave):
            return dep_zona
    return ZONA_DESCONOCIDA


def csv_field(val):
    s = str(val)
    if any(c in s for c in [",", '"', "\n"]):
        s = '"' + s.replace('"', '""') + '"'
    return s


def csv_row(*vals):
    return ",".join(csv_field(v) for v in vals)


async def fetch_dashboard_data():
    async with async_playwright() as p:
        try:
            browser = await p.chromium.connect_over_cdp(DEBUG_URL, timeout=10000)
        except Exception as e:
            raise RuntimeError(
                "No se pudo conectar a Chrome en " + DEBUG_URL + ". "
                "Verifica que la ventana dedicada siga abierta "
                "(powershell -File scripts\\iniciar_chrome_debug.ps1 si no)."
            ) from e

        ctx = browser.contexts[0]
        page = None
        for pg in ctx.pages:
            if "fimlm" in pg.url.lower():
                page = pg
                break
        if page is None:
            raise RuntimeError(
                "La ventana de Chrome esta abierta pero no tiene ninguna pestana "
                "de registros.fimlm.org. Navega a esa URL en esa ventana."
            )

        captured = {}

        async def on_response(resp):
            if "/api/campus/dashboard" in resp.url and resp.request.method == "POST":
                try:
                    captured["data"] = (await resp.json())["data"]
                    captured["status"] = resp.status
                except Exception as e:
                    # El dashboard a veces dispara más de un POST a este
                    # endpoint durante el reload (uno inicial y un retry
                    # propio de la página ~30s después). Si el PRIMERO no
                    # trae "data" (p.ej. una respuesta transitoria de
                    # error), no se debe abortar la espera: se guarda el
                    # error solo si todavía no hay uno, para no pisar un
                    # "data" que ya haya llegado de una respuesta anterior,
                    # y se sigue esperando por si el siguiente POST sí trae
                    # los datos buenos.
                    if "data" not in captured:
                        captured["error"] = str(e)

        page.on("response", on_response)
        # "networkidle" nunca se alcanza en este dashboard (tiene polling/
        # websockets de fondo), así que el reload esperaba con el criterio
        # equivocado y expiraba a los 45s aunque la respuesta que nos
        # importa (POST /api/campus/dashboard) ya hubiera llegado. Se usa
        # "load" (carga inicial del documento) y luego se espera
        # activamente a que el listener capture esa respuesta puntual.
        # El propio POST puede tardar 30s+ en responder cuando el dashboard
        # de origen está lento (medido hasta ~33s en pruebas), así que se
        # espera el margen completo de 90s y solo se corta antes si ya
        # llegó un "data" válido -- un "error" por sí solo no corta la
        # espera, porque puede llegar un segundo POST con los datos buenos.
        await page.reload(wait_until="load", timeout=45000)
        for _ in range(180):
            if "data" in captured:
                break
            await page.wait_for_timeout(500)
        await browser.close()

        if "data" not in captured:
            err = captured.get("error", "respuesta del API no capturada (timeout esperando POST /api/campus/dashboard)")
            raise RuntimeError(f"No se pudo obtener datos del dashboard: {err}")
        return captured["data"]


def build_csv(data):
    lines = []

    # ---------- Secciones 1-3: resumen / cursos / grupos (solo 6 zonas Colombia) ----------
    validacion = [v for v in data["validacion_cupos"] if v["convocatoria"] in ZONA_MAP]
    if len(validacion) != 6:
        found = [v["convocatoria"] for v in validacion]
        raise RuntimeError(f"Se esperaban 6 zonas, se encontraron {len(validacion)}: {found}")

    sec1_rows = []
    sec2_rows = []
    sec3_rows = []
    grupos_snapshot = {}
    tot_mat = tot_cap = tot_disp = tot_grp = tot_esp = tot_bajo = 0

    for zona in validacion:
        zona_nombre = ZONA_MAP[zona["convocatoria"]]
        # Se filtra ANTES de iterar, no dentro del loop, para que el
        # curso excluido tampoco cuente en len(cursos_zona) (columna
        # "Cursos ofertados" de la zona en la Seccion 1).
        cursos_zona = [c for c in zona["cursos"] if f"C-{c['codigo']}" not in CURSOS_EXCLUIDOS]
        z_mat = z_cap = z_esp = z_grp = 0
        z_bajo = 0
        for curso in cursos_zona:
            cap = curso["capacidad"]
            mat = curso["matriculas"]
            grupos = curso["grupos"]
            esp = sum(g["en_espera"] for g in grupos)
            llenos = sum(1 for g in grupos if g["cupo"] == g["matriculas"])
            disp = cap - mat
            ocu = (mat / cap * 100) if cap else 0
            codigo = f"C-{curso['codigo']}"
            nombre = strip_accents(curso["curso"])

            sec2_rows.append(csv_row(zona_nombre, codigo, nombre, len(grupos), cap, mat, disp, llenos, esp))

            for g in grupos:
                dias = strip_accents(",".join(g["dias"]))
                horario = strip_accents(f"{dias} {g['horario']}".strip())
                sec3_rows.append(csv_row(zona_nombre, codigo, nombre, g["grupo"], horario, g["cupo"], g["matriculas"], g["en_espera"]))
                key = f"{zona_nombre}|{codigo}|{g['grupo']}"
                grupos_snapshot[key] = {"z": zona_nombre, "cod": codigo, "nom": nombre, "g": g["grupo"], "mat": g["matriculas"]}

            z_mat += mat
            z_cap += cap
            z_esp += esp
            z_grp += len(grupos)
            if ocu < 30:
                z_bajo += 1

        z_disp = z_cap - z_mat
        z_ocu = round((z_mat / z_cap * 100), 1) if z_cap else 0
        sec1_rows.append(csv_row(zona_nombre, z_mat, z_mat, z_cap, z_disp, z_ocu, len(cursos_zona), z_grp, z_esp, z_bajo))
        tot_mat += z_mat; tot_cap += z_cap; tot_disp += z_disp
        tot_grp += z_grp; tot_esp += z_esp; tot_bajo += z_bajo

    tot_ocu = round((tot_mat / tot_cap * 100), 1) if tot_cap else 0

    lines.append("SECCION 1 - RESUMEN POR ZONA")
    lines.append("")
    lines.append('"Zona","Matriculas","Personas","Capacidad (meta)","Cupos disponibles","Ocupacion (%)","Cursos","Grupos","En espera","Cursos baja ocupacion (<30%)"')
    lines.extend(sec1_rows)
    lines.append(csv_row("Total 6 zonas", tot_mat, tot_mat, tot_cap, tot_disp, tot_ocu, "", tot_grp, tot_esp, tot_bajo))
    lines.append("")

    lines.append("SECCION 2 - DETALLE DE CURSOS POR ZONA")
    lines.append("")
    lines.append('"Zona","Codigo","Curso","Grupos","Capacidad","Matriculados","Disponibles","Grupos llenos","En espera"')
    lines.extend(sec2_rows)
    lines.append("")

    lines.append("SECCION 3 - DETALLE DE GRUPOS POR CURSO")
    lines.append("")
    lines.append('"Zona","Codigo","Curso","Grupo","Horario","Capacidad","Matriculados","En espera"')
    lines.extend(sec3_rows)
    lines.append("")

    # ---------- Seccion 4: iglesias sin matricula ----------
    lines.append("SECCION 4 - IGLESIAS SIN MATRICULA")
    lines.append("")
    lines.append('"Zona","Departamento","Iglesia","Matriculados"')
    for i in data["iglesias"]["sin_co_departamentos"]:
        dep = strip_accents(i["departamento"])
        lines.append(csv_row(zona_de_departamento(dep), dep, strip_accents(i["iglesia"]), 0))
    lines.append("")

    # ---------- Seccion 5: otros datos globales ----------
    lines.append("SECCION 5 - OTROS DATOS GLOBALES")
    lines.append("")
    lines.append('"Categoria","Etiqueta","Valor"')
    for g in data["demanda"]["genero"]:
        lines.append(csv_row("genero", g["etiqueta"], g["n"]))
    for e in data["demanda"]["edades"]:
        label = EDAD_LABELS.get(e["rango"], str(e["rango"]))
        lines.append(csv_row("edad", label, e["n"]))
    for et in data["demanda"]["etnia"]:
        lines.append(csv_row("etnia", strip_accents(et["etiqueta"]), et["n"]))
    disc = data["demanda"]["discapacidad"]
    for d in disc:
        lines.append(csv_row("discapacidad", strip_accents(d["etiqueta"]), d["n"]))
    for c in data.get("conocimiento", {}).get("items", []):
        lines.append(csv_row("conocimiento", strip_accents(c["opcion"]), c["n"]))
    # Pais de residencia (global): solo se guarda el total de Colombia y el
    # total general, para poder estimar que fraccion de "conocimiento" es
    # probablemente de Colombia (el dashboard no cruza ambas dimensiones
    # persona por persona, asi que esto es una proporcion, no un dato exacto).
    origen_pais = data["demanda"].get("origen_pais", [])
    total_pais = sum(o["n"] for o in origen_pais)
    colombia_pais = next((o["n"] for o in origen_pais if o["etiqueta"].strip().lower() == "colombia"), 0)
    lines.append(csv_row("origen_pais", "Colombia", colombia_pais))
    lines.append(csv_row("origen_pais", "Total", total_pais))
    lines.append("")

    # ---------- Seccion 6: iglesias con inscripcion ----------
    lines.append("SECCION 6 - IGLESIAS CON INSCRIPCION (COLOMBIA)")
    lines.append("")
    lines.append('"Zona","Departamento","Iglesia","Inscritos"')
    for i in data["demanda"]["iglesia_co_departamentos"]:
        dep = strip_accents(i["departamento"])
        lines.append(csv_row(zona_de_departamento(dep), dep, strip_accents(i["iglesia"]), i["n"]))
    lines.append("")

    # ---------- Seccion 7: metadatos de la extraccion ----------
    corte = datetime.now(BOGOTA_TZ).isoformat()
    lines.append("SECCION 7 - METADATOS")
    lines.append("")
    lines.append('"Clave","Valor"')
    lines.append(csv_row("corte_datos", corte))

    counts = {
        "zonas": len(sec1_rows), "cursos": len(sec2_rows), "grupos": len(sec3_rows),
        "iglesias_sin": len(data["iglesias"]["sin_co_departamentos"]),
        "iglesias_con": len(data["demanda"]["iglesia_co_departamentos"]),
    }
    return "\n".join(lines) + "\n", counts, grupos_snapshot, corte


def parse_grupos_snapshot_from_csv(path):
    """Lee solo la SECCION 3 (detalle de grupos) de un CSV con el formato
    multi-seccion que genera este mismo script, devolviendo un dict
    {"zona|codigo|grupo": {z, cod, nom, g, mat}}. Usado para comparar el
    corte anterior contra el actual sin volver a llamar al dashboard."""
    if not path.exists():
        return {}
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    markers = [
        "SECCION 2 - DETALLE DE CURSOS POR ZONA", "SECCION 3 - DETALLE DE GRUPOS POR CURSO",
        "SECCION 4 - IGLESIAS SIN MATRICULA", "SECCION 5 - OTROS DATOS GLOBALES",
        "SECCION 6 - IGLESIAS CON INSCRIPCION (COLOMBIA)", "SECCION 7 - METADATOS",
    ]
    start = None
    for i, ln in enumerate(lines):
        if ln.strip() == "SECCION 3 - DETALLE DE GRUPOS POR CURSO":
            start = i
            break
    if start is None:
        return {}
    end = len(lines)
    for i in range(start + 1, len(lines)):
        if lines[i].strip() in markers:
            end = i
            break
    block = [ln for ln in lines[start + 1:end] if ln.strip()]
    if block and block[0].startswith('"Zona"'):
        block = block[1:]

    snapshot = {}
    reader = csv.reader(block)
    for row in reader:
        if len(row) != 8:
            continue
        zona, cod, nom, grupo, _horario, _cap, mat, _esp = row
        key = f"{zona}|{cod}|{grupo}"
        snapshot[key] = {"z": zona, "cod": cod, "nom": nom, "g": grupo, "mat": int(mat)}
    return snapshot


def diff_grupos(actual, anterior):
    """Devuelve la lista de grupos cuyos matriculados subieron entre dos snapshots."""
    novedades = []
    for key, cur in actual.items():
        prev = anterior.get(key)
        if prev is None:
            continue
        if cur["mat"] > prev["mat"]:
            novedades.append({
                "z": cur["z"], "cod": cur["cod"], "nom": cur["nom"], "g": cur["g"],
                "matAntes": prev["mat"], "matAhora": cur["mat"], "delta": cur["mat"] - prev["mat"],
            })
    return novedades


def guardar_boletin(corte, novedades):
    """Guarda un boletin JSON con las novedades de este corte y elimina los
    boletines con mas de HISTORIAL_HORAS de antiguedad."""
    BOLETINES_DIR.mkdir(parents=True, exist_ok=True)
    safe_name = re.sub(r"[^0-9A-Za-z]", "-", corte) + ".json"
    boletin = {"corte": corte, "novedades": novedades}
    (BOLETINES_DIR / safe_name).write_text(
        json.dumps(boletin, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    limite = datetime.now(BOGOTA_TZ) - timedelta(hours=HISTORIAL_HORAS)
    for f in BOLETINES_DIR.glob("*.json"):
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
            ts = datetime.fromisoformat(data["corte"])
        except Exception:
            continue
        if ts < limite:
            f.unlink()


async def main():
    print("Conectando a Chrome (puerto 9222) y solicitando datos del dashboard...")
    data = await fetch_dashboard_data()
    print("Datos recibidos. Construyendo CSV...")
    csv_text, counts, grupos_snapshot, corte = build_csv(data)

    prev_snapshot = parse_grupos_snapshot_from_csv(OUT_CSV)
    novedades = diff_grupos(grupos_snapshot, prev_snapshot)

    OUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    if OUT_CSV.exists():
        PREV_CSV.write_text(OUT_CSV.read_text(encoding="utf-8"), encoding="utf-8")
    OUT_CSV.write_text(csv_text, encoding="utf-8")
    guardar_boletin(corte, novedades)

    print(f"OK -> {OUT_CSV}")
    print(
        f"Zonas: {counts['zonas']}  Cursos: {counts['cursos']}  Grupos: {counts['grupos']}  "
        f"Iglesias sin matricula: {counts['iglesias_sin']}  Iglesias con inscripcion: {counts['iglesias_con']}"
    )
    print(f"Boletin guardado: {len(novedades)} novedad(es) en el corte {corte}")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except RuntimeError as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)
