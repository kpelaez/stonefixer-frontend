import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AssetMaintenanceCreate, MaintenanceType, MaintenancePriority, MaintenanceStatus } from '../../types/inventory';
import { useInventoryStore } from '../../stores/inventoryStore';
import { AlertCircle, Wrench, Package, Calendar, User, Loader2, Search, Clock } from 'lucide-react';
import inventoryApi from '../../services/inventoryApi';

interface UserOption {
  id: number;
  full_name: string;
  email: string;
  department?: string;
}

interface AssetOption {
  id: number;
  name: string;
  asset_tag: string;
  brand: string;
  model: string;
  category: string;
  status: string;
}

const initialFormData: AssetMaintenanceCreate = {
  tech_asset_id: 0,
  maintenance_type: MaintenanceType.PREVENTIVE,
  title: '',
  description: '',
  priority: MaintenancePriority.MEDIUM,
  status:  MaintenanceStatus.SCHEDULED,
  scheduled_date: '',
  estimated_duration_hours: 0,
  assigned_technician_id: 0,
  maintenance_provider: '',
  warranty_work: false,
  notes: ''
};

const MaintenanceFormPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [formData, setFormData] = useState<AssetMaintenanceCreate>(initialFormData);
  const [errors, setErrors] = useState<Partial<AssetMaintenanceCreate>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  
  const [users, setUsers] = useState<UserOption[]>([]);
  const [availableAssets, setAvailableAssets] = useState<AssetOption[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<number[]>([]);
  
  const [userSearch, setUserSearch] = useState('');
  const [assetSearch, setAssetSearch] = useState('');
  
  const createMaintenance = useInventoryStore(state => state.createMaintenance);
  const error = useInventoryStore(state => state.error);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadUsers();
    loadAvailableAssets();
    
    // Verificar si hay parámetros de URL
    const assetId = searchParams.get('asset_id');
    const assetIds = searchParams.get('asset_ids');
    
    if (assetId) {
      const id = parseInt(assetId);
      setSelectedAssets([id]);
      setFormData(prev => ({ ...prev, tech_asset_id: id }));
    } else if (assetIds) {
      const ids = assetIds.split(',').map(id => parseInt(id));
      setSelectedAssets(ids);
    }
  }, [searchParams]);

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const usersData = await inventoryApi.getUsers();
      // Filtrar solo técnicos o usuarios con roles apropiados
      setUsers(usersData.filter((user: any) => 
        user.role === 'technician' || 
        user.role === 'admin' || 
        user.role === 'maintenance_manager'
      ));
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadAvailableAssets = async () => {
    setIsLoadingAssets(true);
    try {
      const assetsData = await inventoryApi.getTechAssets({page_size: 10});
      // Incluir todos los activos excepto los retirados
      const mappedAssets: AssetOption[] = assetsData.items
        .filter((asset: any) => asset.status !== 'retired')
        .map((asset: any) => ({
          id: asset.id,
          name: asset.name,
          asset_tag: asset.asset_tag || 'Sin etiqueta', // CORREGIDO: Manejar undefined
          brand: asset.brand,
          model: asset.model,
          category: asset.category,
          status: asset.status
        }));
      setAvailableAssets(mappedAssets);
    } catch (error) {
      console.error('Error loading assets:', error);
    } finally {
      setIsLoadingAssets(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    (user.department && user.department.toLowerCase().includes(userSearch.toLowerCase()))
  );

  const filteredAssets = availableAssets.filter(asset =>
    asset.name.toLowerCase().includes(assetSearch.toLowerCase()) ||
    asset.asset_tag.toLowerCase().includes(assetSearch.toLowerCase()) ||
    asset.brand.toLowerCase().includes(assetSearch.toLowerCase()) ||
    asset.model.toLowerCase().includes(assetSearch.toLowerCase())
  );

  const validateForm = (): boolean => {
    const newErrors: Partial<AssetMaintenanceCreate> = {};

    if (selectedAssets.length === 0 && !formData.tech_asset_id) {
      newErrors.tech_asset_id = 0;
    }

    if (!formData.title || !formData.title.trim()) {
      newErrors.title = 'El título es requerido';
    }

    if (!formData.description || !formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }

    if (!formData.scheduled_date) {
      newErrors.scheduled_date = 'La fecha programada es requerida';
    }

    if (!formData.estimated_duration_hours || formData.estimated_duration_hours <= 0) {
      newErrors.estimated_duration_hours = 0;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'assigned_technician_id' || name === 'tech_asset_id' 
          ? parseInt(value) || 0 
          : name === 'estimated_duration_hours'
          ? parseFloat(value) || 0
          : value
      }));
    }

    // Limpiar error del campo si existe
    if (errors[name as keyof AssetMaintenanceCreate]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleAssetToggle = (assetId: number) => {
    setSelectedAssets(prev => {
      const newSelection = prev.includes(assetId)
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId];
      
      // Si es mantenimiento individual, actualizar formData
      if (newSelection.length === 1) {
        setFormData(prevForm => ({ ...prevForm, tech_asset_id: newSelection[0] }));
      }
      
      return newSelection;
    });
  };

  const generateMaintenanceTitle = (type: MaintenanceType) => {
    const titles: Record<MaintenanceType, string> = {
      [MaintenanceType.PREVENTIVE]: 'Mantenimiento Preventivo Programado',
      [MaintenanceType.CORRECTIVE]: 'Reparación Correctiva',
      [MaintenanceType.UPGRADE]: 'Actualización de Hardware/Software',
      [MaintenanceType.CLEANING]: 'Limpieza de Hardware/Software',
      [MaintenanceType.CALIBRATION]: 'Calibracion de Hardware',
      [MaintenanceType.REPAIR]: 'Reparacion de Hardware/Software',
      [MaintenanceType.REPLACEMENT]: 'Reemplazo de piezas de Hardware',
      [MaintenanceType.INSPECTION]: 'Inspeccion de diagnostico para verificar problema',
    };
    return titles[type] || 'Mantenimiento';
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as MaintenanceType;
    setFormData(prev => ({
      ...prev,
      maintenance_type: newType,
      title: generateMaintenanceTitle(newType)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const assetsToMaintain = selectedAssets.length > 0 ? selectedAssets : [formData.tech_asset_id];
      
      // Crear un mantenimiento por cada activo seleccionado
      const maintenancePromises = assetsToMaintain.map(assetId => {
        const maintenanceData: AssetMaintenanceCreate = {
          ...formData,
          tech_asset_id: assetId,
          scheduled_date: new Date(formData.scheduled_date).toISOString(),
          assigned_technician_id: formData.assigned_technician_id || undefined
        };
        
        return createMaintenance(maintenanceData);
      });

      await Promise.all(maintenancePromises);

      const message = assetsToMaintain.length === 1 
        ? 'Mantenimiento programado exitosamente' 
        : `${assetsToMaintain.length} mantenimientos programados exitosamente`;

      navigate('/inventory/maintenance', { 
        state: { message } 
      });

    } catch (error) {
      console.error('Error creating maintenance:', error);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedAssets.length > 1 ? 'Programar Múltiples Mantenimientos' : 'Programar Mantenimiento'}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Programa mantenimientos preventivos o correctivos para activos tecnológicos
              </p>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Selección de Activos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Package className="inline h-4 w-4 mr-1" />
                  Activos para Mantenimiento *
                </label>

                {selectedAssets.length > 0 && (
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800 font-medium">
                      {selectedAssets.length} activo(s) preseleccionado(s)
                    </p>
                  </div>
                )}
                
                {/* Búsqueda de activos */}
                <div className="relative mb-3">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={assetSearch}
                    onChange={(e) => setAssetSearch(e.target.value)}
                    placeholder="Buscar activo por nombre, etiqueta, marca o modelo..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-md">
                  {isLoadingAssets ? (
                    <div className="flex justify-center items-center h-20">
                      <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                    </div>
                  ) : filteredAssets.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No se encontraron activos
                    </div>
                  ) : (
                    filteredAssets.map((asset) => (
                      <label key={asset.id} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-200 last:border-b-0">
                        <input
                          type="checkbox"
                          checked={selectedAssets.includes(asset.id)}
                          onChange={() => handleAssetToggle(asset.id)}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                        />
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {asset.name} • {asset.asset_tag}
                          </div>
                          <div className="text-sm text-gray-500">
                            {asset.brand} {asset.model} • {asset.category}
                            <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              asset.status === 'available' ? 'bg-green-100 text-green-800' :
                              asset.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                              asset.status === 'in_maintenance' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {asset.status === 'available' ? 'Disponible' :
                               asset.status === 'assigned' ? 'Asignado' :
                               asset.status === 'in_maintenance' ? 'En Mantenimiento' :
                               'Fuera de Servicio'}
                            </span>
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
                {errors.tech_asset_id !== undefined && selectedAssets.length === 0 && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Selecciona al menos un activo
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Tipo de Mantenimiento */}
                <div>
                  <label htmlFor="maintenance_type" className="block text-sm font-medium text-gray-700">
                    <Wrench className="inline h-4 w-4 mr-1" />
                    Tipo de Mantenimiento *
                  </label>
                  <select
                    id="maintenance_type"
                    name="maintenance_type"
                    value={formData.maintenance_type}
                    onChange={handleTypeChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="preventive">Preventivo</option>
                    <option value="corrective">Correctivo</option>
                    <option value="emergency">Emergencia</option>
                    <option value="upgrade">Actualización</option>
                  </select>
                </div>

                {/* Prioridad */}
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                    Prioridad *
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                    <option value="critical">Crítica</option>
                  </select>
                </div>

                {/* Título */}
                <div className="sm:col-span-2">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Título del Mantenimiento *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500 ${
                      errors.title ? 'border-red-300 ring-red-500' : ''
                    }`}
                    placeholder="Ej: Mantenimiento preventivo trimestral"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.title}
                    </p>
                  )}
                </div>

                {/* Fecha Programada */}
                <div>
                  <label htmlFor="scheduled_date" className="block text-sm font-medium text-gray-700">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Fecha Programada *
                  </label>
                  <input
                    type="datetime-local"
                    id="scheduled_date"
                    name="scheduled_date"
                    value={formData.scheduled_date}
                    onChange={handleInputChange}
                    min={new Date().toISOString().slice(0, 16)}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500 ${
                      errors.scheduled_date ? 'border-red-300 ring-red-500' : ''
                    }`}
                  />
                  {errors.scheduled_date && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      La fecha programada es requerida
                    </p>
                  )}
                </div>

                {/* Duración Estimada */}
                <div>
                  <label htmlFor="estimated_duration_hours" className="block text-sm font-medium text-gray-700">
                    <Clock className="inline h-4 w-4 mr-1" />
                    Duración Estimada (horas) *
                  </label>
                  <input
                    type="number"
                    id="estimated_duration_hours"
                    name="estimated_duration_hours"
                    value={formData.estimated_duration_hours}
                    onChange={handleInputChange}
                    min="0.5"
                    step="0.5"
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500 ${
                      errors.estimated_duration_hours ? 'border-red-300 ring-red-500' : ''
                    }`}
                    placeholder="Ej: 2.5"
                  />
                  {errors.estimated_duration_hours && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      La duración debe ser mayor a 0
                    </p>
                  )}
                </div>

                {/* Técnico Asignado */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="inline h-4 w-4 mr-1" />
                    Técnico Asignado
                  </label>
                  
                  {/* Búsqueda de técnicos */}
                  <div className="relative mb-3">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Buscar técnico por nombre, email o departamento..."
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>

                  <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md">
                    {isLoadingUsers ? (
                      <div className="flex justify-center items-center h-20">
                        <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                      </div>
                    ) : (
                      <>
                        <label className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-200">
                          <input
                            type="radio"
                            name="assigned_technician_id"
                            value="0"
                            checked={formData.assigned_technician_id === 0}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                          />
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">Sin asignar</div>
                            <div className="text-sm text-gray-500">Se asignará posteriormente</div>
                          </div>
                        </label>
                        {filteredUsers.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            No se encontraron técnicos
                          </div>
                        ) : (
                          filteredUsers.map((user) => (
                            <label key={user.id} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-200 last:border-b-0">
                              <input
                                type="radio"
                                name="assigned_technician_id"
                                value={user.id}
                                checked={formData.assigned_technician_id === user.id}
                                onChange={handleInputChange}
                                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                              />
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                                <div className="text-sm text-gray-500">
                                  {user.email}
                                  {user.department && ` • ${user.department}`}
                                </div>
                              </div>
                            </label>
                          ))
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Proveedor de Mantenimiento */}
                <div>
                  <label htmlFor="maintenance_provider" className="block text-sm font-medium text-gray-700">
                    Proveedor de Servicio
                  </label>
                  <input
                    type="text"
                    id="maintenance_provider"
                    name="maintenance_provider"
                    value={formData.maintenance_provider}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Ej: Servicio técnico interno, Proveedor externo"
                  />
                </div>

                {/* Trabajo de Garantía */}
                <div className="flex items-center">
                  <input
                    id="warranty_work"
                    name="warranty_work"
                    type="checkbox"
                    checked={formData.warranty_work}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <label htmlFor="warranty_work" className="ml-2 block text-sm text-gray-900">
                    Trabajo cubierto por garantía
                  </label>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Descripción del Mantenimiento *
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500 ${
                    errors.description ? 'border-red-300 ring-red-500' : ''
                  }`}
                  placeholder="Describe detalladamente las tareas a realizar, problemas identificados, o procedimientos de mantenimiento preventivo..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Notas Adicionales */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Notas Adicionales
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Información adicional, requerimientos especiales, contactos relevantes, etc..."
                />
              </div>

              {/* Botones de Acción */}
              <div className="pt-5">
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => navigate('/inventory/maintenance')}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-3 h-4 w-4" />
                        Programando...
                      </>
                    ) : (
                      `Programar ${selectedAssets.length > 1 ? `${selectedAssets.length} Mantenimientos` : 'Mantenimiento'}`
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceFormPage;