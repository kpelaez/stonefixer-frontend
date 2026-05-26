// src/data/hrSurveyData.ts
// Fuente de verdad de la encuesta de clima laboral 2026 — Omnimedica
// Si en el futuro los datos son dinámicos, reemplazar las importaciones
// de este archivo por llamadas a hrSurveyService.ts sin tocar los componentes.

import type { SurveyComment, DimensionMeta } from '../types/hrSurvey';

export const SURVEY_META = {
  title: 'Encuesta de Clima Laboral',
  edition: '2026',
  totalResponses: 42,
  closedAt: '2026-02-01',
};

export const DIMENSIONS: DimensionMeta[] = [
  {
    key: 'bienestar',
    label: 'Bienestar general',
    color: 'bg-emerald-100',
    textColor: 'text-emerald-800',
    score: 8.2,
  },
  {
    key: 'motivacion',
    label: 'Motivación',
    color: 'bg-teal-100',
    textColor: 'text-teal-800',
    score: 8.8,
  },
  {
    key: 'liderazgo',
    label: 'Liderazgo',
    color: 'bg-blue-100',
    textColor: 'text-blue-800',
    score: 7.8,
  },
  {
    key: 'comunicacion',
    label: 'Comunicación',
    color: 'bg-amber-100',
    textColor: 'text-amber-800',
    score: 6.5,
  },
  {
    key: 'beneficios',
    label: 'Beneficios',
    color: 'bg-purple-100',
    textColor: 'text-purple-800',
    score: 7.2,
  },
  {
    key: 'claridad_rol',
    label: 'Claridad de rol',
    color: 'bg-red-100',
    textColor: 'text-red-800',
    score: 6.0,
  },
  {
    key: 'mejoras',
    label: 'Propuestas de mejora',
    color: 'bg-gray-100',
    textColor: 'text-gray-800',
    score: 0, // dimensión abierta, sin score numérico
  },
];

export const COMMENTS: SurveyComment[] = [
  // ── Bienestar ──────────────────────────────────────────────────────────────
  {
    id: 1,
    dimension: 'bienestar',
    sentiment: 'positivo',
    text: 'En general me siento bien y con energía para arrancar el año. Estamos encaminados; como mejora, ayudaría tener prioridades y objetivos más claros para ordenar el día a día.',
  },
  {
    id: 2,
    dimension: 'bienestar',
    sentiment: 'positivo',
    text: 'En líneas generales, la experiencia ha sido positiva y se percibe una mejora respecto al año pasado. Se reflejan cambios orientados a la optimización de procesos.',
  },
  {
    id: 3,
    dimension: 'bienestar',
    sentiment: 'positivo',
    text: 'Estoy muy expectante de los cambios que pueda traer el consultor para ayudar a ordenar y organizar la empresa en general.',
  },
  {
    id: 4,
    dimension: 'bienestar',
    sentiment: 'positivo',
    text: 'Muy lindo equipo.',
  },
  {
    id: 5,
    dimension: 'bienestar',
    sentiment: 'positivo',
    text: 'En lo personal me encuentro muy bien trabajando dentro de la empresa, siempre soñé con un trabajo como este. Las personas, desde el día uno, me hicieron sentir recibido y parte de la organización.',
  },
  {
    id: 6,
    dimension: 'bienestar',
    sentiment: 'positivo',
    text: 'Año con expectativas de cambios positivos. Trabajar con los líderes, proponiendo mejoras. Resaltar valores como respeto, compañerismo y empatía.',
  },
  {
    id: 7,
    dimension: 'bienestar',
    sentiment: 'positivo',
    text: 'Al principio fue mucho descubrimiento y adaptación. Hoy en día estoy más acoplado y más enfocado en crecer junto a mi equipo.',
  },
  {
    id: 8,
    dimension: 'bienestar',
    sentiment: 'constructivo',
    text: 'Mi lugar y equipo de trabajo son acorde a lo que busco. Quizás estaría bueno revisiones de sueldos trimestrales, premios por objetivos y la implementación de home office. Remarco que Omnimedica es un gran lugar para trabajar, pero siempre se puede mejorar y crecer todos juntos.',
  },
  {
    id: 9,
    dimension: 'bienestar',
    sentiment: 'positivo',
    text: 'Estoy contento por la confianza que tienen en mí y la oportunidad de crecimiento dentro de la empresa. Estoy aprendiendo mucho.',
  },
  {
    id: 10,
    dimension: 'bienestar',
    sentiment: 'positivo',
    text: 'Me siento motivada y con energía. Es una etapa de desafíos, aprendizaje y crecimiento para todos.',
  },

  // ── Motivación ─────────────────────────────────────────────────────────────
  {
    id: 11,
    dimension: 'motivacion',
    sentiment: 'positivo',
    text: 'Con energía para avanzar, aunque con algunos temas por ordenar.',
  },
  {
    id: 12,
    dimension: 'motivacion',
    sentiment: 'constructivo',
    text: 'Aunque a veces ciertas actitudes o decisiones que toman me la bajan y me quitan ganas.',
  },
  {
    id: 13,
    dimension: 'motivacion',
    sentiment: 'positivo',
    text: 'Siempre encuentro auto-motivación y visualizo mucho lo positivo para poder estar a la altura de los desafíos.',
  },
  {
    id: 14,
    dimension: 'motivacion',
    sentiment: 'positivo',
    text: 'Muy alto porque me tienen en cuenta para el futuro de la empresa con sus cambios y proyectos para el crecimiento. Este nuevo año empecé con nuevas tareas y funciones que me hacen sentir valorado.',
  },
  {
    id: 15,
    dimension: 'motivacion',
    sentiment: 'positivo',
    text: 'Muy alta. Este año es algo nuevo y con nuevos objetivos que voy poniéndome en claro a medida que va avanzando el año.',
  },
  {
    id: 16,
    dimension: 'motivacion',
    sentiment: 'positivo',
    text: 'Estoy arrancando el año con un nivel de motivación alto, con ganas de seguir construyendo, acompañar al equipo y avanzar en los objetivos que nos propongamos.',
  },

  // ── Liderazgo ──────────────────────────────────────────────────────────────
  {
    id: 17,
    dimension: 'liderazgo',
    sentiment: 'positivo',
    text: 'Entusiasmado por seguir aprendiendo.',
  },
  {
    id: 18,
    dimension: 'liderazgo',
    sentiment: 'constructivo',
    text: 'Hay predisposición y apoyo; a veces ayudaría un seguimiento más regular.',
  },
  {
    id: 19,
    dimension: 'liderazgo',
    sentiment: 'positivo',
    text: 'Es un líder en el que uno puede tener cualquier conversación y siempre es escuchado, tanto en lo profesional como en lo personal. Es un gran líder.',
  },
  {
    id: 20,
    dimension: 'liderazgo',
    sentiment: 'positivo',
    text: 'Es un buen líder, de a poco voy conociendo sus formas y es una persona bastante optimista.',
  },
  {
    id: 21,
    dimension: 'liderazgo',
    sentiment: 'positivo',
    text: 'Me siento acompañada y siento la disponibilidad siempre por parte de mis líderes; esto me aporta claridad y confianza para desarrollar mi trabajo.',
  },
  {
    id: 22,
    dimension: 'liderazgo',
    sentiment: 'constructivo',
    text: 'Se valora el aporte, pero ayudaría tener espacios más regulares para feedback y seguimiento de lo conversado.',
  },
  {
    id: 23,
    dimension: 'liderazgo',
    sentiment: 'positivo',
    text: 'Sí, en este momento estoy notando que voy tomando confianza para poder brindar mis opiniones.',
  },
  {
    id: 24,
    dimension: 'liderazgo',
    sentiment: 'positivo',
    text: 'Siento que mis opiniones cuentan y que existe apertura al intercambio de ideas, algo clave para construir un equipo sólido.',
  },

  // ── Comunicación ───────────────────────────────────────────────────────────
  {
    id: 25,
    dimension: 'comunicacion',
    sentiment: 'positivo',
    text: 'Desde que se implementó la aplicación, la comunicación mejoró bastante; todavía hay algunos baches puntuales, pero en general está bien.',
  },
  {
    id: 26,
    dimension: 'comunicacion',
    sentiment: 'constructivo',
    text: 'Creo que es un punto en el que hay que mejorar mucho, tanto en la comunicación general como en cada área.',
  },
  {
    id: 27,
    dimension: 'comunicacion',
    sentiment: 'neutro',
    text: 'Quizás muchas personas cuentan con muchas tareas y eso les impide ser claros a la hora de comunicar.',
  },
  {
    id: 28,
    dimension: 'comunicacion',
    sentiment: 'positivo',
    text: 'En general la comunicación es clara y acompaña mi trabajo diario, aunque creo que hay que seguir fortaleciendo los canales y las políticas internas.',
  },
  {
    id: 29,
    dimension: 'comunicacion',
    sentiment: 'neutro',
    text: 'Soy tímido pero de a poco voy dejando atrás eso y tengo más confianza para hablar con más personas en el equipo.',
  },

  // ── Beneficios ─────────────────────────────────────────────────────────────
  {
    id: 30,
    dimension: 'beneficios',
    sentiment: 'neutro',
    text: 'Considero que aportan un valor moderado. Son beneficios que la empresa ofrece y se valoran; en mi caso, algunos los aprovecho más que otros.',
  },
  {
    id: 31,
    dimension: 'beneficios',
    sentiment: 'positivo',
    text: 'Los beneficios son claves para la motivación. El beneficio de pedido ya, la fruta, lo dulce, las tortas... alegran y motivan. Ojalá se puedan agregar como gimnasio, viernes flex o algún día de home office.',
  },
  {
    id: 32,
    dimension: 'beneficios',
    sentiment: 'positivo',
    text: 'Me generan comodidad y me hace sentir afortunado de los beneficios y acompañamiento que da la empresa para el día a día.',
  },
  {
    id: 33,
    dimension: 'beneficios',
    sentiment: 'positivo',
    text: 'Siento que los beneficios suman valor y acompañan mi experiencia en la compañía. Seguir revisándolos y adaptándolos a las nuevas tendencias del mercado puede potenciar aún más el bienestar.',
  },

  // ── Claridad de rol ────────────────────────────────────────────────────────
  {
    id: 34,
    dimension: 'claridad_rol',
    sentiment: 'constructivo',
    text: 'No del todo, sería útil aclarar expectativas y prioridades del rol.',
  },
  {
    id: 35,
    dimension: 'claridad_rol',
    sentiment: 'positivo',
    text: 'Siento que las expectativas sobre mi rol están claras y alineadas con el proyecto de empresa. Siempre valoro mantener espacios de conversación y oportunidades de mejora continua.',
  },

  // ── Propuestas de mejora ───────────────────────────────────────────────────
  {
    id: 36,
    dimension: 'mejoras',
    sentiment: 'constructivo',
    text: 'Capacitación a los líderes para un enfoque apropiado en la resolución de problemas, asignación de responsabilidades y acompañamiento a sus equipos. Realizar evaluaciones y fijar objetivos para conocer qué se espera de cada puesto.',
  },
  {
    id: 37,
    dimension: 'mejoras',
    sentiment: 'constructivo',
    text: 'Establecer objetivos claros y motivadores, como premios o bonos, puede impulsar significativamente el rendimiento y la motivación para alcanzar las metas.',
  },
  {
    id: 38,
    dimension: 'mejoras',
    sentiment: 'constructivo',
    text: 'Seguir mejorando los procesos y la coordinación del día a día. Tener más claridad sobre políticas y criterios de revisiones salariales. Buscar una dinámica un poco más flexible para trabajar más cómodos.',
  },
  {
    id: 39,
    dimension: 'mejoras',
    sentiment: 'constructivo',
    text: 'Sin dudas el espacio físico para las tareas laborales.',
  },
  {
    id: 40,
    dimension: 'mejoras',
    sentiment: 'constructivo',
    text: 'Más comunicación entre los sectores.',
  },
  {
    id: 41,
    dimension: 'mejoras',
    sentiment: 'constructivo',
    text: 'A veces ciertas decisiones a nivel gerencial deberían ser mejor comunicadas a los involucrados.',
  },
  {
    id: 42,
    dimension: 'mejoras',
    sentiment: 'constructivo',
    text: 'Que haya más comunicación entre todos los integrantes de la compañía.',
  },
  {
    id: 43,
    dimension: 'mejoras',
    sentiment: 'positivo',
    text: 'Seria ideal que haya la oportunidad de home office, creo que eso ayudaría muchísimo al empleado y al rendimiento. Los incentivos económicos y suba de la remuneración también harían que se genere esperanza de crecimiento personal y económico.',
  },
  {
    id: 44,
    dimension: 'mejoras',
    sentiment: 'positivo',
    text: 'Sinceramente me encuentro tan conforme con mis tareas que no se me ocurre algo que mejore aún más mi experiencia. Si tengo que imaginar algo, sería mayor cantidad de trabajo y responsabilidades que ayuden al desarrollo del sector.',
  },
  {
    id: 45,
    dimension: 'mejoras',
    sentiment: 'constructivo',
    text: 'Establecer metas claras y alcanzables, disponer de los medios y mecanismos necesarios para alcanzarlas.',
  },
  {
    id: 46,
    dimension: 'mejoras',
    sentiment: 'positivo',
    text: 'Por ahora siento que todo va encaminado para bien y que de a poco se van acomodando las cosas para llegar a tener mejores resultados. Mucho optimismo para este 2026.',
  },
  {
    id: 47,
    dimension: 'mejoras',
    sentiment: 'constructivo',
    text: 'Trabajar mucho con los líderes. Resaltar valores fundamentales para una buena convivencia. Salir de la zona de confort. Proponer mejoras. Sumar más beneficios.',
  },
  {
    id: 48,
    dimension: 'mejoras',
    sentiment: 'constructivo',
    text: 'Más comunicación entre sectores, más liderazgo y acompañamiento gerencial y objetivos claros de la empresa.',
  },
  {
    id: 49,
    dimension: 'mejoras',
    sentiment: 'constructivo',
    text: 'Comunicación entre sectores, más compañerismo y empatía.',
  },
  {
    id: 50,
    dimension: 'mejoras',
    sentiment: 'constructivo',
    text: 'Nuevo objetivos que permitan mi desarrollo y el desarrollo del equipo. Revisiones de sueldo trimestrales, premios con objetivos cumplidos, home office.',
  },
  {
    id: 51,
    dimension: 'mejoras',
    sentiment: 'constructivo',
    text: 'Tener objetivos claros tanto estratégicos de la compañía como individuales. Incentivos de premios anuales (bono) por resultados. Nuevo espacio laboral donde se integren todas las áreas y se pueda trabajar como un todo.',
  },
  {
    id: 52,
    dimension: 'mejoras',
    sentiment: 'constructivo',
    text: 'Fomentar actividades conjuntas que ayuden a interactuar a las distintas áreas.',
  },
  {
    id: 53,
    dimension: 'mejoras',
    sentiment: 'constructivo',
    text: 'Home office un día.',
  },
  {
    id: 54,
    dimension: 'mejoras',
    sentiment: 'constructivo',
    text: 'Definir con mayor precisión las tareas y responsabilidades correspondientes a cada sector. Evaluar la incorporación de algún recurso adicional que permita sostener un nivel óptimo de organización.',
  },
  {
    id: 55,
    dimension: 'mejoras',
    sentiment: 'constructivo',
    text: 'Trabajar en los procesos y empezar a medir los mismos para asignar tareas y recursos en cada área. Generar acuerdos de manera responsable.',
  },
  {
    id: 56,
    dimension: 'mejoras',
    sentiment: 'constructivo',
    text: 'Mayor compañerismo y empatía.',
  },
  {
    id: 57,
    dimension: 'mejoras',
    sentiment: 'constructivo',
    text: 'Trabajar con objetivos claros y mayor flexibilidad en las jornadas laborales (horario flexible, modalidades híbridas, home office).',
  },
  {
    id: 58,
    dimension: 'mejoras',
    sentiment: 'constructivo',
    text: 'Home office, mejoras salariales, incentivos sobre objetivos, mejor comunicación.',
  },
  {
    id: 59,
    dimension: 'mejoras',
    sentiment: 'constructivo',
    text: 'Mayor espacio físico y mejoras en el CRM.',
  },
  {
    id: 60,
    dimension: 'mejoras',
    sentiment: 'neutro',
    text: 'Recién empiezo, no tengo referencia o crítica constructiva por el momento.',
  },
  {
    id: 61,
    dimension: 'mejoras',
    sentiment: 'constructivo',
    text: 'El dilema hoy es el espacio físico. Si pudiéramos mejorar este punto sería un gran aporte para la comodidad de todos.',
  },
  {
    id: 62,
    dimension: 'mejoras',
    sentiment: 'constructivo',
    text: 'Seamos escuchados por el líder de equipo y sentir que nos acompaña.',
  },
  {
    id: 63,
    dimension: 'mejoras',
    sentiment: 'constructivo',
    text: 'Mejores objetivos que representen una considerable mejora en las comisiones. Mayor flexibilidad. Una distribución de las zonas más equitativas para potenciar las ventas.',
  },
  {
    id: 64,
    dimension: 'mejoras',
    sentiment: 'constructivo',
    text: 'Más organización.',
  },
];