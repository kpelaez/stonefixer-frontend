// 🎨 MODAL MEJORADO - AssignmentHistoryModal.tsx (VERSIÓN 2.0)

import React, { useState, useEffect } from 'react';
import { X, History, User, Calendar, FileText, MapPin, AlertCircle, Clock } from 'lucide-react';
import inventoryApi from '../../services/inventoryApi';
import { AssetAssignment } from '../../types/inventory';

interface AssignmentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetId: number;
  assetName: string;
}

const AssignmentHistoryModal: React.FC<AssignmentHistoryModalProps> = ({
  isOpen,
  onClose,
  assetId,
  assetName
}) => {
  const [assignments, setAssignments] = useState<AssetAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && assetId) {
      loadHistory();
    }
  }, [isOpen, assetId]);

  const loadHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const history = await inventoryApi.getAssetAssignmentHistory(assetId);
      setAssignments(history);
    } catch (err) {
      console.error('Error cargando historial:', err);
      setError('No se pudo cargar el historial de asignaciones');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { 
        label: 'Activa', 
        color: 'bg-green-100 text-green-800 border border-green-200',
      },
      returned: { 
        label: 'Devuelta', 
        color: 'bg-gray-100 text-gray-700 border border-gray-200',
      },
      transferred: { 
        label: 'Transferida', 
        color: 'bg-blue-100 text-blue-800 border border-blue-200',
      },
      canceled: { 
        label: 'Cancelada', 
        color: 'bg-red-100 text-red-800 border border-red-200',
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { 
      label: status, 
      color: 'bg-gray-100 text-gray-800 border border-gray-200',
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatAssignmentReason = (reason: string | undefined): string => {
  if (!reason) return '—';
  
  const reasonMap: Record<string, string> = {
    'work_assignment': 'Asignación de trabajo',
    'permanent_assignment': 'Asignación permanente',
    'temporary_assignment': 'Asignación temporal',
    'project': 'Asignación por proyecto',
    'replacement': 'Reemplazo de equipo',
    'new_hire': 'Nuevo empleado',
    'upgrade': 'Actualización de equipo',
    'testing': 'Equipo de prueba',
    'training': 'Capacitación',
    'other': 'Otro motivo'
  };

  return reasonMap[reason] || reason;
};

  const calculateDuration = (startDate: string, endDate?: string) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (days < 30) return `${days} día${days !== 1 ? 's' : ''}`;
    if (days < 365) return `${Math.floor(days / 30)} mes${Math.floor(days / 30) !== 1 ? 'es' : ''}`;
    return `${Math.floor(days / 365)} año${Math.floor(days / 365) !== 1 ? 's' : ''}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay con blur */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal centrado con tamaño optimizado */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl transform transition-all w-full max-w-3xl max-h-[85vh] flex flex-col">
          
          {/* Header mejorado */}
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-5 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center">
                  <History className="h-6 w-6 text-white" />
                </div>
                <div className="text-white">
                  <h3 className="text-xl font-bold">
                    Historial de Asignaciones
                  </h3>
                  <p className="text-sm text-emerald-100 mt-1">
                    {assetName}
                  </p>
                </div>
              </div>
              
              {/* Botón de cierre destacado */}
              <button
                onClick={onClose}
                className="flex-shrink-0 h-10 w-10 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-all flex items-center justify-center group"
                title="Cerrar"
              >
                <X className="h-5 w-5 text-white group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>

          {/* Body con scroll optimizado */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {isLoading ? (
              <div className="flex flex-col justify-center items-center py-16">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-600" />
                <p className="mt-4 text-sm text-gray-500 font-medium">Cargando historial...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="bg-red-50 rounded-full p-4 mb-4">
                  <AlertCircle className="h-12 w-12 text-red-500" />
                </div>
                <p className="text-base font-medium text-gray-900 mb-2">Error al cargar</p>
                <p className="text-sm text-gray-500 text-center max-w-md">{error}</p>
                <button
                  onClick={loadHistory}
                  className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Reintentar
                </button>
              </div>
            ) : assignments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="bg-gray-100 rounded-full p-4 mb-4">
                  <History className="h-12 w-12 text-gray-400" />
                </div>
                <p className="text-base font-medium text-gray-900 mb-2">Sin historial</p>
                <p className="text-sm text-gray-500 text-center max-w-md">
                  Este activo no tiene asignaciones registradas aún
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Estadísticas rápidas */}
                <div className="grid grid-cols-3 gap-4 pb-4 border-b border-gray-200">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-600">
                      {assignments.filter(a => a.status === 'active').length}
                    </p>
                    <p className="text-xs text-gray-600 font-medium">Activa</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-600">
                      {assignments.filter(a => a.status === 'returned').length}
                    </p>
                    <p className="text-xs text-gray-600 font-medium">Devueltas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-800">
                      {assignments.length}
                    </p>
                    <p className="text-xs text-gray-600 font-medium">Total</p>
                  </div>
                </div>

                {/* Timeline mejorado */}
                <div className="relative">
                  {assignments.map((assignment, idx) => (
                    <div key={assignment.id} className="relative pb-8 last:pb-0">
                      {/* Línea conectora */}
                      {idx !== assignments.length - 1 && (
                        <span
                          className="absolute top-10 left-5 w-0.5 h-full bg-gradient-to-b from-gray-300 to-gray-200"
                          aria-hidden="true"
                        />
                      )}

                      <div className="relative flex gap-4">
                        {/* Ícono con estado */}
                        <div className="flex-shrink-0">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ring-4 ring-white shadow-md ${
                            assignment.status === 'active' 
                              ? 'bg-gradient-to-br from-green-400 to-green-600' 
                              : assignment.status === 'returned'
                              ? 'bg-gradient-to-br from-gray-300 to-gray-400'
                              : assignment.status === 'transferred'
                              ? 'bg-gradient-to-br from-blue-400 to-blue-600'
                              : 'bg-gradient-to-br from-red-400 to-red-600'
                          }`}>
                            <User className="h-5 w-5 text-white" />
                          </div>
                        </div>

                        {/* Card de asignación */}
                        <div className="flex-1 bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                          {/* Header del card */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="text-base font-bold text-gray-900">
                                {assignment.assigned_to_name || 'Usuario desconocido'}
                              </h4>
                            </div>
                            {getStatusBadge(assignment.status)}
                          </div>

                          {/* Información principal */}
                          <div className="space-y-2.5">
                            {/* Fechas */}
                            <div className="flex items-center gap-6 text-sm">
                              <div className="flex items-center text-gray-700">
                                <Calendar className="h-4 w-4 mr-2 text-emerald-500" />
                                <span className="font-medium mr-1">Desde:</span>
                                <span>{formatDate(assignment.assigned_date)}</span>
                              </div>

                              {assignment.actual_return_date && (
                                <div className="flex items-center text-gray-700">
                                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                  <span className="font-medium mr-1">Hasta:</span>
                                  <span>{formatDate(assignment.actual_return_date)}</span>
                                </div>
                              )}
                            </div>

                            {/* Duración */}
                            <div className="flex items-center text-sm text-gray-600">
                              <Clock className="h-4 w-4 mr-2 text-blue-500" />
                              <span className="font-medium mr-1">Duración:</span>
                              <span>{calculateDuration(assignment.assigned_date, assignment.actual_return_date)}</span>
                            </div>

                            {/* Ubicación */}
                            {assignment.location_of_use && (
                              <div className="flex items-center text-sm text-gray-600">
                                <MapPin className="h-4 w-4 mr-2 text-purple-500" />
                                <span className="font-medium mr-1">Ubicación:</span>
                                <span>{assignment.location_of_use}</span>
                              </div>
                            )}

                            {/* Razón */}
                            {assignment.assignment_reason && (
                              <div className="flex items-start text-sm text-gray-600">
                                <FileText className="h-4 w-4 mr-2 text-orange-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <span className="font-medium">Motivo:</span>
                                  <span className="ml-1">{formatAssignmentReason(assignment.assignment_reason)}</span>
                                </div>
                              </div>
                            )}

                            {/* Notas en cards diferenciados */}
                            {assignment.assignment_notes && (
                              <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-xs font-semibold text-blue-900 mb-1"> Notas de asignación:</p>
                                <p className="text-sm text-blue-800">{assignment.assignment_notes}</p>
                              </div>
                            )}

                            {assignment.return_notes && (
                              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <p className="text-xs font-semibold text-amber-900 mb-1"> Notas de devolución:</p>
                                <p className="text-sm text-amber-800">{assignment.return_notes}</p>
                              </div>
                            )}
                          </div>

                          {/* Footer del card */}
                          {assignment.assigned_by_name && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs text-gray-500">
                                <span className="font-medium">Asignado por:</span> {assignment.assigned_by_name}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer mejorado */}
          <div className="bg-gray-50 px-6 py-4 rounded-b-xl border-t border-gray-200 flex justify-between items-center">
            <p className="text-sm text-gray-600 font-medium">
              {assignments.length} asignación{assignments.length !== 1 ? 'es' : ''} registrada{assignments.length !== 1 ? 's' : ''}
            </p>
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentHistoryModal;