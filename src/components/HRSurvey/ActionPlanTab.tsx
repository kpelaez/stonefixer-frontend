// src/components/hr-survey/ActionPlanTab.tsx
// Kanban de plan de acción derivado de la Encuesta de Clima Laboral 2026.
// Versión estática — el estado se mantiene en React (useState).
// Migración futura: reemplazar el estado local por llamadas a actionPlanService.ts.

import { useState, useMemo } from 'react';
import type { ActionItem, ActionStatus, ActionPriority, ActionCategory } from '../../types/actionPlan';
import { ACTION_ITEMS, KANBAN_COLUMNS } from '../../data/actionPlanData';

// ─── Configuración visual ────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<ActionPriority, { label: string; className: string }> = {
  alta:  { label: 'Alta',  className: 'bg-red-100 text-red-800' },
  media: { label: 'Media', className: 'bg-amber-100 text-amber-800' },
  baja:  { label: 'Baja',  className: 'bg-gray-100 text-gray-600' },
};

const CATEGORY_CONFIG: Record<ActionCategory, { label: string; className: string }> = {
  comunicacion: { label: 'Comunicación',  className: 'bg-blue-100 text-blue-800' },
  liderazgo:    { label: 'Liderazgo',     className: 'bg-purple-100 text-purple-800' },
  beneficios:   { label: 'Beneficios',    className: 'bg-pink-100 text-pink-800' },
  espacio:      { label: 'Espacio',       className: 'bg-orange-100 text-orange-800' },
  objetivos:    { label: 'Objetivos',     className: 'bg-teal-100 text-teal-800' },
  flexibilidad: { label: 'Flexibilidad',  className: 'bg-indigo-100 text-indigo-800' },
  otro:         { label: 'Otro',          className: 'bg-gray-100 text-gray-600' },
};

const STATUS_OPTIONS: { value: ActionStatus; label: string }[] = [
  { value: 'pendiente',   label: 'Pendiente' },
  { value: 'en_progreso', label: 'En progreso' },
  { value: 'completado',  label: 'Completado' },
  { value: 'descartado',  label: 'Descartado' },
];

// ─── Subcomponentes ──────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: ActionPriority }) {
  const { label, className } = PRIORITY_CONFIG[priority];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

function CategoryBadge({ category }: { category: ActionCategory }) {
  const { label, className } = CATEGORY_CONFIG[category];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

// Card de una iniciativa
function ActionCard({
  item,
  onStatusChange,
  onExpand,
}: {
  item: ActionItem;
  onStatusChange: (id: string, status: ActionStatus) => void;
  onExpand: (item: ActionItem) => void;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow duration-150 space-y-2">
      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        <CategoryBadge category={item.category} />
        <PriorityBadge priority={item.priority} />
      </div>

      {/* Título */}
      <p className="text-sm font-medium text-gray-800 leading-snug">{item.title}</p>

      {/* Descripción truncada */}
      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
        {item.description}
      </p>

      {/* Acciones */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-100">
        {/* Cambio de estado rápido */}
        <select
          value={item.status}
          onChange={e => onStatusChange(item.id, e.target.value as ActionStatus)}
          className="text-xs border border-gray-200 rounded-md px-1.5 py-1 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          aria-label={`Cambiar estado de "${item.title}"`}
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Ver detalle */}
        <button
          type="button"
          onClick={() => onExpand(item)}
          className="text-xs text-emerald-600 hover:text-emerald-800 font-medium flex items-center gap-1 transition-colors"
          aria-label={`Ver detalle de "${item.title}"`}
        >
          Ver detalle
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Modal de detalle
function DetailModal({
  item,
  onClose,
  onStatusChange,
}: {
  item: ActionItem;
  onClose: () => void;
  onStatusChange: (id: string, status: ActionStatus) => void;
}) {
  return (
    // Overlay — faux viewport para que no rompa el layout del iframe
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Detalle de iniciativa: ${item.title}`}
    >
      <div
        className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            <CategoryBadge category={item.category} />
            <PriorityBadge priority={item.priority} />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Título */}
        <h3 className="text-base font-semibold text-gray-900">{item.title}</h3>

        {/* Descripción */}
        <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>

        {/* Insight origen */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs font-medium text-amber-700 mb-1">Origen en la encuesta</p>
          <p className="text-xs text-amber-800 leading-relaxed italic">"{item.sourceInsight}"</p>
        </div>

        {/* Cambio de estado */}
        <div className="pt-2 border-t border-gray-100">
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">
            Estado actual
          </label>
          <select
            value={item.status}
            onChange={e => {
              onStatusChange(item.id, e.target.value as ActionStatus);
              onClose();
            }}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────

export default function ActionPlanTab() {
  const [items, setItems] = useState<ActionItem[]>(ACTION_ITEMS);
  const [expandedItem, setExpandedItem] = useState<ActionItem | null>(null);
  const [filterCategory, setFilterCategory] = useState<ActionCategory | 'todas'>('todas');

  const handleStatusChange = (id: string, status: ActionStatus) => {
    setItems(prev =>
      prev.map(item => (item.id === id ? { ...item, status } : item)),
    );
    // MIGRACIÓN FUTURA: reemplazar el setItems por:
    // await actionPlanService.patchStatus(id, status);
  };

  // Estadísticas rápidas
  const stats = useMemo(() => ({
    total:      items.length,
    pendiente:  items.filter(i => i.status === 'pendiente').length,
    en_progreso: items.filter(i => i.status === 'en_progreso').length,
    completado: items.filter(i => i.status === 'completado').length,
  }), [items]);

  // Categorías disponibles para el filtro
  const categories = useMemo(() => {
    const cats = [...new Set(items.map(i => i.category))];
    return cats.sort();
  }, [items]);

  // Items filtrados
  const filtered = useMemo(
    () =>
      filterCategory === 'todas'
        ? items
        : items.filter(i => i.category === filterCategory),
    [items, filterCategory],
  );

  return (
    <div className="space-y-6">

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total iniciativas', value: stats.total },
          { label: 'Pendientes',        value: stats.pendiente,   color: 'text-gray-700' },
          { label: 'En progreso',       value: stats.en_progreso, color: 'text-blue-600' },
          { label: 'Completadas',       value: stats.completado,  color: 'text-emerald-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-50 rounded-lg px-4 py-3">
            <p className="text-xs text-gray-500 mb-0.5">{label}</p>
            <p className={`text-2xl font-semibold ${color ?? 'text-gray-900'}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Filtro por categoría ── */}
      <div className="flex flex-wrap gap-2 items-center">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mr-1">Categoría</p>
        <button
          type="button"
          onClick={() => setFilterCategory('todas')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
            filterCategory === 'todas'
              ? 'bg-gray-900 text-white border-transparent'
              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          Todas
        </button>
        {categories.map(cat => {
          const { label, className } = CATEGORY_CONFIG[cat];
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                filterCategory === cat
                  ? `${className} border-transparent shadow-sm`
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Nota migración ── */}
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
        <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-blue-700 leading-relaxed">
          Los cambios de estado son locales por ahora. Cuando RRHH confirme el plan real, este módulo se conecta al backend sin cambiar la interfaz.
        </p>
      </div>

      {/* ── Kanban ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {KANBAN_COLUMNS.map(col => {
          const colItems = filtered.filter(i => i.status === col.id);
          return (
            <div key={col.id} className="flex flex-col gap-3">
              {/* Header de columna */}
              <div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${col.color} ${col.borderColor}`}>
                <span className={`text-xs font-semibold uppercase tracking-wide ${col.textColor}`}>
                  {col.label}
                </span>
                <span className={`text-xs font-bold ${col.textColor} bg-white/60 rounded-full w-5 h-5 flex items-center justify-center`}>
                  {colItems.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-3 min-h-[120px]">
                {colItems.length === 0 ? (
                  <div className="flex items-center justify-center h-20 border-2 border-dashed border-gray-200 rounded-lg">
                    <p className="text-xs text-gray-400">Sin iniciativas</p>
                  </div>
                ) : (
                  colItems.map(item => (
                    <ActionCard
                      key={item.id}
                      item={item}
                      onStatusChange={handleStatusChange}
                      onExpand={setExpandedItem}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Modal de detalle ── */}
      {expandedItem && (
        <DetailModal
          item={expandedItem}
          onClose={() => setExpandedItem(null)}
          onStatusChange={(id, status) => {
            handleStatusChange(id, status);
            setExpandedItem(null);
          }}
        />
      )}
    </div>
  );
}