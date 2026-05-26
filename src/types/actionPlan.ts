// src/types/actionPlan.ts

export type ActionStatus =
  | 'pendiente'
  | 'en_progreso'
  | 'completado'
  | 'descartado';

export type ActionPriority = 'alta' | 'media' | 'baja';

export type ActionCategory =
  | 'comunicacion'
  | 'liderazgo'
  | 'beneficios'
  | 'espacio'
  | 'objetivos'
  | 'flexibilidad'
  | 'otro';

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  category: ActionCategory;
  status: ActionStatus;
  priority: ActionPriority;
  sourceInsight: string; // comentario/hallazgo de la encuesta que motivó esta acción
}

export interface KanbanColumn {
  id: ActionStatus;
  label: string;
  color: string;       // color del header de columna
  textColor: string;
  borderColor: string;
}