/**
 * ============================================================
 * RemitosReportPage — Planificación CX
 * ============================================================
 *
 * ARQUITECTURA:
 *   Excel (.xlsx) → SheetJS → estado local → gráfico Recharts
 *
 * MIGRACIÓN FUTURA: reemplazar parseExcel() por fetchFromAPI()
 *
 * COLUMNAS DEL EXCEL (índices 0-16):
 *   0  Fecha                  1  Mes - fechacomprobante
 *   2  Comprobante            3  Forma de entrega material
 *   4  Tecnico1               5  Cliente
 *   6  Vendedor               7  Producto
 *   8  Cantidad               9  Fechaintervencion
 *  10  Medico                11  Institucion
 *  12  Paciente              13  Oc-asociada
 *  14  Tipo de venta         15  Planificacion cx
 *  16  Estado remito
 *
 * NOTAS:
 *   - La métrica es REMITOS ÚNICOS por número de Comprobante (col 2)
 *   - La clasificación viene de "Planificacion cx" (col 15)
 *   - Valores posibles: "Contemplado" | "No Contemplado" | "No aplica"
 *   - Fecha de agrupación: col 0 (datetime)
 */

import { useState, useMemo, useCallback, useRef } from 'react'
import * as XLSX from 'xlsx'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Upload, FileText, RefreshCw, AlertCircle, X } from 'lucide-react'

// ============================================================
// TIPOS
// ============================================================

type PlanificacionCX = 'Contemplado' | 'No Contemplado' | 'No aplica' | string
type GroupBy = 'day' | 'week'

interface RawRow {
  fecha: Date | null
  comprobante: string
  planificacion: PlanificacionCX
}

interface DataPoint {
  fechaLabel: string
  fechaSort: string   // ISO, para ordenar
  contemplado: number
  noContemplado: number
  noAplica: number
}

interface Metrics {
  totalContemplado: number
  totalNoContemplado: number
  totalNoAplica: number
  total: number
  pctContemplado: number
  pctNoContemplado: number
  pctNoAplica: number
  archivo: string
  periodo: string
}

// ============================================================
// HELPERS DE FECHA
// ============================================================

function parseExcelDate(val: unknown): Date | null {
  if (!val) return null
  if (val instanceof Date) return val
  // SheetJS puede devolver número de serie Excel
  if (typeof val === 'number') return new Date((val - 25569) * 86400 * 1000)
  if (typeof val === 'string') {
    const d = new Date(val)
    return isNaN(d.getTime()) ? null : d
  }
  return null
}

function toISODate(d: Date): string {
  return d.toISOString().split('T')[0]
}

function toWeekStart(d: Date): Date {
  const day = d.getDay()               // 0=dom, 1=lun...
  const diff = (day === 0 ? -6 : 1) - day  // lunes como inicio de semana
  const monday = new Date(d)
  monday.setDate(d.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

function formatLabel(isoDate: string, groupBy: GroupBy): string {
  const [ , month, day] = isoDate.split('-')
  if (groupBy === 'week') return `Sem ${day}/${month}`
  return `${day}/${month}`
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

        // Saltar cabecera (fila 0), filtrar filas sin comprobante
        const rows: RawRow[] = rawData
          .slice(1)
          .filter((r: unknown[]) => r[2])   // comprobante obligatorio
          .map((r: unknown[]) => ({
            fecha:        parseExcelDate(r[0]),
            comprobante:  String(r[2] ?? '').trim(),
            planificacion: String(r[15] ?? '').trim(),
          }))

        resolve(rows)
      } catch (err) {
        reject(new Error('No se pudo leer el archivo. Verificá que sea el Excel de remitos correcto.'))
      }
    }
    reader.onerror = () => reject(new Error('Error al leer el archivo.'))
    reader.readAsArrayBuffer(file)
  })
}

// ============================================================
// PROCESAMIENTO DE DATOS
// ============================================================

function procesarDatos(rows: RawRow[], groupBy: GroupBy): DataPoint[] {
  // Agrupar por fecha (día o semana) y deduplicar por comprobante dentro del grupo
  // Map<fechaISO, Map<comprobante, planificacion>>
  const groups = new Map<string, Map<string, PlanificacionCX>>()

  for (const row of rows) {
    if (!row.fecha) continue

    const base = groupBy === 'week' ? toWeekStart(row.fecha) : row.fecha
    const key = toISODate(base)

    if (!groups.has(key)) groups.set(key, new Map())
    const comprobantes = groups.get(key)!

    // Si el comprobante ya existe, mantener la planificación que tenía
    if (!comprobantes.has(row.comprobante)) {
      comprobantes.set(row.comprobante, row.planificacion)
    }
  }

  // Convertir a array de DataPoints ordenados por fecha
  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([isoDate, comprobantes]) => {
      let contemplado = 0
      let noContemplado = 0
      let noAplica = 0

      for (const planif of comprobantes.values()) {
        if (planif === 'Contemplado')    contemplado++
        else if (planif === 'No Contemplado') noContemplado++
        else                             noAplica++
      }

      return {
        fechaSort: isoDate,
        fechaLabel: formatLabel(isoDate, groupBy),
        contemplado,
        noContemplado,
        noAplica,
      }
    })
}

function calcularMetrics(data: DataPoint[], archivo: string, rows: RawRow[]): Metrics {
  const totalContemplado   = data.reduce((s: number, d: DataPoint) => s + d.contemplado, 0)
  const totalNoContemplado = data.reduce((s: number, d: DataPoint) => s + d.noContemplado, 0)
  const totalNoAplica      = data.reduce((s: number, d: DataPoint) => s + d.noAplica, 0)
  const total              = totalContemplado + totalNoContemplado + totalNoAplica

  // Calcular rango de fechas del dataset
  const fechas = rows.map(r => r.fecha).filter(Boolean) as Date[]
  const minFecha = fechas.length ? new Date(Math.min(...fechas.map(d => d.getTime()))) : null
  const maxFecha = fechas.length ? new Date(Math.max(...fechas.map(d => d.getTime()))) : null
  const fmt = (d: Date) => d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const periodo = minFecha && maxFecha ? `${fmt(minFecha)} – ${fmt(maxFecha)}` : ''

  return {
    totalContemplado,
    totalNoContemplado,
    totalNoAplica,
    total,
    pctContemplado:   total > 0 ? Math.round((totalContemplado   / total) * 100) : 0,
    pctNoContemplado: total > 0 ? Math.round((totalNoContemplado  / total) * 100) : 0,
    pctNoAplica:      total > 0 ? Math.round((totalNoAplica       / total) * 100) : 0,
    archivo,
    periodo,
  }
}

// ============================================================
// CONFIGURACIÓN DE SERIES
// ============================================================

interface SeriesConfig {
  key: keyof Pick<DataPoint, 'contemplado' | 'noContemplado' | 'noAplica'>
  label: string
  color: string
  strokeDasharray?: string
  pctKey: keyof Pick<Metrics, 'pctContemplado' | 'pctNoContemplado' | 'pctNoAplica'>
  totalKey: keyof Pick<Metrics, 'totalContemplado' | 'totalNoContemplado' | 'totalNoAplica'>
}

const SERIES: SeriesConfig[] = [
  {
    key: 'contemplado',
    label: 'Contemplado',
    color: '#378ADD',
    pctKey: 'pctContemplado',
    totalKey: 'totalContemplado',
  },
  {
    key: 'noContemplado',
    label: 'No contemplado',
    color: '#D85A30',
    strokeDasharray: '6 3',
    pctKey: 'pctNoContemplado',
    totalKey: 'totalNoContemplado',
  },
  {
    key: 'noAplica',
    label: 'No aplica',
    color: '#888780',
    strokeDasharray: '2 4',
    pctKey: 'pctNoAplica',
    totalKey: 'totalNoAplica',
  },
]

// ============================================================
// SUB-COMPONENTES
// ============================================================

// ── Upload Zone ──────────────────────────────────────────────

interface UploadZoneProps {
  onFile: (f: File) => void
  loading: boolean
}

function UploadZone({ onFile, loading }: UploadZoneProps) {
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
          ${dragging
            ? 'border-blue-500 bg-blue-50 scale-[1.01]'
            : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/40'
          }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />
        {loading ? (
          <>
            <div className="w-14 h-14 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
            <p className="text-gray-600 font-medium">Procesando archivo...</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
              <Upload size={30} className="text-blue-500" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-800">
                Cargar Excel de Remitos
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Arrastrá el archivo acá o hacé click para seleccionarlo
              </p>
              <p className="text-xs text-gray-400 mt-2">.xlsx o .xls</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-500 w-full">
              <p className="font-medium text-gray-600 mb-1">Columnas requeridas:</p>
              <p>Fecha · Comprobante · Planificacion cx</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Metric Card ───────────────────────────────────────────────

interface MetricCardProps {
  label: string
  value: number
  pct: number
  color: string
}

function MetricCard({ label, value, pct, color }: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-1 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
        <span className="text-xs text-gray-500 font-medium truncate">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900 leading-none mt-1">{value}</p>
      <p className="text-xs text-gray-400">{pct}% del total</p>
    </div>
  )
}

// ── Toggle día / semana ───────────────────────────────────────

interface GroupByToggleProps {
  value: GroupBy
  onChange: (v: GroupBy) => void
}

function GroupByToggle({ value, onChange }: GroupByToggleProps) {
  const base = 'px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none'
  const active = 'bg-gray-900 text-white'
  const inactive = 'bg-white text-gray-600 hover:bg-gray-100'

  return (
    <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden" role="group">
      <button className={`${base} ${value === 'day' ? active : inactive}`} onClick={() => onChange('day')}>
        Por día
      </button>
      <button className={`${base} ${value === 'week' ? active : inactive} border-l border-gray-200`} onClick={() => onChange('week')}>
        Por semana
      </button>
    </div>
  )
}

// ── Tooltip custom ────────────────────────────────────────────

interface TooltipEntry {
  name: string
  value: number
  color: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s: number, p: TooltipEntry) => s + p.value, 0)
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 text-sm min-w-[165px]">
      <p className="font-medium text-gray-800 mb-2">{label}</p>
      {payload.map((p: TooltipEntry) => (
        <div key={p.name} className="flex items-center justify-between gap-3 mb-1">
          <span className="flex items-center gap-1.5 text-gray-600">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: p.color }} />
            {p.name}
          </span>
          <span className="font-semibold text-gray-900">{p.value}</span>
        </div>
      ))}
      {payload.length > 1 && (
        <div className="border-t border-gray-100 mt-2 pt-2 flex justify-between text-gray-500">
          <span>Total</span>
          <span className="font-semibold text-gray-900">{total}</span>
        </div>
      )}
    </div>
  )
}

// ── Leyenda custom ────────────────────────────────────────────

function ChartLegend() {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1 justify-center mt-3">
      {SERIES.map((s: SeriesConfig) => (
        <div key={s.key} className="flex items-center gap-1.5 text-xs text-gray-500">
          <svg width="20" height="10" aria-hidden="true">
            <line x1="0" y1="5" x2="20" y2="5" stroke={s.color} strokeWidth="2" strokeDasharray={s.strokeDasharray ?? ''} />
          </svg>
          {s.label}
        </div>
      ))}
    </div>
  )
}

// ============================================================
// PÁGINA PRINCIPAL
// ============================================================

export default function RemitosReportPage() {
  const [rows, setRows]       = useState<RawRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [groupBy, setGroupBy] = useState<GroupBy>('day')

  // ── Procesamiento derivado (memo para no recalcular en cada render) ──
  const chartData = useMemo(
    () => procesarDatos(rows, groupBy),
    [rows, groupBy]
  )

  const metrics = useMemo(
    () => rows.length ? calcularMetrics(chartData, fileName, rows) : null,
    [chartData, fileName, rows]
  )

  // ── Handler de archivo ───────────────────────────────────────
  const handleFile = useCallback(async (file: File) => {
    setLoading(true)
    setError(null)
    setFileName(file.name)
    try {
      const parsed = await parseExcel(file)
      if (parsed.length === 0) throw new Error('El archivo no contiene datos válidos.')
      setRows(parsed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el archivo.')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleReset = () => {
    setRows([])
    setFileName('')
    setError(null)
  }

  // ── Sin datos: mostrar upload ────────────────────────────────
  if (rows.length === 0) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Remitos por Planificación CX</h1>
          <p className="text-gray-500 text-sm mt-1">
            Cargá el Excel de remitos exportado del ERP para visualizar el reporte
          </p>
        </div>
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
            <AlertCircle size={16} className="flex-shrink-0" />
            {error}
          </div>
        )}
        <UploadZone onFile={handleFile} loading={loading} />
      </div>
    )
  }

  // ── Dashboard ────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6 min-h-screen bg-slate-100">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Remitos por Planificación CX</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            <span className="font-medium">{fileName}</span>
            {metrics?.periodo && ` · ${metrics.periodo}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <GroupByToggle value={groupBy} onChange={setGroupBy} />
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors bg-white"
            title="Cargar otro archivo"
          >
            <RefreshCw size={14} />
            Cambiar archivo
          </button>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {SERIES.map((s: SeriesConfig) => (
          <MetricCard
            key={s.key}
            label={s.label}
            value={metrics ? metrics[s.totalKey] : 0}
            pct={metrics ? metrics[s.pctKey] : 0}
            color={s.color}
          />
        ))}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-1 shadow-sm">
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-gray-400" />
            <span className="text-xs text-gray-500 font-medium">Total remitos</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 leading-none mt-1">{metrics?.total ?? 0}</p>
          <p className="text-xs text-gray-400">{chartData.length} puntos temporales</p>
        </div>
      </div>

      {/* Gráfico */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-gray-700">Evolución de remitos únicos</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Comprobantes distintos por {groupBy === 'day' ? 'día hábil' : 'semana'}
            </p>
          </div>
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Cargar nuevo archivo"
          >
            <X size={16} />
          </button>
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData} margin={{ top: 4, right: 12, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="fechaLabel"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              interval={groupBy === 'day' ? 'preserveStartEnd' : 0}
              angle={groupBy === 'day' ? -35 : 0}
              textAnchor={groupBy === 'day' ? 'end' : 'middle'}
              height={groupBy === 'day' ? 52 : 30}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              label={{
                value: 'Remitos únicos',
                angle: -90,
                position: 'insideLeft',
                offset: 12,
                style: { fontSize: 11, fill: '#9ca3af' },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            {SERIES.map((s: SeriesConfig) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2}
                strokeDasharray={s.strokeDasharray ?? ''}
                dot={{ r: 2.5, fill: s.color, strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
        <ChartLegend />
      </div>

      {/* Nota al pie */}
      <p className="text-xs text-gray-400 text-right pb-2">
        Fuente: {fileName} · Próximamente conectado a API en tiempo real.
      </p>
    </div>
  )
}