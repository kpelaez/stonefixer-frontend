// Tab de resumen ejecutivo — scores por dimensión + sentimiento general.
// Usa Recharts (ya instalado en el proyecto).

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { COMMENTS, DIMENSIONS, SURVEY_META } from '../../data/hrSurveyData';

// ─── Datos derivados (estáticos, se calculan una sola vez) ───────────────────

const radarData = DIMENSIONS.filter(d => d.score > 0).map(d => ({
  dimension: d.label,
  score: d.score,
  fullMark: 10,
}));

const barData = DIMENSIONS.filter(d => d.score > 0)
  .sort((a, b) => b.score - a.score)
  .map(d => ({
    name: d.label,
    score: d.score,
    fill: barColor(d.score),
  }));

const sentimentCounts = {
  positivo: COMMENTS.filter(c => c.sentiment === 'positivo').length,
  neutro: COMMENTS.filter(c => c.sentiment === 'neutro').length,
  constructivo: COMMENTS.filter(c => c.sentiment === 'constructivo').length,
};
const totalComments = COMMENTS.length;

// Top temas de mejora (frecuencia manual basada en análisis del doc)
const topThemes = [
  { tema: 'Comunicación entre sectores', menciones: 18, color: '#dc2626' },
  { tema: 'Objetivos claros',            menciones: 15, color: '#d97706' },
  { tema: 'Home office',                 menciones: 12, color: '#2563eb' },
  { tema: 'Mejoras salariales / bonos',  menciones: 10, color: '#f59e0b' },
  { tema: 'Espacio físico',              menciones: 8,  color: '#7c3aed' },
  { tema: 'Capacitación de líderes',     menciones: 7,  color: '#0891b2' },
  { tema: 'Más beneficios',              menciones: 6,  color: '#16a34a' },
];

function barColor(score: number): string {
  if (score >= 8) return '#059669'; // emerald
  if (score >= 7) return '#0284c7'; // sky
  return '#d97706';                  // amber
}

// ─── Subcomponentes ──────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
      {children}
    </h2>
  );
}

function KpiCard({
  label,
  value,
  valueClass = 'text-gray-900',
  sub,
}: {
  label: string;
  value: string | number;
  valueClass?: string;
  sub?: string;
}) {
  return (
    <div className="bg-gray-50 rounded-lg px-4 py-3">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={`text-2xl font-semibold ${valueClass}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// Barra de sentimiento horizontal con 3 segmentos
function SentimentBar() {
  const pos = Math.round((sentimentCounts.positivo / totalComments) * 100);
  const neu = Math.round((sentimentCounts.neutro / totalComments) * 100);
  const con = 100 - pos - neu;

  return (
    <div>
      <div className="flex h-4 rounded-full overflow-hidden w-full">
        <div style={{ width: `${pos}%` }} className="bg-emerald-500" />
        <div style={{ width: `${neu}%` }} className="bg-gray-300" />
        <div style={{ width: `${con}%` }} className="bg-amber-400" />
      </div>
      <div className="flex gap-4 mt-2 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
          Positivos {pos}%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-gray-300 inline-block" />
          Neutros {neu}%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />
          Constructivos {con}%
        </span>
      </div>
    </div>
  );
}

// Tooltip custom para el radar
function RadarTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm shadow-sm">
      <p className="font-medium text-gray-800">{payload[0]?.payload?.dimension}</p>
      <p className="text-emerald-600 font-semibold">{payload[0]?.value} / 10</p>
    </div>
  );
}

// Tooltip custom para barras
function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm shadow-sm">
      <p className="font-medium text-gray-700">{label}</p>
      <p className="font-semibold" style={{ color: payload[0]?.fill }}>
        {payload[0]?.value} / 10
      </p>
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────

export default function ExecutiveSummaryTab() {
  return (
    <div className="space-y-8">

      {/* ── KPIs superiores ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard
          label="Respuestas"
          value={SURVEY_META.totalResponses}
          sub={`edición ${SURVEY_META.edition}`}
        />
        <KpiCard
          label="Score general"
          value="8.2"
          valueClass="text-emerald-600"
          sub="promedio ponderado"
        />
        <KpiCard
          label="Dimensión más alta"
          value="Motivación"
          sub="8.8 / 10"
        />
        <KpiCard
          label="Dimensión a mejorar"
          value="Claridad de rol"
          valueClass="text-amber-600"
          sub="6.0 / 10"
        />
      </div>

      {/* ── Sentimiento general ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <SectionTitle>Sentimiento general en comentarios</SectionTitle>
        <SentimentBar />
        <p className="text-xs text-gray-400 mt-3">
          Basado en {totalComments} comentarios relevados — datos anónimos.
        </p>
      </div>

      {/* ── Radar + Barras ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Radar */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <SectionTitle>Radar por dimensión</SectionTitle>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis
                dataKey="dimension"
                tick={{ fontSize: 11, fill: '#6b7280' }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 10]}
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickCount={6}
              />
              <Radar
                dataKey="score"
                stroke="#059669"
                fill="#059669"
                fillOpacity={0.18}
                strokeWidth={2}
                dot={{ r: 4, fill: '#059669' }}
              />
              <Tooltip content={<RadarTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Barras horizontales */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <SectionTitle>Score por dimensión</SectionTitle>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={barData}
              layout="vertical"
              margin={{ top: 0, right: 24, bottom: 0, left: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
              <XAxis
                type="number"
                domain={[0, 10]}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickCount={6}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                width={110}
              />
              <Tooltip content={<BarTooltip />} cursor={{ fill: '#f9fafb' }} />
              <Bar dataKey="score" radius={[0, 4, 4, 0]} maxBarSize={22}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Top temas de mejora ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <SectionTitle>Principales temas pedidos en respuestas abiertas</SectionTitle>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            data={topThemes}
            layout="vertical"
            margin={{ top: 0, right: 24, bottom: 0, left: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              label={{
                value: 'menciones',
                position: 'insideBottomRight',
                offset: -4,
                fontSize: 10,
                fill: '#9ca3af',
              }}
            />
            <YAxis
              type="category"
              dataKey="tema"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              width={160}
            />
            <Tooltip
              formatter={(value: number) => [`${value} menciones`, '']}
              cursor={{ fill: '#f9fafb' }}
            />
            <Bar dataKey="menciones" radius={[0, 4, 4, 0]} maxBarSize={20}>
              {topThemes.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}