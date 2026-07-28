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

    const totalPersonal = TOTALES.personal.total;
    const totalCursos = TOTALES.oferta.cursos;
    const totalGrupos = TOTALES.oferta.grupos;
    const totalCupos = TOTALES.oferta.cupos;
    const totalDepartamentos = ZONAS.reduce((n, z) => n + z.departamentos.length, 0);

    // Emoji por rol/concepto, para reconocer cada fila de un vistazo.
    const emojiRol = {
      profesores: "👩‍🏫", tutores: "🧑‍🏫", administradores: "🗂️", coordinadora: "🧭",
      enlaceTutores: "🔗", apoyoPedagogico: "🧑‍🎓", coordinadorTutores: "🧑‍💼",
      apoyoTutores: "🤝", responsableCurso: "📌",
    };
    const emojiZona = "📍";

    // Contenido del detalle desplegable de cada tarjeta: una mini
    // tabla de dos columnas (concepto / valor) que sustenta el total.
    const tablaRoles = `
      <table>
        <thead><tr><th>Rol</th><th>Total</th></tr></thead>
        <tbody>
          ${ROLES.map((r) => `<tr><td>${emojiRol[r.key] || "•"} ${r.label}</td><td>${fmt.format(TOTALES.personal[r.key])}</td></tr>`).join("")}
          <tr><td>🔗 Enlace de profesores</td><td>${fmt.format(TOTALES.personal.enlaceProfesores)}</td></tr>
          <tr class="fila-total"><td>🧮 Total cuerpo académico</td><td>${fmt.format(totalPersonal)}</td></tr>
        </tbody>
      </table>`;

    const totalGruposCurso = (c) => ZONAS.reduce((s, z) => s + (c[z.id] || 0), 0);
    const totalCuposCurso = (c) => {
      const cupos = CUPOS_POR_CURSO[c.curso];
      return cupos ? Object.values(cupos).reduce((s, v) => s + v, 0) : 0;
    };
    // Agrupado por categoría (mismo orden que CATEGORIAS_CURSO); dentro
    // de cada categoría se respeta el orden de CURSOS_DETALLE, así los
    // niveles de un mismo curso (Nivel 1, Nivel 2) quedan uno seguido
    // del otro en vez de reordenarse por cantidad de grupos.
    const filasCursosPorCategoria = CATEGORIAS_CURSO.map((cat) => {
      const cursosCat = CURSOS_DETALLE.filter((c) => c.categoria === cat.id);
      if (cursosCat.length === 0) return "";
      const filas = cursosCat
        .map((c) => `<tr><td>📖 ${c.curso}</td><td>${fmt.format(totalGruposCurso(c))}</td><td>${fmt.format(totalCuposCurso(c))}</td></tr>`)
        .join("");
      return `<tr class="fila-categoria"><td colspan="3">${cat.label}</td></tr>${filas}`;
    }).join("");
    const tablaCursos = `
      <table>
        <thead><tr><th>Curso</th><th>Grupos</th><th>Cupos</th></tr></thead>
        <tbody>
          ${filasCursosPorCategoria}
          <tr class="fila-total"><td>🧮 Total (todos los cursos)</td><td>${fmt.format(totalGrupos)}</td><td>${fmt.format(totalCupos)}</td></tr>
        </tbody>
      </table>
      <p style="font-size:12px;color:var(--texto-muted);margin-top:10px;">*Incluye 50 cupos de un grupo presencial adicional en Bogotá y Cundinamarca aún sin curso identificado.</p>`;

    const tablaGruposPorZona = `
      <table>
        <thead><tr><th>Zona</th><th>Grupos</th></tr></thead>
        <tbody>
          ${[...ZONAS].sort((a, b) => b.oferta.grupos - a.oferta.grupos)
            .map((z) => `<tr><td>${emojiZona} ${z.nombre}</td><td>${fmt.format(z.oferta.grupos)}</td></tr>`).join("")}
          <tr class="fila-total"><td>🧮 Total nacional</td><td>${fmt.format(totalGrupos)}</td></tr>
        </tbody>
      </table>`;

    const tablaCuposPorZona = `
      <table>
        <thead><tr><th>Composición de grupos</th><th>Cupos</th></tr></thead>
        <tbody>
          <tr><td>🧩 61 grupos de 60 cupos</td><td>${fmt.format(61 * 60)}</td></tr>
          <tr><td>🧩 456 grupos de 50 cupos</td><td>${fmt.format(456 * 50)}</td></tr>
          <tr><td>🧩 5 grupos de 40 cupos</td><td>${fmt.format(5 * 40)}</td></tr>
          <tr><td>🧩 8 grupos de 25 cupos</td><td>${fmt.format(8 * 25)}</td></tr>
          <tr><td>🧩 1 grupo presencial adicional (Bogotá, curso sin identificar)</td><td>${fmt.format(50)}</td></tr>
        </tbody>
      </table>
      <table style="margin-top:14px;">
        <thead><tr><th>Zona</th><th>Cupos</th></tr></thead>
        <tbody>
          ${[...ZONAS].sort((a, b) => b.oferta.cupos - a.oferta.cupos)
            .map((z) => `<tr><td>${emojiZona} ${z.nombre}</td><td>${fmt.format(z.oferta.cupos)}</td></tr>`).join("")}
          <tr class="fila-total"><td>🧮 Total nacional</td><td>${fmt.format(totalCupos)}</td></tr>
        </tbody>
      </table>`;

    const tablaInformadores = `
      <table>
        <thead><tr><th>Zona</th><th>Informadores</th></tr></thead>
        <tbody>
          ${[...ZONAS].sort((a, b) => b.informadores - a.informadores)
            .map((z) => `<tr><td>${emojiZona} ${z.nombre}</td><td>${fmt.format(z.informadores)}</td></tr>`).join("")}
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
        value: fmt.format(totalCursos),
        delta: `${INFORME_META.notaOferta}`,
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
        delta: `61 grupos de 60 · 456 de 50 · 5 de 40 · 8 de 25 cupos`,
        detalle: tablaCuposPorZona,
      },
      {
        icon: "📣",
        label: "Informadores inscritos en proyecto",
        value: fmt.format(TOTALES.informadores),
        delta: `${fmt.format(INFORMADORES_SIN_ZONA)} sin departamento asignado`,
        detalle: tablaInformadores,
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

    const filas = zonasOrdenadas.map((z) => {
      const share = pct(z.oferta.cupos, TOTALES.oferta.cupos);
      return `
        <tr>
          <td class="cell-zona"><span class="zona-swatch" style="background:${z.color}"></span>${z.nombre}</td>
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
  }

  /* ---------------------------------------------------------
     3. BLOQUES DE ZONA (acordeón con tabla de roles + oferta)
     --------------------------------------------------------- */
  function renderZonas() {
    const cont = document.getElementById("zone-list");
    if (!cont) return;

    cont.innerHTML = ZONAS.map((z) => {
      const filasRoles = ROLES
        .filter((r) => z.personal[r.key] > 0)
        .map((r) => `<tr><td>${r.label}</td><td>${fmt.format(z.personal[r.key])}</td></tr>`)
        .join("");

      const shareCupos = pct(z.oferta.cupos, TOTALES.oferta.cupos);
      const cursosDeZona = CURSOS_DETALLE
        .filter((c) => c[z.id] > 0)
        .sort((a, b) => b[z.id] - a[z.id]);

      return `
        <article class="zone-card" style="--zona-color:${z.color}">
          <button class="zone-card__header" type="button" data-zone-toggle aria-expanded="false">
            <div class="zone-card__title-wrap">
              <span class="zone-card__dot" aria-hidden="true"></span>
              <div>
                <h3 class="zone-card__title">${z.nombre}</h3>
                <p class="zone-card__depts">${z.departamentos.length} departamento${z.departamentos.length > 1 ? "s" : ""}: ${z.departamentos.join(", ")}</p>
              </div>
            </div>
            <div class="zone-card__stats">
              <div class="zone-stat">
                <div class="zone-stat__value">${fmt.format(z.personal.total)}</div>
                <div class="zone-stat__label">Cuerpo académico</div>
              </div>
              <div class="zone-stat">
                <div class="zone-stat__value">${fmt.format(z.oferta.cupos)}</div>
                <div class="zone-stat__label">Cupos</div>
              </div>
              <div class="zone-stat">
                <div class="zone-stat__value">${fmt.format(z.comunidad.iglesias)}</div>
                <div class="zone-stat__label">Iglesias</div>
              </div>
              <div class="zone-stat">
                <div class="zone-stat__value">${fmt.format(z.comunidad.creyentes)}</div>
                <div class="zone-stat__label">Creyentes</div>
              </div>
              <div class="zone-stat">
                <div class="zone-stat__value">${fmt.format(z.informadores)}</div>
                <div class="zone-stat__label">Informadores</div>
              </div>
              <div class="zone-stat">
                <div class="zone-stat__value">${shareCupos.toFixed(1)}%</div>
                <div class="zone-stat__label">De los cupos nacionales</div>
              </div>
            </div>
            <span class="zone-card__toggle" aria-hidden="true">+</span>
          </button>

          <div class="zone-card__body">
            <div class="zone-card__body-inner">
              <div class="zone-card__content">

                <div class="zone-card__table-wrap">
                  <div class="zone-card__depts-list">
                    ${z.departamentos.map((d) => `<span class="zone-chip">${d}</span>`).join("")}
                  </div>
                  <table>
                    <thead><tr><th>Rol</th><th>Cantidad</th></tr></thead>
                    <tbody>
                      ${filasRoles}
                      <tr class="fila-total"><td>Total zona</td><td>${fmt.format(z.personal.total)}</td></tr>
                    </tbody>
                  </table>
                </div>

                <div class="zone-card__oferta">
                  <div class="zone-oferta-item">
                    <span class="zone-oferta-item__label">Cursos</span>
                    <span class="zone-oferta-item__value">${fmt.format(z.oferta.cursos)}</span>
                  </div>
                  <div class="zone-oferta-item">
                    <span class="zone-oferta-item__label">Grupos</span>
                    <span class="zone-oferta-item__value">${fmt.format(z.oferta.grupos)}</span>
                  </div>
                  <div class="zone-oferta-item">
                    <span class="zone-oferta-item__label">Cupos</span>
                    <span class="zone-oferta-item__value">${fmt.format(z.oferta.cupos)}</span>
                  </div>
                  <div class="zone-oferta-item">
                    <span class="zone-oferta-item__label">Coordinadores zonales</span>
                    <span class="zone-oferta-item__value">${fmt.format(z.coordinadoresZonales)}</span>
                  </div>
                  <div class="zone-oferta-item">
                    <span class="zone-oferta-item__label">
                      Enlace Campus Delegación
                      <small>${z.notaEnlace || "Uno por departamento, asignado por el coordinador zonal"}</small>
                    </span>
                    <span class="zone-oferta-item__value">${fmt.format(z.enlaceDelegacion)}</span>
                  </div>
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

              </div>
            </div>
          </div>
        </article>
      `;
    }).join("");

    cont.querySelectorAll("[data-zone-toggle]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const card = btn.closest(".zone-card");
        const abierta = card.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", String(abierta));
      });
    });
  }

  /* ---------------------------------------------------------
     4. TABLA CONSOLIDADA (todas las zonas × todos los roles)
     --------------------------------------------------------- */
  function renderTablaConsolidada() {
    const table = document.getElementById("tabla-consolidada");
    if (!table) return;

    // "Coordinadora" (rol de personal, suma al total de 1.840) se
    // excluye del recorrido genérico y se sustituye por la columna
    // "Coordinadores Zonales" (dato aparte, no forma parte del
    // cuerpo académico ni de ese total).
    const rolesUsados = ROLES.filter((r) => r.key !== "coordinadora" && TOTALES.personal[r.key] > 0);

    const thead = `
      <thead>
        <tr>
          <th>Zona</th>
          ${rolesUsados.map((r) => `<th>${r.label}</th>`).join("")}
          <th>Coordinadores Zonales</th>
          <th>Enlaces de curso</th>
          <th>Total</th>
        </tr>
      </thead>`;

    const filasZona = ZONAS.map((z) => `
      <tr>
        <td>${z.nombre}</td>
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
    renderZonas();
    renderTablaCursos();
    renderTablaConsolidada();
    initPaneles();
  });
})();
