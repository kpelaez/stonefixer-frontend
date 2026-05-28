/**
 * ============================================================
 * OTDetalleModal — Detalle profundo de una Orden de Trabajo
 * ============================================================
 *
 * PROPÓSITO:
 *   Modal fullscreen que muestra el desglose completo de una OT:
 *   - Header con datos de la operación
 *   - KPIs financieros (venta, costo, CM, margen)
 *   - Waterfall visual de composición
 *   - Producto(s) vendido(s) con precio de venta
 *   - Tabla de productos consumidos con costo unitario
 *
 * DATOS:
 *   - RawRow (hoja 1): venta, CM, gastos logísticos, costo PPP
 *   - ConsumoDetalle[] (hoja 2): productos consumidos, costo unitario,
 *     % participación, producto vendido
 *
 * JOIN: Vista_Resumen.nroConsumo === Vista_Detallada.nroConsumo (col 12)
 *
 * COLUMNAS Vista_Detallada (índices 0-16):
 *   0  Fecha factura              1  Nro factura
 *   2  Nro ot                     3  Otoperacionitemid
 *   4  Fecha remito               5  Nro remito
 *   6  Prod. base comercial       7  Cantidad base comercial
 *   8  Importe - neto iva         9  Operacionitemid doc. material
 *  10  Producto material util.   11  Cantidad material utilizado
 *  12  Nro consumo               13  Producto consumo
 *  14  Costo unitario            15  % part. s/total consumo
 *  16  % participacion s/venta neta iva
 *
 * TRIGGER: click en Nro OT en DetalleTab → setOtModal(row)
 * ============================================================
 */

import React, { useEffect, useRef } from 'react'
import {
  X,
  FileText,
  Calendar,
  Hash,
  Truck,
  TrendingUp,
  Package,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  Building2,
  ChevronRight,
} from 'lucide-react'

// ============================================================
// TIPOS EXPORTADOS (importar en ContribucionMarginalDashboard)
// ============================================================

export interface ConsumoDetalleRow {
  // ── Identificadores ──────────────────────────
  nroConsumo: number
  nroOt: string
  nroFactura: string
  otOperacionItemId: number | null    // col[3]  — ID ítem de venta en la OT

  // ── Remito ───────────────────────────────────
  fechaRemito: Date | null
  nroRemito: string

  // ── Producto vendido (base comercial) ────────
  productoVendido: string             // col[6]  — Prod. base comercial
  cantidadBaseComercial: number       // col[7]
  importeNetoIva: number              // col[8]

  // ── Material utilizado ───────────────────────
  operacionItemIdMaterial: number | null  // col[9]
  productoMaterialUtilizado: string       // col[10] — mismo que productoVendido en este caso
  cantidadMaterialUtilizado: number       // col[11]

  // ── Producto consumido (componente) ─────────
  productoConsumo: string             // col[13]
  costoUnitario: number               // col[14]
  pctPartConsumo: number              // col[15]
  pctPartVentaNeta: number            // col[16]
}

/** Map construido en parseExcel hoja 2: key = nroConsumo */
export type ConsumoDetalleMap = Map<number, ConsumoDetalleRow[]>

// RawRow viene del dashboard — re-exportamos el mínimo necesario
export interface OTModalRow {
  nroOt: string
  cliente: string
  nroFactura: string
  fechaFactura: Date | null
  fechaOt: Date | null
  nroRemito: string
  fechaRemito: Date | null
  nroConsumo: number | null
  totalBrutoFactura: number
  totalFacturaNeto: number
  precio: number            // costo PPP (hoja 1)
  gastosLogisticos: number
  contribMarginal: number
  pctMargen: number
  estadoValorizacion: string
  descripcion: string
  paciente: string
  institucion: string
  tecnico: string
  medico: string
  sucursal: string
}

// ============================================================
// HELPERS
// ============================================================

const fmt = (n: number) =>
  n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 2 })

const fmtShort = (n: number): string => {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
  return fmt(n)
}

const fmtPct = (n: number) => `${n.toFixed(1)}%`

const toDateStr = (d: Date | null): string => {
  if (!d) return '—'
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function margenColor(pct: number): string {
  if (pct >= 75) return 'text-emerald-600'
  if (pct >= 50) return 'text-yellow-500'
  return 'text-red-500'
}

function margenBg(pct: number): string {
  if (pct >= 75) return 'bg-emerald-50 border-emerald-200'
  if (pct >= 50) return 'bg-yellow-50 border-yellow-200'
  return 'bg-red-50 border-red-200'
}

// ============================================================
// SUB-COMPONENTES INTERNOS
// ============================================================

// ── KPI Card ─────────────────────────────────────────────────
interface KpiMiniProps {
  label: string
  value: string
  sub?: string
  accent: string
  textColor: string
  icon: React.ReactNode
}

const KpiMini: React.FC<KpiMiniProps> = ({ label, value, sub, accent, textColor, icon }) => (
  <div className={`rounded-xl border p-4 flex items-start gap-3 ${accent}`}>
    <div className="mt-0.5 shrink-0">{icon}</div>
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-0.5">{label}</p>
      <p className={`text-lg font-bold font-mono leading-tight ${textColor}`}>{value}</p>
      {sub && <p className="text-[10px] text-gray-400 font-mono mt-0.5">{sub}</p>}
    </div>
  </div>
)

// ── Waterfall Bar ─────────────────────────────────────────────
interface WaterfallBarProps {
  ventaBruta: number
  costo: number
  gastosLog: number
  cm: number
  pctMargen: number
}

const WaterfallBar: React.FC<WaterfallBarProps> = ({ ventaBruta, costo, gastosLog, cm, pctMargen }) => {
  const total = ventaBruta || 1
  const pctCosto = (costo / total) * 100
  const pctGastos = (gastosLog / total) * 100
  const pctCm = (cm / total) * 100

  const bars = [
    { label: 'Costo PPP', value: costo, pct: pctCosto, color: 'bg-indigo-400', textColor: 'text-indigo-700' },
    { label: 'Gs. Logísticos', value: gastosLog, pct: pctGastos, color: 'bg-amber-400', textColor: 'text-amber-700', hide: gastosLog === 0 },
    { label: 'Contrib. Marginal', value: cm, pct: pctCm, color: 'bg-emerald-500', textColor: 'text-emerald-700' },
  ].filter(b => !b.hide)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Composición sobre venta bruta</p>
        <p className="text-xs font-mono font-bold text-gray-600">{fmtShort(ventaBruta)}</p>
      </div>

      {/* Stacked bar total */}
      <div className="w-full h-6 rounded-lg overflow-hidden flex bg-gray-100">
        <div className="bg-indigo-400 h-full transition-all" style={{ width: `${Math.max(pctCosto, 0.5)}%` }} />
        {gastosLog > 0 && (
          <div className="bg-amber-400 h-full transition-all" style={{ width: `${Math.max(pctGastos, 0.5)}%` }} />
        )}
        <div className="bg-emerald-500 h-full transition-all flex-1" />
      </div>

      {/* Leyenda */}
      <div className="space-y-2">
        {/* Venta bruta como referencia */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-gray-200 inline-block" />
            <span className="text-gray-500">Venta Bruta</span>
          </div>
          <span className="font-mono font-semibold text-gray-700">{fmtShort(ventaBruta)}</span>
        </div>

        {bars.map(b => (
          <div key={b.label} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-sm inline-block ${b.color}`} />
              <span className="text-gray-500">{b.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-medium ${b.textColor}`}>{fmtPct(b.pct)}</span>
              <span className="font-mono font-semibold text-gray-700">{fmtShort(b.value)}</span>
            </div>
          </div>
        ))}

        {/* Separador y margen destacado */}
        <div className={`flex items-center justify-between text-sm mt-1 pt-2 border-t font-semibold rounded-lg px-2 py-1.5 border ${margenBg(pctMargen)}`}>
          <span className={margenColor(pctMargen)}>% Margen</span>
          <span className={`font-mono font-bold text-base ${margenColor(pctMargen)}`}>{fmtPct(pctMargen)}</span>
        </div>
      </div>
    </div>
  )
}

// ── Estado badge ──────────────────────────────────────────────
const EstadoBadge: React.FC<{ estado: string }> = ({ estado }) => {
  if (estado === 'Valorizado')
    return <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full"><CheckCircle2 size={11} /> Valorizado</span>
  if (estado === 'Sin Valorizar')
    return <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full"><Clock size={11} /> Sin Valorizar</span>
  return <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full"><AlertCircle size={11} /> {estado || '—'}</span>
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

interface OTDetalleModalProps {
  row: OTModalRow
  consumoDetalle: ConsumoDetalleMap
  onClose: () => void
}

const OTDetalleModal: React.FC<OTDetalleModalProps> = ({ row, consumoDetalle, onClose }) => {
  const overlayRef = useRef<HTMLDivElement>(null)

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Prevenir scroll del body
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Click en overlay cierra el modal
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose()
  }

  // Obtener todas las filas crudas del consumo (incluye duplicados por OtOperacionItemId)
  const productosRaw: ConsumoDetalleRow[] = row.nroConsumo
    ? (consumoDetalle.get(row.nroConsumo) ?? [])
    : []

  /**
   * DEDUPLICACIÓN DE PRODUCTOS CONSUMIDOS
   *
   * Problema: cuando una OT tiene N OtOperacionItemId distintos (N productos vendidos),
   * el Excel repite las filas de consumo una vez por cada OtOperacionItemId.
   * Ejemplo: 2 productos vendidos × 7 materiales = 14 filas, pero el costo real es 7.
   *
   * Solución: deduplicar por operacionItemIdMaterial (ID único del material).
   * Si ese campo es null (dato sucio), usar productoConsumo + costoUnitario como fallback.
   * Nos quedamos con la primera ocurrencia de cada material.
   */
  /**
   * DEDUPLICACIÓN POR PRIMER OtOperacionItemId
   *
   * Problema estructural del Excel: cuando una OT tiene N productos vendidos
   * (N OtOperacionItemId distintos), el bloque de consumo se repite N veces —
   * una vez por cada OtOperacionItemId — aunque el consumo sea compartido.
   *
   * Solución provisional: tomar SOLO las filas del primer OtOperacionItemId
   * que aparezca. Ese bloque representa el consumo completo del procedimiento.
   * Si el mismo material se usó dos veces, aparecerá dos veces dentro de ese
   * primer bloque — lo cual es correcto.
   *
   * TODO (futuro con BD): reemplazar esto por un flag `primer_ocurrencia`
   * generado en la query SQL con:
   *   ROW_NUMBER() OVER (PARTITION BY nro_consumo, otoperacionitemid ORDER BY ...) = 1
   * que elimine la ambigüedad desde el origen.
   */
  const primerOtOperacionItemId: number | null = productosRaw.length > 0
    ? (productosRaw[0].otOperacionItemId ?? null)
    : null

  const productos: ConsumoDetalleRow[] = productosRaw.length > 0
    ? (primerOtOperacionItemId !== null
        ? productosRaw.filter(p => p.otOperacionItemId === primerOtOperacionItemId)
        : productosRaw  // fallback: otOperacionItemId es null en todos → mostrar todo
      )
    : []

  // Productos vendidos: se toman de las filas CRUDAS (sin deduplicar)
  // porque cada OtOperacionItemId representa un producto vendido distinto.
  const productosVendidos = productosRaw.length > 0
    ? [...new Map(productosRaw.map(p => [p.otOperacionItemId ?? p.productoVendido, p])).values()]
    : []

  // Total costo: suma sobre productos YA deduplicados — sin duplicación
  const totalCostoConsumo = productos.reduce((s, p) => s + p.costoUnitario, 0)

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* ── HEADER ────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-6 py-4 flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xl font-bold text-emerald-400">{row.nroOt}</span>
              <EstadoBadge estado={row.estadoValorizacion} />
              {row.sucursal && (
                <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/70 border border-white/10">{row.sucursal}</span>
              )}
            </div>
            <p className="text-sm text-white/80 font-medium mt-1 truncate">{row.cliente}</p>
            {row.descripcion && (
              <p className="text-xs text-white/50 mt-0.5 truncate">{row.descripcion}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── METADATA ROW ──────────────────────────────────── */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center gap-6 flex-wrap text-xs text-gray-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <FileText size={12} className="text-gray-400" />
            <span className="font-mono">{row.nroFactura || '—'}</span>
          </div>
          <ChevronRight size={10} className="text-gray-300" />
          <div className="flex items-center gap-1.5">
            <Hash size={12} className="text-gray-400" />
            <span>Remito</span>
            <span className="font-mono font-medium text-gray-700">{row.nroRemito || '—'}</span>
          </div>
          <ChevronRight size={10} className="text-gray-300" />
          <div className="flex items-center gap-1.5">
            <Hash size={12} className="text-gray-400" />
            <span>Consumo</span>
            <span className="font-mono font-medium text-gray-700">#{row.nroConsumo ?? '—'}</span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <Calendar size={12} className="text-gray-400" />
            <span>Factura:</span>
            <span className="font-medium text-gray-700">{toDateStr(row.fechaFactura)}</span>
          </div>
          {row.paciente && (
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400">Paciente:</span>
              <span className="font-medium text-gray-700">{row.paciente}</span>
            </div>
          )}
          {row.institucion && (
            <div className="flex items-center gap-1.5">
              <Building2 size={12} className="text-gray-400" />
              <span className="font-medium text-gray-700">{row.institucion}</span>
            </div>
          )}
        </div>

        {/* ── BODY SCROLLABLE ───────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ── SECCIÓN 1: KPIs + Waterfall ─────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* KPIs */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">Resumen Financiero</h3>
              <div className="grid grid-cols-2 gap-3">
                <KpiMini
                  label="Venta Neta"
                  value={fmtShort(row.totalBrutoFactura)}
                  sub={fmt(row.totalBrutoFactura)}
                  accent="bg-blue-50 border border-blue-100"
                  textColor="text-blue-700"
                  icon={<DollarSign size={16} className="text-blue-500" />}
                />
                <KpiMini
                  label="Costo Productos"
                  value={fmtShort(totalCostoConsumo || row.precio)}
                  sub={fmt(totalCostoConsumo || row.precio)}
                  accent="bg-indigo-50 border border-indigo-100"
                  textColor="text-indigo-700"
                  icon={<Package size={16} className="text-indigo-500" />}
                />
                <KpiMini
                  label="Gs. Logísticos"
                  value={row.gastosLogisticos > 0 ? fmtShort(row.gastosLogisticos) : '—'}
                  sub={row.gastosLogisticos > 0 ? fmt(row.gastosLogisticos) : 'Sin gastos'}
                  accent="bg-amber-50 border border-amber-100"
                  textColor={row.gastosLogisticos > 0 ? 'text-amber-700' : 'text-gray-400'}
                  icon={<Truck size={16} className="text-amber-500" />}
                />
              </div>
              {/* CM destacada */}
              <div className={`rounded-xl border p-4 flex items-center justify-between ${margenBg(row.pctMargen)}`}>
                <div className="flex items-center gap-3">
                  <TrendingUp size={18} className={margenColor(row.pctMargen)} />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Contribución Marginal</p>
                    <p className={`text-xl font-bold font-mono ${margenColor(row.pctMargen)}`}>{fmtShort(row.contribMarginal)}</p>
                    <p className="text-[10px] font-mono text-gray-400">{fmt(row.contribMarginal)}</p>
                  </div>
                </div>
                <div className={`text-4xl font-black font-mono ${margenColor(row.pctMargen)}`}>
                  {fmtPct(row.pctMargen)}
                </div>
              </div>
            </div>

            {/* Waterfall */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
              <WaterfallBar
                ventaBruta={row.totalBrutoFactura}
                costo={totalCostoConsumo || row.precio}
                gastosLog={row.gastosLogisticos}
                cm={row.contribMarginal}
                pctMargen={row.pctMargen}
              />
            </div>
          </div>

          {/* ── SECCIÓN 2: Producto(s) vendido(s) ───────────── */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
              Producto{productosVendidos.length !== 1 ? 's' : ''} Vendido{productosVendidos.length !== 1 ? 's' : ''}
            </h3>

            {productosVendidos.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 p-4 text-center">
                <p className="text-xs text-gray-400">
                  {row.nroConsumo
                    ? `Sin detalle de hoja 2 para consumo #${row.nroConsumo}`
                    : 'OT sin número de consumo asociado'}
                </p>
                <p className="text-[10px] text-gray-300 mt-1">El archivo cargado puede no tener la hoja de detalle de productos</p>
              </div>
            ) : (
              <div className="space-y-2">
                {productosVendidos.map((p, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-blue-100 bg-blue-50 p-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="mt-0.5 w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                        <DollarSign size={14} className="text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 leading-snug">{p.productoVendido}</p>
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500 flex-wrap">
                          <span>Cant. comercial: <span className="font-mono font-medium text-gray-700">{p.cantidadBaseComercial}</span></span>
                          <span>Cant. material: <span className="font-mono font-medium text-gray-700">{p.cantidadMaterialUtilizado}</span></span>
                          <span>Remito: <span className="font-mono text-gray-700">{p.nroRemito}</span></span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Precio venta neta</p>
                      <p className="text-base font-bold font-mono text-blue-700">{fmtShort(p.importeNetoIva)}</p>
                      <p className="text-[10px] font-mono text-gray-400">{fmt(p.importeNetoIva)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── SECCIÓN 3: Gastos logísticos (si los hay) ───── */}
          {row.gastosLogisticos > 0 && (
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Truck size={16} className="text-amber-500" />
                <div>
                  <p className="text-xs font-semibold text-amber-700">Costo Logístico</p>
                  <p className="text-[10px] text-amber-500">Incluido en el cálculo de CM</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-base font-bold font-mono text-amber-700">{fmtShort(row.gastosLogisticos)}</p>
                <p className="text-[10px] font-mono text-amber-400">{fmt(row.gastosLogisticos)}</p>
              </div>
            </div>
          )}

          {/* ── SECCIÓN 4: Desglose de productos consumidos ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                Desglose de Productos Consumidos
              </h3>
              {productos.length > 0 && (
                <span className="text-xs text-gray-400 font-mono">{productos.length} ítem{productos.length !== 1 ? 's' : ''}</span>
              )}
            </div>

            {productos.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center">
                <Package size={24} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Sin detalle de productos</p>
                <p className="text-xs text-gray-300 mt-1">
                  {row.nroConsumo
                    ? `No se encontró la hoja de detalle para el consumo #${row.nroConsumo}`
                    : 'Esta OT no tiene número de consumo asociado'}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200">
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-600 uppercase tracking-wide text-[10px]">
                        Producto Consumido
                      </th>
                      <th className="text-right px-4 py-2.5 font-semibold text-gray-600 uppercase tracking-wide text-[10px] w-36">
                        Costo Unit.
                      </th>
                      <th className="text-right px-4 py-2.5 font-semibold text-gray-600 uppercase tracking-wide text-[10px] w-24">
                        % s/Consumo
                      </th>
                      <th className="text-right px-4 py-2.5 font-semibold text-gray-600 uppercase tracking-wide text-[10px] w-24">
                        % s/Vta Neta
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos.map((p, i) => (
                      <tr
                        key={i}
                        className={`border-b border-slate-100 last:border-0 transition-colors
                          ${i % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/50 hover:bg-slate-50'}`}
                      >
                        <td className="px-4 py-3">
                          <span className="text-gray-800 font-medium leading-snug">{p.productoConsumo}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-indigo-700">
                          {fmt(p.costoUnitario)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-mono text-gray-600">{fmtPct(p.pctPartConsumo)}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-mono font-medium ${p.pctPartVentaNeta < 5 ? 'text-emerald-600' : p.pctPartVentaNeta < 15 ? 'text-amber-600' : 'text-red-500'}`}>
                            {fmtPct(p.pctPartVentaNeta)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Footer con totales */}
                  <tfoot>
                    <tr className="bg-slate-100 border-t border-slate-300">
                      <td className="px-4 py-2.5 font-semibold text-gray-700 text-xs">
                        Total ({productos.length} productos)
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-indigo-700">
                        {fmt(totalCostoConsumo)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-gray-500">
                        {fmtPct(productos.reduce((s, p) => s + p.pctPartConsumo, 0))}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-gray-500">
                        {fmtPct(productos.reduce((s, p) => s + p.pctPartVentaNeta, 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* ── SECCIÓN 5: Info clínica/operativa (si existe) ─ */}
          {(row.medico || row.tecnico || row.paciente || row.institucion) && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Info Operativa</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Médico', value: row.medico },
                  { label: 'Técnico', value: row.tecnico },
                  { label: 'Paciente', value: row.paciente },
                  { label: 'Institución', value: row.institucion },
                ].filter(f => f.value).map(f => (
                  <div key={f.label} className="bg-slate-50 rounded-lg border border-slate-200 p-3">
                    <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-0.5">{f.label}</p>
                    <p className="text-xs font-medium text-gray-700 leading-snug">{f.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* ── FOOTER ────────────────────────────────────────── */}
        <div className="shrink-0 border-t border-slate-200 px-6 py-3 flex items-center justify-between bg-slate-50">
          <p className="text-[10px] text-gray-400">
            {row.nroConsumo && productos.length > 0
              ? `${productos.length} producto${productos.length !== 1 ? 's' : ''} en consumo #${row.nroConsumo}`
              : 'Sin detalle de consumo'}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium rounded-lg bg-slate-200 hover:bg-slate-300 text-gray-700 transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  )
}

export default OTDetalleModal