"""Genera data/zonas.js a partir de data/zonas.json.

El navegador no puede leer un .json local con fetch() cuando la pagina se abre
como archivo (file://), asi que la app y el Informe Nacional consumen la misma
informacion a traves de un .js que declara las variables globales.

data/zonas.json es la fuente que se edita a mano; data/zonas.js es generado y
NO debe editarse: cualquier cambio ahi se pierde en la siguiente corrida.

Uso:  py scripts/generar_zonas_js.py
"""

import io
import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ORIGEN = RAIZ / "data" / "zonas.json"
DESTINO = RAIZ / "data" / "zonas.js"


def main():
    datos = json.loads(io.open(ORIGEN, encoding="utf-8").read())
    zonas = datos["zonas"]
    alias = datos.get("aliasDepartamento", {})

    zonas_js = json.dumps(zonas, ensure_ascii=False, indent=2)
    alias_js = json.dumps(alias, ensure_ascii=False, indent=2)

    contenido = f"""/* ARCHIVO GENERADO - NO EDITAR A MANO.
   Se genera desde data/zonas.json con:  py scripts/generar_zonas_js.py
   Editar el .json y volver a generar; los cambios hechos aqui se pierden.

   Fuente unica de las 6 zonas de Colombia y sus departamentos, compartida por
   la app (index.html), el Informe Nacional (informe/) y el informe de Cupos y
   Matriculas (fimlm/). */

const ZONAS_CANONICAS = {zonas_js};

/* Variantes con las que el dashboard FIMLM nombra un mismo departamento. */
const ALIAS_DEPARTAMENTO = {alias_js};

/* Departamento -> nombre de la zona a la que pertenece. */
const ZONA_POR_DEPARTAMENTO = (() => {{
  const mapa = {{}};
  ZONAS_CANONICAS.forEach(z => z.departamentos.forEach(d => {{ mapa[d] = z.nombre; }}));
  Object.entries(ALIAS_DEPARTAMENTO).forEach(([variante, real]) => {{
    if (mapa[real]) mapa[variante] = mapa[real];
  }});
  return mapa;
}})();
"""

    io.open(DESTINO, "w", encoding="utf-8", newline="\n").write(contenido)
    print(f"OK -> {DESTINO}")
    print(f"Zonas: {len(zonas)}  Departamentos: {sum(len(z['departamentos']) for z in zonas)}  Alias: {len(alias)}")


if __name__ == "__main__":
    main()
