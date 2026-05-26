import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Package,
  Search,
  AlertCircle,
  User,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { useInventoryStore } from '../../stores/inventoryStore';
import { AssetStatus } from '../../types/inventory';
import {
  assetAssignmentCreateSchema,
  type AssetAssignmentCreateFormData,
} from '../../schemas/inventorySchemas';
import { FormInput, FormSelect, FormTextarea } from '../../components/Form';
import inventoryApi from '../../services/inventoryApi';
import toast from 'react-hot-toast';


interface UserOption {
  id: number;
  full_name: string;
  email: string;
  department?: string;
}

interface AssetOption {
  id: number;
  name: string;
  asset_tag?: string;
  brand: string;
  model: string;
  category: string;
  status: string;
}

// ─── Opciones estáticas de los selects ──────────────────────────────────────

const ASSIGNMENT_REASON_OPTIONS = [
  { value: 'work_assignment',         label: 'Asignación de trabajo' },
  { value: 'home_office',             label: 'Trabajo remoto / Home office' },
  { value: 'project',                 label: 'Proyecto específico' },
  { value: 'temporary_replacement',   label: 'Reemplazo temporal' },
  { value: 'permanent_assignment',    label: 'Asignación permanente' },
  { value: 'training',                label: 'Capacitación / Training' },
  { value: 'other',                   label: 'Otro' },
];

const CONDITION_OPTIONS = [
  { value: 'excellent',     label: 'Excelente' },
  { value: 'good',          label: 'Buena' },
  { value: 'fair',          label: 'Regular' },
  { value: 'poor',          label: 'Deficiente' },
  { value: 'needs_repair',  label: 'Necesita reparación' },
];

interface User {
  id: number;
  full_name: string;
  email: string;
  is_active: boolean;
}


const AssignmentFormPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [submitError,     setSubmitError]     = useState<string | null>(null);
  
  // ── Estado local para las listas de búsqueda (no son campos del formulario) ─
  const [users, setUsers] = useState<UserOption[]>([]);
  const [availableAssets, setAvailableAssets] = useState<AssetOption[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<number[]>([]);
  const [selectedUser,    setSelectedUser]    = useState<UserOption | null>(null);

  // Estados para búsqueda
  const [assetSearch, setAssetSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  
  const createAssignment = useInventoryStore(state => state.createAssignment);

  // ── React Hook Form ────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    trigger,
  } = useForm<AssetAssignmentCreateFormData>({
    resolver: zodResolver(assetAssignmentCreateSchema),
    defaultValues: {
      tech_asset_id:            0,
      assigned_to_user_id:      0,
      assignment_reason:        '',
      location_of_use:          '',
      expected_return_date:     '',
      condition_at_assignment:  'good',
      assignment_notes:         '',
      accessories: '',
    },
  });


  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const usersData = await inventoryApi.getUsers();
      if (Array.isArray(usersData)) {
        setUsers(usersData);
      } else {
        console.error('Expected array but got:', usersData);
        setUsers([]);
        toast.error('Error al cargar usuarios: formato incorrecto');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadAvailableAssets = async () => {
    setIsLoadingAssets(true);
    try {
      const response = await inventoryApi.getTechAssets({ status: AssetStatus.AVAILABLE, page_size: 10 });
      if (response && Array.isArray(response.items)) {
          setAvailableAssets(response.items);
        } else if (Array.isArray(response)) {
          // Si devuelve array directo (sin paginación)
          setAvailableAssets(response);
        } else {
          console.error('Expected array or paginated response but got:', response);
          setAvailableAssets([]);
          toast.error('Error al cargar activos: formato incorrecto');
        }
    } catch (error: any) {
      console.error('Error loading assets:', error);
      setAvailableAssets([]);
      toast.error(error.message || 'Error al cargar activos disponibles');
    } finally {
      setIsLoadingAssets(false);
    }
  };

  // Cargar usuarios y activos al montar el componente
  useEffect(() => {
    loadUsers();
    loadAvailableAssets();
    
    // Verificar si hay parámetros de URL
    const assetId = searchParams.get('asset_id');
    const assetIds = searchParams.get('asset_ids');
    
    if (assetId) {
      const id = parseInt(assetId);
      setSelectedAssets([id]);
      setValue('tech_asset_id', id);
    } else if (assetIds) {
      const ids = assetIds.split(',').map(id => parseInt(id));
      setSelectedAssets(ids);
      if (ids.length > 0) setValue('tech_asset_id',ids[0]);
    }
  }, [searchParams, setValue]);


  // Filtrar activos disponibles
  const filteredAssets = availableAssets.filter(asset =>
     asset?.name.toLowerCase().includes(assetSearch.toLowerCase()) ||
     (asset.asset_tag && asset.asset_tag.toLowerCase().includes(assetSearch.toLowerCase())) ||
     asset?.brand.toLowerCase().includes(assetSearch.toLowerCase()) ||
     asset?.model.toLowerCase().includes(assetSearch.toLowerCase()));

  // Filtrar usuarios activos
  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    (user.department && user.department.toLowerCase().includes(userSearch.toLowerCase()))
  );

  // ── Handlers para los campos custom

  const handleAssetToggle = (assetId: number) => {
    setSelectedAssets((prev) => {
      const next = prev.includes(assetId)
        ? prev.filter((id) => id !== assetId)
        : [...prev, assetId];

      // Sincrona el campo oculto del formulario para que Zod lo valide
      setValue('tech_asset_id', next.length > 0 ? next[0] : 0);
      trigger('tech_asset_id');

      return next;
    });
  };

  const handleUserSelect = (user: UserOption) => {
    setSelectedUser(user);
    setValue('assigned_to_user_id', user.id);
    trigger('assigned_to_user_id');
  };

  const handleUserDeselect = () => {
    setSelectedUser(null);
    setValue('assigned_to_user_id', 0);
    trigger('assigned_to_user_id');
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const onSubmit = async (data: AssetAssignmentCreateFormData) => {
    setSubmitError(null);

    try {
      // Si hay múltiples activos seleccionados, crear una asignación por cada uno
      const assetsToAssign =
        selectedAssets.length > 0 ? selectedAssets : [data.tech_asset_id];

      // Mostrar loading mientras se crean las asignaciones
      const loadingToast = toast.loading(
        assetsToAssign.length === 1 
          ? 'Creando asignación...' 
          : `Creando ${assetsToAssign.length} asignaciones...`
      );

      const promises = assetsToAssign.map((assetId) =>
        createAssignment({
          ...data,
          tech_asset_id: assetId,
          // Formatear fecha solo si tiene valor
          expected_return_date: data.expected_return_date
            ? new Date(data.expected_return_date + 'T00:00:00Z').toISOString()
            : undefined,
        })
      );

      await Promise.all(promises);

      toast.dismiss(loadingToast);
      toast.success(assetsToAssign.length === 1 ? 'Activo asignado exitosamente' : `${assetsToAssign.length} activos asignados exitosamente`);
      
      navigate('/inventory/assignments');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear la asignación';
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    }
  };


  return (
    <div>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-4 py-5 sm:p-6">

            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedAssets.length > 1
                  ? `Asignar ${selectedAssets.length} Activos`
                  : 'Asignar Activo'}
              </h2>
              <p className="text-gray-600 mt-1">
                Selecciona un activo disponible y un usuario para realizar la asignación.
              </p>
            </div>

            {/* Error global de submit */}
            {submitError && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
                <p className="font-medium">Error al guardar</p>
                <p className="text-sm">{submitError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

              {/* ═══════════ SECCIÓN: Selección de Activo ═══════════ */}
              <div className="bg-gray-50 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-1 flex items-center">
                  <Package className="h-5 w-5 mr-2 text-emerald-600" />
                  Activo a Asignar
                </h3>
                <p className="text-sm text-gray-500 mb-3">
                  Selecciona uno o más activos disponibles.
                </p>

                {/* Búsqueda de activos */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar activos..."
                    value={assetSearch}
                    onChange={(e) => setAssetSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                {/* Lista de activos */}
                <div className="border border-gray-200 rounded-md max-h-56 overflow-y-auto">
                  {isLoadingAssets ? (
                    <div className="flex justify-center items-center h-20">
                      <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                    </div>
                  ) : filteredAssets.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No hay activos disponibles
                    </div>
                  ) : (
                    filteredAssets.map((asset) => {
                      const isSelected = selectedAssets.includes(asset.id);
                      return (
                        <label
                          key={asset.id}
                          className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleAssetToggle(asset.id)}
                            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                          />
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {asset.name}
                              {asset.asset_tag && (
                                <span className="ml-2 text-xs font-normal text-gray-400">
                                  {asset.asset_tag}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {asset.brand} {asset.model} · {asset.category}
                            </div>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>

                {/* Error de validación: activo */}
                {errors.tech_asset_id && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                    {errors.tech_asset_id.message}
                  </p>
                )}
              </div>

              {/* ═══════════ SECCIÓN: Selección de Usuario ═══════════ */}
              <div className="bg-gray-50 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-1 flex items-center">
                  <User className="h-5 w-5 mr-2 text-emerald-600" />
                  Usuario Destinatario
                </h3>
                <p className="text-sm text-gray-500 mb-3">
                  Selecciona el usuario que recibirá el activo.
                </p>

                {/* Si ya hay usuario seleccionado, mostrar chip */}
                {selectedUser ? (
                  <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-md">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-emerald-600 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedUser.full_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {selectedUser.email}
                          {selectedUser.department && ` · ${selectedUser.department}`}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleUserDeselect}
                      className="text-xs text-emerald-700 hover:text-emerald-900 underline"
                    >
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Búsqueda de usuarios */}
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar usuarios..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>

                    {/* Lista de usuarios */}
                    <div className="border border-gray-200 rounded-md max-h-48 overflow-y-auto">
                      {isLoadingUsers ? (
                        <div className="flex justify-center items-center h-16">
                          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                        </div>
                      ) : filteredUsers.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          No se encontraron usuarios
                        </div>
                      ) : (
                        filteredUsers.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => handleUserSelect(user)}
                            className="w-full text-left flex items-center p-3 hover:bg-emerald-50 border-b border-gray-100 last:border-b-0 transition-colors"
                          >
                            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
                              <User className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {user.full_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {user.email}
                                {user.department && ` · ${user.department}`}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )}

                {/* Error de validación: usuario */}
                {errors.assigned_to_user_id && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                    {errors.assigned_to_user_id.message}
                  </p>
                )}
              </div>

              {/* ═══════════ SECCIÓN: Detalles de la Asignación ═══════════ */}
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Detalles de la Asignación
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Razón de Asignación — usa register() */}
                  <div className="sm:col-span-2">
                    <FormSelect
                      label="Razón de Asignación"
                      name="assignment_reason"
                      options={ASSIGNMENT_REASON_OPTIONS}
                      register={register}
                      error={errors.assignment_reason}
                      required
                      placeholder="Selecciona una razón"
                    />
                  </div>

                  {/* Ubicación de Uso — usa register() */}
                  <div className="sm:col-span-2">
                    <FormInput
                      label="Ubicación de Uso"
                      name="location_of_use"
                      placeholder="Ej: Oficina Central, Casa del empleado, Sucursal Norte"
                      register={register}
                      error={errors.location_of_use}
                      required
                    />
                  </div>

                  {/* Fecha de Retorno Esperada — usa register() */}
                  <FormInput
                    label="Fecha de Retorno Esperada"
                    name="expected_return_date"
                    type="date"
                    register={register}
                    error={errors.expected_return_date}
                    min={new Date().toISOString().split('T')[0]}
                    helpText="Opcional. Fecha estimada para la devolución."
                  />

                  {/* Condición del Activo — usa register() */}
                  <FormSelect
                    label="Condición del Activo"
                    name="condition_at_assignment"
                    options={CONDITION_OPTIONS}
                    register={register}
                    error={errors.condition_at_assignment}
                  />

                  {/* Notas — usa register() */}
                  <div className="sm:col-span-2">
                    <FormTextarea
                      label="Notas de Asignación"
                      name="assignment_notes"
                      placeholder="Información adicional sobre la asignación..."
                      register={register}
                      error={errors.assignment_notes}
                      rows={3}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <FormTextarea
                      label="Accesorios entregados"
                      name="accessories"
                      register={register}
                      rows={2}
                      placeholder="Ej: Cargador original, mouse Logitech M185, teclado mecánico Redragon"
                    />
                  </div>
                </div>
              </div>

              {/* ═══════════ BOTONES ═══════════ */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/inventory/assignments')}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center px-5 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {selectedAssets.length > 1
                    ? `Asignar ${selectedAssets.length} Activos`
                    : 'Crear Asignación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentFormPage;