// src/services/inventarioStockService.ts
/**
 * Cliente HTTP para el módulo Inventario de Stock.
 *
 * Convenciones del proyecto (ver shiftScheduleService.ts como referencia):
 *   - USA la instancia `api` de src/lib/axios.ts — NO importar axios directamente.
 *   - Token JWT, manejo de 401/403/500 y baseURL son responsabilidad del interceptor.
 *   - 1 clase por módulo, exportada como singleton (new al final).
 *   - Métodos tipados de entrada y salida.
 */

import api from '../lib/axios';
import type {
  AjusteAutorizarRequest,
  AjusteCreate,
  AnalisisSummary,
  Ajuste,
  CargaResultadosFisicosRequest,
  CargaResultadosResponse,
  Relevamiento,
  RelevamientoCreate,
  ScrapingStatusResponse,
  SeriesListResponse,
} from '../types/inventarioStock';

const BASE = '/api/v1/inventario-stock';

class InventarioStockService {
  // ------------------------------------------------------------------
  // Relevamientos
  // ------------------------------------------------------------------

  async listarRelevamientos(params?: {
    proveedor?: string;
    mes_ciclo?: string;
  }): Promise<Relevamiento[]> {
    const { data } = await api.get<Relevamiento[]>(`${BASE}/`, { params });
    return data;
  }

  async crearRelevamiento(payload: RelevamientoCreate): Promise<Relevamiento> {
    const { data } = await api.post<Relevamiento>(`${BASE}/`, payload);
    return data;
  }

  // ------------------------------------------------------------------
  // Scraping
  // ------------------------------------------------------------------

  async ejecutarScraping(relevamientoId: number): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>(
      `${BASE}/${relevamientoId}/ejecutar-scraping`
    );
    return data;
  }

  async obtenerEstadoScraping(
    relevamientoId: number
  ): Promise<ScrapingStatusResponse> {
    const { data } = await api.get<ScrapingStatusResponse>(
      `${BASE}/${relevamientoId}/estado`
    );
    return data;
  }

  // ------------------------------------------------------------------
  // Series
  // ------------------------------------------------------------------

  async listarSeries(
    relevamientoId: number,
    params?: {
      page?: number;
      page_size?: number;
      solo_pendientes?: boolean;
      solo_diferencias?: boolean;
    }
  ): Promise<SeriesListResponse> {
    const { data } = await api.get<SeriesListResponse>(
      `${BASE}/${relevamientoId}/series`,
      { params }
    );
    return data;
  }

  async cargarResultadosFisicos(
    relevamientoId: number,
    payload: CargaResultadosFisicosRequest
  ): Promise<CargaResultadosResponse> {
    const { data } = await api.patch<CargaResultadosResponse>(
      `${BASE}/${relevamientoId}/resultados-fisicos`,
      payload
    );
    return data;
  }

  // ------------------------------------------------------------------
  // Análisis
  // ------------------------------------------------------------------

  async generarAnalisis(relevamientoId: number): Promise<AnalisisSummary> {
    const { data } = await api.post<AnalisisSummary>(
      `${BASE}/${relevamientoId}/analisis`
    );
    return data;
  }

  async verAnalisis(relevamientoId: number): Promise<AnalisisSummary> {
    const { data } = await api.get<AnalisisSummary>(
      `${BASE}/${relevamientoId}/analisis`
    );
    return data;
  }

  // ------------------------------------------------------------------
  // Excel
  // ------------------------------------------------------------------

  async descargarExcel(relevamientoId: number, proveedor: string, mesCiclo: string): Promise<void> {
    const response = await api.get(`${BASE}/${relevamientoId}/excel`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `relevamiento_${proveedor.replace(/ /g, '_')}_${mesCiclo}.xlsx`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  // ------------------------------------------------------------------
  // Ajustes
  // ------------------------------------------------------------------

  async crearAjuste(
    relevamientoId: number,
    payload: AjusteCreate
  ): Promise<Ajuste> {
    const { data } = await api.post<Ajuste>(
      `${BASE}/${relevamientoId}/ajustes`,
      payload
    );
    return data;
  }

  async autorizarAjuste(
    ajusteId: number,
    payload: AjusteAutorizarRequest
  ): Promise<Ajuste> {
    const { data } = await api.patch<Ajuste>(
      `${BASE}/ajustes/${ajusteId}/autorizar`,
      payload
    );
    return data;
  }
}

export default new InventarioStockService();