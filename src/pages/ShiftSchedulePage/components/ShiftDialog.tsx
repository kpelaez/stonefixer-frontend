// src/pages/ShiftSchedulePage/components/ShiftDialog.tsx
import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ShiftSchedule, ShiftScheduleCreate, ShiftType } from '../../../types/shiftSchedule';
import shiftScheduleService from '../../../services/shiftScheduleService';
import { useAuthStore } from '../../../stores/authStore';

interface ShiftDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string | null;
  existingShift: ShiftSchedule | null;
  onShiftCreated: () => void;
  onShiftUpdated: () => void;
  onShiftDeleted: () => void;
}

const ShiftDialog = ({
  isOpen,
  onClose,
  selectedDate,
  existingShift,
  onShiftCreated,
  onShiftUpdated,
  onShiftDeleted,
}: ShiftDialogProps) => {
  const [shiftType, setShiftType] = useState<ShiftType>('regular');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!existingShift;
//   const isMyShift = existingShift?.user_id === getCurrentUserId(); // Necesitarás implementar esto
const currentUserId = useAuthStore(state => state.user?.id) || 1;
const isMyShift = existingShift?.user_id === currentUserId;

  useEffect(() => {
    if (existingShift) {
      setShiftType(existingShift.shift_type);
      setNotes(existingShift.notes || '');
    } else {
      setShiftType('regular');
      setNotes('');
    }
    setError(null);
  }, [existingShift]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate) return;

    try {
      setLoading(true);
      setError(null);

      if (isEditing && existingShift) {
        // Actualizar turno existente
        await shiftScheduleService.updateShiftSchedule(existingShift.id, {
          shift_type: shiftType,
          notes: notes.trim() || undefined,
        });
        onShiftUpdated();
      } else {
        // Crear nuevo turno
        const newShift: ShiftScheduleCreate = {
          date: selectedDate,
          shift_type: shiftType,
          notes: notes.trim() || undefined,
        };
        await shiftScheduleService.createShiftSchedule(newShift);
        onShiftCreated();
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingShift) return;

    const confirmed = window.confirm(
      '¿Estás seguro de que quieres cancelar este turno?'
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setError(null);
      
      await shiftScheduleService.deleteShiftSchedule(existingShift.id);
      onShiftDeleted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const formattedDate = selectedDate
    ? format(parseISO(selectedDate), "EEEE d 'de' MMMM, yyyy", { locale: es })
    : '';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="bg-emerald-600 text-white px-6 py-4 rounded-t-lg">
          <h2 className="text-xl font-bold">
            {isEditing ? '✏️ Editar Turno' : '➕ Nuevo Turno'}
          </h2>
          <p className="text-emerald-100 text-sm mt-1 capitalize">
            {formattedDate}
          </p>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Mostrar info del usuario si es un turno existente */}
          {existingShift && (
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <p className="text-sm text-gray-600">Asignado a:</p>
              <p className="font-semibold text-gray-800">
                {existingShift.user_full_name}
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">❌ {error}</p>
            </div>
          )}

          {/* Tipo de turno */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Turno
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShiftType('early')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  shiftType === 'early'
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-orange-300'
                }`}
              >
                <div className="text-2xl mb-1">🌅</div>
                <div className="font-semibold">Early</div>
                <div className="text-xs">7:00 AM</div>
              </button>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Notas (opcional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Agrega alguna nota sobre este turno..."
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              {notes.length}/500 caracteres
            </p>
          </div>

          {/* Acciones */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            {isEditing && isMyShift ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                🗑️ Cancelar Turno
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Cerrar
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center">
                    <span className="animate-spin mr-2">⏳</span>
                    Guardando...
                  </span>
                ) : (
                  <span>{isEditing ? 'Actualizar' : 'Crear Turno'}</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShiftDialog;