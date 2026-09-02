/**
 * ============================================================
 * PanelEjecutivoDashboard — V2 (backend)
 * ============================================================
 * Los 4 KPIs (Facturado, Cobrado, Contribución Marginal, Giro de
 * Negocio) vienen de prod.kpi_panel_ejecutivo a través del backend.
 *
 * Simplificación a propósito: el toggle "Con/Sin impuestos" se sacó —
 * el backend hoy solo devuelve el total con impuestos incluidos
 * (columna `total` de comprobante_venta_cabecera). Si hace falta la
 * versión sin impuestos, hay que sumar otra columna en el service
 * (total_conceptos o similar) — pendiente, no bloqueante.
 */
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  DollarSign,
  Wallet,
  // PieChart,
  RefreshCw,
  ArrowRight,
  Receipt,
  Landmark,
  CalendarDays,
  ClipboardList,
  Info,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL; // confirmar nombre real de la env var

interface BcraCotizacion {
  valor: number;
  fecha: string;
  loading: boolean;
  error: boolean;
}
type Moneda = "ARS" | "USD";

interface PeriodoDisponible {
  periodo: string;
  periodo_nombre: string;
  anio_mes_orden: number;
  anio: number;
  mes: number;
}

interface PeriodosResponse {
  anio_predeterminado: number | null;
  anios: number[];
  periodos: PeriodoDisponible[];
}

interface PanelEjecutivoKpis {
  tipo_periodo: "ANIO" | "MES";
  periodo: string | null;
  periodo_nombre: string;
  anio_mes_orden: number | null;
  anio: number;
  mes: number | null;
  facturado: number;
  cobrado: number;
  contribucion_marginal: number;
  giro_negocio_pct: number;
  venta_bruta_cm: number;
  contribucion_marginal_pct: number;
}

interface VentaMesKpis {
  venta_total: number
  cantidad_ots: number
  data_asof: string | null
}

const fmtARS = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
const fmtUSD = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

const fmtShort = (n: number, moneda: Moneda): string => {
  const symbol = moneda === "USD" ? "US$" : "$";
  if (Math.abs(n) >= 1_000_000_000)
    return `${symbol}${(n / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(n) >= 1_000_000)
    return `${symbol}${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${symbol}${(n / 1_000).toFixed(0)}K`;
  return `${symbol}${n.toFixed(0)}`;
};

const fmtPct = (n: number) => `${n.toFixed(1)}%`;

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function useBcraCotizacion(): BcraCotizacion {
  const [state, setState] = useState<BcraCotizacion>({
    valor: 1055,
    fecha: "",
    loading: true,
    error: false,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchDolarApi(): Promise<boolean> {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch("https://dolarapi.com/v1/dolares/oficial", {
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const valor = json?.venta;
        if (!valor) throw new Error("Sin valor de venta");
        if (!cancelled) {
          setState({
            valor: Number(valor),
            fecha: json?.fechaActualizacion
              ? new Date(json.fechaActualizacion).toISOString().slice(0, 10)
              : new Date().toISOString().slice(0, 10),
            loading: false,
            error: false,
          });
        }
        return true;
      } catch {
        return false;
      }
    }

    async function fetchBcraFallback() {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(
          "https://api.bcra.gob.ar/estadisticascambiarias/v1.0/Cotizaciones",
          { signal: controller.signal },
        );
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const fecha: string | undefined = json?.results?.fecha;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const detalle: any[] = json?.results?.detalle ?? [];
        const usd = detalle.find((d) => d?.codigoMoneda === "USD");
        const valor = usd?.tipoCotizacion;
        if (!cancelled && valor) {
          setState({
            valor: Number(valor),
            fecha: fecha ?? new Date().toISOString().slice(0, 10),
            loading: false,
            error: true,
          });
        } else if (!cancelled) {
          throw new Error("Sin datos de cotización USD");
        }
      } catch {
        if (!cancelled)
          setState((prev) => ({ ...prev, loading: false, error: true }));
      }
    }

    async function load() {
      const ok = await fetchDolarApi();
      if (!ok && !cancelled) await fetchBcraFallback();
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

const KpiCard: React.FC<{
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent: string;
  trend?: string;
  trendColor?: string;
  loading?: boolean;
  error?: boolean;
  tooltip?: string;
  linkLabel?: string;
  onLinkClick?: () => void;
}> = ({
  label,
  value,
  sub,
  icon,
  accent,
  trend,
  trendColor = "text-gray-500",
  loading,
  error,
  tooltip,
  linkLabel,
  onLinkClick,
}) => (
  <div className="bg-white rounded-xl border border-slate-300 p-4 sm:p-5 flex flex-col gap-2 sm:gap-3 shadow-md">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <span className="text-xs sm:text-sm font-medium text-gray-500">
          {label}
        </span>
        {tooltip && (
          <div className="group relative flex">
            <Info size={12} className="text-gray-300 hover:text-gray-500 cursor-help" />
            <div className="absolute left-0 top-5 z-10 w-52 p-2 bg-gray-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {tooltip}
            </div>
          </div>
        )}
      </div>
      <div
        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0 ${accent}`}
      >
        {icon}
      </div>
    </div>
    <div>
      {loading ? (
        <p className="text-sm text-gray-400">Cargando...</p>
      ) : error ? (
        <p className="text-sm text-red-500">Error al cargar</p>
      ) : (
        <>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight break-all">
            {value}
          </p>
          {sub && (
            <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 truncate">
              {sub}
            </p>
          )}
        </>
      )}
    </div>
    {trend && !loading && !error && (
      <div
        className={`text-[10px] sm:text-xs font-medium flex items-center gap-1 ${trendColor}`}
      >
        {trend}
      </div>
    )}
    {linkLabel && onLinkClick && !loading && !error && (
      <button
        onClick={onLinkClick}
        className="text-[10px] sm:text-xs font-medium text-emerald-600 hover:text-emerald-800 flex items-center gap-1 self-start group/link"
      >
        {linkLabel}
        <ArrowRight size={11} className="group-hover/link:translate-x-0.5 transition-transform" />
      </button>
    )}
  </div>
);

const ToggleSwitch: React.FC<{
  optionA: { value: string; label: string };
  optionB: { value: string; label: string };
  current: string;
  onChange: (v: string) => void;
  icon?: React.ReactNode;
}> = ({ optionA, optionB, current, onChange, icon }) => (
  <div className="flex items-center gap-1.5 bg-white rounded-lg border border-gray-200 p-1 shrink-0">
    {icon && <div className="px-1.5 text-gray-400">{icon}</div>}
    {[optionA, optionB].map((opt) => (
      <button
        key={opt.value}
        onClick={() => onChange(opt.value)}
        className={`px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold rounded-md transition-colors whitespace-nowrap
          ${current === opt.value ? "bg-emerald-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

const PanelEjecutivoDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [moneda, setMoneda] = useState<Moneda>("ARS");
  const bcra = useBcraCotizacion();

  const [anioSeleccionado, setAnioSeleccionado] = useState<number | null>(null);
  const [mesSeleccionado, setMesSeleccionado] = useState<number | null>(null);
  const [aniosDisponibles, setAniosDisponibles] = useState<number[]>([]);
  const [periodosDisponibles, setPeriodosDisponibles] = useState<
    PeriodoDisponible[]
  >([]);
  const [periodosLoading, setPeriodosLoading] = useState(true);

  const [panelKpis, setPanelKpis] = useState<PanelEjecutivoKpis | null>(null);
  const [panelLoading, setPanelLoading] = useState(true);
  const [panelError, setPanelError] = useState(false);

  const [ventaMes, setVentaMes] = useState<VentaMesKpis | null>(null);
  const [ventaMesLoading, setVentaMesLoading] = useState(true);
  const [ventaMesError, setVentaMesError] = useState(false);

  const mesesDisponibles = periodosDisponibles
    .filter((periodo) => periodo.anio === anioSeleccionado)
    .sort((periodoA, periodoB) => periodoA.mes - periodoB.mes);

  const cargarDatos = useCallback(() => {
    if (anioSeleccionado === null) return;

    const qs = new URLSearchParams();
    qs.set("anio", String(anioSeleccionado));
    if (mesSeleccionado !== null) qs.set("mes", String(mesSeleccionado));

    setPanelLoading(true);
    setPanelError(false);
    apiGet<PanelEjecutivoKpis>(`/api/v1/facturacion-cobranza/kpis?${qs}`)
      .then(setPanelKpis)
      .catch(() => {
        setPanelKpis(null);
        setPanelError(true);
      })
      .finally(() => setPanelLoading(false));

    setVentaMesLoading(true); setVentaMesError(false)
    apiGet<VentaMesKpis>(`/api/v1/venta-mes/kpis?${qs}`)
      .then(setVentaMes)
      .catch(() => setVentaMesError(true))
      .finally(() => setVentaMesLoading(false))  
  }, [anioSeleccionado, mesSeleccionado]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const cargarPeriodos = useCallback(() => {
    let cancelled = false;
    setPeriodosLoading(true);
    apiGet<PeriodosResponse>("/api/v1/facturacion-cobranza/kpis/por-mes")
      .then((data) => {
        if (cancelled) return;
        setAniosDisponibles(data.anios);
        setPeriodosDisponibles(data.periodos);
        if (data.anio_predeterminado === null) {
          setPanelError(true);
          setPanelLoading(false);
          return;
        }
        setAnioSeleccionado((current) => current ?? data.anio_predeterminado);
      })
      .catch((err) => {
        console.error("Error cargando períodos disponibles:", err);
        if (!cancelled) {
          setPanelError(true);
          setPanelLoading(false);
        }
      })
      .finally(() => {
        if (!cancelled) setPeriodosLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => cargarPeriodos(), [cargarPeriodos]);

  const convert = useCallback(
    (valorARS: number) => {
      if (moneda === "ARS" || !bcra.valor) return valorARS;
      return valorARS / bcra.valor;
    },
    [moneda, bcra.valor],
  );

  const fmtMoney = useCallback(
    (valorARS: number) => {
      const converted = convert(valorARS);
      return moneda === "USD" ? fmtUSD(converted) : fmtARS(converted);
    },
    [convert, moneda],
  );

  const fmtMoneyShort = useCallback(
    (valorARS: number) => {
      const converted = convert(valorARS);
      return fmtShort(converted, moneda);
    },
    [convert, moneda],
  );

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 min-h-screen bg-slate-200">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Panel Ejecutivo
            </h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
              Datos en vivo desde el lakehouse
            </p>
          </div>
          <button
            onClick={cargarDatos}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shrink-0"
          >
            <RefreshCw size={14} /> Actualizar
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <ToggleSwitch
            optionA={{ value: "ARS", label: "ARS $" }}
            optionB={{ value: "USD", label: "USD US$" }}
            current={moneda}
            onChange={(v) => setMoneda(v as Moneda)}
            icon={<DollarSign size={13} />}
          />
          <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-1.5 text-xs shrink-0">
            <Landmark size={13} className="text-gray-400" />
            <span className="text-gray-500">Dólar BCRA:</span>
            {bcra.loading ? (
              <RefreshCw size={12} className="animate-spin text-gray-400" />
            ) : (
              <span className="font-mono font-semibold text-gray-700">
                ${" "}
                {bcra.valor.toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                {bcra.error && (
                  <span
                    className="text-amber-500 ml-1"
                    title="Valor de referencia — API no disponible"
                  >
                    *
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filtros de año y mes disponibles en la vista */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mr-1">
          <CalendarDays size={15} />
          <span className="font-medium">Período:</span>
        </div>
        <select
          aria-label="Año"
          value={anioSeleccionado ?? ""}
          disabled={periodosLoading || aniosDisponibles.length === 0}
          onChange={(event) => {
            setMesSeleccionado(null);
            setAnioSeleccionado(Number(event.target.value));
          }}
          className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-60"
        >
          {anioSeleccionado === null && (
            <option value="">Sin años disponibles</option>
          )}
          {aniosDisponibles.map((anio) => (
            <option key={anio} value={anio}>
              {anio}
            </option>
          ))}
        </select>
        <select
          aria-label="Mes"
          value={mesSeleccionado ?? ""}
          disabled={periodosLoading || anioSeleccionado === null}
          onChange={(event) => {
            setMesSeleccionado(
              event.target.value ? Number(event.target.value) : null,
            );
          }}
          className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-60"
        >
          <option value="">Todos</option>
          {mesesDisponibles.map((periodo) => (
            <option key={periodo.anio_mes_orden} value={periodo.mes}>
              {periodo.periodo_nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          label="Facturado"
          value={panelKpis ? fmtMoneyShort(panelKpis.facturado) : "—"}
          sub={panelKpis ? fmtMoney(panelKpis.facturado) : undefined}
          icon={<Receipt size={18} className="text-blue-600" />}
          accent="bg-blue-100"
          loading={panelLoading}
          error={panelError}
          linkLabel="Ver Contribución Marginal"
          onLinkClick={() => navigate("/dashboards/contribucion-marginal")}
        />

        <KpiCard
          label="Cobrado"
          value={panelKpis ? fmtMoneyShort(panelKpis.cobrado) : "—"}
          sub={panelKpis ? fmtMoney(panelKpis.cobrado) : undefined}
          icon={<Wallet size={18} className="text-emerald-600" />}
          accent="bg-emerald-100"
          loading={panelLoading}
          error={panelError}
        />

        <KpiCard
          label="Venta del Mes"
          value={ventaMes ? fmtMoneyShort(ventaMes.venta_total) : "—"}
          sub={ventaMes ? `${ventaMes.cantidad_ots} OTs generadas` : undefined}
          icon={<ClipboardList size={18} className="text-purple-600" />}
          accent="bg-purple-100"
          loading={ventaMesLoading}
          error={ventaMesError}
          tooltip="Suma de OTs generadas en el período. No representa facturación."
        />

        {/* <button
          onClick={() => navigate("/dashboards/contribucion-marginal")}
          disabled={panelLoading || panelError}
          className="text-left bg-white rounded-xl border border-emerald-300 p-4 sm:p-5 flex flex-col gap-2 sm:gap-3 shadow-md hover:shadow-lg hover:border-emerald-500 transition-all group cursor-pointer disabled:cursor-default disabled:opacity-60"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-gray-500">
              Contribución Marginal
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0 bg-emerald-100">
              <PieChart size={18} className="text-emerald-600" />
            </div>
          </div>
          <div>
            {panelLoading ? (
              <p className="text-sm text-gray-400">Cargando...</p>
            ) : panelError || !panelKpis ? (
              <p className="text-sm text-red-500">Error al cargar</p>
            ) : (
              <>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight break-all">
                  {fmtMoneyShort(panelKpis.contribucion_marginal)}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 truncate">
                  {fmtPct(panelKpis.contribucion_marginal_pct)} sobre venta
                  bruta
                </p>
              </>
            )}
          </div>
          <div className="text-[10px] sm:text-xs font-medium flex items-center gap-1 text-emerald-600 group-hover:gap-2 transition-all">
            Ver detalle por cliente <ArrowRight size={12} />
          </div>
        </button> */}

        <KpiCard
          label="Giro de Negocio"
          value={panelKpis ? fmtPct(panelKpis.giro_negocio_pct) : "—"}
          sub="Cobrado / Facturado"
          icon={<TrendingUp size={18} className="text-amber-600" />}
          accent="bg-amber-100"
          loading={panelLoading}
          error={panelError}
          trend={
            panelKpis
              ? panelKpis.giro_negocio_pct >= 75
                ? "✓ Buen ritmo de cobranza"
                : panelKpis.giro_negocio_pct >= 50
                  ? "⚠ Cobranza por debajo del 75%"
                  : "⚠ Cobranza crítica"
              : undefined
          }
          trendColor={
            panelKpis
              ? panelKpis.giro_negocio_pct >= 75
                ? "text-emerald-600"
                : panelKpis.giro_negocio_pct >= 50
                  ? "text-amber-600"
                  : "text-red-500"
              : undefined
          }
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-300 p-4 text-xs sm:text-sm text-gray-500 shadow-md">
        <p>
          <span className="font-semibold text-gray-700">Nota:</span>{" "}
          Facturado/Cobrado incluyen impuestos.{" "}
          {moneda === "USD" && (
            <span>
              Conversión a USD usando cotización oficial BCRA del día
              {bcra.error ? " (valor de referencia)" : ""}.
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

export default PanelEjecutivoDashboard;
