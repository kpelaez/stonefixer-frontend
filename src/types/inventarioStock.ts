// src/types/inventarioStock.ts
/**
 * Tipos del módulo Inventario de Stock.
 * Refleja 1:1 los schemas del backend (app/schemas/inventario_stock.py).
 *
 * Convenciones del proyecto:
 *   - 1 archivo de tipos por módulo en src/types/
 *   - Enums como const enum o union type según uso en UI
 *   - Prefijo "I" solo para interfaces de datos puros
 */

// ---------------------------------------------------------------------------
// Enums (espejados del backend)
// ---------------------------------------------------------------------------

export type EstadoRelevamiento =
  | 'pendiente'
  | 'extrayendo'
  | 'listo'
  | 'en_conteo'
  | 'analizado'
  | 'cerrado';

export type EstadoSerie = 'alta' | 'kit';

export type ResultadoFisico = 'presente' | 'en_transito' | 'no_encontrada';

export type TipoDiferencia =
  | 'cant_omni_vs_finn'
  | 'serie_no_encontrada'
  | 'ingreso_no_reg'
  | 'lote_por_vencer';

export type EstadoAjuste = 'pendiente' | 'autorizado' | 'rechazado' | 'aplicado';

// ---------------------------------------------------------------------------
// Modelos de datos
// ---------------------------------------------------------------------------

export interface Relevamiento {
  id: number;
  proveedor: string;
  mes_ciclo: string;
  estado: EstadoRelevamiento;
  creado_por_user_id: number;
  creado_en: string;           // ISO datetime
  actualizado_en: string | null;
  total_series_omni: number | null;
  total_codigos_finn: number | null;
  scraping_iniciado_en: string | null;
  scraping_finalizado_en: string | null;
  scraping_error: string | null;
}

export interface RelevamientoDetail extends Relevamiento {
  total_diferencias: number;
  total_ajustes_pendientes: number;
  total_ajustes_autorizados: number;
  creado_por_nombre: string | null;
}

export interface Serie {
  id: number;
  relevamiento_id: number;
  codigo: string;
  descripcion: string | null;
  empresa: string | null;
  serie: string;
  lote: string | null;
  vencimiento: string | null;
  deposito: string | null;
  estado_sistema: EstadoSerie;
  en_transito: boolean;
  cant_finnegans: number | null;
  resultado_fisico: ResultadoFisico | null;
  observaciones: string | null;
  cargado_en: string | null;
  cargado_por_user_id: number | null;
  creado_en: string;
}

export interface Diferencia {
  id: number;
  relevamiento_id: number;
  serie_id: number | null;
  tipo: TipoDiferencia;
  descripcion: string;
  cant_omnimedica: number | null;
  cant_finnegans: number | null;
  diferencia: number | null;
  generado_en: string;
}

export interface Ajuste {
  id: number;
  relevamiento_id: number;
  diferencia_id: number;
  codigo: string;
  descripcion_ajuste: string;
  cant_ajuste: number;
  estado: EstadoAjuste;
  autorizado_por_user_id: number | null;
  autorizado_en: string | null;
  aplicado_en: string | null;
  nota: string | null;
  creado_en: string;
  // Extendido desde frontend
  autorizado_por_nombre?: string | null;
}

// ---------------------------------------------------------------------------
// Payloads de request
// ---------------------------------------------------------------------------

export interface RelevamientoCreate {
  proveedor: string;
  mes_ciclo: string; // YYYY-MM
}

export interface ResultadoFisicoItem {
  serie_id: number;
  resultado: ResultadoFisico;
  observaciones?: string;
}

export interface CargaResultadosFisicosRequest {
  items: ResultadoFisicoItem[];
}

export interface AjusteCreate {
  diferencia_id: number;
  codigo: string;
  descripcion_ajuste: string;
  cant_ajuste: number;
}

export interface AjusteAutorizarRequest {
  nota?: string;
}

// ---------------------------------------------------------------------------
// Respuestas
// ---------------------------------------------------------------------------

export interface ScrapingStatusResponse {
  relevamiento_id: number;
  estado: EstadoRelevamiento;
  total_series_omni: number | null;
  total_codigos_finn: number | null;
  scraping_iniciado_en: string | null;
  scraping_finalizado_en: string | null;
  scraping_error: string | null;
  porcentaje_completado: number | null;
}

export interface SeriesListResponse {
  total: number;
  page: number;
  page_size: number;
  items: Serie[];
}

export interface CargaResultadosResponse {
  actualizadas: number;
  no_encontradas: number[];
}

export interface AnalisisSummary {
  relevamiento_id: number;
  total_diferencias: number;
  por_tipo: Partial<Record<TipoDiferencia, number>>;
  diferencias: Diferencia[];
}

// ---------------------------------------------------------------------------
// Helpers de UI
// ---------------------------------------------------------------------------

export const ESTADO_RELEVAMIENTO_LABEL: Record<EstadoRelevamiento, string> = {
  pendiente: 'Pendiente',
  extrayendo: 'Extrayendo datos...',
  listo: 'Listo para conteo',
  en_conteo: 'En conteo físico',
  analizado: 'Analizado',
  cerrado: 'Cerrado',
};

export const TIPO_DIFERENCIA_LABEL: Record<TipoDiferencia, string> = {
  cant_omni_vs_finn: 'Diferencia Omni vs Finnegans',
  serie_no_encontrada: 'Serie no encontrada',
  ingreso_no_reg: 'Ingreso no registrado',
  lote_por_vencer: 'Lote próximo a vencer',
};

export const RESULTADO_FISICO_LABEL: Record<ResultadoFisico, string> = {
  presente: 'Presente',
  en_transito: 'En tránsito',
  no_encontrada: 'No encontrada',
};