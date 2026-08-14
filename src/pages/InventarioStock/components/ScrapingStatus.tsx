// src/pages/InventarioStock/components/ScrapingStatus.tsx
/**
 * Vista de polling del estado del scraping.
 *
 * - Inicia el polling al montar (cada 5 segundos)
 * - Muestra progreso visual animado mientras extrae
 * - Muestra resultado (series + match Finnegans) cuando termina
 * - Permite reintentar si hubo error
 * - Llama onCompleto() cuando estado === 'listo'
 */

import { useEffect, useRef } from 'react';
import {
  Loader2,
  CheckCircle,
  XCircle,
  Download,
  ArrowRight,
  Database,
  Globe,
} from 'lucide-react';
import { useInventarioStockStore } from '../../../stores/inventarioStockStore';
import type { Relevamiento } from '../../../types/inventarioStock';

interface ScrapingStatusProps {
  relevamiento: Relevamiento;
  onCompleto: () => void;
}

const ScrapingStatus = ({ relevamiento, onCompleto }: ScrapingStatusProps) => {
  const {
    scrapingStatus,
    ejecutandoScraping,
    iniciarPolling,
    detenerPolling,
    ejecutarScraping,
    descargarExcel,
  } = useInventarioStockStore();

  const onCompletoRef = useRef(onCompleto);
  onCompletoRef.current = onCompleto;

  // Iniciar polling al montar
  useEffect(() => {
    iniciarPolling(relevamiento.id);
    return () => detenerPolling();
  }, [relevamiento.id, iniciarPolling, detenerPolling]);

  // Detectar cuando termina el scraping
  useEffect(() => {
    if (scrapingStatus?.estado === 'listo') {
      // Pequeña pausa para que el usuario vea el estado final antes de avanzar
      const timer = setTimeout(() => onCompletoRef.current(), 1500);
      return () => clearTimeout(timer);
    }
  }, [scrapingStatus?.estado]);

  const estado = scrapingStatus?.estado ?? relevamiento.estado;
  const error = scrapingStatus?.scraping_error ?? relevamiento.scraping_error;
  const totalSeries = scrapingStatus?.total_series_omni ?? relevamiento.total_series_omni;
  const totalFinn = scrapingStatus?.total_codigos_finn ?? relevamiento.total_codigos_finn;

  const handleReintentar = async () => {
    await ejecutarScraping(relevamiento.id);
    iniciarPolling(relevamiento.id);
  };

  return (
    <div className="max-w-lg space-y-4">

      {/* Card principal de estado */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">

        {/* Estado: extrayendo */}
        {(estado === 'extrayendo' || estado === 'pendiente') && (
          <div className="text-center space-y-4">
            <div className="relative w-16 h-16 mx-auto">
              <div className="w-16 h-16 rounded-full border-4 border-teal-100" />
              <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-teal-500 border-t-transparent animate-spin" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Extrayendo datos</p>
              <p className="text-gray-500 text-sm mt-1">
                Omnimedica y Finnegans están siendo consultados en este momento
              </p>
            </div>

            {/* Pasos del proceso */}
            <div className="space-y-2 text-left pt-2 border-t border-gray-100">
              <StepItem
                icon={<Globe size={16} />}
                label="Scraping Omnimedica"
                status="running"
              />
              <StepItem
                icon={<Database size={16} />}
                label="Consulta Finnegans"
                status="running"
              />
            </div>
          </div>
        )}

        {/* Estado: listo */}
        {estado === 'listo' && (
          <div className="text-center space-y-4">
            <CheckCircle size={48} className="text-teal-500 mx-auto" />
            <div>
              <p className="font-semibold text-gray-900">¡Extracción completa!</p>
              <p className="text-gray-500 text-sm mt-1">
                Cargando la tabla de series...
              </p>
            </div>
            {totalSeries !== null && (
              <div className="flex justify-center gap-6 pt-2 border-t border-gray-100">
                <StatMini label="Series Omnimedica" value={totalSeries ?? 0} />
                {totalFinn !== null && (
                  <StatMini label="Con match Finnegans" value={totalFinn ?? 0} color="teal" />
                )}
              </div>
            )}
          </div>
        )}

        {/* Estado: error */}
        {estado === 'pendiente' && error && (
          <div className="text-center space-y-4">
            <XCircle size={48} className="text-red-400 mx-auto" />
            <div>
              <p className="font-semibold text-gray-900">Error en la extracción</p>
              <p className="text-red-500 text-sm mt-1 font-mono text-left bg-red-50 p-3 rounded-lg">
                {error}
              </p>
            </div>
            <button
              onClick={handleReintentar}
              disabled={ejecutandoScraping}
              className="flex items-center gap-2 mx-auto px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium disabled:opacity-60 transition-colors"
            >
              {ejecutandoScraping ? (
                <Loader2 size={16} className="animate-spin" />
              ) : null}
              Reintentar
            </button>
          </div>
        )}

        {/* Estados post-scraping (si volvemos a este componente) */}
        {(estado === 'en_conteo' || estado === 'analizado' || estado === 'cerrado') && (
          <div className="text-center space-y-4">
            <CheckCircle size={48} className="text-teal-500 mx-auto" />
            <div>
              <p className="font-semibold text-gray-900">Relevamiento en curso</p>
              {totalSeries !== null && (
                <p className="text-gray-500 text-sm">{totalSeries} series extraídas</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Acciones disponibles cuando está listo */}
      {(estado === 'listo' || estado === 'en_conteo' || estado === 'analizado') && (
        <div className="flex gap-3">
          <button
            onClick={() => descargarExcel(relevamiento.id)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
          >
            <Download size={16} />
            Descargar Excel
          </button>
          <button
            onClick={onCompleto}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium transition-colors"
          >
            Ver series
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

// ── Subcomponentes locales ────────────────────────────────────────────

const StepItem = ({
  icon,
  label,
  status,
}: {
  icon: React.ReactNode;
  label: string;
  status: 'pending' | 'running' | 'done' | 'error';
}) => {
  const colors = {
    pending: 'text-gray-400 bg-gray-50',
    running: 'text-teal-600 bg-teal-50',
    done:    'text-green-600 bg-green-50',
    error:   'text-red-500 bg-red-50',
  };

  return (
    <div className={`flex items-center gap-3 p-2 rounded-lg ${colors[status]}`}>
      <span className="flex-shrink-0">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
      {status === 'running' && (
        <Loader2 size={14} className="ml-auto animate-spin" />
      )}
      {status === 'done' && (
        <CheckCircle size={14} className="ml-auto" />
      )}
    </div>
  );
};

const StatMini = ({
  label,
  value,
  color = 'gray',
}: {
  label: string;
  value: number;
  color?: 'gray' | 'teal';
}) => (
  <div className="text-center">
    <p className={`text-2xl font-bold ${color === 'teal' ? 'text-teal-600' : 'text-gray-900'}`}>
      {value}
    </p>
    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
  </div>
);

export default ScrapingStatus;