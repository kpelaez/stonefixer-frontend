// src/pages/Inventory/MaintenancePage.tsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Settings,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Play,
  CheckCircle,
  X,
  Calendar,
  Clock,
  AlertTriangle,
  Package,
  User,
} from 'lucide-react';
import {useInventoryStore} from '../../stores/inventoryStore';

interface Maintenance {
  id: number;
  tech_asset_id: number;
  type: 'preventive' | 'corrective' | 'emergency';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  scheduled_date: string;
  started_date?: string;
  completed_date?: string;
  description: string;
  estimated_duration_hours?: number;
  actual_duration_hours?: number;
  cost?: number;
  notes?: string;
  tech_asset: {
    id: number;
    asset_tag: string;
    name: string;
    category: string;
    brand: string;
    model: string;
  };
  requested_by_user: {
    id: number;
    full_name: string;
  };
  assigned_technician?: {
    id: number;
    full_name: string;
  };
}

const statusColors = {
  scheduled: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800'
};

const statusLabels = {
  scheduled: 'Programado',
  in_progress: 'En Progreso',
  completed: 'Completado',
  cancelled: 'Cancelado'
};

const priorityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

const priorityLabels = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica'
};

const typeColors = {
  preventive: 'bg-blue-100 text-blue-800',
  corrective: 'bg-orange-100 text-orange-800',
  emergency: 'bg-red-100 text-red-800'
};

const typeLabels = {
  preventive: 'Preventivo',
  corrective: 'Correctivo',
  emergency: 'Emergencia'
};

const MaintenancePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMaintenances, setSelectedMaintenances] = useState<number[]>([]);

  const {
    fetchMaintenances,
    startMaintenance,
    completeMaintenance,
    cancelMaintenance,
    isLoading,
    error,
    clearError
  } = useInventoryStore();

  // Mock data para desarrollo - En producción vendría del store
  const [mockMaintenances] = useState<Maintenance[]>([
    {
      id: 1,
      tech_asset_id: 1,
      type: 'preventive',
      status: 'scheduled',
      priority: 'medium',
      scheduled_date: '2025-08-20',
      description: 'Mantenimiento preventivo trimestral - Limpieza y actualización de software',
      estimated_duration_hours: 2,
      tech_asset: {
        id: 1,
        asset_tag: 'LAP-001',
        name: 'MacBook Pro 13"',
        category: 'laptop',
        brand: 'Apple',
        model: 'M2 Pro'
      },
      requested_by_user: {
        id: 1,
        full_name: 'Juan Pérez'
      }
    },
    {
      id: 2,
      tech_asset_id: 2,
      type: 'corrective',
      status: 'in_progress',
      priority: 'high',
      scheduled_date: '2025-08-15',
      started_date: '2025-08-15',
      description: 'Reparación de pantalla con líneas verticales',
      estimated_duration_hours: 4,
      tech_asset: {
        id: 2,
        asset_tag: 'MON-002',
        name: 'Monitor Dell UltraSharp',
        category: 'monitor',
        brand: 'Dell',
        model: '27" 4K'
      },
      requested_by_user: {
        id: 2,
        full_name: 'María González'
      },
      assigned_technician: {
        id: 3,
        full_name: 'Carlos Técnico'
      }
    },
    {
      id: 3,
      tech_asset_id: 3,
      type: 'emergency',
      status: 'completed',
      priority: 'critical',
      scheduled_date: '2025-08-10',
      started_date: '2025-08-10',
      completed_date: '2025-08-10',
      description: 'Servidor no responde - Falla crítica de hardware',
      estimated_duration_hours: 8,
      actual_duration_hours: 6,
      cost: 450.00,
      tech_asset: {
        id: 3,
        asset_tag: 'SRV-001',
        name: 'Servidor Principal',
        category: 'server',
        brand: 'HP',
        model: 'ProLiant DL380'
      },
      requested_by_user: {
        id: 1,
        full_name: 'Juan Pérez'
      },
      assigned_technician: {
        id: 3,
        full_name: 'Carlos Técnico'
      }
    }
  ]);

  // Cargar mantenimientos al montar el componente
  useEffect(() => {
    fetchMaintenances();
  }, [fetchMaintenances]);

  // Manejar parámetros de URL
  useEffect(() => {
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');

    if (status) setSelectedStatus(status);
    if (type) setSelectedType(type);
    if (priority) setSelectedPriority(priority);
  }, [searchParams]);

  // Filtrar mantenimientos
  const filteredMaintenances = mockMaintenances.filter((maintenance: Maintenance) => {
    const matchesSearch = 
      maintenance.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      maintenance.tech_asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      maintenance.tech_asset.asset_tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      maintenance.requested_by_user.full_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !selectedStatus || maintenance.status === selectedStatus;
    const matchesType = !selectedType || maintenance.type === selectedType;
    const matchesPriority = !selectedPriority || maintenance.priority === selectedPriority;

    return matchesSearch && matchesStatus && matchesType && matchesPriority;
  });

  const handleStartMaintenance = async (maintenanceId: number) => {
    const notes = prompt('Notas al iniciar el mantenimiento (opcional):');
    
    try {
      await startMaintenance(maintenanceId, notes || '');
    } catch (error) {
      console.error('Error al iniciar mantenimiento:', error);
    }
  };

  const handleCompleteMaintenance = async (maintenanceId: number) => {
    const cost = prompt('Costo del mantenimiento (opcional):');
    const notes = prompt('Notas de finalización (opcional):');
    
    try {
      await completeMaintenance(maintenanceId, {
        cost: cost ? parseFloat(cost) : undefined,
        completion_notes: notes || ''
      });
    } catch (error) {
      console.error('Error al completar mantenimiento:', error);
    }
  };

  const handleCancelMaintenance = async (maintenanceId: number) => {
    const reason = prompt('Razón de la cancelación:');
    if (!reason) return;

    try {
      await cancelMaintenance(maintenanceId, reason);
    } catch (error) {
      console.error('Error al cancelar mantenimiento:', error);
    }
  };

  const toggleMaintenanceSelection = (maintenanceId: number) => {
    setSelectedMaintenances(prev =>
      prev.includes(maintenanceId)
        ? prev.filter(id => id !== maintenanceId)
        : [...prev, maintenanceId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedMaintenances(
      selectedMaintenances.length === filteredMaintenances.length
        ? []
        : filteredMaintenances.map((maintenance: Maintenance) => maintenance.id)
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Calendar className="h-4 w-4" />;
      case 'in_progress':
        return <Clock className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <X className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const isOverdue = (maintenance: Maintenance) => {
    return maintenance.status === 'scheduled' && 
           new Date(maintenance.scheduled_date) < new Date();
  };

  if (error) {
    return (
      <div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => {
                    clearError();
                    fetchMaintenances();
                  }}
                  className="text-sm font-medium text-red-600 hover:text-red-500"
                >
                  Reintentar
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
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestión de Mantenimientos</h2>
            <p className="mt-1 text-sm text-gray-500">
              Administra el mantenimiento preventivo y correctivo de activos tecnológicos
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <Link
              to="/inventory/maintenance/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Programar Mantenimiento
            </Link>
          </div>
        </div>

        {/* Alertas de mantenimientos vencidos */}
        {filteredMaintenances.some(m => isOverdue(m)) && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Mantenimientos Vencidos</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>Hay {filteredMaintenances.filter(m => isOverdue(m)).length} mantenimiento(s) que requieren atención inmediata.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtros y búsqueda */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por descripción, activo o solicitante..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Botón de filtros */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </button>

            {/* Exportar */}
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <Download className="h-4 w-4" />
            </button>
          </div>

          {/* Panel de filtros expandible */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Todos</option>
                    <option value="scheduled">Programado</option>
                    <option value="in_progress">En Progreso</option>
                    <option value="completed">Completado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Todos</option>
                    <option value="preventive">Preventivo</option>
                    <option value="corrective">Correctivo</option>
                    <option value="emergency">Emergencia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prioridad
                  </label>
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Todas</option>
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                    <option value="critical">Crítica</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSelectedStatus('');
                      setSelectedType('');
                      setSelectedPriority('');
                      setSearchTerm('');
                    }}
                    className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Limpiar Filtros
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Acciones masivas */}
        {selectedMaintenances.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-sm text-blue-800">
                  {selectedMaintenances.length} mantenimiento(s) seleccionado(s)
                </span>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md">
                  Exportar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabla de mantenimientos */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
          ) : filteredMaintenances.length === 0 ? (
            <div className="text-center py-12">
              <Settings className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay mantenimientos</h3>
              <p className="mt-1 text-sm text-gray-500">
                {mockMaintenances.length === 0 
                  ? 'Comienza programando tu primer mantenimiento.'
                  : 'No se encontraron mantenimientos que coincidan con los filtros aplicados.'
                }
              </p>
              <div className="mt-6">
                <Link
                  to="/inventory/maintenance/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Programar Mantenimiento
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedMaintenances.length === filteredMaintenances.length}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Activo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prioridad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Programada
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Solicitado Por
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMaintenances.map((maintenance: Maintenance) => (
                    <tr 
                      key={maintenance.id} 
                      className={`hover:bg-gray-50 ${isOverdue(maintenance) ? 'bg-red-50' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedMaintenances.includes(maintenance.id)}
                          onChange={() => toggleMaintenanceSelection(maintenance.id)}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                              <Package className="h-5 w-5 text-gray-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {maintenance.tech_asset.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {maintenance.tech_asset.asset_tag} • {maintenance.tech_asset.brand} {maintenance.tech_asset.model}
                            </div>
                            <div className="text-xs text-gray-400 mt-1 max-w-xs truncate">
                              {maintenance.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[maintenance.type]}`}>
                          {typeLabels[maintenance.type]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[maintenance.status]}`}>
                          {getStatusIcon(maintenance.status)}
                          <span className="ml-1">{statusLabels[maintenance.status]}</span>
                        </span>
                        {isOverdue(maintenance) && (
                          <div className="text-xs text-red-600 mt-1 font-medium">
                            ¡Vencido!
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[maintenance.priority]}`}>
                          {priorityLabels[maintenance.priority]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                          {new Date(maintenance.scheduled_date).toLocaleDateString('es-AR')}
                        </div>
                        {maintenance.estimated_duration_hours && (
                          <div className="text-xs text-gray-500 mt-1">
                            ~{maintenance.estimated_duration_hours}h estimadas
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                              <User className="h-4 w-4 text-emerald-600" />
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {maintenance.requested_by_user.full_name}
                            </div>
                            {maintenance.assigned_technician && (
                              <div className="text-xs text-gray-500">
                                Asignado: {maintenance.assigned_technician.full_name}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/inventory/maintenance/${maintenance.id}`}
                            className="text-emerald-600 hover:text-emerald-900"
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          
                          {maintenance.status === 'scheduled' && (
                            <button
                              onClick={() => handleStartMaintenance(maintenance.id)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Iniciar mantenimiento"
                            >
                              <Play className="h-4 w-4" />
                            </button>
                          )}
                          
                          {maintenance.status === 'in_progress' && (
                            <button
                              onClick={() => handleCompleteMaintenance(maintenance.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Completar mantenimiento"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          
                          {(maintenance.status === 'scheduled' || maintenance.status === 'in_progress') && (
                            <button
                              onClick={() => handleCancelMaintenance(maintenance.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Cancelar mantenimiento"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Estadísticas resumidas */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Resumen de Mantenimientos</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {filteredMaintenances.length}
              </div>
              <div className="text-sm text-gray-500">
                {filteredMaintenances.length === mockMaintenances.length ? 'Total' : 'Filtrados'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {filteredMaintenances.filter((m: Maintenance) => m.status === 'scheduled').length}
              </div>
              <div className="text-sm text-gray-500">Programados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {filteredMaintenances.filter((m: Maintenance) => m.status === 'in_progress').length}
              </div>
              <div className="text-sm text-gray-500">En Progreso</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {filteredMaintenances.filter((m: Maintenance) => m.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-500">Completados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {filteredMaintenances.filter((m: Maintenance) => isOverdue(m)).length}
              </div>
              <div className="text-sm text-gray-500">Vencidos</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;