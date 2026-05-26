import React, { useState, useEffect } from 'react';
import {
  Package,
  Calendar,
  MapPin,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Search,
  X,
  Eye
} from 'lucide-react';
import inventoryApi from '../../services/inventoryApi';
import { AssetAssignment } from '../../types/inventory';
import { Link } from 'react-router-dom';

const MyAssetsPage: React.FC = () => {
  const [assignments, setAssignments] = useState<AssetAssignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<AssetAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory] = useState<string>('');

  useEffect(() => {
    loadMyAssets();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [assignments, searchTerm, filterCategory]);

  const loadMyAssets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await inventoryApi.getMyAssignments();
      setAssignments(data);
    } catch (err) {
      console.error('Error cargando mis activos:', err);
      setError('No se pudieron cargar tus activos asignados');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...assignments];

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(assignment =>
        assignment.tech_asset_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.tech_asset_serial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.tech_asset_asset_tag?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por categoría (si tenemos esa info)
    if (filterCategory) {
      // Nota: necesitaríamos agregar category al AssetAssignmentWithDetails
      // Por ahora lo dejamos preparado
    }

    setFilteredAssignments(filtered);
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
      'project': 'Proyecto',
      'replacement': 'Reemplazo',
      'new_hire': 'Nuevo empleado',
      'upgrade': 'Actualización',
      'testing': 'Pruebas',
      'training': 'Capacitación',
      'other': 'Otro'
    };

    return reasonMap[reason] || reason;
  };

  const getConditionBadge = (condition: string | undefined) => {
    if (!condition) return null;

    const conditionConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
      'excellent': {
        label: 'Excelente',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: <CheckCircle className="h-4 w-4" />
      },
      'good': {
        label: 'Bueno',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: <CheckCircle className="h-4 w-4" />
      },
      'fair': {
        label: 'Regular',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: <AlertCircle className="h-4 w-4" />
      },
      'poor': {
        label: 'Malo',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: <AlertCircle className="h-4 w-4" />
      }
    };

    const config = conditionConfig[condition] || conditionConfig['good'];

    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        {config.icon}
        <span className="ml-1">{config.label}</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-800 font-medium">{error}</p>
          <button
            onClick={loadMyAssets}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center">
                  <Package className="h-8 w-8 mr-3" />
                  Mis Activos Asignados
                </h1>
                <p className="text-emerald-100 mt-2">
                  Equipos y recursos actualmente bajo tu responsabilidad
                </p>
              </div>
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg px-6 py-4">
                <div className="text-center">
                  <p className="text-4xl font-bold text-white">{assignments.length}</p>
                  <p className="text-sm text-emerald-100 font-medium">Activo{assignments.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, serial o etiqueta..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lista de activos */}
        {filteredAssignments.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No se encontraron activos' : 'No tienes activos asignados'}
            </h3>
            <p className="text-gray-500">
              {searchTerm 
                ? 'Intenta con otro término de búsqueda' 
                : 'Cuando te asignen equipos, aparecerán aquí'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="bg-white shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-shadow border border-gray-200"
              >
                {/* Header del card */}
                <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {assignment.tech_asset_name || 'Activo sin nombre'}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                          {assignment.tech_asset_asset_tag || 'Sin etiqueta'}
                        </span>
                        {assignment.tech_asset_brand && assignment.tech_asset_model && (
                          <span>
                            {assignment.tech_asset_brand} {assignment.tech_asset_model}
                          </span>
                        )}
                      </div>
                    </div>
                    <Link
                      to={`/inventory/tech-assets/${assignment.tech_asset_id}`}
                      className="text-emerald-600 hover:text-emerald-700 p-2 rounded-full hover:bg-emerald-50 transition-colors"
                      title="Ver detalles"
                    >
                      <Eye className="h-5 w-5" />
                    </Link>
                  </div>
                </div>

                {/* Contenido del card */}
                <div className="px-6 py-5 space-y-4">
                  {/* Fecha de asignación */}
                  <div className="flex items-center text-sm">
                    <Calendar className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-gray-600 font-medium">Asignado desde:</p>
                      <p className="text-gray-900">{formatDate(assignment.assigned_date)}</p>
                    </div>
                  </div>

                  {/* Fecha esperada de devolución */}
                  {assignment.expected_return_date && (
                    <div className="flex items-center text-sm">
                      <Clock className="h-5 w-5 text-orange-500 mr-3 flex-shrink-0" />
                      <div>
                        <p className="text-gray-600 font-medium">Devolución esperada:</p>
                        <p className="text-gray-900">{formatDate(assignment.expected_return_date)}</p>
                      </div>
                    </div>
                  )}

                  {/* Ubicación */}
                  {assignment.location_of_use && (
                    <div className="flex items-center text-sm">
                      <MapPin className="h-5 w-5 text-purple-500 mr-3 flex-shrink-0" />
                      <div>
                        <p className="text-gray-600 font-medium">Ubicación:</p>
                        <p className="text-gray-900">{assignment.location_of_use}</p>
                      </div>
                    </div>
                  )}

                  {/* Motivo */}
                  <div className="flex items-center text-sm">
                    <FileText className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-gray-600 font-medium">Motivo:</p>
                      <p className="text-gray-900">{formatAssignmentReason(assignment.assignment_reason)}</p>
                    </div>
                  </div>

                  {/* Condición */}
                  {assignment.condition_at_assignment && (
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-600 font-medium mb-2">Condición al recibirlo:</p>
                      {getConditionBadge(assignment.condition_at_assignment)}
                    </div>
                  )}

                  {/* Notas */}
                  {assignment.assignment_notes && (
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-600 font-medium mb-2">Notas importantes:</p>
                      <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg border border-blue-200">
                        {assignment.assignment_notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer - Información adicional */}
                {assignment.tech_asset_serial && (
                  <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      <span className="font-medium">N° Serie:</span> {assignment.tech_asset_serial}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Info footer */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">¿Necesitas reportar un problema?</p>
              <p>
                Si encuentras algún desperfecto o necesitas devolver un equipo, 
                contacta a tu supervisor o al departamento de TI.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyAssetsPage;
