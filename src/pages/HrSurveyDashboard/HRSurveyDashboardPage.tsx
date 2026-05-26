// src/pages/dashboards/HRSurveyDashboardPage.tsx
// Módulo RRHH — Encuesta de Clima Laboral 2026
// Tabs: Resumen Ejecutivo | Análisis de Comentarios | Plan de Acción

import { useState } from 'react';
import { SURVEY_META } from '../../data/hrSurveyData';
import ExecutiveSummaryTab  from '../../components/HRSurvey/ExecutiveSummaryTab';
import CommentsAnalysisTab  from '../../components/HRSurvey/CommentsAnalysisTab';
import ActionPlanTab        from '../../components/HRSurvey/ActionPlanTab';

// ─── Tipos ───────────────────────────────────────────────────────────────────

type TabId = 'executive' | 'comments' | 'action-plan';

const TABS: { id: TabId; label: string; iconPath: string }[] = [
  {
    id: 'executive',
    label: 'Resumen ejecutivo',
    iconPath:
      'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  },
  {
    id: 'comments',
    label: 'Análisis de comentarios',
    iconPath:
      'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3v-3z',
  },
  {
    id: 'action-plan',
    label: 'Plan de acción',
    iconPath:
      'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  },
];

// ─── Componente ──────────────────────────────────────────────────────────────

export default function HRSurveyDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>('executive');

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

      {/* ── Encabezado ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {SURVEY_META.title}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Recursos Humanos · Edición {SURVEY_META.edition}
          </p>
        </div>
        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full self-start sm:self-auto">
          {SURVEY_META.totalResponses} respuestas · Datos anónimos
        </span>
      </div>

      {/* ── Tabs ── */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6 overflow-x-auto" aria-label="Tabs del módulo RRHH">
          {TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 pb-3 text-sm font-medium border-b-2 whitespace-nowrap
                transition-colors duration-150
                ${
                  activeTab === tab.id
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d={tab.iconPath}
                />
              </svg>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Contenido del tab activo ── */}
      {activeTab === 'executive'    && <ExecutiveSummaryTab />}
      {activeTab === 'comments'     && <CommentsAnalysisTab />}
      {activeTab === 'action-plan'  && <ActionPlanTab />}

    </div>
  );
}