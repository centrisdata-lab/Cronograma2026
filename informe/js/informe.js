/* ============================================================
   INFORME CUERPO ACADÉMICO — lógica de renderizado
   Módulos independientes: KPIs, tabla comparativa por zona,
   tarjetas de zona (acordeón) y tabla consolidada. Todos
   consumen ZONAS/TOTALES/ROLES definidos en js/datos.js.
   ============================================================ */

(function () {
  "use strict";

  const fmt = new Intl.NumberFormat("es-CO");
  const pct = (parte, total) => (total ? ((parte / total) * 100) : 0);

  /* ---------------------------------------------------------
     0. COBERTURA DEL ENCABEZADO
     Se calcula desde ZONAS para no desincronizarse al mover
     departamentos entre zonas.
     --------------------------------------------------------- */
  function renderCobertura() {
    const el = document.getElementById("cobertura-texto");
    if (!el) return;
    const deps = ZONAS.reduce((n, z) => n + z.departamentos.length, 0);
    el.textContent = `${ZONAS.length} zonas · ${deps} departamentos`;
  }

  /* ---------------------------------------------------------
     1. TARJETAS KPI
     --------------------------------------------------------- */
  function renderKpis() {
    const cont = document.getElementById("kpi-grid");
    if (!cont) return;

    const totalPersonal = TOTALES.personal.totalPersonasUnicas;
    const totalCursos = TOTALES.oferta.cursos;
    const totalCursosUnicos = new Set(CURSOS_DETALLE.map((c) => c.curso)).size;
    const totalGrupos = TOTALES.oferta.grupos;
    const totalCupos = TOTALES.oferta.cupos;
    const totalDepartamentos = ZONAS.reduce((n, z) => n + z.departamentos.length, 0);

    // Emoji por rol/concepto, para reconocer cada fila de un vistazo.
    const emojiRol = {
      profesores: "👩‍🏫", tutores: "🧑‍🏫", administradores: "🗂️", coordinadora: "🧭",
      enlaceTutores: "🔗", apoyoPedagogico: "🧑‍🎓",
      apoyoTutores: "🤝", responsableCurso: "📌",
      encargadoPedagogicoZonal: "🎓", encargadoTutoresZonal: "👔",
      encargadoInformadoresZonal: "🗣️", encargadoSoporteTecnicoZonal: "💻",
      apoyoInformadores: "📣", apoyoSoporteTecnologico: "🛠️", enlaceSoporteTecnologico: "🔌",
    };

    // Filas exactas de la tarjeta "Cuerpo académico" (orden y
    // etiquetas curados a mano; no todas las claves de ROLES
    // aparecen aquí porque esta tarjeta muestra un subconjunto).
    const filasCuerpoAcademico = [
      { emoji: "🧭", label: "Coordinadores Zonales", valor: TOTALES.coordinadoresZonales },
      { emoji: "🏫", label: "Enlaces Campus Delegación Departamental", valor: TOTALES.enlaceDelegacion },
      { emoji: "👩‍🏫", label: "Profesores", valor: TOTALES.personal.profesores },
      { emoji: "🧑‍🏫", label: "Tutores", valor: TOTALES.personal.tutores },
      { emoji: "🗂️", label: "Soporte Tecnológico", valor: TOTALES.personal.administradores },
      { emoji: "👔", label: "Apoyo de tutores zonal", valor: TOTALES.personal.encargadoTutoresZonal },
      { emoji: "🤝", label: "Apoyo tutores (apoyo del zonal)", valor: TOTALES.personal.apoyoTutores },
      { emoji: "🎓", label: "Apoyo pedagógico zonal", valor: TOTALES.personal.encargadoPedagogicoZonal },
      { emoji: "🧑‍🎓", label: "Apoyo pedagógico (apoyo del zonal)", valor: TOTALES.personal.apoyoPedagogico },
      { emoji: "🔗", label: "Enlace de curso", valor: TOTALES.enlacesCurso },
      { emoji: "📌", label: "Responsable de curso", valor: TOTALES.personal.responsableCurso },
      { emoji: "🗣️", label: "Apoyo de informadores zonal", nota: " <small>(solo zona A)</small>", valor: TOTALES.personal.encargadoInformadoresZonal },
      { emoji: "📣", label: "Apoyo informadores (apoyo del zonal)", valor: TOTALES.personal.apoyoInformadores },
      { emoji: "💻", label: "Apoyo soporte tecnológico zonal", valor: TOTALES.personal.encargadoSoporteTecnicoZonal },
      { emoji: "🛠️", label: "Apoyo soporte tecnológico (apoyo del zonal)", valor: TOTALES.personal.apoyoSoporteTecnologico },
    ];

    // Contenido del detalle desplegable de cada tarjeta: una mini
    // tabla de dos columnas (concepto / valor) que sustenta el total.
    const tablaRoles = `
      <table>
        <thead><tr><th>Rol</th><th>Total</th></tr></thead>
        <tbody>
          ${filasCuerpoAcademico.map((f) => `<tr><td>${f.emoji} ${f.label}${f.nota || ""}</td><td>${fmt.format(f.valor)}</td></tr>`).join("")}
          <tr class="fila-total"><td>🧮 Total cuerpo académico</td><td>${fmt.format(totalPersonal)}</td></tr>
        </tbody>
      </table>
      <p style="font-size:12px;color:var(--texto-muted);margin-top:10px;">*Este total (${fmt.format(totalPersonal)}) es la cifra oficial de personas distintas. La suma de los roles de esta tabla da un número mayor porque varias personas cumplen más de un rol a la vez.</p>`;

    const totalGruposCurso = (c) => ZONAS.reduce((s, z) => s + (c[z.id] || 0), 0);
    const totalCuposCurso = (c) => {
      const cupos = CUPOS_POR_CURSO[c.curso];
      return cupos ? Object.values(cupos).reduce((s, v) => s + v, 0) : 0;
    };
    // Emoji por curso, para diferenciarlos de un vistazo en vez de
    // repetir el mismo icono de libro en toda la lista.
    const emojiCurso = {
      "Despertar Humano": "🌅", "Comprensión Lectora": "📗", "Economía del Hogar": "🏠",
      "Bienestar para la persona mayor": "👵", "Sin Límites Virtual": "♿",
      "Despertar Emprendedor": "💡", "Orientación Emprendedora": "🧭",
      "Profundización Costos para Emprendedores": "🧮", "Mi Negocio en Internet": "🛒",
      "Estrategias para la Búsqueda de Empleo": "💼", "Familias Empresarias del Campo": "🌾",
      "Sistemas Nivel 1": "💻", "Sistemas Nivel 2": "💻",
      "Inglés Nivel 1": "🇺🇸", "Inglés Nivel 2": "🇺🇸",
      "Business English 1": "🇺🇸", "Business English 2": "🇺🇸",
      "English for Kids": "🧒", "English for Teens": "🧑",
      "Francés Nivel 1": "🇫🇷", "Francés Nivel 2": "🇫🇷",
      "Italiano Nivel 1": "🇮🇹", "Italiano Nivel 2": "🇮🇹",
      "Portugués Nivel 1": "🇵🇹", "Portugués Nivel 2": "🇵🇹",
      "Bisutería": "💍", "Confección: Manejo de Máquinas de Coser": "🧵",
      "Modistería (Faldas)": "👗", "Modistería: Reparación y Modificación de Prendas de Vestir": "🪡",
      "Muñecas de Trapo": "🧸", "Pintura en madera 1": "🎨", "Peinados y Trenzas": "💇",
      "Floristería 1": "💐", "Repostería 1": "🧁", "Repostería 2": "🧁",
      "El ABC del Reciclaje": "♻️", "Salud y Bienestar para Ovinos y Caprinos": "🐐",
      "Sistemas e Informática · Sistema Básico": "🖥️", "Sistemas e Informática · Nivel Avanzado": "🖥️",
      "Huertas Caseras": "🥕", "English Leasing a Conversación": "🗣️",
      "Bonsái en Alambre y Pedrería": "🪴",
    };

    // Agrupado por categoría (mismo orden que CATEGORIAS_CURSO); dentro
    // de cada categoría se respeta el orden de CURSOS_DETALLE, así los
    // niveles de un mismo curso (Nivel 1, Nivel 2) quedan uno seguido
    // del otro en vez de reordenarse por cantidad de grupos.
    const filasCursosPorCategoria = CATEGORIAS_CURSO.map((cat) => {
      const cursosCat = CURSOS_DETALLE.filter((c) => c.categoria === cat.id);
      if (cursosCat.length === 0) return "";
      const filas = cursosCat
        .map((c) => `<tr><td>${emojiCurso[c.curso] || "📖"} ${c.curso}</td><td>${fmt.format(totalGruposCurso(c))}</td><td>${fmt.format(totalCuposCurso(c))}</td></tr>`)
        .join("");
      return `<tr class="fila-categoria"><td colspan="3">${cat.label}</td></tr>${filas}`;
    }).join("");
    const filasTopCupos = [...CURSOS_DETALLE]
      .sort((a, b) => totalCuposCurso(b) - totalCuposCurso(a))
      .map((c) => `<tr><td>${emojiCurso[c.curso] || "📖"} ${c.curso}</td><td>${fmt.format(totalGruposCurso(c))}</td><td>${fmt.format(totalCuposCurso(c))}</td></tr>`)
      .join("");
    const tablaCursos = `
      <div class="cursos-vista-toggle">
        <button type="button" class="cursos-vista-btn is-active" data-cursos-vista="categoria">📚 Por categoría</button>
        <button type="button" class="cursos-vista-btn" data-cursos-vista="top-cupos">🏆 Top cursos con más cupos</button>
      </div>
      <div data-cursos-vista-panel="categoria">
        <table>
          <thead><tr><th>Curso</th><th>Grupos</th><th>Cupos</th></tr></thead>
          <tbody>
            ${filasCursosPorCategoria}
            <tr class="fila-total"><td>🧮 Total (todos los cursos)</td><td>${fmt.format(totalGrupos)}</td><td>${fmt.format(totalCupos)}</td></tr>
          </tbody>
        </table>
        <p style="font-size:12px;color:var(--texto-muted);margin-top:10px;">*Incluye 50 cupos de un grupo presencial adicional en Bogotá y Cundinamarca aún sin curso identificado.</p>
      </div>
      <div data-cursos-vista-panel="top-cupos" hidden>
        <table>
          <thead><tr><th>Curso</th><th>Grupos</th><th>Cupos</th></tr></thead>
          <tbody>
            ${filasTopCupos}
            <tr class="fila-total"><td>🧮 Total (todos los cursos)</td><td>${fmt.format(totalGrupos)}</td><td>${fmt.format(totalCupos)}</td></tr>
          </tbody>
        </table>
        <p style="font-size:12px;color:var(--texto-muted);margin-top:10px;">*Ordenado de mayor a menor cupo, sumando todas las zonas donde se ofrece cada curso.</p>
      </div>`;

    const tablaGruposPorZona = `
      <table>
        <thead><tr><th>Zona</th><th>Grupos</th></tr></thead>
        <tbody>
          ${[...ZONAS].sort((a, b) => b.oferta.grupos - a.oferta.grupos)
            .map((z) => `<tr><td>${z.emoji} ${z.nombre}</td><td>${fmt.format(z.oferta.grupos)}</td></tr>`).join("")}
          <tr class="fila-total"><td>🧮 Total nacional</td><td>${fmt.format(totalGrupos)}</td></tr>
        </tbody>
      </table>`;

    // Tabla resumen por zona, con cada fila de zona clickeable: al
    // hacer clic se despliega debajo el detalle curso-por-curso-y-
    // grupo de esa zona (fuente: columna "Mi Nube" del reporte).
    const tablaCoberturaGrupos = `
      <p style="font-size:12.5px;color:var(--azul-marino-2);font-weight:700;margin:6px 0 14px;">👉 Haz clic sobre cada zona para ver el detalle por curso y grupo.</p>
      <table class="tabla-cobertura">
        <thead>
          <tr>
            <th>Zona</th>
            <th>1 Tutor</th>
            <th>Sin tutor</th>
            <th>2 Tutores</th>
            <th>1 Profesor</th>
            <th>2 Profesores</th>
          </tr>
        </thead>
        <tbody>
          ${ZONAS.map((z, zi) => {
            const g = GRUPOS_COBERTURA[z.id];
            const grupos = GRUPOS_DETALLE_COBERTURA[z.id] || [];
            const filasDetalle = grupos.map((d) => `<tr><td>${emojiCurso[d.curso] || "📖"} ${d.curso} · Grupo ${d.grupo}</td><td>${fmt.format(d.profesores)}</td><td>${fmt.format(d.tutores)}</td></tr>`).join("");
            return `<tr class="cobertura-zona-fila" data-cobertura-zona-toggle="${zi}" aria-expanded="false" tabindex="0" role="button">
              <td>${z.emoji} ${z.nombre} <span class="cobertura-zona-fila__caret" aria-hidden="true">▾</span></td>
              <td>${fmt.format(g.unTutor)}</td>
              <td>${fmt.format(g.sinTutor)}</td>
              <td>${fmt.format(g.dosTutores)}</td>
              <td>${fmt.format(g.unProfesor)}</td>
              <td>${fmt.format(g.dosProfesores)}</td>
            </tr>
            <tr class="cobertura-zona-detalle" data-cobertura-zona-body="${zi}" hidden>
              <td colspan="6">
                <div class="cobertura-zona-detalle__titulo">Detalle por curso y grupo · ${z.nombre}</div>
                <table class="cobertura-zona-detalle__table">
                  <colgroup><col class="col-curso"><col class="col-num"><col class="col-num"></colgroup>
                  <thead><tr><th>Curso · Grupo</th><th>Profesores</th><th>Tutores</th></tr></thead>
                  <tbody>${filasDetalle}</tbody>
                </table>
              </td>
            </tr>`;
          }).join("")}
          <tr class="fila-total">
            <td>🧮 Total nacional</td>
            <td>${fmt.format(TOTALES.gruposCobertura.unTutor)}</td>
            <td>${fmt.format(TOTALES.gruposCobertura.sinTutor)}</td>
            <td>${fmt.format(TOTALES.gruposCobertura.dosTutores)}</td>
            <td>${fmt.format(TOTALES.gruposCobertura.unProfesor)}</td>
            <td>${fmt.format(TOTALES.gruposCobertura.dosProfesores)}</td>
          </tr>
        </tbody>
      </table>
      <p style="font-size:12px;color:var(--texto-muted);margin-top:10px;">*Los grupos "sin tutor" tienen 2 profesores asignados; uno de ellos hace las veces de tutor en ese grupo.</p>`;

    const tablaCuposPorZona = `
      <table>
        <thead><tr><th>Composición de grupos</th><th>Cupos</th></tr></thead>
        <tbody>
          <tr><td>🧩 4 grupos de 100 cupos</td><td>${fmt.format(4 * 100)}</td></tr>
          <tr><td>🧩 67 grupos de 60 cupos</td><td>${fmt.format(67 * 60)}</td></tr>
          <tr><td>🧩 447 grupos de 50 cupos</td><td>${fmt.format(447 * 50)}</td></tr>
          <tr><td>🧩 5 grupos de 40 cupos</td><td>${fmt.format(5 * 40)}</td></tr>
          <tr><td>🧩 8 grupos de 25 cupos</td><td>${fmt.format(8 * 25)}</td></tr>
        </tbody>
      </table>
      <table style="margin-top:14px;">
        <thead><tr><th>Zona</th><th>Cupos</th></tr></thead>
        <tbody>
          ${[...ZONAS].sort((a, b) => b.oferta.cupos - a.oferta.cupos)
            .map((z) => `<tr><td>${z.emoji} ${z.nombre}</td><td>${fmt.format(z.oferta.cupos)}</td></tr>`).join("")}
          <tr class="fila-total"><td>🧮 Total nacional</td><td>${fmt.format(totalCupos)}</td></tr>
        </tbody>
      </table>`;

    const tablaInformadores = `
      <table>
        <thead><tr><th>Zona</th><th>Informadores</th></tr></thead>
        <tbody>
          ${[...ZONAS].sort((a, b) => b.informadores - a.informadores)
            .map((z) => `<tr><td>${z.emoji} ${z.nombre}</td><td>${fmt.format(z.informadores)}</td></tr>`).join("")}
          <tr><td>❔ Sin departamento asignado</td><td>${fmt.format(INFORMADORES_SIN_ZONA)}</td></tr>
          <tr class="fila-total"><td>🧮 Total nacional</td><td>${fmt.format(TOTALES.informadores)}</td></tr>
        </tbody>
      </table>`;

    const kpis = [
      {
        icon: "👥",
        label: "Cuerpo académico total",
        value: fmt.format(totalPersonal),
        delta: `${ZONAS.length} zonas · ${totalDepartamentos} departamentos`,
        detalle: tablaRoles,
      },
      {
        icon: "📚",
        label: "Cursos activos",
        value: `
          <span class="kpi-card__value-pair">
            <span class="kpi-card__value-item"><span class="kpi-card__value-num">${fmt.format(totalCursos)}</span><span class="kpi-card__value-tag">Sumando zonas</span></span>
            <span class="kpi-card__value-item"><span class="kpi-card__value-num">${fmt.format(totalCursosUnicos)}</span><span class="kpi-card__value-tag">Cursos únicos</span></span>
          </span>`,
        delta: "",
        detalle: tablaCursos,
      },
      {
        icon: "🧩",
        label: "Grupos conformados",
        value: fmt.format(totalGrupos),
        delta: `Promedio: ${(totalGrupos / totalCursos).toFixed(1)} grupos por curso`,
        detalle: tablaGruposPorZona,
      },
      {
        icon: "🎓",
        label: "Cupos ofertados",
        value: fmt.format(totalCupos),
        delta: `4 de 100 · 67 de 60 · 447 de 50 · 5 de 40 · 8 de 25 cupos`,
        detalle: tablaCuposPorZona,
      },
      {
        icon: "📣",
        label: "Informadores inscritos en proyecto",
        value: fmt.format(TOTALES.informadores),
        delta: `${fmt.format(INFORMADORES_SIN_ZONA)} sin departamento asignado`,
        detalle: tablaInformadores,
      },
      {
        icon: "👨‍🏫",
        label: "Grupos con 1 solo profesor o tutor",
        value: `
          <span class="kpi-card__value-pair">
            <span class="kpi-card__value-item"><span class="kpi-card__value-num">${fmt.format(TOTALES.gruposCobertura.unTutor)}</span><span class="kpi-card__value-tag">1 Tutor</span></span>
            <span class="kpi-card__value-item"><span class="kpi-card__value-num">${fmt.format(TOTALES.gruposCobertura.unProfesor)}</span><span class="kpi-card__value-tag">1 Profesor</span></span>
          </span>`,
        delta: `${fmt.format(TOTALES.gruposCobertura.sinTutor)} grupos sin tutor (tienen 2 profesores; uno de ellos hace las veces de tutor)`,
        detalle: tablaCoberturaGrupos,
      },
    ];

    cont.innerHTML = kpis.map((k, idx) => `
      <article class="kpi-card">
        <button class="kpi-card__toggle" type="button" data-kpi-toggle="${idx}" aria-expanded="false" aria-controls="kpi-detalle-panel">
          <div class="kpi-card__icon" aria-hidden="true">${k.icon}</div>
          <span class="kpi-card__label">${k.label}</span>
          <span class="kpi-card__value">${k.value}</span>
          <span class="kpi-card__delta">${k.delta}</span>
          <div class="kpi-card__bar"><span style="width:100%"></span></div>
          <span class="kpi-card__hint">Ver el detalle que sustenta esta cifra</span>
        </button>
      </article>
    `).join("");

    const panel = document.getElementById("kpi-detalle-panel");
    const panelInner = document.getElementById("kpi-detalle-panel-inner");
    const botones = Array.from(cont.querySelectorAll("[data-kpi-toggle]"));

    function posicionarCaret(card) {
      // Centra el triángulo conector bajo la tarjeta activa, para que
      // el panel se vea "pegado" a esa tarjeta y no como un bloque suelto.
      const centroCard = card.offsetLeft + card.offsetWidth / 2;
      panelInner.style.setProperty("--caret-left", `${centroCard}px`);
    }

    function cerrarPanel() {
      panel.classList.remove("is-open");
      botones.forEach((b) => {
        b.setAttribute("aria-expanded", "false");
        b.closest(".kpi-card").classList.remove("is-active");
      });
    }

    botones.forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.kpiToggle);
        const card = btn.closest(".kpi-card");
        const yaActiva = card.classList.contains("is-active");

        if (yaActiva) {
          cerrarPanel();
          return;
        }

        botones.forEach((b) => b.closest(".kpi-card").classList.remove("is-active"));
        card.classList.add("is-active");
        botones.forEach((b) => b.setAttribute("aria-expanded", String(b === btn)));

        panelInner.innerHTML = kpis[idx].detalle;
        posicionarCaret(card);
        panel.classList.add("is-open");
      });
    });

    // Delegado: alterna entre las vistas "Por zona" / "Por curso y
    // grupo" dentro del detalle de la tarjeta "Grupos con 1 solo
    // profesor o tutor" (el HTML se reinyecta cada vez que se abre
    // una tarjeta, por eso el listener vive en el contenedor padre).
    // Cada fila de zona en la tabla de cobertura es clickeable: abre
    // o cierra la fila con el detalle curso-por-curso-y-grupo justo
    // debajo, sin salir de la vista resumen.
    function toggleCoberturaZona(zonaBtn) {
      const idx = zonaBtn.dataset.coberturaZonaToggle;
      const body = panelInner.querySelector(`[data-cobertura-zona-body="${idx}"]`);
      const abierto = zonaBtn.getAttribute("aria-expanded") === "true";
      // Acordeón exclusivo: al abrir una zona se cierran las demás,
      // para no mostrar varios detalles largos a la vez.
      panelInner.querySelectorAll("[data-cobertura-zona-toggle]").forEach((b) => {
        if (b !== zonaBtn) b.setAttribute("aria-expanded", "false");
      });
      panelInner.querySelectorAll("[data-cobertura-zona-body]").forEach((el) => {
        if (el !== body) el.hidden = true;
      });
      zonaBtn.setAttribute("aria-expanded", String(!abierto));
      if (body) body.hidden = abierto;
    }
    // Delegado: alterna entre las vistas "Por categoría" / "Top cursos
    // con más cupos" dentro del detalle de la tarjeta "Cursos activos".
    function toggleCursosVista(vistaBtn) {
      const vista = vistaBtn.dataset.cursosVista;
      panelInner.querySelectorAll("[data-cursos-vista]").forEach((b) => {
        b.classList.toggle("is-active", b === vistaBtn);
      });
      panelInner.querySelectorAll("[data-cursos-vista-panel]").forEach((el) => {
        el.hidden = el.dataset.cursosVistaPanel !== vista;
      });
    }
    panelInner.addEventListener("click", (ev) => {
      const zonaBtn = ev.target.closest("[data-cobertura-zona-toggle]");
      if (zonaBtn) toggleCoberturaZona(zonaBtn);
      const vistaBtn = ev.target.closest("[data-cursos-vista]");
      if (vistaBtn) toggleCursosVista(vistaBtn);
    });
    panelInner.addEventListener("keydown", (ev) => {
      if (ev.key !== "Enter" && ev.key !== " ") return;
      const zonaBtn = ev.target.closest("[data-cobertura-zona-toggle]");
      if (!zonaBtn) return;
      ev.preventDefault();
      toggleCoberturaZona(zonaBtn);
    });

    window.addEventListener("resize", () => {
      const cardActiva = cont.querySelector(".kpi-card.is-active");
      if (cardActiva) posicionarCaret(cardActiva);
    });
  }

  /* ---------------------------------------------------------
     2. TABLA COMPARATIVA POR ZONA
     Una sola tabla con lo esencial de cada zona: cuerpo
     académico, cursos, grupos, cupos y su participación
     porcentual sobre el total nacional.
     --------------------------------------------------------- */
  function renderComparativoZonas() {
    const table = document.getElementById("tabla-comparativo-zonas");
    if (!table) return;

    const thead = `
      <thead>
        <tr>
          <th>Zona</th>
          <th>Cuerpo académico</th>
          <th>Cursos</th>
          <th>Grupos</th>
          <th>Cupos</th>
          <th>Iglesias</th>
          <th>Creyentes</th>
          <th>Informadores</th>
          <th>Coordinadores zonales</th>
          <th>Enlace Campus Delegación</th>
          <th>% de los cupos nacionales</th>
        </tr>
      </thead>`;

    const zonasOrdenadas = [...ZONAS].sort((a, b) => b.oferta.cupos - a.oferta.cupos);

    // Detalle de cada zona (roles + cursos), el mismo contenido que
    // antes vivía en la sección aparte "Detalle por zona": ahora se
    // fusiona como fila expandible bajo cada fila de la tabla
    // comparativa, para no repetir la misma información en dos
    // paneles distintos.
    const detalleZona = (z) => {
      const filasRoles = `<tr><td>Coordinadores Zonales</td><td>${fmt.format(z.coordinadoresZonales)}</td></tr>` + ROLES
        .filter((r) => r.key !== "coordinadora" && z.personal[r.key] > 0)
        .map((r) => `<tr><td>${r.label}</td><td>${fmt.format(z.personal[r.key])}</td></tr>`)
        .join("");

      const cursosDeZona = CURSOS_DETALLE
        .filter((c) => c[z.id] > 0)
        .sort((a, b) => b[z.id] - a[z.id]);

      return `
        <div class="zone-card__content">
          <div class="zone-card__table-wrap">
            <h4 class="zone-card__depts-title">Departamentos que la conforman</h4>
            <div class="zone-card__depts-list">
              ${z.departamentos.map((d) => `<span class="zone-chip">${d}</span>`).join("")}
            </div>
            <table class="zone-card__roles-table">
              <colgroup><col class="col-rol"><col class="col-cantidad"></colgroup>
              <thead><tr><th>Rol</th><th>Cantidad</th></tr></thead>
              <tbody>
                ${filasRoles}
                <tr class="fila-total"><td>Total zona</td><td>${fmt.format(z.personal.total)}</td></tr>
              </tbody>
            </table>
          </div>

          <div class="zone-card__oferta">
            <table class="zone-card__oferta-table">
              <colgroup><col class="col-rol"><col class="col-cantidad"></colgroup>
              <thead><tr><th>Concepto</th><th>Valor</th></tr></thead>
              <tbody>
                <tr><td>Cursos</td><td>${fmt.format(z.oferta.cursos)}</td></tr>
                <tr><td>Grupos</td><td>${fmt.format(z.oferta.grupos)}</td></tr>
                <tr><td>Cupos</td><td>${fmt.format(z.oferta.cupos)}</td></tr>
                <tr><td>Coordinadores zonales</td><td>${fmt.format(z.coordinadoresZonales)}</td></tr>
                <tr>
                  <td>
                    Enlace Campus Delegación
                    <small>${z.notaEnlace || "Uno por departamento, asignado por el coordinador zonal"}</small>
                  </td>
                  <td>${fmt.format(z.enlaceDelegacion)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          ${cursosDeZona.length ? `
          <div class="zone-card__cursos">
            <h4 class="zone-card__cursos-title">
              Cursos con grupos en la zona (${cursosDeZona.length})
            </h4>
            <div class="zone-card__cursos-list">
              ${cursosDeZona.map((c) => `
                <span class="curso-chip">${c.curso}<b>${fmt.format(c[z.id])}</b></span>
              `).join("")}
            </div>
          </div>
          ` : ""}
        </div>`;
    };

    const filas = zonasOrdenadas.map((z, zi) => {
      const share = pct(z.oferta.cupos, TOTALES.oferta.cupos);
      return `
        <tr class="fila-zona-comparativo" data-zona-toggle="${zi}" aria-expanded="false" tabindex="0" role="button" style="--zona-color:${z.color}">
          <td class="cell-zona"><span class="zona-swatch" style="background:${z.color}"></span>${z.emoji} ${z.nombre} <span class="fila-zona-comparativo__caret" aria-hidden="true">▾</span></td>
          <td>${fmt.format(z.personal.total)}</td>
          <td>${fmt.format(z.oferta.cursos)}</td>
          <td>${fmt.format(z.oferta.grupos)}</td>
          <td>${fmt.format(z.oferta.cupos)}</td>
          <td>${fmt.format(z.comunidad.iglesias)}</td>
          <td>${fmt.format(z.comunidad.creyentes)}</td>
          <td>${fmt.format(z.informadores)}</td>
          <td>${fmt.format(z.coordinadoresZonales)}</td>
          <td>${fmt.format(z.enlaceDelegacion)}</td>
          <td class="cell-total">${share.toFixed(1)}%</td>
        </tr>
        <tr class="fila-zona-comparativo-detalle" data-zona-body="${zi}" hidden style="--zona-color:${z.color}">
          <td colspan="11">${detalleZona(z)}</td>
        </tr>
      `;
    }).join("");

    const filaTotal = `
      <tr class="fila-total">
        <td>Total general</td>
        <td>${fmt.format(TOTALES.personal.total)}</td>
        <td>${fmt.format(TOTALES.oferta.cursos)}</td>
        <td>${fmt.format(TOTALES.oferta.grupos)}</td>
        <td>${fmt.format(TOTALES.oferta.cupos)}</td>
        <td>${fmt.format(TOTALES.comunidad.iglesias)}</td>
        <td>${fmt.format(TOTALES.comunidad.creyentes)}</td>
        <td>${fmt.format(TOTALES.informadores)}</td>
        <td>${fmt.format(TOTALES.coordinadoresZonales)}</td>
        <td>${fmt.format(TOTALES.enlaceDelegacion)}</td>
        <td class="cell-total">100%</td>
      </tr>
    `;

    table.innerHTML = thead + `<tbody>${filas}${filaTotal}</tbody>`;

    function toggleZonaComparativo(zonaBtn) {
      const idx = zonaBtn.dataset.zonaToggle;
      const body = table.querySelector(`[data-zona-body="${idx}"]`);
      const abierto = zonaBtn.getAttribute("aria-expanded") === "true";
      zonaBtn.setAttribute("aria-expanded", String(!abierto));
      if (body) body.hidden = abierto;
    }
    table.querySelectorAll("[data-zona-toggle]").forEach((fila) => {
      fila.addEventListener("click", () => toggleZonaComparativo(fila));
      fila.addEventListener("keydown", (ev) => {
        if (ev.key !== "Enter" && ev.key !== " ") return;
        ev.preventDefault();
        toggleZonaComparativo(fila);
      });
    });
  }

  /* ---------------------------------------------------------
     4. TABLA CONSOLIDADA (todas las zonas × todos los roles)
     --------------------------------------------------------- */
  function renderTablaConsolidada() {
    const table = document.getElementById("tabla-consolidada");
    if (!table) return;

    // "Coordinadora" (rol de personal) se excluye del recorrido
    // genérico y se sustituye por la columna "Coordinadores
    // Zonales" (dato aparte, no forma parte del
    // cuerpo académico ni de ese total).
    const rolesUsados = ROLES.filter((r) => r.key !== "coordinadora" && TOTALES.personal[r.key] > 0);

    const thead = `
      <thead>
        <tr>
          <th>Zona</th>
          ${rolesUsados.map((r) => `<th>${r.label}</th>`).join("")}
          <th>Coordinadores Zonales</th>
          <th>Enlaces Apoyo pedagógico</th>
          <th>Total</th>
        </tr>
      </thead>`;

    const filasZona = ZONAS.map((z) => `
      <tr>
        <td>${z.emoji} ${z.nombre}</td>
        ${rolesUsados.map((r) => `<td>${z.personal[r.key] ? fmt.format(z.personal[r.key]) : "—"}</td>`).join("")}
        <td>${fmt.format(z.coordinadoresZonales)}</td>
        <td>${fmt.format(z.enlacesCurso)}</td>
        <td class="cell-total">${fmt.format(z.personal.total)}</td>
      </tr>
    `).join("");

    const filaTotal = `
      <tr class="fila-total">
        <td>Total general</td>
        ${rolesUsados.map((r) => `<td>${fmt.format(TOTALES.personal[r.key])}</td>`).join("")}
        <td>${fmt.format(TOTALES.coordinadoresZonales)}</td>
        <td>${fmt.format(TOTALES.enlacesCurso)}</td>
        <td class="cell-total">${fmt.format(TOTALES.personal.total)}</td>
      </tr>
    `;

    table.innerHTML = thead + `<tbody>${filasZona}${filaTotal}</tbody>`;
  }

  /* ---------------------------------------------------------
     5. TABLA DE CURSOS POR ZONA
     Filas = cursos, columnas = zonas, celdas = grupos abiertos
     de ese curso en esa zona. Ordenada por total de grupos.
     --------------------------------------------------------- */
  function renderTablaCursos() {
    const table = document.getElementById("tabla-cursos");
    if (!table) return;

    const totalGruposCurso = (c) => ZONAS.reduce((suma, z) => suma + (c[z.id] || 0), 0);

    const thead = `
      <thead>
        <tr>
          <th>Curso</th>
          ${ZONAS.map((z) => `<th>${z.nombre}</th>`).join("")}
          <th>Total grupos</th>
        </tr>
      </thead>`;

    // Se respeta el orden de CATEGORIAS_CURSO y, dentro de cada una,
    // el orden en que los cursos aparecen en CURSOS_DETALLE (así los
    // niveles de un mismo curso — Nivel 1, Nivel 2 — quedan juntos).
    const filasPorCategoria = CATEGORIAS_CURSO.map((cat) => {
      const cursos = CURSOS_DETALLE.filter((c) => c.categoria === cat.id);
      if (!cursos.length) return "";

      const filaCategoria = `
        <tr class="fila-categoria">
          <td colspan="${ZONAS.length + 2}">${cat.label}</td>
        </tr>
      `;

      const filasCurso = cursos.map((c) => `
        <tr>
          <td>${c.curso}</td>
          ${ZONAS.map((z) => `<td>${c[z.id] ? fmt.format(c[z.id]) : "—"}</td>`).join("")}
          <td class="cell-total">${fmt.format(totalGruposCurso(c))}</td>
        </tr>
      `).join("");

      return filaCategoria + filasCurso;
    }).join("");

    const totalesPorZona = ZONAS.map((z) =>
      CURSOS_DETALLE.reduce((suma, c) => suma + (c[z.id] || 0), 0)
    );

    const filaTotal = `
      <tr class="fila-total">
        <td>Total de grupos</td>
        ${totalesPorZona.map((t) => `<td>${fmt.format(t)}</td>`).join("")}
        <td class="cell-total">${fmt.format(totalesPorZona.reduce((a, b) => a + b, 0))}</td>
      </tr>
    `;

    table.innerHTML = thead + `<tbody>${filasPorCategoria}${filaTotal}</tbody>`;
  }

  /* ---------------------------------------------------------
     6. SECCIONES DESPLEGABLES
     Las tablas inician colapsadas; el título actúa como botón.
     --------------------------------------------------------- */
  function initPaneles() {
    document.querySelectorAll("[data-panel-toggle]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const panel = btn.closest(".panel");
        const abierto = panel.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", String(abierto));
      });
    });
  }

  /* ---------------------------------------------------------
     Init
     --------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    renderCobertura();
    renderKpis();
    renderComparativoZonas();
    renderTablaCursos();
    renderTablaConsolidada();
    initPaneles();
  });
})();
