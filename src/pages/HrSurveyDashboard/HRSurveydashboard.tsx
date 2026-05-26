import { useMemo, useState } from 'react';
import type { SurveyDimension, Sentiment, SurveyFilters } from '../../types/hrSurvey';
import { COMMENTS, DIMENSIONS, SURVEY_META } from '../../data/hrSurveyData';
import { buildWordFrequencies } from '../../utils/textAnalysis';
import WordCloud from '../../components/HRSurvey/WordCloud';
import CommentList from '../../components/HRSurvey/CommentList';

// ─── Constantes de UI ────────────────────────────────────────────────────────

const SENTIMENT_OPTIONS: { value: Sentiment | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'positivo', label: 'Positivos' },
  { value: 'neutro', label: 'Neutros' },
  { value: 'constructivo', label: 'Constructivos' },
];

const DIMENSION_ALL = 'todas' as const;

// ─── Subcomponentes ──────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-gray-50 rounded-lg px-4 py-3">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function FilterChip({
  active,
  label,
  color,
  onClick,
}: {
  active: boolean;
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150
        ${
          active
            ? `${color} border-transparent shadow-sm`
            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
        }
      `}
    >
      {label}
    </button>
  );
}

// ─── Página ──────────────────────────────────────────────────────────────────

export default function HRSurveyDashboardPage() {
  const [filters, setFilters] = useState<SurveyFilters>({
    dimension: DIMENSION_ALL,
    sentiment: 'todos',
    search: '',
  });

  // Comentarios filtrados
  const filtered = useMemo(() => {
    return COMMENTS.filter(c => {
      if (filters.dimension !== DIMENSION_ALL && c.dimension !== filters.dimension)
        return false;
      if (filters.sentiment !== 'todos' && c.sentiment !== filters.sentiment)
        return false;
      if (
        filters.search.trim() &&
        !c.text.toLowerCase().includes(filters.search.toLowerCase())
      )
        return false;
      return true;
    });
  }, [filters]);

  // Word cloud — se recalcula al cambiar dimensión o sentimiento (no en búsqueda)
  const wordFreqs = useMemo(
    () =>
      buildWordFrequencies(
        COMMENTS.filter(c => {
          if (filters.dimension !== DIMENSION_ALL && c.dimension !== filters.dimension)
            return false;
          if (filters.sentiment !== 'todos' && c.sentiment !== filters.sentiment)
            return false;
          return true;
        }),
      ),
    [filters.dimension, filters.sentiment],
  );

  // Contadores por sentimiento en los comentarios filtrados por dim/sentiment (sin búsqueda)
  const sentimentCounts = useMemo(() => {
    const base = COMMENTS.filter(c => {
      if (filters.dimension !== DIMENSION_ALL && c.dimension !== filters.dimension)
        return false;
      return true;
    });
    return {
      total: base.length,
      positivo: base.filter(c => c.sentiment === 'positivo').length,
      neutro: base.filter(c => c.sentiment === 'neutro').length,
      constructivo: base.filter(c => c.sentiment === 'constructivo').length,
    };
  }, [filters.dimension]);

  const setDimension = (d: SurveyDimension | 'todas') =>
    setFilters(f => ({ ...f, dimension: d }));

  const setSentiment = (s: Sentiment | 'todos') =>
    setFilters(f => ({ ...f, sentiment: s }));

  const handleWordClick = (word: string) =>
    setFilters(f => ({ ...f, search: word }));

  const clearSearch = () => setFilters(f => ({ ...f, search: '' }));

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* ── Encabezado ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {SURVEY_META.title}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Análisis de comentarios — edición {SURVEY_META.edition}
          </p>
        </div>
        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full self-start sm:self-auto">
          {SURVEY_META.totalResponses} respuestas · Datos anónimos
        </span>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Comentarios"
          value={sentimentCounts.total}
          sub="en dimensión seleccionada"
        />
        <StatCard
          label="Positivos"
          value={sentimentCounts.positivo}
          sub={`${Math.round((sentimentCounts.positivo / sentimentCounts.total) * 100)}%`}
        />
        <StatCard
          label="Neutros"
          value={sentimentCounts.neutro}
          sub={`${Math.round((sentimentCounts.neutro / sentimentCounts.total) * 100)}%`}
        />
        <StatCard
          label="Constructivos"
          value={sentimentCounts.constructivo}
          sub={`${Math.round((sentimentCounts.constructivo / sentimentCounts.total) * 100)}%`}
        />
      </div>

      {/* ── Filtro por dimensión ── */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
          Dimensión
        </p>
        <div className="flex flex-wrap gap-2">
          <FilterChip
            active={filters.dimension === DIMENSION_ALL}
            label="Todas"
            color="bg-gray-900 text-white"
            onClick={() => setDimension(DIMENSION_ALL)}
          />
          {DIMENSIONS.map(d => (
            <FilterChip
              key={d.key}
              active={filters.dimension === d.key}
              label={d.label}
              color={`${d.color} ${d.textColor}`}
              onClick={() => setDimension(d.key)}
            />
          ))}
        </div>
      </div>

      {/* ── Word Cloud ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-700">Palabras más frecuentes</p>
          <p className="text-xs text-gray-400">Hacé clic en una palabra para filtrar</p>
        </div>
        <WordCloud words={wordFreqs} height={280} onWordClick={handleWordClick} />
      </div>

      {/* ── Filtros: sentimiento + búsqueda ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Sentimiento */}
        <div className="flex flex-wrap gap-2 items-center">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mr-1">
            Sentimiento
          </p>
          {SENTIMENT_OPTIONS.map(opt => (
            <FilterChip
              key={opt.value}
              active={filters.sentiment === opt.value}
              label={opt.label}
              color={
                opt.value === 'positivo'
                  ? 'bg-emerald-100 text-emerald-800'
                  : opt.value === 'neutro'
                  ? 'bg-gray-200 text-gray-800'
                  : opt.value === 'constructivo'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-gray-900 text-white'
              }
              onClick={() => setSentiment(opt.value)}
            />
          ))}
        </div>

        {/* Búsqueda libre */}
        <div className="relative flex-1 min-w-[200px]">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
              />
            </svg>
          </div>
          <input
            type="search"
            placeholder="Buscar en comentarios..."
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
            aria-label="Buscar en comentarios"
          />
          {filters.search && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
              aria-label="Limpiar búsqueda"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Lista de comentarios ── */}
      <div className="bg-white border border-gray-200 rounded-xl px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-700">
            Comentarios
          </p>
          <span className="text-xs text-gray-400">
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
        <CommentList comments={filtered} searchTerm={filters.search} />
      </div>
    </div>
  );
}