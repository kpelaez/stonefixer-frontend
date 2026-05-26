import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import overtimeService from '../../services/overtimeService';
import type {
  OvertimeEntryRead,
  OvertimeBalanceRead,
  OvertimeEntryCreate,
} from '../../types/overtime';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Pendiente',  color: 'bg-yellow-100 text-yellow-800' },
  approved:  { label: 'Aprobado',   color: 'bg-green-100 text-green-800'  },
  rejected:  { label: 'Rechazado',  color: 'bg-red-100 text-red-800'      },
  cancelled: { label: 'Cancelado',  color: 'bg-gray-100 text-gray-500'    },
};

const TYPE_LABEL = {
  credit: 'Horas extra',
  debit:  'Compensatorio',
};

const INITIAL_FORM = {
  entry_type: 'credit' as const,
  hours: 1,
  reference_date: new Date().toISOString().split('T')[0],
  reason: '',
};

export default function MyOvertimePage() {
  // ─── Store 
  const user    = useAuthStore(state => state.user);

  // const isManager = roles.some(r => ['admin', 'manager'].includes(r));

  // ─── State 
  const [balance,    setBalance]    = useState<OvertimeBalanceRead | null>(null);
  const [entries,    setEntries]    = useState<OvertimeEntryRead[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [form,       setForm]       = useState<Omit<OvertimeEntryCreate, 'user_id'>>(INITIAL_FORM);

  // ─── Data
  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const [bal, ents] = await Promise.all([
        overtimeService.getBalance(user.id),
        overtimeService.listEntries({ user_id: user.id }),
      ]);
      setBalance(bal);
      setEntries(ents);
    } catch (e: any) {
      setError(e.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user?.id]);

  // ─── Handlers 
  const handleSubmit = async () => {
    if (!user?.id || !form.reason.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await overtimeService.createEntry({ ...form, user_id: user.id });
      setShowForm(false);
      setForm(INITIAL_FORM);
      await load();
    } catch (e: any) {
      setError(e.message || 'Error al crear la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: number) => {
    if (!window.confirm('¿Cancelar esta solicitud?')) return;
    try {
      await overtimeService.cancelEntry(id);
      await load();
    } catch (e: any) {
      setError(e.message || 'Error al cancelar');
    }
  };

  // ─── Render 
  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Horas Extras</h1>
          {user?.full_name && (
            <p className="text-sm text-gray-500 mt-0.5">{user.full_name}</p>
          )}
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(null); }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Nueva solicitud
        </button>
      </div>

      {/* Error global */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Tarjetas de saldo */}
      {balance && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Saldo disponible',          value: balance.balance_hours,         color: 'text-emerald-700', bold: true  },
            { label: 'Total acumulado',            value: balance.total_credit_hours,    color: 'text-blue-700',    bold: false },
            { label: 'Compensatorios tomados',     value: balance.total_debit_hours,     color: 'text-orange-700',  bold: false },
            { label: 'Pendientes de aprobación',   value: Number(balance.pending_credit_hours) + Number(balance.pending_debit_hours), color: 'text-yellow-700', bold: false },
          ].map(({ label, value, color, bold }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className={`text-2xl ${bold ? 'font-bold' : 'font-semibold'} ${color}`}>
                {Number(value).toFixed(1)}h
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Formulario nueva solicitud */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-800">Nueva solicitud</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={form.entry_type}
                onChange={e => setForm({ ...form, entry_type: e.target.value as 'credit' | 'debit' })}
              >
                <option value="credit"> Horas extra trabajadas</option>
                <option value="debit"> Compensatorio (usar horas)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Horas{' '}
                {form.entry_type === 'debit' && balance && (
                  <span className="text-gray-400 font-normal">
                    (disponible: {Number(balance.balance_hours).toFixed(1)}h)
                  </span>
                )}
              </label>
              <input
                type="number"
                min={0.5}
                max={24}
                step={0.5}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={form.hours}
                onChange={e => setForm({ ...form, hours: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de referencia</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={form.reference_date}
                onChange={e => setForm({ ...form, reference_date: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                placeholder="Ej: Cierre de inventario mensual"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                value={form.reason}
                onChange={e => setForm({ ...form, reason: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => { setShowForm(false); setError(null); }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !form.reason.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {submitting ? 'Enviando...' : 'Solicitar'}
            </button>
          </div>
        </div>
      )}

      {/* Historial */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Historial de solicitudes</h2>
        </div>

        {entries.length === 0 ? (
          <p className="text-center text-gray-400 py-12 text-sm">
            No hay solicitudes registradas aún
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Tipo', 'Horas', 'Fecha', 'Motivo', 'Estado', ''].map(h => (
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
                      <td className="px-4 py-3 whitespace-nowrap">
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
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                        {entry.review_note && (
                          <p className="text-xs text-gray-400 mt-1 italic truncate max-w-xs" title={entry.review_note}>
                            "{entry.review_note}"
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {entry.status === 'pending' && (
                          <button
                            onClick={() => handleCancel(entry.id)}
                            className="text-xs text-red-500 hover:text-red-700 transition-colors"
                          >
                            Cancelar
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
    </div>
  );
}