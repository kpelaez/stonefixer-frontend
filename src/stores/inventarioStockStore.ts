// src/stores/inventarioStockStore.ts
/**
 * Estado global del módulo Inventario de Stock con Zustand 5.
 *
 * Responsabilidades:
 *   - Cachear la lista de relevamientos y el relevamiento activo.
 *   - Manejar el estado de polling del scraping.
 *   - Exponer acciones que llaman a inventarioStockService y actualizan el estado.
 *
 * Convenciones del proyecto:
 *   - No duplicar lógica del service (el store LLAMA al service, no hace HTTP).
 *   - Loading granular por acción (no un solo `isLoading` global).
 *   - Errores como string | null.
 */

import { create } from 'zustand';
import toast from 'react-hot-toast';
import inventarioStockService from '../services/inventarioStockService';
import type {
  AnalisisSummary,
  Ajuste,
  CargaResultadosFisicosRequest,
  Relevamiento,
  RelevamientoCreate,
  ScrapingStatusResponse,
  Serie,
} from '../types/inventarioStock';

// ---------------------------------------------------------------------------
// Tipos del store
// ---------------------------------------------------------------------------

interface InventarioStockState {
  // Datos
  relevamientos: Relevamiento[];
  relevamientoActivo: Relevamiento | null;
  series: Serie[];
  totalSeries: number;
  analisis: AnalisisSummary | null;
  ajustes: Ajuste[];

  // Paginación de series
  paginaActual: number;
  pageSize: number;

  // Polling
  scrapingStatus: ScrapingStatusResponse | null;
  pollingIntervalId: ReturnType<typeof setInterval> | null;

  // Estados de carga
  cargandoRelevamientos: boolean;
  cargandoSeries: boolean;
  ejecutandoScraping: boolean;
  cargandoAnalisis: boolean;
  guardandoResultados: boolean;

  // Errores
  errorRelevamientos: string | null;
  errorSeries: string | null;
  errorScraping: string | null;

  // Acciones
  cargarRelevamientos: (filtros?: { proveedor?: string; mes_ciclo?: string }) => Promise<void>;
  crearRelevamiento: (payload: RelevamientoCreate) => Promise<Relevamiento | null>;
  seleccionarRelevamiento: (rel: Relevamiento) => void;
  limpiarRelevamientoActivo: () => void;

  ejecutarScraping: (relevamientoId: number) => Promise<void>;
  iniciarPolling: (relevamientoId: number) => void;
  detenerPolling: () => void;

  cargarSeries: (
    relevamientoId: number,
    opciones?: { page?: number; page_size?: number; solo_pendientes?: boolean; solo_diferencias?: boolean }
  ) => Promise<void>;

  guardarResultadosFisicos: (
    relevamientoId: number,
    payload: CargaResultadosFisicosRequest
  ) => Promise<boolean>;

  generarAnalisis: (relevamientoId: number) => Promise<void>;
  cargarAnalisis: (relevamientoId: number) => Promise<void>;

  descargarExcel: (relevamientoId: number) => Promise<void>;

  autorizarAjuste: (ajusteId: number, nota?: string) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useInventarioStockStore = create<InventarioStockState>((set, get) => ({
  // Estado inicial
  relevamientos: [],
  relevamientoActivo: null,
  series: [],
  totalSeries: 0,
  analisis: null,
  ajustes: [],
  paginaActual: 1,
  pageSize: 50,
  scrapingStatus: null,
  pollingIntervalId: null,
  cargandoRelevamientos: false,
  cargandoSeries: false,
  ejecutandoScraping: false,
  cargandoAnalisis: false,
  guardandoResultados: false,
  errorRelevamientos: null,
  errorSeries: null,
  errorScraping: null,

  // ------------------------------------------------------------------
  // Relevamientos
  // ------------------------------------------------------------------

  cargarRelevamientos: async (filtros) => {
    set({ cargandoRelevamientos: true, errorRelevamientos: null });
    try {
      const data = await inventarioStockService.listarRelevamientos(filtros);
      set({ relevamientos: data });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar relevamientos';
      set({ errorRelevamientos: msg });
      toast.error(msg);
    } finally {
      set({ cargandoRelevamientos: false });
    }
  },

  crearRelevamiento: async (payload) => {
    try {
      const nuevo = await inventarioStockService.crearRelevamiento(payload);
      set((state) => ({ relevamientos: [nuevo, ...state.relevamientos] }));
      toast.success(`Relevamiento creado para ${payload.proveedor} (${payload.mes_ciclo})`);
      return nuevo;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al crear relevamiento';
      toast.error(msg);
      return null;
    }
  },

  seleccionarRelevamiento: (rel) => set({ relevamientoActivo: rel }),

  limpiarRelevamientoActivo: () => {
    get().detenerPolling();
    set({
      relevamientoActivo: null,
      series: [],
      totalSeries: 0,
      analisis: null,
      scrapingStatus: null,
    });
  },

  // ------------------------------------------------------------------
  // Scraping + Polling
  // ------------------------------------------------------------------

  ejecutarScraping: async (relevamientoId) => {
    set({ ejecutandoScraping: true, errorScraping: null });
    try {
      await inventarioStockService.ejecutarScraping(relevamientoId);
      toast.success('Scraping iniciado. Te avisaremos cuando finalice.');
      get().iniciarPolling(relevamientoId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar scraping';
      set({ errorScraping: msg });
      toast.error(msg);
    } finally {
      set({ ejecutandoScraping: false });
    }
  },

  iniciarPolling: (relevamientoId) => {
    // Limpiar intervalo previo si existe
    const prevId = get().pollingIntervalId;
    if (prevId) clearInterval(prevId);

    const intervalId = setInterval(async () => {
      try {
        const status = await inventarioStockService.obtenerEstadoScraping(relevamientoId);
        set({ scrapingStatus: status });

        // Actualizar el relevamiento activo con el nuevo estado
        set((state) => ({
          relevamientoActivo: state.relevamientoActivo
            ? { ...state.relevamientoActivo, estado: status.estado }
            : state.relevamientoActivo,
          relevamientos: state.relevamientos.map((r) =>
            r.id === relevamientoId ? { ...r, estado: status.estado } : r
          ),
        }));

        // Detener polling cuando el scraping termina (OK o error)
        if (status.estado === 'listo') {
          get().detenerPolling();
          toast.success('¡Scraping completado! Planilla lista para descargar.');
        } else if (status.estado === 'pendiente' && status.scraping_error) {
          get().detenerPolling();
          toast.error(`Error en scraping: ${status.scraping_error}`);
        }
      } catch {
        // Silenciar errores de red durante polling; no interrumpir UX
      }
    }, 3_000); // Cada 3 segundos

    set({ pollingIntervalId: intervalId });
  },

  detenerPolling: () => {
    const id = get().pollingIntervalId;
    if (id) {
      clearInterval(id);
      set({ pollingIntervalId: null });
    }
  },

  // ------------------------------------------------------------------
  // Series
  // ------------------------------------------------------------------

  cargarSeries: async (relevamientoId, opciones = {}) => {
    const { page = 1, solo_pendientes = false, solo_diferencias = false } = opciones;
    set({ cargandoSeries: true, errorSeries: null, paginaActual: page });
    try {
      const res = await inventarioStockService.listarSeries(relevamientoId, {
        page,
        page_size: opciones?.page_size ?? get().pageSize,
        solo_pendientes,
        solo_diferencias,
      });
      set({ series: res.items, totalSeries: res.total });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar series';
      set({ errorSeries: msg });
      toast.error(msg);
    } finally {
      set({ cargandoSeries: false });
    }
  },

  guardarResultadosFisicos: async (relevamientoId, payload) => {
    set({ guardandoResultados: true });
    try {
      const res = await inventarioStockService.cargarResultadosFisicos(
        relevamientoId,
        payload
      );
      toast.success(`${res.actualizadas} series actualizadas`);
      if (res.no_encontradas.length > 0) {
        toast(`⚠️ ${res.no_encontradas.length} series no encontradas`, { icon: '⚠️' });
      }
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar resultados';
      toast.error(msg);
      return false;
    } finally {
      set({ guardandoResultados: false });
    }
  },

  // ------------------------------------------------------------------
  // Análisis
  // ------------------------------------------------------------------

  generarAnalisis: async (relevamientoId) => {
    set({ cargandoAnalisis: true });
    try {
      const analisis = await inventarioStockService.generarAnalisis(relevamientoId);
      set({ analisis });
      toast.success(`Análisis completado: ${analisis.total_diferencias} diferencias encontradas`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al generar análisis';
      toast.error(msg);
    } finally {
      set({ cargandoAnalisis: false });
    }
  },

  cargarAnalisis: async (relevamientoId) => {
    set({ cargandoAnalisis: true });
    try {
      const analisis = await inventarioStockService.verAnalisis(relevamientoId);
      set({ analisis });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar análisis';
      toast.error(msg);
    } finally {
      set({ cargandoAnalisis: false });
    }
  },

  // ------------------------------------------------------------------
  // Excel
  // ------------------------------------------------------------------

  descargarExcel: async (relevamientoId) => {
    const rel = get().relevamientoActivo;
    if (!rel) return;
    try {
      await inventarioStockService.descargarExcel(
        relevamientoId,
        rel.proveedor,
        rel.mes_ciclo
      );
      toast.success('Planilla descargada');
    } catch {
      toast.error('Error al descargar la planilla');
    }
  },

  // ------------------------------------------------------------------
  // Ajustes
  // ------------------------------------------------------------------

  autorizarAjuste: async (ajusteId, nota) => {
    try {
      const ajuste = await inventarioStockService.autorizarAjuste(ajusteId, { nota });
      set((state) => ({
        ajustes: state.ajustes.map((a) => (a.id === ajusteId ? ajuste : a)),
      }));
      toast.success(`Ajuste #${ajusteId} autorizado`);
    } catch {
      toast.error('Error al autorizar el ajuste');
    }
  },
}));