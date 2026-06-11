/**
 * ============================================================
 * PanelEjecutivoDashboard — Nivel 0 (vista ejecutiva)
 * ============================================================
 *
 * Este componente AHORA consume datos de ExcelDataContext
 * (ver ExcelDataContext.tsx) en lugar de tener su propio estado
 * de archivo. Esto permite:
 *
 *   1. Subir el Excel UNA SOLA VEZ (mismo archivo para CM y Detalle)
 *   2. Click en el KPI "Contribución Marginal" navega al dashboard
 *      de CM SIN perder los datos cargados (vía useNavigate de react-router)
 *
 * KPIs (4):
 *   1. Facturado del mes        → toggle impuestos afecta
 *   2. Cobrado del mes          → toggle impuestos afecta
 *   3. Contribución Marginal    → NO afectado por impuestos, click → navega a CM
 *   4. Giro de Negocio (%)      → Cobrado / Facturado * 100
 *
 * TOGGLES:
 *   - Mes: selector de período (default = mes más reciente con datos)
 *   - Con / Sin impuestos: cambia KPIs 1, 2 y 4 (no afecta CM)
 *   - ARS / USD: convierte usando cotización de dolarApi oficial BNA venta minorista
 *
 * RESPONSIVE:
 *   Desktop  (>1024px): 4 KPIs en fila
 *   Tablet   (640-1024px): 2x2
 *   Mobile   (<640px): 1 columna, filtros en scroll horizontal
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Upload,
  TrendingUp,
  DollarSign,
  Wallet,
  PieChart,
  CalendarDays,
  RefreshCw,
  ArrowRight,
  Receipt,
  Landmark,
} from 'lucide-react'
import { useExcelData } from './ExcelDataContext'
import UploadZone from './UploadZone'

// ============================================================
// TIPOS LOCALES
// ============================================================

interface BcraCotizacion {
  valor: number
  fecha: string
  loading: boolean
  error: boolean
}

type Moneda = 'ARS' | 'USD'
type ImpuestosMode = 'con' | 'sin'

// ============================================================
// HELPERS
// ============================================================

const fmtARS = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

const fmtUSD = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

const fmtShort = (n: number, moneda: Moneda): string => {
  const symbol = moneda === 'USD' ? 'US$' : '$'
  if (Math.abs(n) >= 1_000_000_000) return `${symbol}${(n / 1_000_000_000).toFixed(1)}B`
  if (Math.abs(n) >= 1_000_000) return `${symbol}${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `${symbol}${(n / 1_000).toFixed(0)}K`
  return `${symbol}${n.toFixed(0)}`
}

const fmtPct = (n: number) => `${n.toFixed(1)}%`

const mesAnioLabel = (mesAnio: string): string => {
  const [m, y] = mesAnio.split('/')
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const idx = parseInt(m, 10) - 1
  return `${meses[idx] ?? m} ${y}`
}

// ============================================================
// HOOK — Cotización BCRA (oficial)
// ============================================================

function useBcraCotizacion(): BcraCotizacion {
  const [state, setState] = useState<BcraCotizacion>({
    valor: 1055,
    fecha: '',
    loading: true,
    error: false,
  })
 
  useEffect(() => {
    let cancelled = false
 
    async function fetchDolarApi(): Promise<boolean> {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 5000)
 
        const res = await fetch('https://dolarapi.com/v1/dolares/oficial', {
          signal: controller.signal,
        })
        clearTimeout(timeout)
 
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
 
        const valor = json?.venta
        if (!valor) throw new Error('Sin valor de venta')
 
        if (!cancelled) {
          setState({
            valor: Number(valor),
            fecha: json?.fechaActualizacion
              ? new Date(json.fechaActualizacion).toISOString().slice(0, 10)
              : new Date().toISOString().slice(0, 10),
            loading: false,
            error: false,
          })
        }
        return true
      } catch {
        return false
      }
    }

    // Fallback: BCRA mayorista (Estadísticas Cambiarias)
    async function fetchBcraFallback() {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 5000)
 
        const res = await fetch('https://api.bcra.gob.ar/estadisticascambiarias/v1.0/Cotizaciones', {
          signal: controller.signal,
        })
        clearTimeout(timeout)
 
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
 
        const fecha: string | undefined = json?.results?.fecha
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const detalle: any[] = json?.results?.detalle ?? []
        const usd = detalle.find(d => d?.codigoMoneda === 'USD')
        const valor = usd?.tipoCotizacion
 
        if (!cancelled && valor) {
          setState({
            valor: Number(valor),
            fecha: fecha ?? new Date().toISOString().slice(0, 10),
            loading: false,
            // error=true: este valor es MAYORISTA, no minorista — la UI debe avisar
            error: true,
          })
        } else if (!cancelled) {
          throw new Error('Sin datos de cotización USD')
        }
      } catch {
        if (!cancelled) {
          setState(prev => ({ ...prev, loading: false, error: true }))
        }
      }
    }
    async function load() {
      const ok = await fetchDolarApi()
      if (!ok && !cancelled) await fetchBcraFallback()
    }
 
    load()
    return () => { cancelled = true }
  }, [])
 
  return state
}
 

// ============================================================
// KPI CARD
// ============================================================

const KpiCard: React.FC<{
  label: string
  value: string
  sub?: string
  icon: React.ReactNode
  accent: string
  trend?: string
  trendColor?: string
}> = ({ label, value, sub, icon, accent, trend, trendColor = 'text-gray-500' }) => (
  <div className="bg-white rounded-xl border border-slate-300 p-4 sm:p-5 flex flex-col gap-2 sm:gap-3 shadow-md">
    <div className="flex items-center justify-between">
      <span className="text-xs sm:text-sm font-medium text-gray-500">{label}</span>
      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0 ${accent}`}>{icon}</div>
    </div>
    <div>
      <p className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight break-all">{value}</p>
      {sub && <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 truncate">{sub}</p>}
    </div>
    {trend && (
      <div className={`text-[10px] sm:text-xs font-medium flex items-center gap-1 ${trendColor}`}>
        {trend}
      </div>
    )}
  </div>
)

// ============================================================
// TOGGLE GENÉRICO (2 opciones)
// ============================================================

const ToggleSwitch: React.FC<{
  optionA: { value: string; label: string }
  optionB: { value: string; label: string }
  current: string
  onChange: (v: string) => void
  icon?: React.ReactNode
}> = ({ optionA, optionB, current, onChange, icon }) => (
  <div className="flex items-center gap-1.5 bg-white rounded-lg border border-gray-200 p-1 shrink-0">
    {icon && <div className="px-1.5 text-gray-400">{icon}</div>}
    {[optionA, optionB].map((opt) => (
      <button
        key={opt.value}
        onClick={() => onChange(opt.value)}
        className={`px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold rounded-md transition-colors whitespace-nowrap
          ${current === opt.value ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
      >
        {opt.label}
      </button>
    ))}
  </div>
)

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

const PanelEjecutivoDashboard: React.FC = () => {
  const {
    rows, facturacion, cobranza, fileName,
    loading, error, loadFile, reset, hasData,
  } = useExcelData()

  const navigate = useNavigate()

  const [selectedMes, setSelectedMes] = useState<string>('')
  const [impuestosMode, setImpuestosMode] = useState<ImpuestosMode>('con')
  const [moneda, setMoneda] = useState<Moneda>('ARS')

  const bcra = useBcraCotizacion()

  // Default: mes más reciente con datos (se ejecuta cuando cambian los datos)
  useEffect(() => {
    if (!hasData) return
    const meses = new Set<string>()
    facturacion.forEach(r => r.mesAnio && meses.add(r.mesAnio))
    cobranza.forEach(r => r.mesAnio && meses.add(r.mesAnio))
    rows.forEach(r => r.mesAnio && meses.add(r.mesAnio))
    const sorted = Array.from(meses).sort((a, b) => {
      const [ma, ya] = a.split('/').map(Number)
      const [mb, yb] = b.split('/').map(Number)
      return yb !== ya ? yb - ya : mb - ma // desc → más reciente primero
    })
    setSelectedMes(prev => prev || sorted[0] || '')
  }, [hasData, facturacion, cobranza, rows])

  const handleFile = useCallback((file: File) => {
    loadFile(file)
  }, [loadFile])

  // Meses disponibles (unión de las 3 fuentes), ordenados cronológicamente
  const mesesDisponibles = useMemo(() => {
    const set = new Set<string>()
    facturacion.forEach(r => r.mesAnio && set.add(r.mesAnio))
    cobranza.forEach(r => r.mesAnio && set.add(r.mesAnio))
    rows.forEach(r => r.mesAnio && set.add(r.mesAnio))
    return Array.from(set).sort((a, b) => {
      const [ma, ya] = a.split('/').map(Number)
      const [mb, yb] = b.split('/').map(Number)
      return ya !== yb ? ya - yb : ma - mb
    })
  }, [facturacion, cobranza, rows])

  // ── Cálculo de KPIs para el mes seleccionado ──────────────
  const kpis = useMemo(() => {
    const factMes = facturacion.filter(r => r.mesAnio === selectedMes)
    const cobMes = cobranza.filter(r => r.mesAnio === selectedMes)
    const cmMes = rows.filter(r => r.mesAnio === selectedMes)

    const facturadoConImp = factMes.reduce((s, r) => s + r.total, 0)   // Total Bruto
    const facturadoSinImp = factMes.reduce((s, r) => s + r.importe, 0) // Total Neto

    const cobradoConImp = cobMes.reduce((s, r) => s + r.total, 0)   // Total Bruto
    const cobradoSinImp = cobMes.reduce((s, r) => s + r.importe, 0) // Total Neto

    const contribMarginal = cmMes.reduce((s, r) => s + r.contribMarginal, 0)

    const facturado = impuestosMode === 'con' ? facturadoConImp : facturadoSinImp
    const cobrado = impuestosMode === 'con' ? cobradoConImp : cobradoSinImp

    const giroNegocio = facturado > 0 ? (cobrado / facturado) * 100 : 0

    return { facturado, cobrado, contribMarginal, giroNegocio }
  }, [facturacion, cobranza, rows, selectedMes, impuestosMode])

  // ── Conversión de moneda ───────────────────────────────────
  const convert = useCallback((valorARS: number) => {
    if (moneda === 'ARS' || !bcra.valor) return valorARS
    return valorARS / bcra.valor
  }, [moneda, bcra.valor])

  const fmtMoney = useCallback((valorARS: number) => {
    const converted = convert(valorARS)
    return moneda === 'USD' ? fmtUSD(converted) : fmtARS(converted)
  }, [convert, moneda])

  const fmtMoneyShort = useCallback((valorARS: number) => {
    const converted = convert(valorARS)
    return fmtShort(converted, moneda)
  }, [convert, moneda])

  // ── Sin datos ───────────────────────────────────────────
  if (!hasData) {
    return (
      <div className="p-3 sm:p-6">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Panel Ejecutivo</h1>
          <p className="text-gray-500 text-sm mt-1">Cargá el archivo Excel para visualizar el panel</p>
        </div>
        <UploadZone
          onFile={handleFile}
          loading={loading}
          error={error}
          title="Cargar Excel del Panel Ejecutivo"
          subtitle="Arrastrá el archivo acá o hacé click para seleccionarlo"
          hint="Hojas: Vista_Resumen, Vista_Detallada, Facturacion, Cobranza"
        />
      </div>
    )
  }

  // ── Dashboard ───────────────────────────────────────────
  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 min-h-screen bg-slate-200">

      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Panel Ejecutivo</h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
              {selectedMes ? mesAnioLabel(selectedMes) : '—'} ·{' '}
              <span className="text-emerald-600 font-medium">{fileName}</span>
            </p>
          </div>
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shrink-0"
          >
            <Upload size={14} /> Cambiar archivo
          </button>
        </div>

        {/* Toggles + cotización dólar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <ToggleSwitch
              optionA={{ value: 'con', label: 'Con impuestos' }}
              optionB={{ value: 'sin', label: 'Sin impuestos' }}
              current={impuestosMode}
              onChange={(v) => setImpuestosMode(v as ImpuestosMode)}
              icon={<Receipt size={13} />}
            />
            <ToggleSwitch
              optionA={{ value: 'ARS', label: 'ARS $' }}
              optionB={{ value: 'USD', label: 'USD US$' }}
              current={moneda}
              onChange={(v) => setMoneda(v as Moneda)}
              icon={<DollarSign size={13} />}
            />
          </div>

          {/* Cotización BCRA */}
          <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-1.5 text-xs shrink-0">
            <Landmark size={13} className="text-gray-400" />
            <span className="text-gray-500">Dólar BCRA:</span>
            {bcra.loading ? (
              <RefreshCw size={12} className="animate-spin text-gray-400" />
            ) : (
              <span className="font-mono font-semibold text-gray-700">
                $ {bcra.valor.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                {bcra.error && <span className="text-amber-500 ml-1" title="Valor de referencia — API no disponible">*</span>}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filtro de mes */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mr-1 shrink-0">
          <CalendarDays size={15} />
          <span className="font-medium hidden sm:inline">Período:</span>
        </div>
        {mesesDisponibles.map((mes) => (
          <button
            key={mes}
            onClick={() => setSelectedMes(mes)}
            className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium border transition-colors shrink-0
              ${selectedMes === mes
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-emerald-400 hover:text-emerald-700'
              }`}
          >
            {mesAnioLabel(mes)}
          </button>
        ))}
      </div>

      {/* KPI Cards — 4 KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

        {/* 1. Facturado */}
        <KpiCard
          label={`Facturado ${impuestosMode === 'con' ? '(c/imp.)' : '(s/imp.)'}`}
          value={fmtMoneyShort(kpis.facturado)}
          sub={fmtMoney(kpis.facturado)}
          icon={<Receipt size={18} className="text-blue-600" />}
          accent="bg-blue-100"
        />

        {/* 2. Cobrado */}
        <KpiCard
          label={`Cobrado ${impuestosMode === 'con' ? '(c/imp.)' : '(s/imp.)'}`}
          value={fmtMoneyShort(kpis.cobrado)}
          sub={fmtMoney(kpis.cobrado)}
          icon={<Wallet size={18} className="text-emerald-600" />}
          accent="bg-emerald-100"
        />

        {/* 3. Contribución Marginal — siempre sin impuestos, click → CM dashboard */}
        <button
          onClick={() => navigate('/dashboards/contribucion-marginal')}
          className="text-left bg-white rounded-xl border border-emerald-300 p-4 sm:p-5 flex flex-col gap-2 sm:gap-3 shadow-md hover:shadow-lg hover:border-emerald-500 transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-gray-500">Contribución Marginal</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0 bg-emerald-100">
              <PieChart size={18} className="text-emerald-600" />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight break-all">{fmtMoneyShort(kpis.contribMarginal)}</p>
            <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 truncate">{fmtMoney(kpis.contribMarginal)} · sin impuestos</p>
          </div>
          <div className="text-[10px] sm:text-xs font-medium flex items-center gap-1 text-emerald-600 group-hover:gap-2 transition-all">
            Ver detalle por cliente <ArrowRight size={12} />
          </div>
        </button>

        {/* 4. Giro de Negocio */}
        <KpiCard
          label="Giro de Negocio"
          value={fmtPct(kpis.giroNegocio)}
          sub="Cobrado / Facturado"
          icon={<TrendingUp size={18} className="text-amber-600" />}
          accent="bg-amber-100"
          trend={kpis.giroNegocio >= 75 ? '✓ Buen ritmo de cobranza' : kpis.giroNegocio >= 50 ? '⚠ Cobranza por debajo del 75%' : '⚠ Cobranza crítica'}
          trendColor={kpis.giroNegocio >= 75 ? 'text-emerald-600' : kpis.giroNegocio >= 50 ? 'text-amber-600' : 'text-red-500'}
        />

      </div>

      {/* Nota informativa */}
      <div className="bg-white rounded-xl border border-slate-300 p-4 text-xs sm:text-sm text-gray-500 shadow-md">
        <p>
          <span className="font-semibold text-gray-700">Nota:</span> Los valores de Facturación y Cobranza
          provienen del Excel cargado.{' '}
          {moneda === 'USD' && (
            <span>Conversión a USD usando cotización oficial BCRA del día{bcra.error ? ' (valor de referencia)' : ''}.</span>
          )}
        </p>
      </div>

    </div>
  )
}

export default PanelEjecutivoDashboard