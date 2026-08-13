/* ARCHIVO GENERADO - NO EDITAR A MANO.
   Se genera desde data/zonas.json con:  py scripts/generar_zonas_js.py
   Editar el .json y volver a generar; los cambios hechos aqui se pierden.

   Fuente unica de las 6 zonas de Colombia y sus departamentos, compartida por
   la app (index.html), el Informe Nacional (informe/) y el informe de Cupos y
   Matriculas (fimlm/). */

const ZONAS_CANONICAS = [
  {
    "id": "bogota-cundinamarca",
    "nombre": "Bogotá & Cundinamarca",
    "emoji": "🏙️",
    "color": "#1a3c6e",
    "departamentos": [
      "Bogotá",
      "Cundinamarca"
    ],
    "codigoFimlm": "BOG",
    "nombreDashboard": "ZONA BOGOTÁ & CUNDINAMARCA 2026"
  },
  {
    "id": "caribe",
    "nombre": "Zona Caribe",
    "emoji": "🌊",
    "color": "#0891b2",
    "departamentos": [
      "Atlántico",
      "La Guajira",
      "Córdoba",
      "Sucre",
      "San Andrés",
      "Bolívar",
      "Magdalena"
    ],
    "codigoFimlm": "CAR",
    "nombreDashboard": "ZONA CARIBE 2026"
  },
  {
    "id": "antioquia-eje-cafetero",
    "nombre": "Antioquia & Eje Cafetero",
    "emoji": "☕",
    "color": "#7c3aed",
    "departamentos": [
      "Antioquia",
      "Urabá",
      "Caldas",
      "Risaralda",
      "Quindío"
    ],
    "codigoFimlm": "ANT",
    "nombreDashboard": "ZONA ANTIOQUIA EJE CAFETERO 2026"
  },
  {
    "id": "pacifico",
    "nombre": "Zona Pacífico",
    "emoji": "🌿",
    "color": "#059669",
    "departamentos": [
      "Valle del Cauca",
      "Cauca",
      "Chocó",
      "Nariño",
      "Putumayo"
    ],
    "codigoFimlm": "PAC",
    "nombreDashboard": "ZONA PACIFICO 2026"
  },
  {
    "id": "sur-llanos",
    "nombre": "Zona Sur & Llanos",
    "emoji": "🌾",
    "color": "#d97706",
    "departamentos": [
      "Meta",
      "Arauca",
      "Casanare",
      "Guainía",
      "Guaviare",
      "Vaupés",
      "Vichada",
      "Amazonas",
      "Caquetá",
      "Huila",
      "Tolima"
    ],
    "codigoFimlm": "SUR",
    "nombreDashboard": "ZONA SUR Y LLANOS 2026"
  },
  {
    "id": "santanderes-boyaca",
    "nombre": "Santanderes, Boyacá y Cesar",
    "emoji": "⛰️",
    "color": "#dc2626",
    "departamentos": [
      "Santander",
      "Norte de Santander",
      "Boyacá",
      "Cesar"
    ],
    "codigoFimlm": "SAN",
    "nombreDashboard": "ZONA SANTANDERES & BOYACA 2026"
  }
];

/* Variantes con las que el dashboard FIMLM nombra un mismo departamento. */
const ALIAS_DEPARTAMENTO = {
  "Archipielago de San Andres": "San Andrés",
  "Archipielago de San Andres, Providencia y Santa Catalina": "San Andrés"
};

/* Departamento -> nombre de la zona a la que pertenece. */
const ZONA_POR_DEPARTAMENTO = (() => {
  const mapa = {};
  ZONAS_CANONICAS.forEach(z => z.departamentos.forEach(d => { mapa[d] = z.nombre; }));
  Object.entries(ALIAS_DEPARTAMENTO).forEach(([variante, real]) => {
    if (mapa[real]) mapa[variante] = mapa[real];
  });
  return mapa;
})();
