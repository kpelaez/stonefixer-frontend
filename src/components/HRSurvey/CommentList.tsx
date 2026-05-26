import type { SurveyComment } from '../../types/hrSurvey';
import { DIMENSIONS } from '../../data/hrSurveyData';
import SentimentBadge from './SentimentBadge';

interface Props {
  comments: SurveyComment[];
  searchTerm?: string;
}

/**
 * Resalta los términos de búsqueda en el texto del comentario.
 */
function Highlighted({ text, term }: { text: string; term: string }) {
  if (!term.trim()) return <>{text}</>;

  const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export default function CommentList({ comments, searchTerm = '' }: Props) {
  if (!comments.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <svg
          className="w-10 h-10 mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3v-3z"
          />
        </svg>
        <p className="text-sm">No hay comentarios para los filtros seleccionados.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-100" role="list" aria-label="Lista de comentarios">
      {comments.map(comment => {
        const dim = DIMENSIONS.find(d => d.key === comment.dimension);
        return (
          <li key={comment.id} className="py-4 flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {dim && (
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${dim.color} ${dim.textColor}`}
                >
                  {dim.label}
                </span>
              )}
              <SentimentBadge sentiment={comment.sentiment} />
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              <Highlighted text={comment.text} term={searchTerm} />
            </p>
          </li>
        );
      })}
    </ul>
  );
}