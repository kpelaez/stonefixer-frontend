import { useEffect, useState} from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import {useInventoryStore} from '../../stores/inventoryStore';
import { TechAsset } from '../../types/inventory';
import  AssignmentHistoryModal  from '../../components/Inventory/AssignmentHistoryModal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { Package, Plus, Search, Filter, Download, Upload, Edit, Trash2, Eye, MapPin, AlertCircle, Locate, User, History, Loader2 } from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';
import Pagination from '../../components/Pagination/Pagination';
import toast from 'react-hot-toast';


const statusColors = {
    available: 'bg-green-100 text-green-800',
    assigned: 'bg-blue-100 text-blue-800',
    in_maintenance: 'bg-yellow-100 text-yellow-800',
    out_of_order: 'bg-red-100 text-red-800',
    retired: 'bg-gray-100 text-gray-800'
};

const statusLabels = {
    available: 'Disponible',
    assigned: 'Asignado',
    in_maintenance: 'En Mantenimiento',
    out_of_order: 'Fuera de servicio',
    retired: 'Retirado'
};

const categoryColors = {
    'Notebook': 'bg-purple-100 text-purple-800',
    'Desktop': 'bg-blue-100 text-blue-800',
    'Monitor': 'bg-green-100 text-green-800',
    'Impresora': 'bg-orange-100 text-orange-800',
    'Tablet': 'bg-cyan-100 text-cyan-800',
    'Mouse':'bg-indigo-100 text-indigo-800',
    'Keyboard':'bg-yellow-100 text-yellow-800',
    'Celular': 'bg-pink-100 text-pink-800',
    'Server': 'bg-red-100 text-red-800',
    'Accesorios': 'bg-gray-100 text-gray-800',
    'Software': 'bg-teal-100 text-teal-800',
    'Cable':'bg-slate-100 text-slate-800',
    'Otro': 'bg-neutral-100 text-neutral-800',
};


const TechAssetsPage = () => {
  const [searchParams] = useSearchParams();
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<number[]>([]);
  const [filterAssignment, setFilterAssignment] = useState<string>('');

  // Estado local para el input (no dispara búsqueda inmediatamente)
  const [searchInput, setSearchInput] = useState('');

  // States para History Modal
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedAssetForHistory, setSelectedAssetForHistory] = useState<{
    id: number;
    name: string;
  } | null>(null);

  // Estados para el ConfirmDialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    assetId: number | null;
    assetName: string;
  }>({
    isOpen: false,
    assetId: null,
    assetName: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Usando hook Propio useInventoryStore
  const techAssets = useInventoryStore(state => state.techAssets);
  const fetchTechAssets = useInventoryStore(state => state.fetchTechAssets);
  const deleteTechAsset = useInventoryStore(state => state.deleteTechAsset);
  const isLoading = useInventoryStore(state => state.isLoading);
  const error = useInventoryStore(state => state.error);
  const clearError = useInventoryStore(state => state.clearError);

  //Paginacion
  const totalAssets = useInventoryStore(state=> state.totalAssets);
  const currentPage = useInventoryStore(state=> state.currentPage);
  const itemsPerPage = useInventoryStore(state=> state.itemsPerPage);
  const setPage = useInventoryStore(state=> state.setPage);
  const setPageSize = useInventoryStore(state=> state.setPageSize);
  const setSearchTerm = useInventoryStore(state => state.setSearchTerm);
  const searchTerm = useInventoryStore(state => state.searchTerm);

  // Debounce de la búsqueda (espera 500ms después de que el usuario deja de escribir)
  const debouncedSearchInput = useDebounce(searchInput, 500);

  // Cuando el debounced search cambia, actualizar el store
  useEffect(() => {
    setSearchTerm(debouncedSearchInput);
  }, [debouncedSearchInput]);


  // Cargar activos al montar el componente
 useEffect(()=> {
    fetchTechAssets(currentPage, itemsPerPage);
}, [currentPage, itemsPerPage, searchTerm]);  // Recargar cuando cambie página o tamaño

  // Manejar parametros de URL
  useEffect(()=>{
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    if (status) setSelectedStatus(status);
    if (category) setSelectedCategory(category);
  }, [searchParams]);

  const displayedAssets = techAssets;

  // Handler del input de búsqueda
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);  // Actualiza el input inmediatamente
    // La búsqueda real se dispara después del debounce via useEffect
  };

  // Limpiar filtros
  const handleClearFilters = () => {
    setSelectedStatus('');
    setSelectedCategory('');
    setFilterAssignment('');
    setSearchInput('');  // ← Limpiar también el input de búsqueda
    setSearchTerm('');   // ← Y el término en el store
  };


  const handleDeleteAsset = (assetId: number, assetName: string) => {
  setConfirmDialog({
    isOpen: true,
    assetId,
    assetName,
  });
};

const handleConfirmDelete = async () => {
  if (!confirmDialog.assetId) return;

  setIsDeleting(true);
  try {
    await deleteTechAsset(confirmDialog.assetId);
    setSelectedAssets(prev => prev.filter(id => id !== confirmDialog.assetId));
    toast.success(`Activo "${confirmDialog.assetName}" eliminado exitosamente`);
  } catch (error) {
    console.error('Error al eliminar activo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al eliminar el activo';
    toast.error(errorMessage);
  } finally {
    setIsDeleting(false);
    setConfirmDialog({ isOpen: false, assetId: null, assetName: '' });
  }
};

  const handleBulkAction = (action: string) => {
    if (selectedAssets.length === 0) {
      alert('Por favor selecciona al menos un activo');
      return;
    }

    switch (action) {
      case 'export':
        console.log('Exportar activos seleccionados:', selectedAssets);
        break;
      case 'assign':
        console.log('Asignar activos seleccionados:', selectedAssets);
        const assetIds = selectedAssets.join(',');
        window.location.href = `/inventory/assignments/new?asset_ids=${assetIds}`;
        break;
      case 'maintenance':
        console.log('Programar mantenimiento para activos:', selectedAssets);
        const maintenanceIds = selectedAssets.join(',');
        window.location.href = `/inventory/maintenance/new?asset_ids=${maintenanceIds}`;
        break;
      default:
        break;
    }
  };

  const handleShowHistory = (assetId: number, assetName: string) => {
    setSelectedAssetForHistory({ id: assetId, name: assetName });
    setIsHistoryModalOpen(true);
  };

  const handleCloseHistoryModal = () => {
    setIsHistoryModalOpen(false);
    setSelectedAssetForHistory(null);
  };

  const toggleAssetSelection = (assetId: number) => {
    setSelectedAssets(prev =>
      prev.includes(assetId)
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedAssets(
      selectedAssets.length === (displayedAssets ?? []).length
        ? []
        : (displayedAssets ?? []).map((asset) => asset.id)
    );
  };

  // Si hay error en la pagina mostrar el aviso
  if (error) {
    return (
      <div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => {
                    clearError();
                    fetchTechAssets();
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
            <h2 className="text-2xl font-bold text-gray-900">Gestión de Activos Tecnológicos</h2>
            <p className="mt-1 text-sm text-gray-500">
              Administra todos los activos tecnológicos de la organización
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <Link
              to="/inventory/tech-assets/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Activo
            </Link>
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Input de búsqueda */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, etiqueta, marca, modelo o serie..."
                value={searchInput}  // ← Conectado al estado local
                onChange={handleSearchChange}  // ← Handler con debounce
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              />
              {isLoading && searchInput && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              )}
            </div>

            {/* Botón de filtros */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </button>

            {/* Acciones rápidas */}
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('export')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleBulkAction('import')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Upload className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Panel de filtros expandible */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Todos los estados</option>
                    <option value="available">Disponible</option>
                    <option value="assigned">Asignado</option>
                    <option value="in_maintenance">En Mantenimiento</option>
                    <option value="retired">Retirado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Todas las categorías</option>
                    <option value="Notebook">Notebook</option>
                    <option value="Desktop">Desktop</option>
                    <option value="Monitor">Monitor</option>
                    <option value="Kit_teclado_mouse">Kit de Teclado y Mouse</option>
                    <option value="Impresora">Impresora</option>
                    <option value="Tablet">Tablet</option>
                    <option value="Celular">Celular</option>
                    <option value="Router">Router</option>
                    <option value="Servidor">Servidor</option>
                    <option value="Accesorios">Accesorios</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Asignaciones
                  </label>
                  <select
                    value={filterAssignment}
                    onChange={(e) => setFilterAssignment(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Todos</option>
                    <option value="assigned">Asignados</option>
                    <option value="unassigned">Sin asignar</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={handleClearFilters}
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
        {selectedAssets.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-sm text-blue-800">
                  {selectedAssets.length} activo(s) seleccionado(s)
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction('assign')}
                  className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md"
                >
                  Asignar
                </button>
                <button
                  onClick={() => handleBulkAction('maintenance')}
                  className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md"
                >
                  Mantenimiento
                </button>
                <button
                  onClick={() => handleBulkAction('export')}
                  className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md"
                >
                  Exportar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabla de activos */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
          ) : displayedAssets.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay activos</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchInput || selectedStatus || selectedCategory
                  ? 'No se encontraron activos que coincidan con los filtros aplicados.'
                  : 'Comienza creando tu primer activo tecnológico.'}
              </p>
              <div className="mt-6">
                <Link
                  to="/inventory/tech-assets/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Activo
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
                        checked={selectedAssets.length === displayedAssets.length}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Activo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Asignado a
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sector
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ubicación
                    </th>
                    {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th> */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                    
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayedAssets.map((asset: TechAsset) => (
                    <tr key={asset.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedAssets.includes(asset.id)}
                          onChange={() => toggleAssetSelection(asset.id)}
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
                              {asset.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {asset.asset_tag} • {asset.brand} {asset.model}
                            </div>
                            <div className="text-xs text-gray-400">
                              S/N: {asset.serial_number}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryColors[asset.category as keyof typeof categoryColors] || 'bg-gray-100 text-gray-800'}`}>
                          {asset.category.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[asset.status]}`}>
                          {statusLabels[asset.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {asset.user_assigned ? (
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-blue-500 mr-2" />
                            <span className="text-gray-900 font-medium">
                              {asset.user_assigned
                                ? asset.user_assigned.split('(')[0].trim()
                                : '—'
                              }
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Sin asignar</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Locate className="h-4 w-4 text-gray-400 mr-1" />
                          {asset.department ? asset.department : "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                          {asset.location}
                        </div>
                      </td>
                      {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                          {asset.purchase_price !== undefined 
                            ? `${asset.purchase_price.toLocaleString('es-AR')}`
                            : "—"}
                        </div>
                      </td> */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/inventory/tech-assets/${asset.id}`}
                            className="text-emerald-600 hover:text-emerald-900"
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleShowHistory(asset.id, asset.name)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Ver historial de asignaciones"
                          >
                            <History className="h-4 w-4" />
                          </button>

                          {asset.status === 'available' && (
                            <Link
                              to={`/inventory/assignments/new?asset_id=${asset.id}`}
                              className="inline-flex items-center p-1 border border-transparent rounded-full text-gray-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              title="Asignar activo"
                            >
                              <User className="h-4 w-4" />
                            </Link>
                          )}
                          <Link
                            to={`/inventory/tech-assets/${asset.id}/edit`}
                            className="text-blue-600 hover:text-blue-900"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDeleteAsset(asset.id, asset.name)}
                            className="text-red-600 hover:text-red-900"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {totalAssets > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(totalAssets / itemsPerPage)}
                totalItems={totalAssets}
                itemsPerPage={itemsPerPage}
                onPageChange={setPage}
                onItemsPerPageChange={setPageSize}
                showItemsPerPage={true}
              />
            )}
        </div>

        {/* Estadísticas resumidas */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Resumen</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {(displayedAssets ?? []).length}
              </div>
              <div className="text-sm text-gray-500">
                {totalAssets > 0 ? `de ${totalAssets} total` : 'Total'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {(displayedAssets ?? []).filter((a: TechAsset) => a.status === 'available').length}
              </div>
              <div className="text-sm text-gray-500">Disponibles</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {(displayedAssets ?? []).filter((a: TechAsset) => a.status === 'assigned').length}
              </div>
              <div className="text-sm text-gray-500">Asignados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">
                ${(displayedAssets ?? []).reduce((total: number, asset: TechAsset) => total + (asset.purchase_price ?? 0), 0).toLocaleString('es-AR')}
              </div>
              <div className="text-sm text-gray-500">Valor Total</div>
            </div>
          </div>
        </div>
      </div>
      {/* Modal de historial de asignaciones */}
      {selectedAssetForHistory && (
        <AssignmentHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={handleCloseHistoryModal}
          assetId={selectedAssetForHistory.id}
          assetName={selectedAssetForHistory.name}
        />
      )}
      {/* Modal de confirmación de eliminación */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => !isDeleting && setConfirmDialog({ isOpen: false, assetId: null, assetName: '' })}
        onConfirm={handleConfirmDelete}
        title="Eliminar Activo"
        message={`¿Estás seguro de que quieres eliminar "${confirmDialog.assetName}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default TechAssetsPage;