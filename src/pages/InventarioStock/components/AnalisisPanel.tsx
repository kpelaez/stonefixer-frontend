// src/pages/InventarioStock/components/AnalisisPanel.tsx
/**
 * Panel de análisis de diferencias post-conteo físico.
 *
 * Muestra el resultado del motor de análisis del backend:
 *   - Resumen con conteo por tipo de diferencia
 *   - Lista detallada de diferencias con contexto
 *   - Acción para generar el análisis si todavía no existe
 *   - (Futuro) Autorización de ajustes en Finnegans
 */

import { useEffect, useState } from 'react';
import {
  BarChart2,
  AlertCircle,
  XCircle,
  Clock,
  TrendingDown,
  Loader2,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';
import { useInventarioStockStore } from '../../../stores/inventarioStockStore';
import type {
  Relevamiento,
  TipoDiferencia,
  Diferencia,
} from '../../../types/inventarioStock';
import { TIPO_DIFERENCIA_LABEL } from '../../../types/inventarioStock';

interface AnalisisPanelProps {
  relevamiento: Relevamiento;
}

// Configuración visual por tipo de diferencia
const TIPO_CONFIG: Record<
  TipoDiferencia,
  { icon: React.ReactNode; color: string; bg: string; border: string }
> = {
  cant_omni_vs_finn: {
    icon: <TrendingDown size={16} />,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
  },
  serie_no_encontrada: {
    icon: <XCircle size={16} />,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
  },
  ingreso_no_reg: {
    icon: <AlertCircle size={16} />,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
  },
  lote_por_vencer: {
    icon: <Clock size={16} />,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
  },
};

const AnalisisPanel = ({ relevamiento }: AnalisisPanelProps) => {
  const [generando, setGenerando] = useState(false);

  const {
    analisis,
    cargandoAnalisis,
    cargarAnalisis,
    generarAnalisis,
  } = useInventarioStockStore();

  // Intentar cargar análisis existente al montar
  useEffect(() => {
    if (relevamiento.estado === 'analizado' || relevamiento.estado === 'cerrado') {
      cargarAnalisis(relevamiento.id);
    }
  }, [relevamiento.id, relevamiento.estado, cargarAnalisis]);

  const handleGenerar = async () => {
    setGenerando(true);
    await generarAnalisis(relevamiento.id);
    setGenerando(false);
  };

  // ── Estado: sin análisis todavía ──────────────────────────────

  if (!analisis && !cargandoAnalisis) {
    return (
      <div className="max-w-lg space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center space-y-4">
          <BarChart2 size={44} className="text-teal-500 mx-auto" />
          <div>
            <p className="font-semibold text-gray-900">Generar análisis de diferencias</p>
            <p className="text-gray-400 text-sm mt-1">
              El motor comparará las series verificadas en el conteo físico
              contra lo que tienen Omnimedica y Finnegans.
            </p>
          </div>
          <button
            onClick={handleGenerar}
            disabled={generando}
            className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {generando ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <BarChart2 size={16} />
            )}
            {generando ? 'Analizando...' : 'Generar análisis'}
          </button>
        </div>
      </div>
    );
  }

  // ── Estado: cargando ──────────────────────────────────────────

  if (cargandoAnalisis) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 size={28} className="animate-spin text-teal-500" />
      </div>
    );
  }

  // ── Sin diferencias — todo ok ─────────────────────────────────

  if (analisis && analisis.total_diferencias === 0) {
    return (
      <div className="max-w-lg">
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center space-y-3">
          <CheckCircle size={48} className="text-green-500 mx-auto" />
          <div>
            <p className="font-semibold text-gray-900">Sin diferencias detectadas</p>
            <p className="text-gray-400 text-sm mt-1">
              El stock físico coincide con Omnimedica y Finnegans.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Con diferencias ───────────────────────────────────────────

  return (
    <div className="space-y-4 max-w-3xl">

      {/* Header del análisis */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            {analisis?.total_diferencias} diferencias detectadas
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {relevamiento.proveedor} · {relevamiento.mes_ciclo}
          </p>
        </div>
        <button
          onClick={handleGenerar}
          disabled={generando}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 text-sm transition-colors disabled:opacity-50"
          title="Re-generar análisis"
        >
          <RefreshCw size={14} className={generando ? 'animate-spin' : ''} />
          Re-analizar
        </button>
      </div>

      {/* Resumen por tipo */}
      {analisis && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(Object.entries(analisis.por_tipo) as [TipoDiferencia, number][]).map(
            ([tipo, cantidad]) => {
              const cfg = TIPO_CONFIG[tipo];
              return (
                <div
                  key={tipo}
                  className={`rounded-xl border p-3 ${cfg.bg} ${cfg.border}`}
                >
                  <div className={`flex items-center gap-1.5 ${cfg.color} mb-1`}>
                    {cfg.icon}
                    <span className="text-xs font-semibold">
                      {TIPO_DIFERENCIA_LABEL[tipo]}
                    </span>
                  </div>
                  <p className={`text-2xl font-bold ${cfg.color}`}>{cantidad}</p>
                </div>
              );
            }
          )}
        </div>
      )}

      {/* Lista detallada */}
      {analisis && analisis.diferencias.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-700">Detalle de diferencias</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {analisis.diferencias.map((dif) => (
              <DiferenciaRow key={dif.id} diferencia={dif} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Subcomponentes ────────────────────────────────────────────────────

const DiferenciaRow = ({ diferencia }: { diferencia: Diferencia }) => {
  const cfg = TIPO_CONFIG[diferencia.tipo];

  return (
    <div className="p-4 flex items-start gap-3">
      <div className={`mt-0.5 p-1.5 rounded-lg ${cfg.bg} ${cfg.color} flex-shrink-0`}>
        {cfg.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold ${cfg.color} mb-0.5`}>
          {TIPO_DIFERENCIA_LABEL[diferencia.tipo]}
        </p>
        <p className="text-sm text-gray-700">{diferencia.descripcion}</p>
        {diferencia.diferencia !== null && (
          <p className="text-xs text-gray-400 mt-1">
            Omnimedica: {diferencia.cant_omnimedica ?? '—'} ·{' '}
            Finnegans: {diferencia.cant_finnegans ?? '—'} ·{' '}
            <span className={diferencia.diferencia !== 0 ? 'text-orange-600 font-semibold' : ''}>
              Δ {diferencia.diferencia > 0 ? '+' : ''}{String(diferencia.diferencia)}
            </span>
          </p>
        )}
      </div>
    </div>
  );
};

export default AnalisisPanel;