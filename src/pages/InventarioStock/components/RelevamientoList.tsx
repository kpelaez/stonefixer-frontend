// src/pages/InventarioStock/components/RelevamientoList.tsx
/**
 * Lista de relevamientos de ciclo con estado visual.
 * Sigue el mismo patrón de cards que InventoryReportsPage.
 */

import { Package, ChevronRight, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import type { Relevamiento, EstadoRelevamiento } from '../../../types/inventarioStock';
import { ESTADO_RELEVAMIENTO_LABEL } from '../../../types/inventarioStock';

interface RelevamientoListProps {
  relevamientos: Relevamiento[];
  cargando: boolean;
  onSeleccionar: (rel: Relevamiento) => void;
  onNuevo: () => void;
}

// Colores y íconos por estado
const ESTADO_CONFIG: Record<
  EstadoRelevamiento,
  { color: string; bg: string; icon: React.ReactNode }
> = {
  pendiente:   { color: 'text-gray-500',   bg: 'bg-gray-100',   icon: <Clock size={14} /> },
  extrayendo:  { color: 'text-blue-600',   bg: 'bg-blue-50',    icon: <Loader2 size={14} className="animate-spin" /> },
  listo:       { color: 'text-teal-600',   bg: 'bg-teal-50',    icon: <CheckCircle size={14} /> },
  en_conteo:   { color: 'text-orange-600', bg: 'bg-orange-50',  icon: <Clock size={14} /> },
  analizado:   { color: 'text-purple-600', bg: 'bg-purple-50',  icon: <CheckCircle size={14} /> },
  cerrado:     { color: 'text-green-700',  bg: 'bg-green-50',   icon: <CheckCircle size={14} /> },
};

const RelevamientoList = ({
  relevamientos,
  cargando,
  onSeleccionar,
  onNuevo,
}: RelevamientoListProps) => {

  if (cargando) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-100 rounded-xl h-20 animate-pulse" />
        ))}
      </div>
    );
  }

  if (relevamientos.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <Package size={40} className="text-gray-300 mx-auto mb-3" />
        <h3 className="text-gray-700 font-medium mb-1">Sin relevamientos todavía</h3>
        <p className="text-gray-400 text-sm mb-4">
          Creá el primer relevamiento de ciclo para comenzar.
        </p>
        <button
          onClick={onNuevo}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium transition-colors"
        >
          Crear relevamiento
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {relevamientos.map((rel) => {
        const cfg = ESTADO_CONFIG[rel.estado];
        return (
          <button
            key={rel.id}
            onClick={() => onSeleccionar(rel)}
            className="w-full bg-white rounded-xl border border-gray-200 p-4 hover:border-teal-300 hover:shadow-sm transition-all text-left group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Ícono del módulo */}
                <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                  <Package size={20} className="text-teal-600" />
                </div>

                {/* Info principal */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">
                      {rel.proveedor}
                    </span>
                    <span className="text-gray-400 text-sm">·</span>
                    <span className="text-gray-500 text-sm">{rel.mes_ciclo}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    {/* Badge de estado */}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                      {cfg.icon}
                      {ESTADO_RELEVAMIENTO_LABEL[rel.estado]}
                    </span>
                    {/* Totales si existen */}
                    {rel.total_series_omni !== null && (
                      <span className="text-gray-400 text-xs">
                        {rel.total_series_omni} series
                        {rel.total_codigos_finn !== null && (
                          <> · {rel.total_codigos_finn} con match Finnegans</>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Error si existe */}
              <div className="flex items-center gap-3">
                {rel.scraping_error && (
                  <div className="flex items-center gap-1 text-red-500 text-xs">
                    <AlertCircle size={14} />
                    <span>Error en scraping</span>
                  </div>
                )}
                <ChevronRight
                  size={18}
                  className="text-gray-300 group-hover:text-teal-500 transition-colors"
                />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default RelevamientoList;