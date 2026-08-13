/**
 * ============================================
 * ContribucionMarginalDashboard — V3 (backend)
 * ============================================
 * Migrado de Excel a la API. Ver notas de simplificación en el mensaje
 * que acompaña este archivo antes de reemplazar el original.
 */
import React, { useEffect, useMemo, useState, useCallback } from 'react'
import {
  useReactTable, getCoreRowModel, getSortedRowModel, flexRender,
  type ColumnDef, type SortingState,
} from '@tanstack/react-table'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, LabelList,
} from 'recharts'
import {
  TrendingUp, DollarSign, BarChart2, ChevronUp, ChevronDown, ChevronsUpDown,
  Search, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, Clock,
  Truck, CalendarDays, ArrowLeft,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import OTDetalleModal, { type RegistroCM } from './OTDetalleModal'

const API = import.meta.env.VITE_API_URL

// ============================================================
// TIPOS
// ============================================================

interface RankingCliente {
  cliente: string
  venta_bruta: number
  margen: number
  pct_margen: number
  cantidad_ots: number
}

interface KpisPeriodo {
  venta_bruta: number
  costos: number
  gastos_logisticos: number
  margen: number
  pct_margen: number
  pct_gastos: number
  pct_costos: number
  ultima_actualizacion: string | null
}

interface MesDisponible {
  mes_anio: string
}

// ============================================================
// HELPERS
// ============================================================

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

const fmtShort = (n: number): string => {
  if (Math.abs(n) >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

const fmtPct = (n: number) => `${n.toFixed(1)}%`

const mesLabel = (mesAnio: string): string => {
  const [y, m] = mesAnio.split('-')
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const idx = parseInt(m, 10) - 1
  return `${meses[idx] ?? m} ${y}`
}

const toDateString = (val: string | null): string => {
  if (!val) return '—'
  return new Date(val).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const margenColor = (pct: number) => {
  if (pct >= 85) return 'text-emerald-600'
  if (pct >= 70) return 'text-blue-600'
  if (pct >= 50) return 'text-yellow-600'
  return 'text-red-500'
}

const margenBg = (pct: number) => {
  if (pct >= 85) return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (pct >= 70) return 'bg-blue-50 text-blue-700 border-blue-200'
  if (pct >= 50) return 'bg-yellow-50 text-yellow-700 border-yellow-200'
  return 'bg-red-50 text-red-700 border-red-200'
}

const EMERALD_PALETTE = [
  '#059669', '#10b981', '#34d399', '#6ee7b7',
  '#047857', '#065f46', '#0d9488', '#0891b2',
  '#0284c7', '#2563eb', '#4f46e5', '#7c3aed',
]

const RADIAL_COLORS = { ventas: '#059669', costos: '#6366f1', gastos: '#f59e0b' }

// ============================================================
// FETCH HELPER (cookie de sesión, no token manual)
// ============================================================

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { credentials: 'include' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// ============================================================
// KPI CARD
// ============================================================

const KpiCard: React.FC<{
  label: string; value: string; sub?: string; icon: React.ReactNode
  accent: string; trend?: string; trendColor?: string
}> = ({ label, value, sub, icon, accent, trend, trendColor = 'text-emerald-600' }) => (
  <div className="bg-white rounded-xl border border-slate-300 p-5 flex flex-col gap-3 shadow-md hover:shadow-lg transition-shadow">
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${accent}`}>{icon}</div>
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
    {trend && (
      <div className={`text-xs font-medium flex items-center gap-1 ${trendColor}`}>
        <TrendingUp size={12} /> {trend}
      </div>
    )}
  </div>
)

// ============================================================
// Y-AXIS TICK
// ============================================================

const CustomYAxisTick = ({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) => {
  const name = (payload?.value ?? '').replace(/"+/g, '').trim()
  const words = name.split(' ').filter(Boolean)
  let line1 = ''; let splitIndex = 0
  for (let i = 0; i < words.length; i++) {
    const candidate = line1 ? `${line1} ${words[i]}` : words[i]
    if (candidate.length <= 18) { line1 = candidate; splitIndex = i + 1 } else break
  }
  if (splitIndex >= words.length) {
    return (
      <g transform={`translate(${x},${y})`}>
        <title>{name}</title>
        <text x={0} y={0} dy={4} textAnchor="end" fill="#374151" fontSize={10}>{line1}</text>
      </g>
    )
  }
  let line2 = words.slice(splitIndex).join(' ')
  if (line2.length > 20) line2 = line2.substring(0, 19) + '…'
  return (
    <g transform={`translate(${x},${y})`}>
      <title>{name}</title>
      <text x={0} y={-7} textAnchor="end" fill="#374151" fontSize={10} fontWeight={600}>{line1}</text>
      <text x={0} y={6} textAnchor="end" fill="#6b7280" fontSize={9}>{line2}</text>
    </g>
  )
}

const CmBarTooltip: React.FC<{
  active?: boolean
  payload?: Array<{ payload: { fullName: string; cm: number; pct: number } }>
}> = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-xs max-w-[280px]">
      <p className="font-semibold text-gray-800 text-sm leading-tight mb-1">{d.fullName}</p>
      <div className="flex items-center gap-3">
        <div>
          <p className="text-gray-400 text-[10px] uppercase tracking-wide">CM Total</p>
          <p className="font-mono font-semibold text-emerald-700">{fmt(d.cm)}</p>
        </div>
        <div>
          <p className="text-gray-400 text-[10px] uppercase tracking-wide">Margen</p>
          <p className={`font-bold ${d.pct >= 80 ? 'text-emerald-600' : d.pct >= 60 ? 'text-blue-600' : 'text-yellow-600'}`}>
            {fmtPct(d.pct)}
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// DONUT
// ============================================================

interface DonutSlice {
  name: string
  value: number
  pct: number
  fill: string
  [key: string]: string | number
}
const LABEL_OFFSET = 18; const INNER_R = 55; const OUTER_R = 90

const DonutLabel = ({ cx, cy, midAngle, outerRadius, pct, fill, name }: {
  cx: number; cy: number; midAngle: number; outerRadius: number; pct: number; fill: string; name: string
}) => {
  if (pct < 0.5) return null
  const RADIAN = Math.PI / 180
  const sin = Math.sin(-RADIAN * midAngle); const cos = Math.cos(-RADIAN * midAngle)
  const sx = cx + (outerRadius + 6) * cos; const sy = cy + (outerRadius + 6) * sin
  const mx = cx + (outerRadius + LABEL_OFFSET) * cos; const my = cy + (outerRadius + LABEL_OFFSET) * sin
  const ex = mx + (cos >= 0 ? 1 : -1) * 12; const ey = my
  const textAnchor = cos >= 0 ? 'start' : 'end'
  return (
    <g>
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" strokeWidth={1.5} />
      <circle cx={ex} cy={ey} r={2} fill={fill} />
      <text x={ex + (cos >= 0 ? 4 : -4)} y={ey} textAnchor={textAnchor} fill={fill} fontSize={10} fontWeight={700} dominantBaseline="central">
        {pct.toFixed(1)}%
      </text>
      <text x={ex + (cos >= 0 ? 4 : -4)} y={ey + 12} textAnchor={textAnchor} fill="#9ca3af" fontSize={9} dominantBaseline="central">
        {name.split(' ')[0]}
      </text>
    </g>
  )
}

const ComposicionDonut: React.FC<{ data: DonutSlice[] }> = ({ data }) => {
  const pieData = data.filter(d => d.pct > 0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderLabel = (props: any) => {
    const d = pieData[props.index]
    if (!d || props.index === 0 || d.pct < 0.3) return null
    return <DonutLabel cx={props.cx} cy={props.cy} midAngle={props.midAngle} outerRadius={props.outerRadius} pct={d.pct} fill={d.fill} name={d.name} />
  }
  const marginPct = data[0]?.pct ?? 0
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart margin={{ top: 24, right: 34, bottom: 24, left: 34 }}>
        <Pie data={pieData} cx="50%" cy="50%" innerRadius={INNER_R} outerRadius={OUTER_R} dataKey="value"
          startAngle={90} endAngle={-270} strokeWidth={2} stroke="#fff" labelLine={false} label={renderLabel} isAnimationActive>
          {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} opacity={0.92} />)}
        </Pie>
        <text x="50%" y="44%" textAnchor="middle" dominantBaseline="central" fill="#059669" fontSize={15} fontWeight={700}>
          {`${marginPct.toFixed(1)}%`}
        </text>
        <text x="50%" y="57%" textAnchor="middle" dominantBaseline="central" fill="#6b7280" fontSize={9}>Margen</text>
      </PieChart>
    </ResponsiveContainer>
  )
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

const ContribucionMarginalDashboard: React.FC = () => {
  const navigate = useNavigate()

  const [mes, setMes] = useState<string>('') // 'YYYY-MM' o '' = todos
  const [mesesDisponibles, setMesesDisponibles] = useState<string[]>([])
  const [chartMode, setChartMode] = useState<'cm' | 'margen' | 'rankings'>('cm')
  const [selectedCliente, setSelectedCliente] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'resumen' | 'detalle'>('resumen')
  const [otModalRow, setOtModalRow] = useState<RegistroCM | null>(null)

  const [kpis, setKpis] = useState<KpisPeriodo | null>(null)
  const [ranking, setRanking] = useState<RankingCliente[]>([])
  const [otBest, setOtBest] = useState<RegistroCM[]>([])
  const [otWorst, setOtWorst] = useState<RegistroCM[]>([])
  const [loadingTop, setLoadingTop] = useState(true)
  const [errorTop, setErrorTop] = useState(false)

  const [detalleRows, setDetalleRows] = useState<RegistroCM[]>([])
  const [detallePage, setDetallePage] = useState(0)
  const [detalleHasMore, setDetalleHasMore] = useState(true)
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [searchCliente, setSearchCliente] = useState('')
  const [detalleSortBy, setDetalleSortBy] = useState('fecha_factura')
  const [detalleSortDir, setDetalleSortDir] = useState<'asc' | 'desc'>('desc')
  const [sorting, setSorting] = useState<SortingState>([])

  const PAGE_SIZE = 20

  const fechaDesde = mes ? `${mes}-01` : undefined
  const fechaHasta = mes ? new Date(Number(mes.slice(0, 4)), Number(mes.slice(5, 7)), 0).toISOString().slice(0, 10) : undefined

  // ── Meses disponibles (una sola vez al montar) ────────────
  useEffect(() => {
    let cancelled = false
    apiGet<MesDisponible[]>('/api/v1/contribucion-marginal/kpis/por-mes?meses=18')
      .then(data => { if (!cancelled) setMesesDisponibles(data.map(d => d.mes_anio).sort().reverse()) })
      .catch(() => { /* si falla, no se muestran botones de mes — no bloquea el resto */ })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    setLoadingTop(true); setErrorTop(false)
    const qs = new URLSearchParams()
    if (fechaDesde) qs.set('fecha_desde', fechaDesde)
    if (fechaHasta) qs.set('fecha_hasta', fechaHasta)

    Promise.all([
      apiGet<KpisPeriodo>(`/api/v1/contribucion-marginal/kpis?${qs}`),
      apiGet<RankingCliente[]>(`/api/v1/contribucion-marginal/ranking-clientes?${qs}&limit=10`),
      apiGet<RegistroCM[]>(`/api/v1/contribucion-marginal/registros?order_by=porcentaje_margen&order_dir=desc&limit=5`),
      apiGet<RegistroCM[]>(`/api/v1/contribucion-marginal/registros?order_by=porcentaje_margen&order_dir=asc&limit=5`),
    ])
      .then(([k, r, best, worst]) => {
        setKpis(k); setRanking(r); setOtBest(best); setOtWorst(worst)
      })
      .catch(() => setErrorTop(true))
      .finally(() => setLoadingTop(false))
  }, [fechaDesde, fechaHasta])

  const loadDetalle = useCallback((page: number, cliente: string | null, search: string, sortBy: string, sortDir: string, append: boolean) => {
    setLoadingDetalle(true)
    const qs = new URLSearchParams()
    if (fechaDesde) qs.set('fecha_desde', fechaDesde)
    if (fechaHasta) qs.set('fecha_hasta', fechaHasta)
    if (cliente) qs.set('cliente', cliente)
    if (search) qs.set('search', search)
    qs.set('order_by', sortBy)
    qs.set('order_dir', sortDir)
    qs.set('limit', String(PAGE_SIZE))
    qs.set('offset', String(page * PAGE_SIZE))

    apiGet<RegistroCM[]>(`/api/v1/contribucion-marginal/registros?${qs}`)
      .then(data => {
        setDetalleRows(prev => append ? [...prev, ...data] : data)
        setDetalleHasMore(data.length === PAGE_SIZE)
      })
      .finally(() => setLoadingDetalle(false))
  }, [fechaDesde, fechaHasta])

  // Búsqueda en vivo con debounce (300ms) — evita pegarle al backend en cada tecla
  useEffect(() => {
    const t = setTimeout(() => {
      setDetallePage(0)
      loadDetalle(0, selectedCliente, searchCliente, detalleSortBy, detalleSortDir, false)
    }, 300)
    return () => clearTimeout(t)
  }, [selectedCliente, searchCliente, detalleSortBy, detalleSortDir, loadDetalle])

  const toggleDetalleSort = (col: string) => {
    if (detalleSortBy === col) {
      setDetalleSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setDetalleSortBy(col)
      setDetalleSortDir('desc')
    }
  }

  const SortIcon: React.FC<{ col: string }> = ({ col }) => {
    if (detalleSortBy !== col) return <ChevronsUpDown size={12} className="text-gray-300" />
    return detalleSortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
  }

  const barData = useMemo(() => {
    const source = chartMode === 'margen' ? [...ranking].sort((a, b) => b.pct_margen - a.pct_margen) : ranking
    return source.map(c => ({ name: c.cliente, fullName: c.cliente, cm: c.margen, pct: c.pct_margen }))
  }, [ranking, chartMode])

  const radialData: DonutSlice[] = useMemo(() => {
    if (!kpis) return []
    const total = kpis.venta_bruta || 1
    return [
      { name: 'Contr. Marginal', value: kpis.margen, pct: parseFloat(((kpis.margen / total) * 100).toFixed(1)), fill: RADIAL_COLORS.ventas },
      { name: 'Costos (P.P.P.)', value: kpis.costos, pct: parseFloat(((kpis.costos / total) * 100).toFixed(1)), fill: RADIAL_COLORS.costos },
      { name: 'Gastos Logísticos', value: kpis.gastos_logisticos, pct: parseFloat(((kpis.gastos_logisticos / total) * 100).toFixed(1)), fill: RADIAL_COLORS.gastos },
    ]
  }, [kpis])

  const columnsResumen = useMemo<ColumnDef<RankingCliente>[]>(() => [
    { accessorKey: 'cliente', header: 'Cliente', cell: ({ getValue }) => <span className="font-medium text-gray-800 text-sm">{getValue() as string}</span> },
    { accessorKey: 'cantidad_ots', header: 'OTs', cell: ({ getValue }) => <span className="text-center block text-gray-600">{getValue() as number}</span> },
    { accessorKey: 'venta_bruta', header: 'Venta Bruta', cell: ({ getValue }) => <span className="text-right block font-mono text-gray-700 text-sm">{fmt(getValue() as number)}</span> },
    { accessorKey: 'margen', header: 'Contr. Marginal', cell: ({ getValue }) => <span className="text-right block font-mono font-semibold text-emerald-700 text-sm">{fmt(getValue() as number)}</span> },
    {
      accessorKey: 'pct_margen', header: '% Margen',
      cell: ({ getValue }) => {
        const pct = getValue() as number
        return <div className="flex justify-end"><span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${margenBg(pct)}`}>{fmtPct(pct)}</span></div>
      },
    },
  ], [])

  const tableResumen = useReactTable({
    data: ranking, columns: columnsResumen, state: { sorting },
    onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(),
  })

  if (loadingTop && !kpis) {
    return <div className="p-6 flex items-center justify-center min-h-[50vh] text-gray-400">Cargando Contribución Marginal...</div>
  }

  if (errorTop || !kpis) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
          <AlertCircle size={16} /> No se pudo cargar la Contribución Marginal. Reintentá en unos minutos.
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 min-h-screen bg-slate-200">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contribución Marginal por Cliente</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {mes ? mesLabel(mes) : 'Todos los meses'} · {ranking.length} clientes en el top ·{' '}
            {kpis.ultima_actualizacion && (
              <span className="text-emerald-600 font-medium">
                Actualizado {new Date(kpis.ultima_actualizacion).toLocaleString('es-AR')}
              </span>
            )}
          </p>
        </div>
        <button onClick={() => navigate('/dashboards/dash-ppal')}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          <ArrowLeft size={15} /> Panel Ejecutivo
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mr-1">
          <CalendarDays size={15} /><span className="font-medium">Período:</span>
        </div>
        <button onClick={() => setMes('')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors
            ${mes === '' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-300 hover:border-emerald-400 hover:text-emerald-700'}`}>
          Todos
        </button>
        {mesesDisponibles.map((m) => (
          <button key={m} onClick={() => setMes(m)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors
              ${mes === m ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-300 hover:border-emerald-400 hover:text-emerald-700'}`}>
            {mesLabel(m)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Venta Bruta" value={fmtShort(kpis.venta_bruta)} sub={fmt(kpis.venta_bruta)}
          icon={<DollarSign size={18} className="text-emerald-600" />} accent="bg-emerald-100" />
        <KpiCard label="Costos (P.P.P.)" value={fmtShort(kpis.costos)} sub={fmt(kpis.costos)}
          icon={<BarChart2 size={18} className="text-indigo-600" />} accent="bg-indigo-100"
          trend={`${fmtPct(kpis.pct_costos)} sobre venta bruta`} trendColor="text-indigo-600" />
        <KpiCard label="Gastos Logísticos" value={fmtShort(kpis.gastos_logisticos)} sub={fmt(kpis.gastos_logisticos)}
          icon={<Truck size={18} className="text-amber-600" />} accent="bg-amber-100"
          trend={kpis.gastos_logisticos > 0 ? `${fmtPct(kpis.pct_gastos)} sobre venta bruta` : 'Sin gastos en este período'}
          trendColor={kpis.gastos_logisticos > 0 ? 'text-amber-600' : 'text-gray-400'} />
        <KpiCard label="Margen (Contr. Marginal)" value={fmtShort(kpis.margen)} sub={fmt(kpis.margen)}
          icon={<TrendingUp size={18} className="text-emerald-600" />} accent="bg-emerald-100"
          trend={`${fmtPct(kpis.pct_margen)} sobre venta bruta`}
          trendColor={kpis.pct_margen >= 70 ? 'text-emerald-600' : 'text-yellow-600'} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-300 p-5 shadow-md">
          <div className="flex items-start justify-between mb-4 gap-2 flex-wrap">
            <div>
              <h2 className="text-sm font-semibold text-gray-700">
                {chartMode === 'cm' ? 'Top 10 Clientes por Contribución Marginal' : chartMode === 'margen' ? 'Top 10 Clientes por % de Margen' : 'Ranking de Rentabilidad por OT'}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {chartMode === 'rankings' ? 'Top 5 mejores y peores OTs según % de margen' : 'Hacé click en una barra para filtrar el detalle'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {chartMode !== 'rankings' && selectedCliente && (
                <button onClick={() => setSelectedCliente(null)} className="text-xs text-emerald-600 hover:text-emerald-800 font-medium">
                  ✕ Limpiar filtro
                </button>
              )}
              <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
                {(['cm', 'margen', 'rankings'] as const).map(m => (
                  <button key={m} onClick={() => setChartMode(m)}
                    className={`px-3 py-1.5 transition-colors border-l first:border-l-0 border-gray-200 ${chartMode === m ? 'bg-emerald-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                    {m === 'cm' ? 'Top CM' : m === 'margen' ? '% Margen' : 'Ranking OTs'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {(chartMode === 'cm' || chartMode === 'margen') && (
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 50, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" tickFormatter={fmtShort} tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={185} tick={<CustomYAxisTick />} axisLine={false} tickLine={false} />
                <Tooltip content={<CmBarTooltip />} cursor={{ fill: 'rgba(16,185,129,0.06)' }} />
                <Bar dataKey="cm" radius={[0, 4, 4, 0]} maxBarSize={26} style={{ cursor: 'pointer' }}
                  onClick={(data) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const clicked = (data as any)?.fullName as string | undefined
                    if (clicked) { setSelectedCliente(prev => prev === clicked ? null : clicked); setActiveTab('detalle') }
                  }}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={selectedCliente === null || selectedCliente === entry.fullName ? EMERALD_PALETTE[i % EMERALD_PALETTE.length] : '#e5e7eb'} />
                  ))}
                  <LabelList dataKey="pct" position="right"
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(v: any) => `${Number(v).toFixed(1)}%`} style={{ fontSize: 10, fontWeight: 600, fill: '#6b7280' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {chartMode === 'rankings' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Top 5 Mejores</span>
                </div>
                <div className="space-y-2">
                  {otBest.map((ot, i) => (
                    <button key={ot.id} onClick={() => setOtModalRow(ot)}
                      className="w-full text-left flex items-center gap-3 p-3 rounded-lg bg-emerald-50/60 border border-emerald-100 hover:bg-emerald-50 transition-colors">
                      <span className="text-xs font-bold text-emerald-400 w-4 shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-xs font-semibold text-gray-700">{ot.nro_ot || '—'}</p>
                        <p className="text-[10px] text-gray-400 truncate">{ot.cliente}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-emerald-600">{fmtPct(ot.porcentaje_margen ?? 0)}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{fmtShort(ot.total_bruto_factura ?? 0)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Top 5 Peores</span>
                </div>
                <div className="space-y-2">
                  {otWorst.map((ot, i) => (
                    <button key={ot.id} onClick={() => setOtModalRow(ot)}
                      className="w-full text-left flex items-center gap-3 p-3 rounded-lg bg-red-50/60 border border-red-100 hover:bg-red-50 transition-colors">
                      <span className="text-xs font-bold text-red-300 w-4 shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-xs font-semibold text-gray-700">{ot.nro_ot || '—'}</p>
                        <p className="text-[10px] text-gray-400 truncate">{ot.cliente}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-red-500">{fmtPct(ot.porcentaje_margen ?? 0)}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{fmtShort(ot.total_bruto_factura ?? 0)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-300 p-5 shadow-md flex flex-col">
          <div className="mb-2">
            <h2 className="text-sm font-semibold text-gray-700">Composición de la Venta Bruta</h2>
            <p className="text-xs text-gray-400 mt-0.5">Costos y gastos logísticos sobre el total</p>
          </div>
          <div className="flex-1 flex items-center justify-center"><ComposicionDonut data={radialData} /></div>
          <div className="space-y-2 mt-3 border-t border-gray-100 pt-3">
            {radialData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.fill }} />
                  <span className="text-gray-600">{d.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold" style={{ color: d.fill }}>{fmtPct(d.pct)}</span>
                  <span className="font-mono text-gray-500">{fmtShort(d.value)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-300 shadow-md overflow-hidden">
        <div className="flex border-b border-gray-200">
          {(['resumen', 'detalle'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-6 py-3.5 text-sm font-medium transition-colors ${activeTab === tab ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
              {tab === 'resumen' ? 'Resumen por Cliente' : 'Detalle de Operaciones'}
            </button>
          ))}
        </div>

        {activeTab === 'resumen' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                {tableResumen.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className="bg-gray-50 border-b border-gray-200">
                    {hg.headers.map((header) => (
                      <th key={header.id} onClick={header.column.getToggleSortingHandler()}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide cursor-pointer select-none hover:bg-gray-100">
                        <div className="flex items-center gap-1.5">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <span className="text-gray-400">
                            {header.column.getIsSorted() === 'asc' ? <ChevronUp size={13} /> : header.column.getIsSorted() === 'desc' ? <ChevronDown size={13} /> : <ChevronsUpDown size={13} />}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {tableResumen.getRowModel().rows.map((row, i) => (
                  <tr key={row.id} className={`border-b border-gray-100 hover:bg-emerald-50/40 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div>
            <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              {selectedCliente && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-medium text-emerald-700 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {selectedCliente.length > 40 ? selectedCliente.substring(0, 40) + '…' : selectedCliente}
                  <button onClick={() => setSelectedCliente(null)} className="ml-1 text-emerald-500 hover:text-emerald-800 font-bold leading-none">✕</button>
                </div>
              )}
              <div className="relative max-w-sm w-full">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={searchCliente} onChange={(e) => setSearchCliente(e.target.value)}
                  placeholder="Buscar OT, factura o cliente..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {[
                      { label: 'N° OT', col: 'nro_ot' },
                      { label: 'Cliente', col: 'cliente' },
                      { label: 'N° Factura', col: null },
                      { label: 'Fecha', col: 'fecha_factura' },
                      { label: 'Bruto', col: 'total_bruto_factura' },
                      { label: 'Costo', col: 'precio' },
                      { label: 'Gs. Log.', col: 'gastos_logisticos' },
                      { label: 'C. Marginal', col: 'contribucion_marginal' },
                      { label: '%', col: 'porcentaje_margen' },
                      { label: 'Estado', col: null },
                    ].map(h => (
                      <th key={h.label}
                        onClick={h.col ? () => toggleDetalleSort(h.col!) : undefined}
                        className={`px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap ${h.col ? 'cursor-pointer select-none hover:bg-gray-100' : ''}`}>
                        <div className="flex items-center gap-1">
                          {h.label}
                          {h.col && <SortIcon col={h.col} />}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detalleRows.map((ot, i) => (
                    <tr key={ot.id} className={`border-b border-gray-100 transition-colors ${i % 2 === 0 ? 'bg-white hover:bg-emerald-50/40' : 'bg-gray-50/30 hover:bg-emerald-50/40'}`}>
                      <td className="px-4 py-2.5">
                        <button onClick={() => setOtModalRow(ot)}
                          className="font-mono text-xs text-emerald-700 hover:text-emerald-900 hover:underline underline-offset-2">
                          {ot.nro_ot || '—'}
                        </button>
                      </td>
                      <td className="px-4 py-2.5"><span className="text-sm font-medium text-gray-800 truncate block max-w-[200px]">{ot.cliente}</span></td>
                      <td className="px-4 py-2.5"><span className="font-mono text-xs text-gray-500">{ot.nro_factura}</span></td>
                      <td className="px-4 py-2.5"><span className="text-xs text-gray-500">{toDateString(ot.fecha_factura)}</span></td>
                      <td className="px-4 py-2.5"><span className="text-right block font-mono text-xs text-gray-700">{fmt(ot.total_bruto_factura ?? 0)}</span></td>
                      <td className="px-4 py-2.5"><span className="text-right block font-mono text-xs text-gray-500">{fmt(ot.precio ?? 0)}</span></td>
                      <td className="px-4 py-2.5">
                        <span className={`text-right block font-mono text-xs ${(ot.gastos_logisticos ?? 0) > 0 ? 'text-amber-600' : 'text-gray-300'}`}>
                          {(ot.gastos_logisticos ?? 0) > 0 ? fmt(ot.gastos_logisticos!) : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5"><span className="text-right block font-mono text-xs font-semibold text-emerald-700">{fmt(ot.contribucion_marginal ?? 0)}</span></td>
                      <td className="px-4 py-2.5"><span className={`text-right block text-xs font-bold ${margenColor(ot.porcentaje_margen ?? 0)}`}>{fmtPct(ot.porcentaje_margen ?? 0)}</span></td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ot.estado_valorizacion === 'Valorizado' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {ot.estado_valorizacion === 'Valorizado' ? <CheckCircle2 size={11} className="inline mr-1" /> : <Clock size={11} className="inline mr-1" />}
                          {ot.estado_valorizacion || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
              <span>{detalleRows.length} operaciones{loadingDetalle && ' · cargando...'}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { const p = detallePage - 1; setDetallePage(p); loadDetalle(p, selectedCliente, searchCliente, detalleSortBy, detalleSortDir, false) }}
                  disabled={detallePage === 0 || loadingDetalle}
                  className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-medium">Pág. {detallePage + 1}</span>
                <button
                  onClick={() => { const p = detallePage + 1; setDetallePage(p); loadDetalle(p, selectedCliente, searchCliente, detalleSortBy, detalleSortDir, false) }}
                  disabled={!detalleHasMore || loadingDetalle}
                  className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {otModalRow && <OTDetalleModal row={otModalRow} onClose={() => setOtModalRow(null)} />}
    </div>
  )
}

export default ContribucionMarginalDashboard