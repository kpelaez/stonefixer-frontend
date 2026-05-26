import { useEffect, useState } from 'react';
import overtimeService from '../../services/overtimeService';
import type { OvertimeEntryRead } from '../../types/overtime';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Pendiente',  color: 'bg-yellow-100 text-yellow-800' },
  approved:  { label: 'Aprobado',   color: 'bg-green-100 text-green-800'  },
  rejected:  { label: 'Rechazado',  color: 'bg-red-100 text-red-800'      },
  cancelled: { label: 'Cancelado',  color: 'bg-gray-100 text-gray-500'    },
};

const TYPE_LABEL = { credit: '🕐 HE', debit: '🌴 Comp.' };

export default function OvertimeManagePage() {

  const [entries,    setEntries]    = useState<OvertimeEntryRead[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('pending');

  // Modal de revisión
  const [reviewing,  setReviewing]  = useState<OvertimeEntryRead | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await overtimeService.listEntries({
        status: filterStatus as any || undefined,
        limit: 100,
      });
      setEntries(data);
    } catch (e: any) {
      setError(e.message || 'Error al cargar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterStatus]);

  const handleReview = async (approved: boolean) => {
    if (!reviewing) return;
    setSubmitting(true);
    try {
      await overtimeService.reviewEntry(reviewing.id, {
        status: approved ? 'approved' : 'rejected',
        review_note: reviewNote.trim() || undefined,
      });
      setReviewing(null);
      setReviewNote('');
      await load();
    } catch (e: any) {
      setError(e.message || 'Error al revisar');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = entries.filter(e => e.status === 'pending').length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Horas Compensatorias</h1>
          <p className="text-sm text-gray-500 mt-0.5">Aprobación de solicitudes del equipo de Stock</p>
        </div>
        {pendingCount > 0 && (
          <span className="bg-yellow-100 text-yellow-800 text-sm font-semibold px-3 py-1 rounded-full">
            {pendingCount} pendiente{pendingCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: 'pending',  label: 'Pendientes'  },
          { value: 'approved', label: 'Aprobadas'   },
          { value: 'rejected', label: 'Rechazadas'  },
          { value: '',         label: 'Todas'        },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilterStatus(value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filterStatus === value
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-emerald-600" />
          </div>
        ) : entries.length === 0 ? (
          <p className="text-center text-gray-400 py-12 text-sm">
            No hay solicitudes con el filtro seleccionado
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Empleado', 'Tipo', 'Horas', 'Fecha', 'Motivo', 'Estado', 'Acciones'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map(entry => {
                  const statusCfg = STATUS_CONFIG[entry.status];
                  return (
                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                        {entry.user_full_name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                        {TYPE_LABEL[entry.entry_type]}
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold whitespace-nowrap">
                        <span className={entry.entry_type === 'credit' ? 'text-emerald-600' : 'text-orange-600'}>
                          {entry.entry_type === 'credit' ? '+' : '−'}{Number(entry.hours).toFixed(1)}h
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {entry.reference_date}
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={entry.reason}>
                        {entry.reason}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                        {entry.review_note && (
                          <p className="text-xs text-gray-400 mt-1 italic truncate max-w-xs" title={entry.review_note}>
                            "{entry.review_note}"
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {entry.status === 'pending' && (
                          <button
                            onClick={() => { setReviewing(entry); setReviewNote(''); }}
                            className="text-xs text-emerald-600 hover:text-emerald-800 font-medium transition-colors"
                          >
                            Revisar →
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de revisión */}
      {reviewing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Revisar solicitud</h2>

            {/* Detalle */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Empleado</span>
                <span className="font-medium">{reviewing.user_full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tipo</span>
                <span>{reviewing.entry_type === 'credit' ? ' Horas extra' : ' Compensatorio'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Horas</span>
                <span className="font-mono font-semibold">{Number(reviewing.hours).toFixed(1)}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Fecha</span>
                <span>{reviewing.reference_date}</span>
              </div>
              <div>
                <span className="text-gray-500">Motivo</span>
                <p className="mt-1 text-gray-800">{reviewing.reason}</p>
              </div>
            </div>

            {/* Nota del manager */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comentario (opcional)
              </label>
              <textarea
                rows={2}
                placeholder="Ej: Confirmado con supervisora de turno"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                value={reviewNote}
                onChange={e => setReviewNote(e.target.value)}
              />
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setReviewing(null); setReviewNote(''); }}
                className="flex-1 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleReview(false)}
                disabled={submitting}
                className="flex-1 px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                Rechazar
              </button>
              <button
                onClick={() => handleReview(true)}
                disabled={submitting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors"
              >
                {submitting ? '...' : 'Aprobar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}