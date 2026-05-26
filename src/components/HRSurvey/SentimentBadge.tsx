
import type { Sentiment } from '../../types/hrSurvey';

const CONFIG: Record<Sentiment, { label: string; className: string }> = {
  positivo: {
    label: 'Positivo',
    className: 'bg-emerald-100 text-emerald-800',
  },
  neutro: {
    label: 'Neutro',
    className: 'bg-gray-100 text-gray-700',
  },
  constructivo: {
    label: 'Constructivo',
    className: 'bg-amber-100 text-amber-800',
  },
};

interface Props {
  sentiment: Sentiment;
}

export default function SentimentBadge({ sentiment }: Props) {
  const { label, className } = CONFIG[sentiment];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}