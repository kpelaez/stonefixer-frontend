// src/pages/InventarioStock/InventarioStockPage.tsx
/**
 * Página orquestadora del módulo Inventario de Stock.
 *
 * Flujo completo:
 *   lista → nuevo → scraping → series → conteo → analisis
 */

import { useState, useEffect } from 'react';
import { Package, Plus, ArrowLeft } from 'lucide-react';
import { useInventarioStockStore } from '../../stores/inventarioStockStore';
import RelevamientoList from './components/RelevamientoList';
import NuevoRelevamientoForm from './components/NuevoRelevamientoForm';
import ScrapingStatus from './components/ScrapingStatus';
import SeriesTable from './components/SeriesTable';
import CargaResultados from './components/CargaResultados';
import AnalisisPanel from './components/AnalisisPanel';
import type { Relevamiento } from '../../types/inventarioStock';

type Vista = 'lista' | 'nuevo' | 'scraping' | 'series' | 'conteo' | 'analisis';

const SUBTITULOS: Record<Vista, string> = {
  lista:    'Relevamientos de ciclo — Omnimedica vs Finnegans',
  nuevo:    'Nuevo relevamiento de ciclo',
  scraping: '',
  series:   '',
  conteo:   'Conteo físico online',
  analisis: 'Análisis de diferencias',
};

const InventarioStockPage = () => {
  const [vista, setVista] = useState<Vista>('lista');

  const {
    relevamientos,
    relevamientoActivo,
    cargandoRelevamientos,
    errorRelevamientos,
    cargarRelevamientos,
    seleccionarRelevamiento,
    limpiarRelevamientoActivo,
  } = useInventarioStockStore();

  useEffect(() => {
    cargarRelevamientos();
  }, [cargarRelevamientos]);

  // ── Navegación ───────────────────────────────────────────────

  const handleRelevamientoCreado = (rel: Relevamiento) => {
    seleccionarRelevamiento(rel);
    setVista('scraping');
  };

  const handleScrapingCompleto = () => setVista('series');

  const handleSeleccionarRelevamiento = (rel: Relevamiento) => {
    seleccionarRelevamiento(rel);
    const vistaDestino: Record<string, Vista> = {
      pendiente:  'scraping',
      extrayendo: 'scraping',
      listo:      'series',
      en_conteo:  'conteo',
      analizado:  'analisis',
      cerrado:    'analisis',
    };
    setVista(vistaDestino[rel.estado] ?? 'series');
  };

  const handleVolver = () => {
    // Navegación entre vistas (back lógico)
    const anterior: Record<Vista, Vista> = {
      lista:    'lista',
      nuevo:    'lista',
      scraping: 'lista',
      series:   'lista',
      conteo:   'series',
      analisis: 'conteo',
    };
    const vistaAnterior = anterior[vista];
    if (vistaAnterior === 'lista') {
      limpiarRelevamientoActivo();
      cargarRelevamientos();
    }
    setVista(vistaAnterior);
  };

  const subtitulo =
    (vista === 'scraping' || vista === 'series') && relevamientoActivo
      ? `${relevamientoActivo.proveedor} · ${relevamientoActivo.mes_ciclo}`
      : SUBTITULOS[vista];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {vista !== 'lista' && (
            <button
              onClick={handleVolver}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              aria-label="Volver"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <Package size={22} className="text-teal-600" />
              <h1 className="text-2xl font-bold text-gray-900">Inventario de Stock</h1>
            </div>
            {subtitulo && (
              <p className="text-gray-500 text-sm mt-0.5">{subtitulo}</p>
            )}
          </div>
        </div>

        {vista === 'lista' && (
          <button
            onClick={() => setVista('nuevo')}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
          >
            <Plus size={16} />
            Nuevo relevamiento
          </button>
        )}

        {/* Tabs de navegación cuando hay relevamiento activo */}
        {relevamientoActivo && vista !== 'lista' && vista !== 'nuevo' && vista !== 'scraping' && (
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {(['series', 'conteo', 'analisis'] as Vista[]).map((v) => (
              <button
                key={v}
                onClick={() => setVista(v)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  vista === v
                    ? 'bg-white text-teal-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {v === 'series' ? 'Series' : v === 'conteo' ? 'Conteo físico' : 'Análisis'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error global */}
      {errorRelevamientos && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">Error al cargar relevamientos</p>
          <p className="text-red-600 text-sm mt-1">{errorRelevamientos}</p>
          <button
            onClick={() => cargarRelevamientos()}
            className="mt-2 text-sm text-red-700 underline hover:no-underline"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Vistas */}
      {vista === 'lista' && (
        <RelevamientoList
          relevamientos={relevamientos}
          cargando={cargandoRelevamientos}
          onSeleccionar={handleSeleccionarRelevamiento}
          onNuevo={() => setVista('nuevo')}
        />
      )}

      {vista === 'nuevo' && (
        <NuevoRelevamientoForm
          onCreado={handleRelevamientoCreado}
          onCancelar={() => setVista('lista')}
        />
      )}

      {vista === 'scraping' && relevamientoActivo && (
        <ScrapingStatus
          relevamiento={relevamientoActivo}
          onCompleto={handleScrapingCompleto}
        />
      )}

      {vista === 'series' && relevamientoActivo && (
        <SeriesTable
          relevamiento={relevamientoActivo}
          onIrAConteo={() => setVista('conteo')}
        />
      )}

      {vista === 'conteo' && relevamientoActivo && (
        <CargaResultados
          relevamiento={relevamientoActivo}
          onFinalizado={() => setVista('analisis')}
        />
      )}

      {vista === 'analisis' && relevamientoActivo && (
        <AnalisisPanel relevamiento={relevamientoActivo} />
      )}
    </div>
  );
};

export default InventarioStockPage;