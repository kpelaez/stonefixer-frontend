// src/data/actionPlanData.ts
// Iniciativas derivadas del análisis de la Encuesta de Clima Laboral 2026.
// Fuente: respuestas abiertas + dimensiones con score más bajo.
//
// MIGRACIÓN FUTURA: cuando RRHH confirme el plan real o se implemente el
// backend, reemplazar este archivo por llamadas a actionPlanService.ts
// sin modificar los componentes.

import type { ActionItem, KanbanColumn } from '../types/actionPlan';

export const KANBAN_COLUMNS: KanbanColumn[] = [
  {
    id: 'pendiente',
    label: 'Pendiente',
    color: 'bg-gray-100',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-300',
  },
  {
    id: 'en_progreso',
    label: 'En progreso',
    color: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-300',
  },
  {
    id: 'completado',
    label: 'Completado',
    color: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-300',
  },
  {
    id: 'descartado',
    label: 'Descartado',
    color: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-300',
  },
];

export const ACTION_ITEMS: ActionItem[] = [
  // ── Comunicación (tema #1, 18 menciones) ─────────────────────────────────
  {
    id: 'ac-001',
    title: 'Definir canales oficiales de comunicación entre sectores',
    description:
      'Establecer qué canal se usa para cada tipo de comunicación (urgente, informativa, decisiones). Comunicar la política a toda la empresa.',
    category: 'comunicacion',
    status: 'pendiente',
    priority: 'alta',
    sourceInsight:
      '"Más comunicación entre los sectores" — mencionado en 18 respuestas abiertas.',
  },
  {
    id: 'ac-002',
    title: 'Implementar reuniones de sincronización inter-áreas',
    description:
      'Reunión quincenal breve (15-20 min) entre referentes de cada sector para alinear prioridades y detectar dependencias.',
    category: 'comunicacion',
    status: 'pendiente',
    priority: 'alta',
    sourceInsight:
      '"La colaboración mutua entre todas las áreas para lograr un trabajo eficiente y sencillo para todos."',
  },
  {
    id: 'ac-003',
    title: 'Revisar y fortalecer políticas de comunicación interna',
    description:
      'Documentar y comunicar las políticas y criterios de toma de decisiones gerenciales que impactan a los equipos.',
    category: 'comunicacion',
    status: 'pendiente',
    priority: 'media',
    sourceInsight:
      '"A veces ciertas decisiones a nivel gerencial deberían ser mejor comunicadas a los involucrados."',
  },

  // ── Objetivos claros (tema #2, 15 menciones) ─────────────────────────────
  {
    id: 'ac-004',
    title: 'Definir OKRs o metas por área para 2026',
    description:
      'Establecer objetivos claros, medibles y alcanzables por sector. Comunicarlos formalmente a cada equipo antes del Q2.',
    category: 'objetivos',
    status: 'en_progreso',
    priority: 'alta',
    sourceInsight:
      '"Tener objetivos claros tanto estratégicos de la compañía como individuales." — 15 menciones.',
  },
  {
    id: 'ac-005',
    title: 'Implementar evaluaciones de desempeño individuales',
    description:
      'Definir criterios de evaluación por puesto. Realizar revisiones semestrales con feedback estructurado.',
    category: 'objetivos',
    status: 'pendiente',
    priority: 'alta',
    sourceInsight:
      '"Realizar evaluaciones y fijar objetivos para conocer qué se espera de cada puesto."',
  },
  {
    id: 'ac-006',
    title: 'Definir esquema de incentivos por objetivos cumplidos',
    description:
      'Diseñar un sistema de bonos o reconocimientos asociados al cumplimiento de metas individuales y de equipo.',
    category: 'objetivos',
    status: 'pendiente',
    priority: 'media',
    sourceInsight:
      '"Incentivos de premios anuales (bono) por resultados obtenidos con respecto a los objetivos planteados."',
  },

  // ── Liderazgo (score 7.8, varios comentarios constructivos) ──────────────
  {
    id: 'ac-007',
    title: 'Programa de capacitación para líderes de equipo',
    description:
      'Talleres o capacitaciones en resolución de conflictos, feedback efectivo, asignación de responsabilidades y acompañamiento.',
    category: 'liderazgo',
    status: 'pendiente',
    priority: 'alta',
    sourceInsight:
      '"Capacitación a los líderes para un enfoque apropiado en la resolución de problemas y acompañamiento a sus equipos."',
  },
  {
    id: 'ac-008',
    title: 'Establecer espacios regulares de feedback 1:1',
    description:
      'Cada líder tiene reuniones individuales periódicas (al menos mensuales) con cada miembro de su equipo.',
    category: 'liderazgo',
    status: 'pendiente',
    priority: 'media',
    sourceInsight:
      '"Hay predisposición y apoyo; a veces ayudaría un seguimiento más regular."',
  },

  // ── Flexibilidad / Home office (tema #3, 12 menciones) ───────────────────
  {
    id: 'ac-009',
    title: 'Evaluar viabilidad de política de home office parcial',
    description:
      'Relevar qué puestos admiten modalidad híbrida. Definir criterios, frecuencia y herramientas necesarias. Presentar propuesta a gerencia.',
    category: 'flexibilidad',
    status: 'pendiente',
    priority: 'media',
    sourceInsight:
      '"Home office" — mencionado en 12 respuestas. "Trabajar con objetivos claros y mayor flexibilidad en las jornadas laborales."',
  },
  {
    id: 'ac-010',
    title: 'Explorar horario flexible o viernes flex',
    description:
      'Evaluar la implementación de un esquema de horario flexible o cierre anticipado los viernes como beneficio adicional.',
    category: 'flexibilidad',
    status: 'pendiente',
    priority: 'baja',
    sourceInsight:
      '"Ojalá se puedan agregar como gimnasio, viernes flex o algún día de home office."',
  },

  // ── Espacio físico (tema #5, 8 menciones) ────────────────────────────────
  {
    id: 'ac-011',
    title: 'Relevamiento de necesidades de espacio por sector',
    description:
      'Realizar un diagnóstico del espacio físico actual. Identificar sectores más afectados y opciones de mejora a corto plazo.',
    category: 'espacio',
    status: 'en_progreso',
    priority: 'alta',
    sourceInsight:
      '"El dilema hoy es el espacio físico. Si pudiéramos mejorar este punto sería un gran aporte para la comodidad de todos."',
  },
  {
    id: 'ac-012',
    title: 'Nuevo espacio laboral integrado por áreas',
    description:
      'Planificar la redistribución o ampliación del espacio para que las áreas puedan trabajar de manera integrada y no sectorizada.',
    category: 'espacio',
    status: 'pendiente',
    priority: 'media',
    sourceInsight:
      '"Nuevo espacio laboral donde se integren todas las áreas y se pueda trabajar como un todo y no sectorizado."',
  },

  // ── Beneficios (score 7.2) ────────────────────────────────────────────────
  {
    id: 'ac-013',
    title: 'Revisión y actualización del paquete de beneficios',
    description:
      'Relevar los beneficios actuales, comparar con el mercado y evaluar incorporar nuevas opciones (gimnasio, salud mental, etc.).',
    category: 'beneficios',
    status: 'pendiente',
    priority: 'media',
    sourceInsight:
      '"Seguir revisándolos y adaptándolos a las nuevas tendencias del mercado puede potenciar aún más el bienestar."',
  },
  {
    id: 'ac-014',
    title: 'Definir política de revisiones salariales',
    description:
      'Establecer criterios claros y comunicados de cuándo, cómo y bajo qué condiciones se realizan las revisiones de remuneración.',
    category: 'beneficios',
    status: 'pendiente',
    priority: 'alta',
    sourceInsight:
      '"Tener más claridad sobre políticas y criterios de revisiones salariales." — múltiples menciones.',
  },

  // ── Claridad de rol (score más bajo: 6.0) ────────────────────────────────
  {
    id: 'ac-015',
    title: 'Documentar responsabilidades por puesto y sector',
    description:
      'Crear o actualizar las descripciones de puesto de cada rol. Comunicarlas formalmente a cada colaborador y a sus líderes.',
    category: 'objetivos',
    status: 'pendiente',
    priority: 'alta',
    sourceInsight:
      '"Definir con mayor precisión las tareas y responsabilidades correspondientes a cada sector." Score más bajo de la encuesta: 6.0/10.',
  },
];