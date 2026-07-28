/* ============================================================
   DATOS DEL INFORME — Cuerpo académico Convocatoria 32
   Fuente: reporte regional de resultados (corte 25/07/2026) y
   consolidado de cursos/informadores (corte 27/07/2026).
   Estructura pensada para agregar zonas o departamentos sin
   tocar el resto del código (informe.js consume este archivo).
   ============================================================ */

const INFORME_META = {
  corte: "25 de julio de 2026",
  convocatoria: "Convocatoria 32",
  responsablesCurso: 42,
  notaOferta: "5 cursos de ejecución presencial (cada uno de un grupo, cada grupo de 50 cupos).",
};

/* Roles del cuerpo académico, en el orden en que aparecen en el
   reporte original. La clave coincide con las propiedades de
   "personal" en cada zona. */
/* "enlaceProfesores" se conserva en los datos (suma al total de
   cada zona) pero no se lista aquí, por lo que no aparece como
   columna en la tabla consolidada. */
const ROLES = [
  { key: "profesores",            label: "Profesores" },
  { key: "tutores",                label: "Tutores" },
  { key: "administradores",        label: "Administradores" },
  { key: "coordinadora",           label: "Coordinadores Zonales" },
  { key: "enlaceTutores",          label: "Enlace de tutores" },
  { key: "encargadoPedagogicoZonal", label: "Encargado pedagógico zonal" },
  { key: "apoyoPedagogico",        label: "Apoyo pedagógico" },
  { key: "coordinadorTutores",     label: "Coordinador de tutores" },
  { key: "encargadoTutoresZonal",  label: "Encargado de tutores zonal" },
  { key: "apoyoTutores",           label: "Apoyo tutores" },
  { key: "responsableCurso",       label: "Responsable de curso" },
  { key: "encargadoInformadoresZonal", label: "Encargado de informadores zonal" },
  { key: "apoyoInformadores",      label: "Apoyo informadores zona" },
  { key: "encargadoSoporteTecnicoZonal", label: "Encargado soporte técnico zonal" },
  { key: "apoyoSoporteTecnologico", label: "Apoyo soporte tecnológico zona" },
  { key: "enlaceSoporteTecnologico", label: "Enlace soporte tecnológico" },
];

/* Cada zona agrupa: departamentos que la componen, personal por
   rol (con total), oferta académica (cursos, grupos, cupos),
   datos de comunidad (iglesias, creyentes) e informadores
   inscritos al proyecto. Para agregar un departamento nuevo a
   una zona, solo hay que añadirlo al arreglo "departamentos". */
const ZONAS = [
  {
    id: "bogota-cundinamarca",
    nombre: "Bogotá & Cundinamarca",
    departamentos: ["Bogotá", "Cundinamarca"],
    color: "#1B4DA0",
    personal: {
      profesores: 238, tutores: 175, administradores: 74, coordinadora: 1,
      enlaceProfesores: 1, enlaceTutores: 0,
      encargadoPedagogicoZonal: 1, apoyoPedagogico: 3,
      coordinadorTutores: 3, encargadoTutoresZonal: 1, apoyoTutores: 3, responsableCurso: 0,
      encargadoInformadoresZonal: 1, apoyoInformadores: 3,
      encargadoSoporteTecnicoZonal: 1, apoyoSoporteTecnologico: 1, enlaceSoporteTecnologico: 0,
      total: 506,
    },
    enlacesCurso: 37,
    oferta: { cursos: 37, grupos: 169, cupos: 8600 },
    comunidad: { iglesias: 97, creyentes: 38800 },
    informadores: 838,
    coordinadoresZonales: 2,
    enlaceDelegacion: 67,
    // Única zona donde el enlace se asigna por iglesia y no por departamento.
    notaEnlace: "Asignados por iglesia: 35 en Bogotá y 31 en Cundinamarca",
  },
  {
    id: "caribe",
    nombre: "Zona Caribe",
    departamentos: ["Atlántico", "La Guajira", "Córdoba", "Sucre", "San Andrés", "Bolívar", "Magdalena"],
    color: "#0090A0",
    personal: {
      profesores: 74, tutores: 65, administradores: 34, coordinadora: 0,
      enlaceProfesores: 3, enlaceTutores: 0,
      encargadoPedagogicoZonal: 1, apoyoPedagogico: 2,
      coordinadorTutores: 1, encargadoTutoresZonal: 1, apoyoTutores: 1, responsableCurso: 0,
      encargadoInformadoresZonal: 1, apoyoInformadores: 1,
      encargadoSoporteTecnicoZonal: 1, apoyoSoporteTecnologico: 1, enlaceSoporteTecnologico: 0,
      total: 186,
    },
    enlacesCurso: 23,
    oferta: { cursos: 23, grupos: 47, cupos: 2400 },
    comunidad: { iglesias: 63, creyentes: 25200 },
    informadores: 355,
    coordinadoresZonales: 2,
    enlaceDelegacion: 7,
  },
  {
    id: "antioquia-eje-cafetero",
    nombre: "Antioquia & Eje Cafetero",
    departamentos: ["Antioquia", "Urabá", "Caldas", "Risaralda", "Quindío"],
    color: "#D9791C",
    personal: {
      profesores: 180, tutores: 119, administradores: 9, coordinadora: 0,
      enlaceProfesores: 0, enlaceTutores: 0,
      encargadoPedagogicoZonal: 1, apoyoPedagogico: 2,
      coordinadorTutores: 2, encargadoTutoresZonal: 1, apoyoTutores: 2, responsableCurso: 0,
      encargadoInformadoresZonal: 1, apoyoInformadores: 0,
      encargadoSoporteTecnicoZonal: 1, apoyoSoporteTecnologico: 0, enlaceSoporteTecnologico: 0,
      total: 318,
    },
    enlacesCurso: 21,
    oferta: { cursos: 31, grupos: 100, cupos: 4750 },
    comunidad: { iglesias: 111, creyentes: 44400 },
    informadores: 935,
    coordinadoresZonales: 2,
    enlaceDelegacion: 6,
  },
  {
    id: "pacifico",
    nombre: "Zona Pacífico",
    departamentos: ["Valle del Cauca", "Cauca", "Chocó", "Nariño", "Putumayo"],
    color: "#1A9E6E",
    personal: {
      profesores: 172, tutores: 213, administradores: 45, coordinadora: 1,
      enlaceProfesores: 16, enlaceTutores: 1,
      encargadoPedagogicoZonal: 1, apoyoPedagogico: 3,
      coordinadorTutores: 0, encargadoTutoresZonal: 1, apoyoTutores: 0, responsableCurso: 1,
      encargadoInformadoresZonal: 1, apoyoInformadores: 5,
      encargadoSoporteTecnicoZonal: 1, apoyoSoporteTecnologico: 2, enlaceSoporteTecnologico: 0,
      total: 463,
    },
    enlacesCurso: 28,
    oferta: { cursos: 27, grupos: 88, cupos: 4550 },
    comunidad: { iglesias: 131, creyentes: 52400 },
    informadores: 777,
    coordinadoresZonales: 3,
    enlaceDelegacion: 7,
  },
  {
    id: "sur-llanos",
    nombre: "Zona Sur & Llanos",
    departamentos: ["Meta", "Arauca", "Casanare", "Guainía", "Guaviare", "Vaupés", "Vichada", "Amazonas", "Caquetá", "Huila", "Tolima"],
    color: "#4A3AA7",
    personal: {
      profesores: 157, tutores: 121, administradores: 23, coordinadora: 0,
      enlaceProfesores: 4, enlaceTutores: 0,
      encargadoPedagogicoZonal: 1, apoyoPedagogico: 5,
      coordinadorTutores: 3, encargadoTutoresZonal: 1, apoyoTutores: 4, responsableCurso: 0,
      encargadoInformadoresZonal: 0, apoyoInformadores: 0,
      encargadoSoporteTecnicoZonal: 1, apoyoSoporteTecnologico: 3, enlaceSoporteTecnologico: 0,
      total: 323,
    },
    enlacesCurso: 34,
    oferta: { cursos: 20, grupos: 103, cupos: 5150 },
    comunidad: { iglesias: 113, creyentes: 45200 },
    informadores: 1113,
    coordinadoresZonales: 2,
    enlaceDelegacion: 7,
  },
  {
    id: "santanderes-boyaca",
    nombre: "Santanderes & Boyacá",
    departamentos: ["Santander", "Norte de Santander", "Boyacá", "Cesar"],
    color: "#C0392B",
    personal: {
      profesores: 36, tutores: 44, administradores: 8, coordinadora: 0,
      enlaceProfesores: 1, enlaceTutores: 0,
      encargadoPedagogicoZonal: 1, apoyoPedagogico: 2,
      coordinadorTutores: 3, encargadoTutoresZonal: 1, apoyoTutores: 3, responsableCurso: 0,
      encargadoInformadoresZonal: 0, apoyoInformadores: 0,
      encargadoSoporteTecnicoZonal: 1, apoyoSoporteTecnologico: 2, enlaceSoporteTecnologico: 0,
      total: 102,
    },
    enlacesCurso: 16,
    oferta: { cursos: 16, grupos: 28, cupos: 1460 },
    comunidad: { iglesias: 88, creyentes: 30800 },
    informadores: 445,
    coordinadoresZonales: 1,
    enlaceDelegacion: 4,
  },
];

/* Informadores inscritos sin departamento asignado (no se
   reparten a ninguna zona; se suman aparte al total nacional). */
const INFORMADORES_SIN_ZONA = 238;

/* Agrupación temática de los cursos (ver piezas "Habilidades
   Humanas", "Emprendimiento y Empleabilidad", etc.). Define el
   orden de las categorías en la tabla "Cursos por zona"; dentro de
   cada categoría los cursos van en el orden en que aparecen en
   CURSOS_DETALLE, así que los niveles de un mismo curso (Nivel 1,
   Nivel 2) se ubican uno junto al otro. */
const CATEGORIAS_CURSO = [
  { id: "habilidades-humanas",  label: "Habilidades Humanas" },
  { id: "emprendimiento",       label: "Emprendimiento y Empleabilidad" },
  { id: "tecnologia",           label: "Tecnología y Programación" },
  { id: "idiomas",              label: "Idiomas" },
  { id: "artes-oficios",        label: "Artes y Oficios" },
  { id: "medio-ambiente",       label: "Medio Ambiente y Agroproductividad" },
  { id: "presencial",           label: "Ejecución Presencial (Antioquia y Eje Cafetero)" },
];

/* Detalle de cursos por zona: cantidad de GRUPOS de cada curso
   en cada zona (no "1 = se dicta"). zonasQueOfrecen es el número
   de zonas donde el curso tiene al menos un grupo, tal como lo
   reporta el consolidado. Claves de zona = id de ZONAS. */
const CURSOS_DETALLE = [
  // --- Habilidades Humanas ---
  { curso: "Despertar Humano", categoria: "habilidades-humanas", "bogota-cundinamarca": 10, "sur-llanos": 16, "antioquia-eje-cafetero": 13, "santanderes-boyaca": 4, "pacifico": 7, "caribe": 4, zonasQueOfrecen: 6 },
  { curso: "Comprensión Lectora", categoria: "habilidades-humanas", "bogota-cundinamarca": 10, "sur-llanos": 8, "antioquia-eje-cafetero": 7, "santanderes-boyaca": 1, "pacifico": 5, "caribe": 5, zonasQueOfrecen: 6 },
  { curso: "Economía del Hogar", categoria: "habilidades-humanas", "bogota-cundinamarca": 9, "sur-llanos": 10, "antioquia-eje-cafetero": 8, "santanderes-boyaca": 4, "pacifico": 6, "caribe": 4, zonasQueOfrecen: 6 },
  { curso: "Bienestar para la persona mayor", categoria: "habilidades-humanas", "bogota-cundinamarca": 6, "sur-llanos": 5, "antioquia-eje-cafetero": 4, "santanderes-boyaca": 0, "pacifico": 3, "caribe": 0, zonasQueOfrecen: 4 },
  { curso: "Sin Límites Virtual", categoria: "habilidades-humanas", "bogota-cundinamarca": 2, "sur-llanos": 2, "antioquia-eje-cafetero": 1, "santanderes-boyaca": 0, "pacifico": 0, "caribe": 1, zonasQueOfrecen: 4 },

  // --- Emprendimiento y Empleabilidad ---
  { curso: "Despertar Emprendedor", categoria: "emprendimiento", "bogota-cundinamarca": 8, "sur-llanos": 14, "antioquia-eje-cafetero": 3, "santanderes-boyaca": 2, "pacifico": 3, "caribe": 2, zonasQueOfrecen: 6 },
  { curso: "Orientación Emprendedora", categoria: "emprendimiento", "bogota-cundinamarca": 7, "sur-llanos": 3, "antioquia-eje-cafetero": 8, "santanderes-boyaca": 1, "pacifico": 4, "caribe": 3, zonasQueOfrecen: 6 },
  { curso: "Profundización Costos para Emprendedores", categoria: "emprendimiento", "bogota-cundinamarca": 5, "sur-llanos": 5, "antioquia-eje-cafetero": 0, "santanderes-boyaca": 1, "pacifico": 1, "caribe": 1, zonasQueOfrecen: 5 },
  { curso: "Mi Negocio en Internet", categoria: "emprendimiento", "bogota-cundinamarca": 4, "sur-llanos": 5, "antioquia-eje-cafetero": 0, "santanderes-boyaca": 1, "pacifico": 1, "caribe": 1, zonasQueOfrecen: 5 },
  { curso: "Estrategias para la Búsqueda de Empleo", categoria: "emprendimiento", "bogota-cundinamarca": 7, "sur-llanos": 1, "antioquia-eje-cafetero": 3, "santanderes-boyaca": 0, "pacifico": 3, "caribe": 1, zonasQueOfrecen: 5 },
  { curso: "Familias Empresarias del Campo", categoria: "emprendimiento", "bogota-cundinamarca": 5, "sur-llanos": 2, "antioquia-eje-cafetero": 1, "santanderes-boyaca": 1, "pacifico": 1, "caribe": 0, zonasQueOfrecen: 5 },

  // --- Tecnología y Programación ---
  { curso: "Sistemas Nivel 1", categoria: "tecnologia", "bogota-cundinamarca": 13, "sur-llanos": 5, "antioquia-eje-cafetero": 14, "santanderes-boyaca": 1, "pacifico": 8, "caribe": 3, zonasQueOfrecen: 6 },
  { curso: "Sistemas Nivel 2", categoria: "tecnologia", "bogota-cundinamarca": 4, "sur-llanos": 3, "antioquia-eje-cafetero": 5, "santanderes-boyaca": 2, "pacifico": 4, "caribe": 1, zonasQueOfrecen: 6 },

  // --- Idiomas ---
  { curso: "Inglés Nivel 1", categoria: "idiomas", "bogota-cundinamarca": 15, "sur-llanos": 5, "antioquia-eje-cafetero": 5, "santanderes-boyaca": 4, "pacifico": 7, "caribe": 5, zonasQueOfrecen: 6 },
  { curso: "Inglés Nivel 2", categoria: "idiomas", "bogota-cundinamarca": 9, "sur-llanos": 4, "antioquia-eje-cafetero": 4, "santanderes-boyaca": 1, "pacifico": 7, "caribe": 2, zonasQueOfrecen: 6 },
  { curso: "Business English 1", categoria: "idiomas", "bogota-cundinamarca": 1, "sur-llanos": 0, "antioquia-eje-cafetero": 1, "santanderes-boyaca": 0, "pacifico": 1, "caribe": 0, zonasQueOfrecen: 3 },
  { curso: "Business English 2", categoria: "idiomas", "bogota-cundinamarca": 1, "sur-llanos": 0, "antioquia-eje-cafetero": 0, "santanderes-boyaca": 0, "pacifico": 0, "caribe": 0, zonasQueOfrecen: 1 },
  { curso: "English for Kids", categoria: "idiomas", "bogota-cundinamarca": 4, "sur-llanos": 0, "antioquia-eje-cafetero": 0, "santanderes-boyaca": 0, "pacifico": 0, "caribe": 0, zonasQueOfrecen: 1 },
  { curso: "English for Teens", categoria: "idiomas", "bogota-cundinamarca": 4, "sur-llanos": 0, "antioquia-eje-cafetero": 0, "santanderes-boyaca": 0, "pacifico": 0, "caribe": 0, zonasQueOfrecen: 1 },
  { curso: "Francés Nivel 1", categoria: "idiomas", "bogota-cundinamarca": 4, "sur-llanos": 0, "antioquia-eje-cafetero": 0, "santanderes-boyaca": 0, "pacifico": 4, "caribe": 1, zonasQueOfrecen: 3 },
  { curso: "Francés Nivel 2", categoria: "idiomas", "bogota-cundinamarca": 2, "sur-llanos": 0, "antioquia-eje-cafetero": 0, "santanderes-boyaca": 0, "pacifico": 0, "caribe": 0, zonasQueOfrecen: 1 },
  { curso: "Italiano Nivel 1", categoria: "idiomas", "bogota-cundinamarca": 1, "sur-llanos": 0, "antioquia-eje-cafetero": 0, "santanderes-boyaca": 1, "pacifico": 3, "caribe": 1, zonasQueOfrecen: 4 },
  { curso: "Italiano Nivel 2", categoria: "idiomas", "bogota-cundinamarca": 2, "sur-llanos": 0, "antioquia-eje-cafetero": 0, "santanderes-boyaca": 0, "pacifico": 0, "caribe": 0, zonasQueOfrecen: 1 },
  { curso: "Portugués Nivel 1", categoria: "idiomas", "bogota-cundinamarca": 3, "sur-llanos": 0, "antioquia-eje-cafetero": 0, "santanderes-boyaca": 0, "pacifico": 3, "caribe": 1, zonasQueOfrecen: 3 },
  { curso: "Portugués Nivel 2", categoria: "idiomas", "bogota-cundinamarca": 1, "sur-llanos": 0, "antioquia-eje-cafetero": 0, "santanderes-boyaca": 0, "pacifico": 0, "caribe": 0, zonasQueOfrecen: 1 },

  // --- Artes y Oficios ---
  { curso: "Bisutería", categoria: "artes-oficios", "bogota-cundinamarca": 5, "sur-llanos": 0, "antioquia-eje-cafetero": 1, "santanderes-boyaca": 2, "pacifico": 1, "caribe": 1, zonasQueOfrecen: 5 },
  { curso: "Confección: Manejo de Máquinas de Coser", categoria: "artes-oficios", "bogota-cundinamarca": 2, "sur-llanos": 0, "antioquia-eje-cafetero": 1, "santanderes-boyaca": 0, "pacifico": 2, "caribe": 1, zonasQueOfrecen: 4 },
  { curso: "Modistería (Faldas)", categoria: "artes-oficios", "bogota-cundinamarca": 2, "sur-llanos": 3, "antioquia-eje-cafetero": 2, "santanderes-boyaca": 1, "pacifico": 2, "caribe": 2, zonasQueOfrecen: 6 },
  { curso: "Modistería: Reparación y Modificación de Prendas de Vestir", categoria: "artes-oficios", "bogota-cundinamarca": 2, "sur-llanos": 0, "antioquia-eje-cafetero": 0, "santanderes-boyaca": 0, "pacifico": 0, "caribe": 0, zonasQueOfrecen: 1 },
  { curso: "Muñecas de Trapo", categoria: "artes-oficios", "bogota-cundinamarca": 2, "sur-llanos": 0, "antioquia-eje-cafetero": 0, "santanderes-boyaca": 0, "pacifico": 0, "caribe": 0, zonasQueOfrecen: 1 },
  { curso: "Pintura en madera 1", categoria: "artes-oficios", "bogota-cundinamarca": 3, "sur-llanos": 0, "antioquia-eje-cafetero": 1, "santanderes-boyaca": 0, "pacifico": 1, "caribe": 2, zonasQueOfrecen: 4 },
  { curso: "Peinados y Trenzas", categoria: "artes-oficios", "bogota-cundinamarca": 3, "sur-llanos": 1, "antioquia-eje-cafetero": 3, "santanderes-boyaca": 0, "pacifico": 2, "caribe": 0, zonasQueOfrecen: 4 },
  { curso: "Floristería 1", categoria: "artes-oficios", "bogota-cundinamarca": 2, "sur-llanos": 0, "antioquia-eje-cafetero": 0, "santanderes-boyaca": 0, "pacifico": 1, "caribe": 0, zonasQueOfrecen: 2 },
  { curso: "Repostería 1", categoria: "artes-oficios", "bogota-cundinamarca": 3, "sur-llanos": 3, "antioquia-eje-cafetero": 2, "santanderes-boyaca": 0, "pacifico": 4, "caribe": 2, zonasQueOfrecen: 5 },
  { curso: "Repostería 2", categoria: "artes-oficios", "bogota-cundinamarca": 2, "sur-llanos": 1, "antioquia-eje-cafetero": 0, "santanderes-boyaca": 0, "pacifico": 2, "caribe": 2, zonasQueOfrecen: 4 },

  // --- Medio Ambiente y Agroproductividad ---
  { curso: "El ABC del Reciclaje", categoria: "medio-ambiente", "bogota-cundinamarca": 5, "sur-llanos": 7, "antioquia-eje-cafetero": 3, "santanderes-boyaca": 1, "pacifico": 2, "caribe": 1, zonasQueOfrecen: 6 },
  { curso: "Salud y Bienestar para Ovinos y Caprinos", categoria: "medio-ambiente", "bogota-cundinamarca": 1, "sur-llanos": 0, "antioquia-eje-cafetero": 0, "santanderes-boyaca": 0, "pacifico": 0, "caribe": 0, zonasQueOfrecen: 1 },

  // --- Ejecución Presencial (Antioquia y Eje Cafetero) ---
  { curso: "Sistemas e Informática · Sistema Básico", categoria: "presencial", "bogota-cundinamarca": 0, "sur-llanos": 0, "antioquia-eje-cafetero": 1, "santanderes-boyaca": 0, "pacifico": 0, "caribe": 0, zonasQueOfrecen: 1 },
  { curso: "Sistemas e Informática · Nivel Avanzado", categoria: "presencial", "bogota-cundinamarca": 0, "sur-llanos": 0, "antioquia-eje-cafetero": 1, "santanderes-boyaca": 0, "pacifico": 0, "caribe": 0, zonasQueOfrecen: 1 },
  { curso: "Huertas Caseras", categoria: "presencial", "bogota-cundinamarca": 0, "sur-llanos": 0, "antioquia-eje-cafetero": 1, "santanderes-boyaca": 0, "pacifico": 0, "caribe": 0, zonasQueOfrecen: 1 },
  { curso: "English Leasing a Conversación", categoria: "presencial", "bogota-cundinamarca": 0, "sur-llanos": 0, "antioquia-eje-cafetero": 1, "santanderes-boyaca": 0, "pacifico": 0, "caribe": 0, zonasQueOfrecen: 1 },
  { curso: "Bonsái en Alambre y Pedrería", categoria: "presencial", "bogota-cundinamarca": 0, "sur-llanos": 0, "antioquia-eje-cafetero": 1, "santanderes-boyaca": 0, "pacifico": 0, "caribe": 0, zonasQueOfrecen: 1 },
];

/* Totales generales (tal como aparecen en el reporte más
   reciente; se recalculan además en informe.js como
   verificación cruzada). */
const TOTALES = {
  personal: {
    profesores: 857, tutores: 737, administradores: 193, coordinadora: 2,
    enlaceProfesores: 25, enlaceTutores: 1,
    encargadoPedagogicoZonal: 6, apoyoPedagogico: 17,
    coordinadorTutores: 12, encargadoTutoresZonal: 6, apoyoTutores: 13, responsableCurso: 1,
    encargadoInformadoresZonal: 4, apoyoInformadores: 9,
    encargadoSoporteTecnicoZonal: 6, apoyoSoporteTecnologico: 9, enlaceSoporteTecnologico: 0,
    total: 1898,
    // Cifra real de personas (headcount único). "total" (1.898) es la
    // suma de roles y da más porque varias personas cumplen más de un
    // rol a la vez (ej. alguien es "Apoyo tutores" y también "Enlace
    // de curso"); 1.840 es el dato oficial de personas distintas.
    totalPersonasUnicas: 1840,
  },
  enlacesCurso: 159,
  oferta: { cursos: 154, grupos: 535, cupos: 26910 },
  comunidad: { iglesias: 603, creyentes: 236800 },
  informadores: 4701,
  coordinadoresZonales: 12,
  enlaceDelegacion: 98,
};

/* Cupos por curso y zona (fuente: hoja "Cupos" del consolidado
   Convocatoria 32). La suma de este detalle da 26.860; los 50
   cupos restantes hasta el total nacional (26.910) corresponden
   a un grupo presencial adicional en Bogotá y Cundinamarca cuyo
   curso aún no está identificado, por lo que no aparece aquí. */
const CUPOS_POR_CURSO = {
  "Bienestar para la persona mayor": { "bogota-cundinamarca": 300, "sur-llanos": 250, "antioquia-eje-cafetero": 200, "pacifico": 150 },
  "Bisutería": { "santanderes-boyaca": 100, "caribe": 60, "bogota-cundinamarca": 250, "antioquia-eje-cafetero": 50, "pacifico": 60 },
  "Comprensión Lectora": { "sur-llanos": 400, "santanderes-boyaca": 50, "caribe": 250, "antioquia-eje-cafetero": 350, "pacifico": 250, "bogota-cundinamarca": 500 },
  "Business English 1": { "bogota-cundinamarca": 60, "antioquia-eje-cafetero": 50, "pacifico": 60 },
  "Profundización Costos para Emprendedores": { "sur-llanos": 250, "santanderes-boyaca": 50, "caribe": 50, "pacifico": 60, "bogota-cundinamarca": 250 },
  "Confección: Manejo de Máquinas de Coser": { "caribe": 60, "antioquia-eje-cafetero": 50, "pacifico": 120, "bogota-cundinamarca": 120 },
  "Business English 2": { "bogota-cundinamarca": 60 },
  "Despertar Emprendedor": { "sur-llanos": 700, "santanderes-boyaca": 100, "caribe": 100, "antioquia-eje-cafetero": 150, "pacifico": 150, "bogota-cundinamarca": 400 },
  "Despertar Humano": { "sur-llanos": 800, "santanderes-boyaca": 200, "caribe": 200, "antioquia-eje-cafetero": 650, "pacifico": 350, "bogota-cundinamarca": 500 },
  "Economía del Hogar": { "sur-llanos": 500, "santanderes-boyaca": 200, "caribe": 200, "antioquia-eje-cafetero": 400, "pacifico": 300, "bogota-cundinamarca": 450 },
  "El ABC del Reciclaje": { "sur-llanos": 350, "santanderes-boyaca": 50, "caribe": 50, "antioquia-eje-cafetero": 150, "pacifico": 100, "bogota-cundinamarca": 250 },
  "Estrategias para la Búsqueda de Empleo": { "sur-llanos": 50, "caribe": 50, "antioquia-eje-cafetero": 150, "pacifico": 150, "bogota-cundinamarca": 350 },
  "Familias Empresarias del Campo": { "santanderes-boyaca": 50, "sur-llanos": 100, "antioquia-eje-cafetero": 50, "pacifico": 60, "bogota-cundinamarca": 250 },
  "Inglés Nivel 1": { "santanderes-boyaca": 240, "sur-llanos": 250, "caribe": 200, "antioquia-eje-cafetero": 250, "pacifico": 350, "bogota-cundinamarca": 750 },
  "Inglés Nivel 2": { "santanderes-boyaca": 60, "sur-llanos": 200, "caribe": 100, "antioquia-eje-cafetero": 200, "pacifico": 350, "bogota-cundinamarca": 450 },
  "Francés Nivel 1": { "caribe": 50, "pacifico": 200, "bogota-cundinamarca": 200 },
  "Italiano Nivel 1": { "santanderes-boyaca": 60, "caribe": 60, "pacifico": 150, "bogota-cundinamarca": 60 },
  "English for Kids": { "bogota-cundinamarca": 100 },
  "Mi Negocio en Internet": { "sur-llanos": 250, "santanderes-boyaca": 50, "caribe": 50, "pacifico": 60, "bogota-cundinamarca": 200 },
  "English for Teens": { "bogota-cundinamarca": 100 },
  "Modistería (Faldas)": { "sur-llanos": 150, "santanderes-boyaca": 50, "antioquia-eje-cafetero": 100, "caribe": 120, "pacifico": 120, "bogota-cundinamarca": 120 },
  "Floristería 1": { "pacifico": 60, "bogota-cundinamarca": 120 },
  "Orientación Emprendedora": { "sur-llanos": 150, "santanderes-boyaca": 50, "antioquia-eje-cafetero": 400, "caribe": 150, "pacifico": 200, "bogota-cundinamarca": 350 },
  "Repostería 1": { "sur-llanos": 150, "antioquia-eje-cafetero": 100, "caribe": 120, "pacifico": 200, "bogota-cundinamarca": 150 },
  "Sistemas Nivel 1": { "santanderes-boyaca": 50, "sur-llanos": 250, "antioquia-eje-cafetero": 700, "caribe": 150, "pacifico": 400, "bogota-cundinamarca": 650 },
  "Repostería 2": { "sur-llanos": 50, "caribe": 120, "pacifico": 120, "bogota-cundinamarca": 100 },
  "Pintura en madera 1": { "antioquia-eje-cafetero": 50, "caribe": 100, "pacifico": 60, "bogota-cundinamarca": 180 },
  "Sistemas Nivel 2": { "santanderes-boyaca": 100, "sur-llanos": 150, "antioquia-eje-cafetero": 250, "caribe": 60, "pacifico": 200, "bogota-cundinamarca": 240 },
  "Sin Límites Virtual": { "sur-llanos": 100, "antioquia-eje-cafetero": 50, "caribe": 50, "bogota-cundinamarca": 100 },
  "Francés Nivel 2": { "bogota-cundinamarca": 100 },
  "Portugués Nivel 1": { "caribe": 50, "pacifico": 150, "bogota-cundinamarca": 180 },
  "Peinados y Trenzas": { "sur-llanos": 50, "antioquia-eje-cafetero": 150, "pacifico": 120, "bogota-cundinamarca": 180 },
  "Italiano Nivel 2": { "bogota-cundinamarca": 120 },
  "Sistemas e Informática · Sistema Básico": { "antioquia-eje-cafetero": 50 },
  "Sistemas e Informática · Nivel Avanzado": { "antioquia-eje-cafetero": 50 },
  "Huertas Caseras": { "antioquia-eje-cafetero": 50 },
  "Muñecas de Trapo": { "bogota-cundinamarca": 120 },
  "English Leasing a Conversación": { "antioquia-eje-cafetero": 50 },
  "Bonsái en Alambre y Pedrería": { "antioquia-eje-cafetero": 50 },
  "Portugués Nivel 2": { "bogota-cundinamarca": 60 },
  "Modistería: Reparación y Modificación de Prendas de Vestir": { "bogota-cundinamarca": 120 },
  "Salud y Bienestar para Ovinos y Caprinos": { "bogota-cundinamarca": 60 },
};
