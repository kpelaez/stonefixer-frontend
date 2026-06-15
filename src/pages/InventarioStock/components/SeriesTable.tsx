// src/pages/InventarioStock/components/SeriesTable.tsx
/**
 * Tabla de series del relevamiento.
 *
 * Vista principal post-scraping:
 * - Muestra las 225+ series con sus datos de Omnimedica y Finnegans
 * - Filtros: solo pendientes de conteo, solo con diferencias
 * - Paginación del servidor (no client-side — pueden ser muchas filas)
 * - Descarga de Excel
 * - Cada serie muestra: código, descripción, serie, lote, vencimiento,
 *   depósito, estado, cant. Finnegans, resultado físico
 *
 * NO muestra cant. Finnegans por línea en primera instancia (como
 * dijiste: la verificación es de series, no de cantidades — eso va en
 * el análisis posterior).
 */

import { useEffect, useState } from 'react';
import { Download, Filter, CheckCircle, AlertCircle, Clock, Loader2, ClipboardList } from 'lucide-react';
import { useInventarioStockStore } from '../../../stores/inventarioStockStore';
import type { Relevamiento, ResultadoFisico, Serie } from '../../../types/inventarioStock';

interface SeriesTableProps {
  relevamiento: Relevamiento;
  onIrAConteo?: () => void;
}

// Badge por resultado físico
const RESULTADO_CONFIG: Record<ResultadoFisico, { label: string; color: string; bg: string }> = {
  presente:      { label: 'Presente',     color: 'text-green-700',  bg: 'bg-green-50'  },
  en_transito:   { label: 'En tránsito',  color: 'text-orange-600', bg: 'bg-orange-50' },
  no_encontrada: { label: 'No encontrada',color: 'text-red-600',    bg: 'bg-red-50'    },
};

const SeriesTable = ({ relevamiento, onIrAConteo }: SeriesTableProps) => {
  const [soloPendientes, setSoloPendientes] = useState(false);
  const [soloDiferencias, setSoloDiferencias] = useState(false);

  const {
    series,
    totalSeries,
    paginaActual,
    pageSize,
    cargandoSeries,
    cargarSeries,
    descargarExcel,
  } = useInventarioStockStore();

  // Cargar series al montar y cuando cambian los filtros
  useEffect(() => {
    cargarSeries(relevamiento.id, {
      page: 1,
      solo_pendientes: soloPendientes,
      solo_diferencias: soloDiferencias,
    });
  }, [relevamiento.id, soloPendientes, soloDiferencias, cargarSeries]);

  const handlePagina = (nuevaPagina: number) => {
    cargarSeries(relevamiento.id, {
      page: nuevaPagina,
      solo_pendientes: soloPendientes,
      solo_diferencias: soloDiferencias,
    });
  };

  const totalPaginas = Math.ceil(totalSeries / pageSize);

  return (
    <div className="space-y-4">

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <span className="text-sm text-gray-600 font-medium">Filtros:</span>
          <ToggleChip
            label="Solo pendientes de conteo"
            active={soloPendientes}
            onChange={setSoloPendientes}
          />
          <ToggleChip
            label="Solo con diferencias"
            active={soloDiferencias}
            onChange={setSoloDiferencias}
            color="orange"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {totalSeries} series
          </span>
          <button
            onClick={() => descargarExcel(relevamiento.id)}
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
          >
            <Download size={15} />
            Descargar Excel
          </button>
          {onIrAConteo && (
            <button
              onClick={onIrAConteo}
              className="flex items-center gap-2 px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium transition-colors"
            >
              <ClipboardList size={15} />
              Iniciar conteo físico
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {cargandoSeries ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={28} className="animate-spin text-teal-500" />
          </div>
        ) : series.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>No hay series con los filtros aplicados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <Th>Código</Th>
                  <Th>Descripción</Th>
                  <Th>Serie</Th>
                  <Th>Lote</Th>
                  <Th>Vencimiento</Th>
                  <Th>Depósito</Th>
                  <Th>Estado</Th>
                  <Th>Conteo físico</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {series.map((serie) => (
                  <SerieRow key={serie.id} serie={serie} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Página {paginaActual} de {totalPaginas}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handlePagina(paginaActual - 1)}
              disabled={paginaActual === 1}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Anterior
            </button>
            <button
              onClick={() => handlePagina(paginaActual + 1)}
              disabled={paginaActual === totalPaginas}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Subcomponentes locales ────────────────────────────────────────────

const Th = ({ children }: { children: React.ReactNode }) => (
  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
    {children}
  </th>
);

const SerieRow = ({ serie }: { serie: Serie }) => {
  const resultado = serie.resultado_fisico
    ? RESULTADO_CONFIG[serie.resultado_fisico]
    : null;

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 font-mono text-xs text-gray-600 whitespace-nowrap">
        {serie.codigo}
      </td>
      <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate" title={serie.descripcion ?? ''}>
        {serie.descripcion ?? '—'}
      </td>
      <td className="px-4 py-3 font-mono text-xs text-gray-900 whitespace-nowrap">
        {serie.serie}
      </td>
      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
        {serie.lote || '—'}
      </td>
      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
        {serie.vencimiento || '—'}
      </td>
      <td className="px-4 py-3 text-gray-500 text-xs max-w-[120px] truncate" title={serie.deposito ?? ''}>
        {serie.deposito || '—'}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        {serie.en_transito ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full text-xs font-medium">
            <Clock size={10} />
            KIT / Tránsito
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">
            <CheckCircle size={10} />
            Alta
          </span>
        )}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        {resultado ? (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${resultado.bg} ${resultado.color}`}>
            {resultado.label}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full text-xs">
            <AlertCircle size={10} />
            Sin verificar
          </span>
        )}
      </td>
    </tr>
  );
};

const ToggleChip = ({
  label,
  active,
  onChange,
  color = 'teal',
}: {
  label: string;
  active: boolean;
  onChange: (v: boolean) => void;
  color?: 'teal' | 'orange';
}) => {
  const activeClass = color === 'teal'
    ? 'bg-teal-600 text-white border-teal-600'
    : 'bg-orange-500 text-white border-orange-500';

  return (
    <button
      onClick={() => onChange(!active)}
      className={`px-3 py-1 rounded-full border text-xs font-medium transition-colors ${
        active ? activeClass : 'border-gray-300 text-gray-600 hover:border-gray-400'
      }`}
    >
      {label}
    </button>
  );
};

export default SeriesTable;