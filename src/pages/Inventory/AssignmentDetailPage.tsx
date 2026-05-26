// src/pages/inventory/AssignmentDetailPage.tsx (NUEVO)

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  User,
  Calendar,
  MapPin,
  FileText,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { AssignmentDocumentManager } from '../../components/Inventory/AssignmentDocumentManager';
import inventoryApi from '../../services/inventoryApi';
import type { AssetAssignment } from '../../types/inventory';

const statusColors = {
  active: 'bg-blue-100 text-blue-800',
  returned: 'bg-green-100 text-green-800',
  transferred: 'bg-purple-100 text-purple-800',
  lost: 'bg-red-100 text-red-800',
  damaged: 'bg-orange-100 text-orange-800',
};

const statusLabels = {
  active: 'Activa',
  returned: 'Devuelta',
  transferred: 'Transferida',
  lost: 'Perdido',
  damaged: 'Dañado'
};

const getConditionLabel = (condition: string | undefined): string => {
  if (!condition) return 'No especificada';
  
  const conditionMap: Record<string, string> = {
    'excellent': 'Excelente',
    'good': 'Bueno',
    'fair': 'Regular',
    'poor': 'Malo'
  };
  
  return conditionMap[condition] || condition;
};

const AssignmentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<AssetAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadAssignment(parseInt(id));
    }
  }, [id]);

  const loadAssignment = async (assignmentId: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await inventoryApi.getAssignment(assignmentId);
      setAssignment(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar la asignación');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
        </div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-2 text-sm text-red-700">
                {error || 'Asignación no encontrada'}
              </p>
              <div className="mt-4">
                <button
                  onClick={() => navigate('/inventory/assignments')}
                  className="text-sm font-medium text-red-600 hover:text-red-500"
                >
                  Volver a Asignaciones
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Link
            to="/inventory/assignments"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver a Asignaciones
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Asignación #{assignment.id}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Detalles completos de la asignación
              </p>
            </div>
            
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[assignment.status]}`}>
              {statusLabels[assignment.status]}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Datos del Activo */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Package className="h-5 w-5 mr-2 text-emerald-600" />
                  Activo Asignado
                </h2>
              </div>
              <div className="px-6 py-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Nombre</p>
                    <p className="text-sm font-medium text-gray-900">
                      {assignment.tech_asset_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Número de Serie</p>
                    <p className="text-sm font-medium text-gray-900">
                      {assignment.tech_asset_serial || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Marca / Modelo</p>
                    <p className="text-sm font-medium text-gray-900">
                      {assignment.tech_asset_brand} {assignment.tech_asset_model}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Asset Tag</p>
                    <p className="text-sm font-medium text-gray-900">
                      {assignment.tech_asset_asset_tag || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Datos del Usuario */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <User className="h-5 w-5 mr-2 text-emerald-600" />
                  Usuario Asignado
                </h2>
              </div>
              <div className="px-6 py-4">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                    <User className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">
                      {assignment.assigned_to_name}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detalles de la Asignación */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-emerald-600" />
                  Detalles de la Asignación
                </h2>
              </div>
              <div className="px-6 py-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1" />
                      Fecha de Asignación
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(assignment.assigned_date).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                  
                  {assignment.expected_return_date && (
                    <div>
                      <p className="text-xs text-gray-500 flex items-center">
                        <Calendar className="h-3.5 w-3.5 mr-1" />
                        Fecha de Retorno Esperada
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(assignment.expected_return_date).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                  )}

                  {assignment.location_of_use && (
                    <div>
                      <p className="text-xs text-gray-500 flex items-center">
                        <MapPin className="h-3.5 w-3.5 mr-1" />
                        Ubicación de Uso
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {assignment.location_of_use}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-gray-500">Condición al Asignar</p>
                    <p className="text-sm font-medium text-gray-900">
                      {getConditionLabel(assignment.condition_at_assignment) || 'No especificada'}
                    </p>
                  </div>
                </div>

                {assignment.accessories && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Accesorios Incluidos</p>
                    <p className="text-sm text-gray-900">
                      {assignment.accessories}
                    </p>
                  </div>
                )}

                {assignment.assignment_notes && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Notas</p>
                    <p className="text-sm text-gray-900">
                      {assignment.assignment_notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Documentos */}
          <div className="lg:col-span-1">
            <AssignmentDocumentManager
              assignment={assignment}
              onDocumentSent={() => {
                loadAssignment(assignment.id);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetailPage;