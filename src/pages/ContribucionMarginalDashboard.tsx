/**
 * ============================================
 * ContribucionMarginalDashboard — V2
 * ============================================
 *
 * ARQUITECTURA (MVP):
 *   Excel (.xlsx) → SheetJS → estado local → UI
 *
 * MIGRACIÓN FUTURA: reemplazar parseExcel() por fetchFromAPI()
 *
 * COLUMNAS DEL EXCEL V2 (índices 0-21):
 *   0  Fecha factura        1  Nro factura          2  Cliente
 *   3  Fecha OT             4  Nro OT               5  Total bruto factura
 *   6  Concepto impositivo  7  Total factura (neto)  8  Gastos logísticos
 *   9  % Gastos log        10  Fecha remito         11  Nro remito
 *  12  Fecha consumo       13  Nro consumo          14  Precio (costo PPP)
 *  15  Estado valorización 16  Descripción          17  Fecha NC
 *  18  Nro NC              19  Total bruto NC       20  Contr. marginal
 *  21  % margen
 *
 * NOTAS DE NEGOCIO:
 *   - % margen calculado sobre bruto (col 5)
 *   - CM ya tiene gastos logísticos descontados (no restar de nuevo)
 *   - Filas con Nro NC (col 18) se excluyen del dashboard
 *   - Las fechas vienen como datetime objects (no número de serie Excel)
 *   - Toggle IVA preparado para sprint siguiente
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import * as XLSX from 'xlsx'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts'
import {
  Upload,
  TrendingUp,
  DollarSign,
  BarChart2,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  Truck,
  CalendarDays,
  EyeOff,
} from 'lucide-react'

// ============================================================
// TIPOS
// ============================================================

interface RawRow {
  fechaFactura: Date | null
  nroFactura: string
  cliente: string
  fechaOt: Date | null
  nroOt: string
  totalBrutoFactura: number   // col 5  — base de cálculo % margen
  conceptoImpositivo: number  // col 6  — IVA
  totalFacturaNeto: number    // col 7  — bruto + IVA
  gastosLogisticos: number    // col 8
  pctGastosLog: number        // col 9
  fechaRemito: Date | null    // col 10
  nroRemito: string           // col 11
  // ── Campos clínicos / operativos (V3) ──
  paciente: string            // col 12
  institucion: string         // col 13
  tecnico: string             // col 14
  medico: string              // col 15
  medicoProctor: string       // col 16
  sucursal: string            // col 17
  // ── Continuación (corridas +6 desde V2) ──
  fechaConsumo: Date | null   // col 18
  nroConsumo: number | null   // col 19
  precio: number              // col 20 — costo PPP
  estadoValorizacion: string  // col 21
  descripcion: string         // col 22
  fechaNc: Date | null        // col 23
  nroNc: string               // col 24
  totalBrutoNc: number        // col 25
  contribMarginal: number     // col 26 — ya incluye descuento de gastos log
  pctMargen: number           // col 27
  mesAnio: string             // derivado — "MM/YYYY"
}

interface ClienteSummary {
  cliente: string
  totalBruto: number
  totalNeto: number
  conceptoImpositivo: number
  gastosLogisticos: number
  costo: number
  contribMarginal: number
  pctMargen: number
  cantOTs: number
  estadoValorizacion: 'Valorizado' | 'Sin Valorizar' | 'Mixto'
}

interface OtSummary {
  nroOt: string
  cliente: string
  bruto: number
  cm: number
  pct: number
}

// ============================================================
// HELPERS
// ============================================================

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(n)

const fmtShort = (n: number): string => {
  if (Math.abs(n) >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

const fmtPct = (n: number) => `${n.toFixed(1)}%`

const toDateString = (val: Date | number | null): string => {
  if (!val) return '—'
  const date = val instanceof Date ? val : new Date((val as number - 25569) * 86400 * 1000)
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const toMesAnio = (date: Date | null): string => {
  if (!date) return ''
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${m}/${date.getFullYear()}`
}

const parseDate = (val: unknown): Date | null => {
  if (!val) return null
  if (val instanceof Date) return val
  if (typeof val === 'number') return new Date((val - 25569) * 86400 * 1000)
  return null
}

// ============================================================
// PARSE EXCEL
// ============================================================

function parseExcel(file: File): Promise<RawRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array', cellDates: true })
        const rawData: unknown[][] = XLSX.utils.sheet_to_json(
          wb.Sheets[wb.SheetNames[0]],
          { header: 1, raw: true }
        )

        const rows: RawRow[] = rawData
          .slice(1)
          .filter((r: unknown[]) => r[2])
          .filter((r: unknown[]) => !r[24] || String(r[24]).trim() === '')        // excluir NC (col 24 en V3)
          .map((r: unknown[]) => {
            const fechaFactura = parseDate(r[0])
            return {
              fechaFactura,
              nroFactura: String(r[1] ?? ''),
              cliente: String(r[2] ?? ''),
              fechaOt: parseDate(r[3]),
              nroOt: String(r[4] ?? ''),
              totalBrutoFactura: Number(r[5] ?? 0),
              conceptoImpositivo: Number(r[6] ?? 0),
              totalFacturaNeto: Number(r[7] ?? 0),
              gastosLogisticos: Number(r[8] ?? 0),
              pctGastosLog: Number(r[9] ?? 0),
              fechaRemito: parseDate(r[10]),
              nroRemito: String(r[11] ?? ''),
              // ── Campos clínicos V3 ──
              paciente: String(r[12] ?? '').trim(),
              institucion: String(r[13] ?? '').trim(),
              tecnico: String(r[14] ?? '').trim(),
              medico: String(r[15] ?? '').trim(),
              medicoProctor: String(r[16] ?? '').trim(),
              sucursal: String(r[17] ?? '').trim(),
              // ── Continuación corrida +6 ──
              fechaConsumo: parseDate(r[18]),
              nroConsumo: r[19] ? Number(r[19]) : null,
              precio: Number(r[20] ?? 0),
              estadoValorizacion: String(r[21] ?? ''),
              descripcion: String(r[22] ?? ''),
              fechaNc: parseDate(r[23]),
              nroNc: String(r[24] ?? ''),
              totalBrutoNc: Number(r[25] ?? 0),
              contribMarginal: Number(r[26] ?? 0),
              pctMargen: Number(r[27] ?? 0),
              mesAnio: toMesAnio(fechaFactura),
            }
          })
        resolve(rows)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Error leyendo el archivo'))
    reader.readAsArrayBuffer(file)
  })
}

// ============================================================
// BUILD OT RANKINGS
// ============================================================

/** Devuelve top N mejores y peores OTs por % margen (excluyendo 100%) */
function buildOtRankings(rows: RawRow[], n = 5): { best: OtSummary[]; worst: OtSummary[] } {
  const ots: OtSummary[] = rows
    .filter((r) => r.nroOt && r.totalBrutoFactura > 0 && r.pctMargen < 99.9)
    .map((r) => ({
      nroOt: r.nroOt,
      cliente: r.cliente,
      bruto: r.totalBrutoFactura,
      cm: r.contribMarginal,
      pct: r.pctMargen,
    }))

  const sorted = [...ots].sort((a, b) => b.pct - a.pct)
  return {
    best: sorted.slice(0, n),
    worst: sorted.slice(-n).reverse(),
  }
}

/** Mapea cliente → top 3 OTs por rentabilidad (sin 100%) para tooltips */
function buildClienteOtMap(rows: RawRow[]): Map<string, OtSummary[]> {
  const map = new Map<string, OtSummary[]>()
  for (const r of rows) {
    if (!r.nroOt || r.totalBrutoFactura <= 0 || r.pctMargen >= 99.9) continue
    const existing = map.get(r.cliente) ?? []
    existing.push({ nroOt: r.nroOt, cliente: r.cliente, bruto: r.totalBrutoFactura, cm: r.contribMarginal, pct: r.pctMargen })
    map.set(r.cliente, existing)
  }
  // Ordenar y quedarse con top 3 por cliente
  map.forEach((ots, key) => {
    map.set(key, [...ots].sort((a, b) => b.pct - a.pct).slice(0, 3))
  })
  return map
}

// ============================================================
// BUILD SUMMARIES
// ============================================================

function buildClienteSummaries(rows: RawRow[]): ClienteSummary[] {
  const map = new Map<string, ClienteSummary>()

  for (const r of rows) {
    const existing = map.get(r.cliente)
    if (!existing) {
      map.set(r.cliente, {
        cliente: r.cliente,
        totalBruto: r.totalBrutoFactura,
        totalNeto: r.totalFacturaNeto,
        conceptoImpositivo: r.conceptoImpositivo,
        gastosLogisticos: r.gastosLogisticos,
        costo: r.precio,
        contribMarginal: r.contribMarginal,
        pctMargen: 0,
        cantOTs: r.nroOt ? 1 : 0,
        estadoValorizacion: r.estadoValorizacion === 'Valorizado' ? 'Valorizado' : 'Sin Valorizar',
      })
    } else {
      existing.totalBruto += r.totalBrutoFactura
      existing.totalNeto += r.totalFacturaNeto
      existing.conceptoImpositivo += r.conceptoImpositivo
      existing.gastosLogisticos += r.gastosLogisticos
      existing.costo += r.precio
      existing.contribMarginal += r.contribMarginal
      if (r.nroOt) existing.cantOTs += 1
      if (existing.estadoValorizacion !== r.estadoValorizacion) {
        existing.estadoValorizacion = 'Mixto'
      }
    }
  }

  return Array.from(map.values())
    .map((c) => ({
      ...c,
      pctMargen: c.totalBruto > 0 ? (c.contribMarginal / c.totalBruto) * 100 : 0,
    }))
    .sort((a, b) => b.contribMarginal - a.contribMarginal)
}

// ============================================================
// COLORES
// ============================================================

const EMERALD_PALETTE = [
  '#059669', '#10b981', '#34d399', '#6ee7b7',
  '#047857', '#065f46', '#0d9488', '#0891b2',
  '#0284c7', '#2563eb', '#4f46e5', '#7c3aed',
]

const RADIAL_COLORS = {
  ventas: '#059669',
  costos: '#6366f1',
  gastos: '#f59e0b',
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

// ============================================================
// UPLOAD ZONE
// ============================================================

const UploadZone: React.FC<{ onFile: (f: File) => void; loading: boolean }> = ({ onFile, loading }) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }, [onFile])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`w-full max-w-lg border-2 border-dashed rounded-2xl p-14 flex flex-col items-center gap-5 cursor-pointer transition-all duration-200
          ${dragging ? 'border-emerald-500 bg-emerald-50 scale-[1.01]' : 'border-gray-300 bg-white hover:border-emerald-400 hover:bg-emerald-50/40'}`}
      >
        <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        {loading ? (
          <>
            <div className="w-14 h-14 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
            <p className="text-gray-600 font-medium">Procesando archivo...</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center">
              <Upload size={30} className="text-emerald-600" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-800">Cargar Excel de Contribución Marginal</p>
              <p className="text-sm text-gray-500 mt-1">Arrastrá el archivo acá o hacé click para seleccionarlo</p>
              <p className="text-xs text-gray-400 mt-2">.xlsx o .xls</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
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
// CUSTOM Y-AXIS TICK
// ============================================================

/**
 * Muestra el nombre del cliente en el eje Y.
 * Estrategia: mostrar la primera palabra significativa en línea 1,
 * y las siguientes 2-3 palabras en línea 2 (hasta 20 chars).
 * Así "INSTITUTO NACIONAL..." e "INSTITUTO DE OBRA..." se distinguen
 * porque la línea 2 muestra "NACIONAL..." vs "DE OBRA..."
 */
const CustomYAxisTick = ({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) => {
  const name = (payload?.value ?? '').replace(/"+/g, '').trim()
  const words = name.split(' ').filter(Boolean)

  // Calcular el punto de corte: línea 1 tiene las primeras palabras
  // hasta llegar a ~18 chars, línea 2 las siguientes (hasta 20 chars)
  let line1 = ''
  let splitIndex = 0
  for (let i = 0; i < words.length; i++) {
    const candidate = line1 ? `${line1} ${words[i]}` : words[i]
    if (candidate.length <= 18) {
      line1 = candidate
      splitIndex = i + 1
    } else {
      break
    }
  }
  // Si el nombre cabe entero en una línea
  if (splitIndex >= words.length) {
    return (
      <g transform={`translate(${x},${y})`}>
        <title>{name}</title>
        <text x={0} y={0} dy={4} textAnchor="end" fill="#374151" fontSize={10} fontFamily="system-ui, sans-serif">
          {line1}
        </text>
      </g>
    )
  }
  // Línea 2: palabras restantes, truncadas a 20 chars
  let line2 = words.slice(splitIndex).join(' ')
  if (line2.length > 20) line2 = line2.substring(0, 19) + '…'

  return (
    <g transform={`translate(${x},${y})`}>
      <title>{name}</title>
      <text x={0} y={-7} textAnchor="end" fill="#374151" fontSize={10} fontWeight={600} fontFamily="system-ui, sans-serif">
        {line1}
      </text>
      <text x={0} y={6} textAnchor="end" fill="#6b7280" fontSize={9} fontFamily="system-ui, sans-serif">
        {line2}
      </text>
    </g>
  )
}

// ============================================================
// CUSTOM TOOLTIP — bar chart CM con Top 3 OTs del cliente
// ============================================================

const CmBarTooltip: React.FC<{
  active?: boolean
  payload?: Array<{ payload: { fullName: string; cm: number; pct: number } }>
  clienteOtMap: Map<string, OtSummary[]>
}> = ({ active, payload, clienteOtMap }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const top3 = clienteOtMap.get(d.fullName) ?? []

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-xs max-w-[280px]">
      <p className="font-semibold text-gray-800 text-sm leading-tight mb-1">{d.fullName}</p>
      <div className="flex items-center gap-3 mb-3 pb-2 border-b border-gray-100">
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
      {top3.length > 0 && (
        <>
          <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1.5">Top 3 OTs por rentabilidad</p>
          <div className="space-y-1.5">
            {top3.map((ot, i) => (
              <div key={ot.nroOt} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-gray-400 w-3">{i + 1}.</span>
                  <span className="font-mono text-gray-600">{ot.nroOt}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">{fmtShort(ot.bruto)}</span>
                  <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                    ot.pct >= 90 ? 'bg-emerald-100 text-emerald-700'
                    : ot.pct >= 70 ? 'bg-blue-100 text-blue-700'
                    : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {fmtPct(ot.pct)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================
// COMPOSICION DONUT — anillo base (venta bruta) con arcos
// superpuestos de costos y gastos logísticos al mismo radio
// ============================================================

interface DonutSlice { name: string; value: number; pct: number; fill: string }

const LABEL_OFFSET = 18
const INNER_R = 55
const OUTER_R = 90

/**
 * Renderiza una etiqueta de porcentaje fuera del arco,
 * con una línea de referencia y el texto del %.
 */
const DonutLabel = ({
  cx, cy, midAngle, outerRadius, pct, fill, name,
}: {
  cx: number; cy: number; midAngle: number
  outerRadius: number; pct: number; fill: string; name: string
}) => {
  if (pct < 0.5) return null // no mostrar si es insignificante
  const RADIAN = Math.PI / 180
  const sin = Math.sin(-RADIAN * midAngle)
  const cos = Math.cos(-RADIAN * midAngle)
  const sx = cx + (outerRadius + 6) * cos
  const sy = cy + (outerRadius + 6) * sin
  const mx = cx + (outerRadius + LABEL_OFFSET) * cos
  const my = cy + (outerRadius + LABEL_OFFSET) * sin
  const ex = mx + (cos >= 0 ? 1 : -1) * 12
  const ey = my
  const textAnchor = cos >= 0 ? 'start' : 'end'

  return (
    <g>
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" strokeWidth={1.5} />
      <circle cx={ex} cy={ey} r={2} fill={fill} />
      <text x={ex + (cos >= 0 ? 4 : -4)} y={ey} textAnchor={textAnchor}
        fill={fill} fontSize={10} fontWeight={700} dominantBaseline="central">
        {pct.toFixed(1)}%
      </text>
      <text x={ex + (cos >= 0 ? 4 : -4)} y={ey + 12} textAnchor={textAnchor}
        fill="#9ca3af" fontSize={9} dominantBaseline="central">
        {name.split(' ')[0]}
      </text>
    </g>
  )
}

const ComposicionDonut: React.FC<{ data: DonutSlice[] }> = ({ data }) => {
  const marginPct = data[0]?.pct ?? 0
  const costosPct = data[1]?.pct ?? 0
  const gastosPct = data[2]?.pct ?? 0

  // Un único anillo con 3 segmentos que suman exactamente 100%
  // CM (verde) + Costos (índigo) + Gastos Log (ámbar) = 100%
  const pieData = [
    { name: data[0]?.name ?? 'Contr. Marginal', value: marginPct,  fill: data[0]?.fill ?? '#059669', pct: marginPct },
    { name: data[1]?.name ?? 'Costos',          value: costosPct,  fill: data[1]?.fill ?? '#6366f1', pct: costosPct },
    { name: data[2]?.name ?? 'Gastos Log.',      value: gastosPct,  fill: data[2]?.fill ?? '#f59e0b', pct: gastosPct },
  ].filter(d => d.value > 0)  // excluir segmentos vacíos (ej: gastos = 0)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderLabel = (props: any) => {
    const d = pieData[props.index]
    // Solo mostrar etiqueta en Costos y Gastos, no en el segmento verde
    if (!d || props.index === 0 || d.pct < 0.3) return null
    return (
      <DonutLabel
        cx={props.cx}
        cy={props.cy}
        midAngle={props.midAngle}
        outerRadius={props.outerRadius}
        pct={d.pct}
        fill={d.fill}
        name={d.name}
      />
    )
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart margin={{ top: 24, right: 34, bottom: 24, left: 34 }}>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          innerRadius={INNER_R}
          outerRadius={OUTER_R}
          dataKey="value"
          startAngle={90}
          endAngle={-270}
          strokeWidth={2}
          stroke="#fff"
          labelLine={false}
          label={renderLabel}
          isAnimationActive={true}
        >
          {pieData.map((entry, i) => (
            <Cell key={i} fill={entry.fill} opacity={0.92} />
          ))}
        </Pie>

        {/* Texto central — % de margen dinámico */}
        <text x="50%" y="44%" textAnchor="middle" dominantBaseline="central"
          fill="#059669" fontSize={15} fontWeight={700}>
          {`${marginPct.toFixed(1)}%`}
        </text>
        <text x="50%" y="57%" textAnchor="middle" dominantBaseline="central"
          fill="#6b7280" fontSize={9}>
          Margen
        </text>
      </PieChart>
    </ResponsiveContainer>
  )
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

const ContribucionMarginalDashboard: React.FC = () => {
  const [rows, setRows] = useState<RawRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'resumen' | 'detalle'>('resumen')
  const [selectedCliente, setSelectedCliente] = useState<string | null>(null)
  const [selectedMes, setSelectedMes] = useState<string>('todos')

  // Toggle del gráfico: 'cm' = Top 10 por CM | 'rankings' = Top 5 mejor/peor
  const [chartMode, setChartMode] = useState<'cm' | 'rankings'>('cm')
  const [sorting, setSorting] = useState<SortingState>([{ id: 'contribMarginal', desc: true }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  const handleFile = useCallback(async (file: File) => {
    setLoading(true)
    setError(null)
    try {
      const parsed = await parseExcel(file)
      setRows(parsed)
      setFileName(file.name)
      setSelectedMes('todos')
      setSelectedCliente(null)
    } catch (e) {
      setError('Error al procesar el archivo. Verificá que sea el formato correcto.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  // Meses disponibles ordenados cronológicamente
  const mesesDisponibles = useMemo(() => {
    const set = new Set<string>()
    rows.forEach((r) => { if (r.mesAnio) set.add(r.mesAnio) })
    return Array.from(set).sort((a, b) => {
      const [ma, ya] = a.split('/').map(Number)
      const [mb, yb] = b.split('/').map(Number)
      return ya !== yb ? ya - yb : ma - mb
    })
  }, [rows])

  // Filas filtradas por mes seleccionado
  const rowsFiltradas = useMemo(() =>
    selectedMes === 'todos' ? rows : rows.filter((r) => r.mesAnio === selectedMes),
    [rows, selectedMes]
  )

  const summaries = useMemo(() => buildClienteSummaries(rowsFiltradas), [rowsFiltradas])

  const kpis = useMemo(() => {
    const ventaBruta = rowsFiltradas.reduce((s, r) => s + r.totalBrutoFactura, 0)
    const costos = rowsFiltradas.reduce((s, r) => s + r.precio, 0)
    const gastosLog = rowsFiltradas.reduce((s, r) => s + r.gastosLogisticos, 0)
    const margen = rowsFiltradas.reduce((s, r) => s + r.contribMarginal, 0)
    const pctMargen = ventaBruta > 0 ? (margen / ventaBruta) * 100 : 0
    const pctGastos = ventaBruta > 0 ? (gastosLog / ventaBruta) * 100 : 0
    const pctCostos = ventaBruta > 0 ? (costos / ventaBruta) * 100 : 0
    return { ventaBruta, costos, gastosLog, margen, pctMargen, pctGastos, pctCostos }
  }, [rowsFiltradas])

  const barData = useMemo(() =>
    summaries.slice(0, 10).map((c) => ({
      name: c.cliente,
      fullName: c.cliente,
      cm: c.contribMarginal,
      bruto: c.totalBruto,
      pct: c.pctMargen,
    })),
    [summaries]
  )

  const otRankings = useMemo(() => buildOtRankings(rowsFiltradas), [rowsFiltradas])
  const clienteOtMap = useMemo(() => buildClienteOtMap(rowsFiltradas), [rowsFiltradas])


  // Donut — [0] Margen/CM (verde, base), [1] Costos, [2] Gastos Log
  // El anillo verde representa la CM como % del bruto (ej: 82.1%)
  // Los arcos de costos y gastos se superponen sobre ese anillo
  const radialData = useMemo(() => {
    const total = kpis.ventaBruta || 1
    return [
      { name: 'Contr. Marginal', value: kpis.margen, pct: parseFloat(((kpis.margen / total) * 100).toFixed(1)), fill: RADIAL_COLORS.ventas },
      { name: 'Costos (P.P.P.)', value: kpis.costos, pct: parseFloat(((kpis.costos / total) * 100).toFixed(1)), fill: RADIAL_COLORS.costos },
      { name: 'Gastos Logísticos', value: kpis.gastosLog, pct: parseFloat(((kpis.gastosLog / total) * 100).toFixed(1)), fill: RADIAL_COLORS.gastos },
    ]
  }, [kpis])

  const columns = useMemo<ColumnDef<ClienteSummary>[]>(() => [
    {
      accessorKey: 'cliente',
      header: 'Cliente',
      cell: ({ getValue }) => <span className="font-medium text-gray-800 text-sm">{getValue() as string}</span>,
      size: 260,
    },
    {
      accessorKey: 'cantOTs',
      header: 'OTs',
      cell: ({ getValue }) => <span className="text-center block text-gray-600">{getValue() as number}</span>,
      size: 55,
    },
    {
      accessorKey: 'totalBruto',
      header: 'Venta Bruta',
      cell: ({ getValue }) => <span className="text-right block font-mono text-gray-700 text-sm">{fmt(getValue() as number)}</span>,
    },
    {
      accessorKey: 'costo',
      header: 'Costos (P.P.P.)',
      cell: ({ getValue }) => <span className="text-right block font-mono text-gray-500 text-sm">{fmt(getValue() as number)}</span>,
    },
    {
      accessorKey: 'gastosLogisticos',
      header: 'Gs. Logísticos',
      cell: ({ getValue }) => {
        const v = getValue() as number
        return <span className={`text-right block font-mono text-sm ${v > 0 ? 'text-amber-600' : 'text-gray-300'}`}>{v > 0 ? fmt(v) : '—'}</span>
      },
    },
    {
      accessorKey: 'contribMarginal',
      header: 'Contr. Marginal',
      cell: ({ getValue }) => <span className="text-right block font-mono font-semibold text-emerald-700 text-sm">{fmt(getValue() as number)}</span>,
    },
    {
      accessorKey: 'pctMargen',
      header: '% Margen',
      cell: ({ getValue }) => {
        const pct = getValue() as number
        return (
          <div className="flex justify-end">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${margenBg(pct)}`}>
              {fmtPct(pct)}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: 'estadoValorizacion',
      header: 'Estado',
      cell: ({ getValue }) => {
        const v = getValue() as string
        return (
          <div className="flex justify-center">
            {v === 'Valorizado' ? (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-700"><CheckCircle2 size={13} /> Valorizado</span>
            ) : v === 'Sin Valorizar' ? (
              <span className="inline-flex items-center gap-1 text-xs text-amber-600"><Clock size={13} /> Sin Valorizar</span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-blue-600"><AlertCircle size={13} /> Mixto</span>
            )}
          </div>
        )
      },
    },
  ], [])

  const table = useReactTable({
    data: summaries,
    columns,
    state: { sorting, columnFilters, globalFilter, pagination },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  // ── Sin datos ───────────────────────────────────────────
  if (rows.length === 0) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Contribución Marginal por Cliente</h1>
          <p className="text-gray-500 text-sm mt-1">Cargá el archivo Excel para visualizar el dashboard</p>
        </div>
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}
        <UploadZone onFile={handleFile} loading={loading} />
      </div>
    )
  }

  // ── Dashboard ───────────────────────────────────────────
  return (
    <div className="p-6 space-y-6 min-h-screen bg-slate-200">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contribución Marginal por Cliente</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {selectedMes !== 'todos' ? selectedMes : 'Todos los meses'} · {summaries.length} clientes · {rowsFiltradas.length} operaciones ·{' '}
            <span className="text-emerald-600 font-medium">{fileName}</span>
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Toggle IVA — preparado para sprint siguiente */}
          <button
            disabled
            title="Vista con/sin IVA — próximamente"
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border bg-gray-50 border-gray-300 text-gray-400 cursor-not-allowed"
          >
            <EyeOff size={14} />
            CON IVA
            <span className="ml-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded font-bold">PRONTO</span>
          </button>
          <button
            onClick={() => { setRows([]); setFileName('') }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Upload size={15} /> Cambiar archivo
          </button>
        </div>
      </div>

      {/* Filtro de mes */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mr-1">
          <CalendarDays size={15} />
          <span className="font-medium">Período:</span>
        </div>
        <button
          onClick={() => setSelectedMes('todos')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors
            ${selectedMes === 'todos'
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-white text-gray-600 border-gray-300 hover:border-emerald-400 hover:text-emerald-700'
            }`}
        >
          Todos
        </button>
        {mesesDisponibles.map((mes) => (
          <button
            key={mes}
            onClick={() => setSelectedMes(mes)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors
              ${selectedMes === mes
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-emerald-400 hover:text-emerald-700'
              }`}
          >
            {mes}
          </button>
        ))}
      </div>

      {/* KPI Cards — orden: Venta Bruta | Costos | Gastos Log | Margen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Venta Bruta"
          value={fmtShort(kpis.ventaBruta)}
          sub={fmt(kpis.ventaBruta)}
          icon={<DollarSign size={18} className="text-emerald-600" />}
          accent="bg-emerald-100"
        />
        <KpiCard
          label="Costos (P.P.P.)"
          value={fmtShort(kpis.costos)}
          sub={fmt(kpis.costos)}
          icon={<BarChart2 size={18} className="text-indigo-600" />}
          accent="bg-indigo-100"
          trend={`${fmtPct(kpis.pctCostos)} sobre venta bruta`}
          trendColor="text-indigo-600"
        />
        <KpiCard
          label="Gastos Logísticos"
          value={fmtShort(kpis.gastosLog)}
          sub={fmt(kpis.gastosLog)}
          icon={<Truck size={18} className="text-amber-600" />}
          accent="bg-amber-100"
          trend={kpis.gastosLog > 0 ? `${fmtPct(kpis.pctGastos)} sobre venta bruta` : 'Sin gastos en este período'}
          trendColor={kpis.gastosLog > 0 ? 'text-amber-600' : 'text-gray-400'}
        />
        <KpiCard
          label="Margen (Contr. Marginal)"
          value={fmtShort(kpis.margen)}
          sub={fmt(kpis.margen)}
          icon={<TrendingUp size={18} className="text-emerald-600" />}
          accent="bg-emerald-100"
          trend={`${fmtPct(kpis.pctMargen)} sobre venta bruta`}
          trendColor={kpis.pctMargen >= 70 ? 'text-emerald-600' : 'text-yellow-600'}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Bar chart — toggle CM / Rankings */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-300 p-5 shadow-md">

          {/* Header con toggle */}
          <div className="flex items-start justify-between mb-4 gap-2 flex-wrap">
            <div>
              <h2 className="text-sm font-semibold text-gray-700">
                {chartMode === 'cm' ? 'Top 10 Clientes por Contribución Marginal' : 'Ranking de Rentabilidad por OT'}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {chartMode === 'cm'
                  ? 'Hacé click en una barra para filtrar el detalle'
                  : 'Top 5 mejores y peores OTs según % de margen (excluye OTs al 100%)'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {chartMode === 'cm' && selectedCliente && (
                <button onClick={() => setSelectedCliente(null)}
                  className="text-xs text-emerald-600 hover:text-emerald-800 font-medium flex items-center gap-1">
                  ✕ Limpiar filtro
                </button>
              )}
              {/* Toggle */}
              <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
                <button
                  onClick={() => setChartMode('cm')}
                  className={`px-3 py-1.5 transition-colors ${chartMode === 'cm' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                >
                  Top 10 CM
                </button>
                <button
                  onClick={() => setChartMode('rankings')}
                  className={`px-3 py-1.5 transition-colors border-l border-gray-200 ${chartMode === 'rankings' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                >
                  Rentabilidad OTs
                </button>
              </div>
            </div>
          </div>

          {/* MODO CM: Top 10 por Contribución Marginal */}
          {chartMode === 'cm' && (
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 50, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" tickFormatter={fmtShort} tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={185} tick={<CustomYAxisTick />} axisLine={false} tickLine={false} />
                <Tooltip
                  content={<CmBarTooltip clienteOtMap={clienteOtMap} />}
                  cursor={{ fill: 'rgba(16,185,129,0.06)' }}
                />
                <Bar
                  dataKey="cm"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={26}
                  style={{ cursor: 'pointer' }}
                  onClick={(data) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const clicked = (data as any)?.fullName as string | undefined
                    if (clicked) {
                      setSelectedCliente((prev) => (prev === clicked ? null : clicked))
                      setActiveTab('detalle')
                    }
                  }}
                >
                  {barData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={selectedCliente === null || selectedCliente === entry.fullName
                        ? EMERALD_PALETTE[i % EMERALD_PALETTE.length]
                        : '#e5e7eb'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {/* MODO RANKINGS: Top 5 mejor / Top 5 peor */}
          {chartMode === 'rankings' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">

              {/* TOP 5 MEJORES */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Top 5 Mejores</span>
                  <span className="text-xs text-gray-400">mayor % de margen</span>
                </div>
                <div className="space-y-2">
                  {otRankings.best.map((ot, i) => (
                    <div key={ot.nroOt} className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50/60 border border-emerald-100 hover:bg-emerald-50 transition-colors">
                      <span className="text-xs font-bold text-emerald-400 w-4 shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-xs font-semibold text-gray-700">{ot.nroOt}</p>
                        <p className="text-[10px] text-gray-400 truncate">{ot.cliente}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-emerald-600">{fmtPct(ot.pct)}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{fmtShort(ot.bruto)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* TOP 5 PEORES */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Top 5 Peores</span>
                  <span className="text-xs text-gray-400">menor % de margen</span>
                </div>
                <div className="space-y-2">
                  {otRankings.worst.map((ot, i) => (
                    <div key={ot.nroOt} className="flex items-center gap-3 p-3 rounded-lg bg-red-50/60 border border-red-100 hover:bg-red-50 transition-colors">
                      <span className="text-xs font-bold text-red-300 w-4 shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-xs font-semibold text-gray-700">{ot.nroOt}</p>
                        <p className="text-[10px] text-gray-400 truncate">{ot.cliente}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-red-500">{fmtPct(ot.pct)}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{fmtShort(ot.bruto)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Donut chart — composición superpuesta sobre venta bruta */}
        <div className="bg-white rounded-xl border border-slate-300 p-5 shadow-md flex flex-col">
          <div className="mb-2">
            <h2 className="text-sm font-semibold text-gray-700">Composición de la Venta Bruta</h2>
            <p className="text-xs text-gray-400 mt-0.5">Costos y gastos logísticos sobre el total</p>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <ComposicionDonut data={radialData} />
          </div>
          {/* Leyenda con valores absolutos */}
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

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-300 shadow-md overflow-hidden">
        <div className="flex border-b border-gray-200">
          {(['resumen', 'detalle'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3.5 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-emerald-600 text-emerald-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab === 'resumen' ? 'Resumen por Cliente' : 'Detalle de Operaciones'}
            </button>
          ))}
        </div>

        {activeTab === 'resumen' ? (
          <div>
            <div className="p-4 border-b border-gray-100">
              <div className="relative max-w-sm">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)}
                  placeholder="Buscar cliente..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id} className="bg-gray-50 border-b border-gray-200">
                      {hg.headers.map((header) => (
                        <th key={header.id} onClick={header.column.getToggleSortingHandler()}
                          className={`px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide
                            ${header.column.getCanSort() ? 'cursor-pointer select-none hover:bg-gray-100' : ''}`}
                          style={{ width: header.getSize() }}>
                          <div className="flex items-center gap-1.5">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getCanSort() && (
                              <span className="text-gray-400">
                                {header.column.getIsSorted() === 'asc' ? <ChevronUp size={13} />
                                  : header.column.getIsSorted() === 'desc' ? <ChevronDown size={13} />
                                  : <ChevronsUpDown size={13} />}
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row, i) => (
                    <tr key={row.id}
                      className={`border-b border-gray-100 hover:bg-emerald-50/40 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
              <span>{table.getFilteredRowModel().rows.length} clientes{globalFilter && ` (filtrado de ${summaries.length})`}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}
                  className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-medium">Pág. {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}</span>
                <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}
                  className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <DetalleTab rows={rowsFiltradas} selectedCliente={selectedCliente} onClearCliente={() => setSelectedCliente(null)} />
        )}
      </div>
    </div>
  )
}

// ============================================================
// EXPAND ROW — datos clínicos/operativos expandibles
// ============================================================

const campo = (valor: string) => valor.trim() || '—'

const ExpandRow: React.FC<{ row: RawRow; colSpan: number }> = ({ row, colSpan }) => (
  <tr className="bg-gradient-to-r from-slate-50 to-blue-50/30">
    <td colSpan={colSpan} className="px-4 py-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">

        {/* Paciente */}
        <div className="flex items-start gap-2">
          <div className="mt-0.5 w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center shrink-0">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium">Paciente</p>
            <p className={`text-xs font-medium truncate ${row.paciente ? 'text-gray-700' : 'text-gray-300'}`}>
              {campo(row.paciente)}
            </p>
          </div>
        </div>

        {/* Institución */}
        <div className="flex items-start gap-2">
          <div className="mt-0.5 w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center shrink-0">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/>
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium">Institución</p>
            <p className={`text-xs font-medium truncate ${row.institucion ? 'text-gray-700' : 'text-gray-300'}`}
               title={row.institucion || undefined}>
              {campo(row.institucion)}
            </p>
          </div>
        </div>

        {/* Sucursal */}
        <div className="flex items-start gap-2">
          <div className="mt-0.5 w-6 h-6 rounded-md bg-violet-100 flex items-center justify-center shrink-0">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium">Sucursal</p>
            <p className={`text-xs font-medium truncate ${row.sucursal ? 'text-gray-700' : 'text-gray-300'}`}>
              {campo(row.sucursal)}
            </p>
          </div>
        </div>

        {/* Médico */}
        <div className="flex items-start gap-2">
          <div className="mt-0.5 w-6 h-6 rounded-md bg-cyan-100 flex items-center justify-center shrink-0">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2" strokeLinecap="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium">Médico</p>
            <p className={`text-xs font-medium truncate ${row.medico ? 'text-gray-700' : 'text-gray-300'}`}>
              {campo(row.medico)}
            </p>
          </div>
        </div>

        {/* Médico Proctor */}
        <div className="flex items-start gap-2">
          <div className="mt-0.5 w-6 h-6 rounded-md bg-indigo-100 flex items-center justify-center shrink-0">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium">Médico Proctor</p>
            <p className={`text-xs font-medium truncate ${row.medicoProctor ? 'text-gray-700' : 'text-gray-300'}`}>
              {campo(row.medicoProctor)}
            </p>
          </div>
        </div>

        {/* Técnico */}
        <div className="flex items-start gap-2">
          <div className="mt-0.5 w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center shrink-0">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium">Técnico</p>
            <p className={`text-xs font-medium truncate ${row.tecnico ? 'text-gray-700' : 'text-gray-300'}`}>
              {campo(row.tecnico)}
            </p>
          </div>
        </div>

      </div>
    </td>
  </tr>
)

// ============================================================
// TAB DETALLE
// ============================================================

const DetalleTab: React.FC<{
  rows: RawRow[]
  selectedCliente: string | null
  onClearCliente: () => void
}> = ({ rows, selectedCliente, onClearCliente }) => {
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 15 })
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }))
    setExpandedRows(new Set()) // colapsar al cambiar filtro
  }, [selectedCliente])

  const filteredRows = useMemo(() =>
    selectedCliente ? rows.filter((r) => r.cliente === selectedCliente) : rows,
    [rows, selectedCliente]
  )

  const TOTAL_COLS = 10 // columnas visibles + col expand

  const columns = useMemo<ColumnDef<RawRow>[]>(() => [
    {
      id: 'expand',
      header: '',
      cell: ({ row }) => (
        <button
          onClick={() => toggleRow(row.id)}
          className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold transition-all
            ${expandedRows.has(row.id)
              ? 'bg-emerald-100 text-emerald-700 rotate-45'
              : 'bg-gray-100 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600'
            }`}
          title={expandedRows.has(row.id) ? 'Colapsar detalle' : 'Ver detalle clínico'}
        >
          +
        </button>
      ),
      size: 36,
      enableSorting: false,
    },
    {
      accessorKey: 'nroOt',
      header: 'N° OT',
      cell: ({ getValue }) => <span className="font-mono text-xs text-gray-600">{getValue() as string || '—'}</span>,
      size: 110,
    },
    {
      accessorKey: 'cliente',
      header: 'Cliente',
      cell: ({ getValue }) => <span className="text-sm font-medium text-gray-800 truncate block max-w-[200px]">{getValue() as string}</span>,
      size: 220,
    },
    {
      accessorKey: 'nroFactura',
      header: 'N° Factura',
      cell: ({ getValue }) => <span className="font-mono text-xs text-gray-500">{getValue() as string}</span>,
      size: 150,
    },
    {
      accessorKey: 'fechaFactura',
      header: 'Fecha Factura',
      cell: ({ getValue }) => <span className="text-xs text-gray-500">{toDateString(getValue() as Date)}</span>,
      size: 110,
    },
    {
      accessorKey: 'totalBrutoFactura',
      header: 'Bruto',
      cell: ({ getValue }) => <span className="text-right block font-mono text-xs text-gray-700">{fmt(getValue() as number)}</span>,
    },
    {
      accessorKey: 'precio',
      header: 'Costo',
      cell: ({ getValue }) => <span className="text-right block font-mono text-xs text-gray-500">{fmt(getValue() as number)}</span>,
    },
    {
      accessorKey: 'gastosLogisticos',
      header: 'Gs. Log.',
      cell: ({ getValue }) => {
        const v = getValue() as number
        return <span className={`text-right block font-mono text-xs ${v > 0 ? 'text-amber-600' : 'text-gray-300'}`}>{v > 0 ? fmt(v) : '—'}</span>
      },
      size: 90,
    },
    {
      accessorKey: 'contribMarginal',
      header: 'C. Marginal',
      cell: ({ getValue }) => <span className="text-right block font-mono text-xs font-semibold text-emerald-700">{fmt(getValue() as number)}</span>,
    },
    {
      accessorKey: 'pctMargen',
      header: '%',
      cell: ({ getValue }) => {
        const pct = getValue() as number
        return <span className={`text-right block text-xs font-bold ${margenColor(pct)}`}>{fmtPct(pct)}</span>
      },
      size: 60,
    },
    {
      accessorKey: 'estadoValorizacion',
      header: 'Estado',
      cell: ({ getValue }) => {
        const v = getValue() as string
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
            ${v === 'Valorizado' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
            {v}
          </span>
        )
      },
      size: 100,
    },
  ], [])

  const table = useReactTable({
    data: filteredRows,
    columns,
    state: { sorting, globalFilter, pagination },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <div>
      <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {selectedCliente && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-medium text-emerald-700 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {selectedCliente.length > 40 ? selectedCliente.substring(0, 40) + '…' : selectedCliente}
            <button onClick={onClearCliente} className="ml-1 text-emerald-500 hover:text-emerald-800 font-bold leading-none" title="Quitar filtro">✕</button>
          </div>
        )}
        <div className="relative max-w-sm w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Buscar OT, cliente, factura..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="bg-gray-50 border-b border-gray-200">
                {hg.headers.map((header) => (
                  <th key={header.id} onClick={header.column.getToggleSortingHandler()}
                    className={`px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap
                      ${header.column.getCanSort() ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                    style={{ width: header.getSize() }}>
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <span className="text-gray-400">
                          {header.column.getIsSorted() === 'asc' ? <ChevronUp size={12} />
                            : header.column.getIsSorted() === 'desc' ? <ChevronDown size={12} />
                            : <ChevronsUpDown size={12} />}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, i) => (
              <React.Fragment key={row.id}>
                <tr
                  className={`border-b border-gray-100 transition-colors
                    ${expandedRows.has(row.id)
                      ? 'bg-emerald-50/30 border-emerald-100'
                      : i % 2 === 0 ? 'bg-white hover:bg-emerald-50/40' : 'bg-gray-50/30 hover:bg-emerald-50/40'
                    }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-2.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
                {expandedRows.has(row.id) && (
                  <ExpandRow row={row.original} colSpan={TOTAL_COLS} />
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
        <span>
          {table.getFilteredRowModel().rows.length} operaciones
          {selectedCliente && ` de ${rows.length} totales`}
          {!selectedCliente && globalFilter && ` (filtrado de ${rows.length})`}
        </span>
        <div className="flex items-center gap-2">
          <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}
            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-medium">Pág. {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}</span>
          <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}
            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ContribucionMarginalDashboard