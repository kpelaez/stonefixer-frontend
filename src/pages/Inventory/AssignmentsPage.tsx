import { useEffect, useState } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import {
  Plus, Search, Eye,
  ArrowLeftRight, RotateCcw, Calendar, User, Package,
  AlertCircle, CheckCircle, Clock,
} from 'lucide-react';
import { useInventoryStore } from '../../stores/inventoryStore';
import { Link, useSearchParams } from 'react-router-dom';
import { AssetAssignment, AssignmentStatus } from '../../types/inventory';
import Pagination from '../../components/Pagination/Pagination';
import toast from 'react-hot-toast';


const statusColors = {
  active: 'bg-blue-100 text-blue-800',
  returned: 'bg-green-100 text-green-800',
  transferred: 'bg-purple-100 text-purple-800',
  lost: 'bg-fuchsia-100 text-fuchsia-800',
  damaged: 'bg-red-100 text-red-800',
};

const statusLabels = {
  active: 'Activa',
  returned: 'Devuelta',
  transferred: 'Transferida',
  lost: 'Perdido',
  damaged: 'Dañado'
};

const statusOptions = [
  { value: '',            label: 'Todos los estados' },
  { value: 'active',      label: 'Activa' },
  { value: 'returned',    label: 'Devuelta' },
  { value: 'transferred', label: 'Transferida' },
  { value: 'lost',        label: 'Perdido' },
  { value: 'damaged',     label: 'Dañado' },
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'active':      return <Clock className="h-4 w-4" />;
    case 'returned':    return <CheckCircle className="h-4 w-4" />;
    case 'transferred': return <ArrowLeftRight className="h-4 w-4" />;
    default:            return <AlertCircle className="h-4 w-4" />;
  }
};

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const AssignmentsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Input local de búsqueda (no se envía al backend hasta el debounce)
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 500);

  // Estado local del filtro de status (se envía al backend al cambiar)
  const [selectedStatus, setSelectedStatus] = useState<AssignmentStatus | undefined>(
    searchParams.get('status') as AssignmentStatus ?? undefined
  );

  // ─── Store ────
  const assignments          = useInventoryStore(state => state.assignments);
  const totalAssignments     = useInventoryStore(state => state.totalAssignments);
  const currentPage          = useInventoryStore(state => state.assignmentsCurrentPage);
  const pageSize             = useInventoryStore(state => state.assignmentsPageSize);
  const assignmentSearchTerm = useInventoryStore(state => state.assignmentSearchTerm);
  const fetchAssignments     = useInventoryStore(state => state.fetchAssignments);
  const setAssignmentPage    = useInventoryStore(state => state.setAssignmentPage);
  const setAssignmentPageSize = useInventoryStore(state => state.setAssignmentPageSize);
  const setAssignmentSearchTerm = useInventoryStore(state => state.setAssignmentSearchTerm);
  const setAssignmentFilters = useInventoryStore(state => state.setAssignmentFilters);
  const returnAsset          = useInventoryStore(state => state.returnAsset);
  const transferAsset        = useInventoryStore(state => state.transferAsset);
  const isLoading            = useInventoryStore(state => state.isLoading);
  const error                = useInventoryStore(state => state.error);
  const clearError           = useInventoryStore(state => state.clearError);

  // Cargar asignaciones al montar el componente
  useEffect(() => {
    fetchAssignments(currentPage, pageSize);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, assignmentSearchTerm, selectedStatus]);

  // Sync del input de búsqueda al store (después del debounce)
  useEffect(() => {
    setAssignmentSearchTerm(debouncedSearch);
  }, [debouncedSearch]);

  // Sync del filtro de status al store cuando cambia
  useEffect(() => {
    setAssignmentFilters({ status: selectedStatus });
  }, [selectedStatus]);

  // Leer status inicial desde URL params
  useEffect(() => {
    const status = searchParams.get('status') as AssignmentStatus | null;
    setSelectedStatus(status ?? undefined);
  }, [searchParams]);


  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const raw = e.target.value;
    const value = raw !== '' ? (raw as AssignmentStatus) : undefined;
    setSelectedStatus(value);
    setAssignmentPage(1); // Resetear a página 1 al cambiar filtro
    // Actualizar URL param para que sea compartible
    if (value) {
      setSearchParams({ status: value });
    } else {
      setSearchParams({});
    }
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSelectedStatus(undefined);
    setAssignmentSearchTerm('');
    setAssignmentFilters({});
    setSearchParams({});
  };

  const handleReturnAsset = async (assignmentId: number) => {
    // TODO: Reemplazar prompt() por un modal real (es una deuda técnica)
    const notes = prompt('Notas sobre la devolución (opcional):');
    try {
      await returnAsset(assignmentId, {
        actual_return_date: new Date().toISOString().split('T')[0],
        condition_at_return: 'good',
        return_notes: notes || '',
      });
      toast.success('Activo devuelto exitosamente');
      fetchAssignments(currentPage, pageSize);
    } catch (err) {
      toast.error('Error al devolver el activo');
      console.error(err);
    }
  };

  const handleTransferAsset = async (assignmentId: number) => {
    // TODO: Reemplazar prompt() por un modal real
    const newUserId = prompt('ID del nuevo usuario:');
    if (!newUserId || isNaN(parseInt(newUserId))) return;
    const notes = prompt('Notas sobre la transferencia (opcional):');
    try {
      await transferAsset(assignmentId, parseInt(newUserId), notes || '');
      toast.success('Activo transferido exitosamente');
      fetchAssignments(currentPage, pageSize);
    } catch (err) {
      toast.error('Error al transferir el activo');
      console.error(err);
    }
  };

  const hasActiveFilters = searchInput || selectedStatus;

  // ─── Render: Error ───
  if (error) {
    return (
      <div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-2 text-sm text-red-700">{error}</p>
              <button
                onClick={() => { clearError(); fetchAssignments(); }}
                className="mt-4 text-sm font-medium text-red-600 hover:text-red-500"
              >
                Reintentar
              </button>
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
            <h2 className="text-2xl font-bold text-gray-900">Gestión de Asignaciones</h2>
            <p className="mt-1 text-sm text-gray-500">
              {totalAssignments > 0
                ? `${totalAssignments} asignaciones en total`
                : 'Sin asignaciones registradas'}
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link
              to="/inventory/assignments/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Asignación
            </Link>
          </div>
        </div>

        {/* Barra de búsqueda y filtros */}
        <div className="bg-white p-4 rounded-lg shadow space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">

            {/* Búsqueda */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por activo, serial, empleado..."
                value={searchInput}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Filtro de estado */}
            <select
              value={selectedStatus}
              onChange={handleStatusChange}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-emerald-500 focus:border-emerald-500"
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {/* Limpiar filtros */}
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
              <span className="ml-3 text-gray-500 text-sm">Cargando asignaciones...</span>
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Sin resultados</h3>
              <p className="mt-1 text-sm text-gray-500">
                {hasActiveFilters
                  ? 'No se encontraron asignaciones con los filtros aplicados.'
                  : 'No hay asignaciones registradas.'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="mt-3 text-sm text-emerald-600 hover:text-emerald-800"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Activo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empleado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Asignación
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Asignado por
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assignments.map((assignment: AssetAssignment) => (
                    <tr key={assignment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Package className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {assignment.tech_asset_name ?? `Activo #${assignment.tech_asset_id}`}
                            </div>
                            <div className="text-xs text-gray-500">
                              {assignment.tech_asset_brand} {assignment.tech_asset_model}
                            </div>
                            {assignment.tech_asset_asset_tag && (
                              <div className="text-xs text-gray-400">
                                Tag: {assignment.tech_asset_asset_tag}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                          <div className="text-sm text-gray-900">
                            {assignment.assigned_to_name ?? `Usuario #${assignment.assigned_to_user_id}`}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                            statusColors[assignment.status] ?? 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {getStatusIcon(assignment.status)}
                          {statusLabels[assignment.status] ?? assignment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                          {formatDate(assignment.assigned_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {assignment.assigned_by_name ?? '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            to={`/inventory/assignments/${assignment.id}`}
                            className="text-emerald-600 hover:text-emerald-900"
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          {assignment.status === 'active' && (
                            <>
                              <button
                                onClick={() => handleReturnAsset(assignment.id)}
                                className="text-green-600 hover:text-green-900"
                                title="Devolver activo"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleTransferAsset(assignment.id)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Transferir activo"
                              >
                                <ArrowLeftRight className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginación */}
          {totalAssignments > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(totalAssignments / pageSize)}
              totalItems={totalAssignments}
              itemsPerPage={pageSize}
              onPageChange={setAssignmentPage}
              onItemsPerPageChange={setAssignmentPageSize}
              showItemsPerPage={true}
            />
          )}
        </div>

        {/* Resumen */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Resumen de Asignaciones</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{totalAssignments}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {assignments.filter(a => a.status === 'active').length}
              </div>
              <div className="text-sm text-gray-500">Activas (pág. actual)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {assignments.filter(a => a.status === 'returned').length}
              </div>
              <div className="text-sm text-gray-500">Devueltas (pág. actual)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {assignments.filter(a => a.status === 'transferred').length}
              </div>
              <div className="text-sm text-gray-500">Transferidas (pág. actual)</div>
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-400 text-center">
            * Los contadores del resumen corresponden a la página actual.
            Para ver totales globales, usa el filtro de estado.
          </p>
        </div>

      </div>
    </div>
  );
};

export default AssignmentsPage;