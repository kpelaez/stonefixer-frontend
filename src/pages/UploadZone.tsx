/**
 * ============================================================
 * UploadZone — Zona de carga de archivo, compartida entre dashboards
 * ============================================================
 *
 * Componente genérico de drag & drop. Ambos dashboards
 * (PanelEjecutivo y ContribucionMarginal) lo usan, pero como el
 * archivo se carga una sola vez vía ExcelDataContext, en la práctica
 * solo se ve en el primer dashboard que el usuario visita.
 */

import React, { useCallback, useRef, useState } from 'react'
import { Upload, AlertCircle } from 'lucide-react'

interface UploadZoneProps {
  onFile: (f: File) => void
  loading: boolean
  error: string | null
  title?: string
  subtitle?: string
  hint?: string
}

const UploadZone: React.FC<UploadZoneProps> = ({
  onFile,
  loading,
  error,
  title = 'Cargar archivo Excel',
  subtitle = 'Arrastrá el archivo acá o hacé click para seleccionarlo',
  hint = '.xlsx o .xls',
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }, [onFile])

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`w-full max-w-lg border-2 border-dashed rounded-2xl p-8 sm:p-14 flex flex-col items-center gap-5 cursor-pointer transition-all duration-200
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
              <p className="text-lg font-semibold text-gray-800">{title}</p>
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
              <p className="text-xs text-gray-400 mt-2">{hint}</p>
            </div>
          </>
        )}
        {error && (
          <div className="w-full p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" /> {error}
          </div>
        )}
      </div>
    </div>
  )
}

export default UploadZone