/**
 * ============================================================
 * ExcelDataContext — Estado compartido del Excel entre dashboards
 * ============================================================
 *
 * PROBLEMA QUE RESUELVE:
 *   El usuario sube UN excel (Excel_Vistas_v3.xlsx) que contiene
 *   las 4 hojas: Vista_Resumen, Vista_Detallada, Facturacion, Cobranza.
 *
 *   Sin este Context, cada dashboard (PanelEjecutivo, ContribucionMarginal)
 *   tendría su propio estado y habría que subir el archivo dos veces,
 *   y además se perdería el estado al navegar entre ellos.
 *
 * SOLUCIÓN:
 *   Un único Provider en el nivel más alto de la app parsea el Excel
 *   UNA SOLA VEZ y expone los datos ya parseados (rows de Vista_Resumen,
 *   consumoDetalle de Vista_Detallada, facturación, cobranza) a través
 *   de Context. Ambos dashboards consumen de acá.
 *
 *   También maneja la navegación entre vistas ('ejecutivo' | 'cm')
 *   para que el click en el KPI de Contribución Marginal funcione.
 *
 * MIGRACIÓN FUTURA (con BD):
 *   Cuando haya API, este Provider deja de parsear un File y en su lugar
 *   hace fetch a los endpoints. La forma de los datos expuestos
 *   (RawRow[], ConsumoDetalleMap, FacturacionRow[], CobranzaRow[])
 *   se mantiene igual — los dashboards no se enteran del cambio.
 * ============================================================
 */

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import * as XLSX from 'xlsx'

// ============================================================
// TIPOS COMPARTIDOS
// ============================================================

export interface RawRow {
  fechaFactura: Date | null
  nroFactura: string
  cliente: string
  fechaOt: Date | null
  nroOt: string
  totalBrutoFactura: number
  conceptoImpositivo: number
  totalFacturaNeto: number
  gastosLogisticos: number
  pctGastosLog: number
  fechaRemito: Date | null
  nroRemito: string
  paciente: string
  institucion: string
  tecnico: string
  medico: string
  medicoProctor: string
  sucursal: string
  fechaConsumo: Date | null
  nroConsumo: number | null
  precio: number
  estadoValorizacion: string
  descripcion: string
  fechaNc: Date | null
  nroNc: string
  totalBrutoNc: number
  contribMarginal: number
  pctMargen: number
  mesAnio: string
}

export interface ConsumoDetalleRow {
  nroConsumo: number
  nroOt: string
  nroFactura: string
  otOperacionItemId: number | null
  fechaRemito: Date | null
  nroRemito: string
  productoVendido: string
  cantidadBaseComercial: number
  importeNetoIva: number
  operacionItemIdMaterial: number | null
  productoMaterialUtilizado: string
  cantidadMaterialUtilizado: number
  productoConsumo: string
  costoUnitario: number
  pctPartConsumo: number
  pctPartVentaNeta: number
}
export type ConsumoDetalleMap = Map<number, ConsumoDetalleRow[]>

export interface FacturacionRow {
  fecha: Date | null
  cliente: string
  factura: string
  importe: number   // Total Neto — sin impuestos
  total: number     // Total Bruto — con impuestos
  mesAnio: string
}

export interface CobranzaRow {
  fecha: Date | null
  cliente: string
  importe: number   // Total Neto — sin impuestos
  otros: number     // diferencia (retenciones/percepciones)
  total: number     // Total Bruto — con impuestos
  mesAnio: string
}

interface ExcelDataState {
  rows: RawRow[]
  consumoDetalle: ConsumoDetalleMap
  facturacion: FacturacionRow[]
  cobranza: CobranzaRow[]
  fileName: string
  loading: boolean
  error: string | null
}

interface ExcelDataContextValue extends ExcelDataState {
  loadFile: (file: File) => Promise<void>
  reset: () => void
  hasData: boolean
}

const ExcelDataContext = createContext<ExcelDataContextValue | null>(null)

// ============================================================
// HELPERS DE PARSEO
// ============================================================

const toMesAnio = (date: Date | null): string => {
  if (!date) return ''
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${m}/${date.getFullYear()}`
}

/** Convierte "YYYY/MM" (Facturacion/Cobranza) -> "MM/YYYY" (Vista_Resumen) */
const yearMonthToMesAnio = (val: unknown): string => {
  const str = String(val ?? '').trim()
  const match = str.match(/^(\d{4})\/(\d{1,2})$/)
  if (!match) return ''
  const [, year, month] = match
  return `${month.padStart(2, '0')}/${year}`
}

const parseDate = (val: unknown): Date | null => {
  if (!val) return null
  if (val instanceof Date) return val
  if (typeof val === 'number') return new Date((val - 25569) * 86400 * 1000)
  return null
}

// ── Vista_Resumen → RawRow[] ────────────────────────────────
function parseVistaResumen(wb: XLSX.WorkBook): RawRow[] {
  const sheetName = wb.SheetNames.find(n => /vista.?resumen/i.test(n)) ?? wb.SheetNames[0]
  const rawData: unknown[][] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, raw: true })

  return rawData
    .slice(1)
    .filter((r: unknown[]) => r[2])
    .filter((r: unknown[]) => !r[24] || String(r[24]).trim() === '')
    .map((r: unknown[]) => {
      const fechaFactura = parseDate(r[0])
      return {
        fechaFactura,
        nroFactura:           String(r[1]  ?? ''),
        cliente:              String(r[2]  ?? ''),
        fechaOt:              parseDate(r[3]),
        nroOt:                String(r[4]  ?? ''),
        totalBrutoFactura:    Number(r[5]  ?? 0),
        conceptoImpositivo:   Number(r[6]  ?? 0),
        totalFacturaNeto:     Number(r[7]  ?? 0),
        gastosLogisticos:     Number(r[8]  ?? 0),
        pctGastosLog:         Number(r[9]  ?? 0),
        fechaRemito:          parseDate(r[10]),
        nroRemito:            String(r[11] ?? ''),
        paciente:             String(r[12] ?? '').trim(),
        institucion:          String(r[13] ?? '').trim(),
        tecnico:              String(r[14] ?? '').trim(),
        medico:               String(r[15] ?? '').trim(),
        medicoProctor:        String(r[16] ?? '').trim(),
        sucursal:             String(r[17] ?? '').trim(),
        fechaConsumo:         parseDate(r[18]),
        nroConsumo:           r[19] ? Number(r[19]) : null,
        precio:               Number(r[20] ?? 0),
        estadoValorizacion:   String(r[21] ?? ''),
        descripcion:          String(r[22] ?? ''),
        fechaNc:              parseDate(r[23]),
        nroNc:                String(r[24] ?? ''),
        totalBrutoNc:         Number(r[25] ?? 0),
        contribMarginal:      Number(r[26] ?? 0),
        pctMargen:            Number(r[27] ?? 0),
        mesAnio:              toMesAnio(fechaFactura),
      }
    })
}

// ── Vista_Detallada → ConsumoDetalleMap ─────────────────────
function parseVistaDetallada(wb: XLSX.WorkBook): ConsumoDetalleMap {
  const map: ConsumoDetalleMap = new Map()
  const sheetName =
    wb.SheetNames.find(n => /vista.?detallada|detallada|detalle/i.test(n))
    ?? wb.SheetNames[1]
  if (!sheetName) return map

  const rawData: unknown[][] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, raw: true })

  rawData.slice(1).forEach((r: unknown[]) => {
    const nroConsumo = r[12] ? Number(r[12]) : null
    if (!nroConsumo) return

    const row: ConsumoDetalleRow = {
      nroConsumo,
      nroOt:                     String(r[2]  ?? '').trim(),
      nroFactura:                String(r[1]  ?? '').trim(),
      otOperacionItemId:         r[3]  ? Number(r[3])  : null,
      fechaRemito:               parseDate(r[4]),
      nroRemito:                 String(r[5]  ?? '').trim(),
      productoVendido:           String(r[6]  ?? '').trim(),
      cantidadBaseComercial:     Number(r[7]  ?? 1),
      importeNetoIva:            Number(r[8]  ?? 0),
      operacionItemIdMaterial:   r[9]  ? Number(r[9])  : null,
      productoMaterialUtilizado: String(r[10] ?? '').trim(),
      cantidadMaterialUtilizado: Number(r[11] ?? 1),
      productoConsumo:           String(r[13] ?? '').trim(),
      costoUnitario:             Number(r[14] ?? 0),
      pctPartConsumo:            Number(r[15] ?? 0),
      pctPartVentaNeta:          Number(r[16] ?? 0),
    }

    const existing = map.get(nroConsumo) ?? []
    existing.push(row)
    map.set(nroConsumo, existing)
  })

  return map
}

// ── Facturacion → FacturacionRow[] ──────────────────────────
function parseFacturacion(wb: XLSX.WorkBook): FacturacionRow[] {
  const sheetName = wb.SheetNames.find(n => /facturaci[oó]n/i.test(n))
  if (!sheetName) return []

  const rawData: unknown[][] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, raw: true })

  return rawData
    .slice(1)
    .filter((r: unknown[]) => r[2])
    .map((r: unknown[]) => ({
      fecha: null,
      cliente: String(r[3] ?? '').trim(),
      factura: String(r[2] ?? '').trim(),
      importe: Number(r[4] ?? 0), // Total Neto — sin impuestos
      total: Number(r[5] ?? 0),   // Total Bruto — con impuestos
      mesAnio: yearMonthToMesAnio(r[0]),
    }))
}

// ── Cobranza → CobranzaRow[] ────────────────────────────────
function parseCobranza(wb: XLSX.WorkBook): CobranzaRow[] {
  const sheetName = wb.SheetNames.find(n => /cobranza/i.test(n))
  if (!sheetName) return []

  const rawData: unknown[][] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, raw: true })

  return rawData
    .slice(1)
    .filter((r: unknown[]) => r[2])
    .map((r: unknown[]) => {
      const totalNeto = Number(r[4] ?? 0)
      const totalBruto = Number(r[5] ?? 0)
      return {
        fecha: parseDate(r[1]),
        cliente: String(r[2] ?? '').trim(),
        importe: totalNeto,
        otros: totalBruto - totalNeto,
        total: totalBruto,
        mesAnio: yearMonthToMesAnio(r[0]),
      }
    })
}

// ============================================================
// PROVIDER
// ============================================================

const initialState: ExcelDataState = {
  rows: [],
  consumoDetalle: new Map(),
  facturacion: [],
  cobranza: [],
  fileName: '',
  loading: false,
  error: null,
}

export const ExcelDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ExcelDataState>(initialState)

  const loadFile = useCallback(async (file: File) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const data = new Uint8Array(await file.arrayBuffer())
      const wb = XLSX.read(data, { type: 'array', cellDates: true })

      const rows = parseVistaResumen(wb)
      const consumoDetalle = parseVistaDetallada(wb)
      const facturacion = parseFacturacion(wb)
      const cobranza = parseCobranza(wb)

      if (rows.length === 0 && facturacion.length === 0 && cobranza.length === 0) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'El archivo no contiene datos reconocibles. Verificá que tenga las hojas Vista_Resumen, Vista_Detallada, Facturacion y Cobranza.',
        }))
        return
      }

      setState({
        rows,
        consumoDetalle,
        facturacion,
        cobranza,
        fileName: file.name,
        loading: false,
        error: null,
      })
    } catch (e) {
      console.error(e)
      setState(prev => ({ ...prev, loading: false, error: 'No se pudo leer el archivo. Verificá el formato.' }))
    }
  }, [])

  const reset = useCallback(() => {
    setState(initialState)
  }, [])

  const value: ExcelDataContextValue = {
    ...state,
    loadFile,
    reset,
    hasData: state.rows.length > 0 || state.facturacion.length > 0 || state.cobranza.length > 0,
  }

  return (
    <ExcelDataContext.Provider value={value}>
      {children}
    </ExcelDataContext.Provider>
  )
}

// ============================================================
// HOOK DE CONSUMO
// ============================================================

export function useExcelData(): ExcelDataContextValue {
  const ctx = useContext(ExcelDataContext)
  if (!ctx) {
    throw new Error('useExcelData debe usarse dentro de <ExcelDataProvider>')
  }
  return ctx
}
