// src/pages/InventarioStock/components/CargaResultados.tsx
/**
 * Conteo físico online — con selección de depósito previa.
 *
 * Flujo:
 *   1. Pantalla de selección de depósito (extraído de las series)
 *   2. Lista agrupada por producto, filtrada por depósito seleccionado
 *   3. Guardar en batch y pasar al análisis
 */

import { useEffect, useState, useMemo } from 'react';
import {
  Check,
  Truck,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  Save,
  BarChart2,
  Warehouse,
  ArrowRight,
} from 'lucide-react';
import { useInventarioStockStore } from '../../../stores/inventarioStockStore';
import type {
  Relevamiento,
  ResultadoFisico,
  ResultadoFisicoItem,
  Serie,
} from '../../../types/inventarioStock';

interface CargaResultadosProps {
  relevamiento: Relevamiento;
  onFinalizado: () => void;
}

interface GrupoProducto {
  codigo: string;
  descripcion: string;
  series: Serie[];
}

// Nombres cortos para mostrar en badges
const NOMBRE_CORTO_DEPOSITO: Record<string, string> = {
  'OMNIMEDICA CENTRAL': 'Omni Central',
  'DEPOSITO DE DISTRIBUCION': 'Distribución',
};

const nombreCorto = (deposito: string) =>
  NOMBRE_CORTO_DEPOSITO[deposito] ?? deposito;

const BOTONES: {
  valor: ResultadoFisico;
  label: string;
  icon: React.ReactNode;
  activeBg: string;
  activeBorder: string;
  activeText: string;
}[] = [
  {
    valor: 'presente',
    label: 'Presente',
    icon: <Check size={16} />,
    activeBg: '#0F6E56',
    activeBorder: '#0F6E56',
    activeText: '#E1F5EE',
  },
  {
    valor: 'en_transito',
    label: 'Tránsito',
    icon: <Truck size={16} />,
    activeBg: '#FAEEDA',
    activeBorder: '#BA7517',
    activeText: '#633806',
  },
  {
    valor: 'no_encontrada',
    label: 'No encontrada',
    icon: <X size={16} />,
    activeBg: '#FCEBEB',
    activeBorder: '#A32D2D',
    activeText: '#501313',
  },
];

// ── Paso 1: Selección de depósito ────────────────────────────────────

interface SelectorDepositoProps {
  series: Serie[];
  onSeleccionar: (deposito: string | null) => void;
}

const SelectorDeposito = ({ series, onSeleccionar }: SelectorDepositoProps) => {
  // Extraer depósitos únicos con su conteo de series
  const depositos = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const s of series) {
      if (s.deposito) {
        mapa.set(s.deposito, (mapa.get(s.deposito) ?? 0) + 1);
      }
    }
    // Ordenar por cantidad desc
    return Array.from(mapa.entries()).sort((a, b) => b[1] - a[1]);
  }, [series]);

  return (
    <div className="max-w-md space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
            <Warehouse size={20} className="text-teal-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">¿En qué depósito estás?</p>
            <p className="text-sm text-gray-400 mt-0.5">
              Solo vas a ver las series de ese depósito
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {depositos.map(([deposito, cantidad]) => (
            <button
              key={deposito}
              onClick={() => onSeleccionar(deposito)}
              className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border border-gray-200 hover:border-teal-400 hover:bg-teal-50 transition-all text-left group"
            >
              <div>
                <p className="font-medium text-gray-900 group-hover:text-teal-700 text-sm">
                  {deposito}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {cantidad} series para verificar
                </p>
              </div>
              <ArrowRight
                size={18}
                className="text-gray-300 group-hover:text-teal-500 transition-colors flex-shrink-0"
              />
            </button>
          ))}

          {/* Opción "todos" */}
          <button
            onClick={() => onSeleccionar(null)}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all text-left group"
          >
            <div>
              <p className="font-medium text-gray-600 text-sm">Todos los depósitos</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {series.length} series en total
              </p>
            </div>
            <ArrowRight
              size={18}
              className="text-gray-300 group-hover:text-gray-400 transition-colors flex-shrink-0"
            />
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Paso 2: Conteo físico ─────────────────────────────────────────────

interface ConteoProps {
  relevamiento: Relevamiento;
  series: Serie[];
  depositoSeleccionado: string | null;
  onFinalizado: () => void;
  onCambiarDeposito: () => void;
}

const ConteoFisico = ({
  relevamiento,
  series,
  depositoSeleccionado,
  onFinalizado,
  onCambiarDeposito,
}: ConteoProps) => {
  const [marcaciones, setMarcaciones] = useState<Map<number, ResultadoFisico>>(new Map());
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());
  const [guardando, setGuardando] = useState(false);

  const { guardarResultadosFisicos } = useInventarioStockStore();

  // Filtrar por depósito seleccionado
  const seriesFiltradas = useMemo(
    () =>
      depositoSeleccionado
        ? series.filter((s) => s.deposito === depositoSeleccionado)
        : series,
    [series, depositoSeleccionado]
  );

  // Agrupar por código de producto
  const grupos = useMemo<GrupoProducto[]>(() => {
    const mapa = new Map<string, GrupoProducto>();
    for (const serie of seriesFiltradas) {
      if (!mapa.has(serie.codigo)) {
        mapa.set(serie.codigo, {
          codigo: serie.codigo,
          descripcion: serie.descripcion ?? serie.codigo,
          series: [],
        });
      }
      mapa.get(serie.codigo)!.series.push(serie);
    }
    return Array.from(mapa.values());
  }, [seriesFiltradas]);

  // Expandir el primer grupo automáticamente
  useEffect(() => {
    if (grupos.length > 0) {
      setExpandidos(new Set([grupos[0].codigo]));
    }
  }, [grupos.length]);

  // Progreso
  const totalVerificadas = useMemo(
    () =>
      seriesFiltradas.filter(
        (s) => marcaciones.has(s.id) || s.resultado_fisico !== null
      ).length,
    [seriesFiltradas, marcaciones]
  );

  const progresoPct =
    seriesFiltradas.length > 0
      ? Math.round((totalVerificadas / seriesFiltradas.length) * 100)
      : 0;

  const handleMarcar = (serieId: number, resultado: ResultadoFisico) => {
    setMarcaciones((prev) => {
      const next = new Map(prev);
      if (next.get(serieId) === resultado) {
        next.delete(serieId);
      } else {
        next.set(serieId, resultado);
      }
      return next;
    });
  };

  const toggleGrupo = (codigo: string) => {
    setExpandidos((prev) => {
      const next = new Set(prev);
      next.has(codigo) ? next.delete(codigo) : next.add(codigo);
      return next;
    });
  };

  const handleGuardar = async () => {
    if (marcaciones.size === 0) {
      onFinalizado();
      return;
    }

    setGuardando(true);
    const items: ResultadoFisicoItem[] = Array.from(marcaciones.entries()).map(
      ([serie_id, resultado]) => ({ serie_id, resultado })
    );

    const ok = await guardarResultadosFisicos(relevamiento.id, { items });
    setGuardando(false);
    if (ok) onFinalizado();
  };

  return (
    <div className="max-w-2xl space-y-3">

      {/* Barra de progreso sticky */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">
              {depositoSeleccionado
                ? nombreCorto(depositoSeleccionado)
                : 'Todos los depósitos'}
            </span>
            <button
              onClick={onCambiarDeposito}
              className="text-xs text-teal-600 hover:underline"
            >
              Cambiar
            </button>
          </div>
          <span className="text-sm font-bold text-teal-600">
            {totalVerificadas} / {seriesFiltradas.length} series
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-500 rounded-full transition-all duration-500"
            style={{ width: `${progresoPct}%` }}
          />
        </div>
        {marcaciones.size > 0 && (
          <p className="text-xs text-orange-500 font-medium mt-1.5">
            {marcaciones.size} marcaciones sin guardar
          </p>
        )}
      </div>

      {/* Acordeones por producto */}
      {grupos.map((grupo) => {
        const expandido = expandidos.has(grupo.codigo);
        const verificadasGrupo = grupo.series.filter(
          (s) => marcaciones.has(s.id) || s.resultado_fisico !== null
        ).length;
        const totalGrupo = grupo.series.length;
        const grupoCompleto = verificadasGrupo === totalGrupo && totalGrupo > 0;

        return (
          <div
            key={grupo.codigo}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden"
          >
            <button
              onClick={() => toggleGrupo(grupo.codigo)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {grupo.descripcion}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Código: {grupo.codigo} · {totalGrupo} series
                </p>
              </div>
              <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    grupoCompleto
                      ? 'bg-teal-50 text-teal-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {verificadasGrupo}/{totalGrupo}
                  {grupoCompleto && ' ✓'}
                </span>
                {expandido ? (
                  <ChevronUp size={16} className="text-gray-400" />
                ) : (
                  <ChevronDown size={16} className="text-gray-400" />
                )}
              </div>
            </button>

            {expandido && (
              <div className="divide-y divide-gray-100 border-t border-gray-100">
                {grupo.series.map((serie) => {
                  const resultadoActual =
                    marcaciones.get(serie.id) ?? serie.resultado_fisico ?? null;
                  return (
                    <SerieItem
                      key={serie.id}
                      serie={serie}
                      resultadoActual={resultadoActual}
                      onMarcar={(r) => handleMarcar(serie.id, r)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Botón guardar */}
      <div className="pb-6 pt-2">
        <button
          onClick={handleGuardar}
          disabled={guardando}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-semibold text-sm transition-colors disabled:opacity-60"
        >
          {guardando ? (
            <Loader2 size={18} className="animate-spin" />
          ) : marcaciones.size > 0 ? (
            <>
              <Save size={18} />
              Guardar {marcaciones.size} marcaciones y ver análisis
            </>
          ) : (
            <>
              <BarChart2 size={18} />
              Ver análisis de diferencias
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// ── Fila de serie ─────────────────────────────────────────────────────

const SerieItem = ({
  serie,
  resultadoActual,
  onMarcar,
}: {
  serie: Serie;
  resultadoActual: ResultadoFisico | null;
  onMarcar: (r: ResultadoFisico) => void;
}) => (
  <div className="px-4 py-3 space-y-2.5">
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="text-sm text-gray-900">
          Serie:{' '}
          <span className="font-mono font-semibold text-gray-800">{serie.serie}</span>
          {serie.en_transito && (
            <span className="ml-2 text-xs text-orange-600 font-medium">KIT/Tránsito</span>
          )}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {serie.lote && <span>Lote: {serie.lote}</span>}
          {serie.vencimiento && <span> · Vto: {serie.vencimiento}</span>}
        </p>
      </div>
    </div>

    <div className="grid grid-cols-3 gap-2">
      {BOTONES.map((btn) => {
        const activo = resultadoActual === btn.valor;
        return (
          <button
            key={btn.valor}
            onClick={() => onMarcar(btn.valor)}
            className="flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 text-xs font-semibold transition-all duration-100 active:scale-95"
            style={
              activo
                ? {
                    background: btn.activeBg,
                    borderColor: btn.activeBorder,
                    color: btn.activeText,
                  }
                : {
                    background: 'transparent',
                    borderColor: '#e5e7eb',
                    color: '#6b7280',
                  }
            }
          >
            {btn.icon}
            <span className="leading-tight text-center">{btn.label}</span>
          </button>
        );
      })}
    </div>
  </div>
);

// ── Componente principal — orquesta los dos pasos ─────────────────────

const CargaResultados = ({ relevamiento, onFinalizado }: CargaResultadosProps) => {
  const [depositoSeleccionado, setDepositoSeleccionado] = useState<string | null | undefined>(
    undefined // undefined = todavía en la pantalla de selección
  );

  const { series, cargandoSeries, cargarSeries } = useInventarioStockStore();

  // Cargar todas las series al montar
  useEffect(() => {
    cargarSeries(relevamiento.id, { page: 1, page_size: 200 });
  }, [relevamiento.id, cargarSeries]);

  if (cargandoSeries && series.length === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 size={28} className="animate-spin text-teal-500" />
      </div>
    );
  }

  // Paso 1: selección de depósito
  if (depositoSeleccionado === undefined) {
    return (
      <SelectorDeposito
        series={series}
        onSeleccionar={setDepositoSeleccionado}
      />
    );
  }

  // Paso 2: conteo filtrado
  return (
    <ConteoFisico
      relevamiento={relevamiento}
      series={series}
      depositoSeleccionado={depositoSeleccionado}
      onFinalizado={onFinalizado}
      onCambiarDeposito={() => setDepositoSeleccionado(undefined)}
    />
  );
};

export default CargaResultados;