// src/pages/Inventory/AssetFormPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Tag, Loader2 } from 'lucide-react';
import { FormInput, FormSelect, FormTextarea } from '../../components/Form';
import { 
  techAssetCreateSchema, 
  type TechAssetCreateFormData 
} from '../../schemas/inventorySchemas';
import { AssetCategory, AssetStatus } from '../../types/inventory';
import { useInventoryStore } from '../../stores/inventoryStore';
import inventoryApi from '../../services/inventoryApi'
import toast from 'react-hot-toast';

const AssetFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(isEditMode);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isGeneratingTag, setIsGeneratingTag] = useState(false);

  // Obtener funciones del store
  const createTechAsset = useInventoryStore(state => state.createTechAsset);
  const updateTechAsset = useInventoryStore(state => state.updateTechAsset);
  const techAssets = useInventoryStore(state => state.techAssets);

  // Configurar React Hook Form con validación de Zod
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<TechAssetCreateFormData>({
    resolver: zodResolver(techAssetCreateSchema),
    defaultValues: {
      status: AssetStatus.AVAILABLE,
      purchase_date: new Date().toISOString().split('T')[0],
    },
  });

  // Watch category para el botón de generar tag
  const selectedCategory = watch('category');

  // Cargar datos si es edición
  useEffect(() => {
    if (isEditMode && id) {
      loadAssetData(parseInt(id));
    }
  }, [id, isEditMode]);
  
  const loadAssetData = (assetId: number) => {
    try {
      setIsLoadingData(true);
      
      // Buscar el activo en el store
      const asset = techAssets.find(a => a.id === assetId);
      
      if (!asset) {
        setSubmitError('Activo no encontrado');
        setIsLoadingData(false);
        return;
      }
      
      // Llenar el formulario con los datos existentes
      reset({
        name: asset.name,
        description: asset.description || '',
        brand: asset.brand,
        model: asset.model,
        serial_number: asset.serial_number,
        asset_tag: asset.asset_tag || '',
        category: asset.category,
        status: asset.status,
        purchase_price: asset.purchase_price || 0,
        purchase_date: asset.purchase_date ? asset.purchase_date.split('T')[0] : '',
        supplier: asset.supplier || '',
        invoice: asset.invoice || '',
        warranty_expiry: asset.warranty_expiry ? asset.warranty_expiry.split('T')[0] : '',
        warranty_provider: asset.warranty_provider || '',
        location: asset.location || '',
        department: asset.department || '',
        specifications: asset.specifications || '',
        notes: asset.notes || '',
      });
    } catch (error) {
      console.error('Error cargando activo:', error);
      setSubmitError('Error al cargar los datos del activo');
    } finally {
      setIsLoadingData(false);
    }
  };

  // Función para generar asset tag
  const generateAssetTag = async () => {
    if (!selectedCategory) {
      alert('Primero selecciona una categoría');
      return;
    }
    setIsGeneratingTag(true);
    try {
      const response = await inventoryApi.generateAssetTag(selectedCategory);

      setValue('asset_tag', response.asset_tag)
      
    } catch (error) {
      console.error('Error generando asset tag: ',error);
      alert(`Error al generar el codigo del activo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsGeneratingTag(false);
    }
  };

  const onSubmit = async (data: TechAssetCreateFormData) => {
    try {
      setIsLoading(true);
      setSubmitError(null);
      
      if (isEditMode && id) {
        await updateTechAsset(parseInt(id), data);
        toast.success('Activo actualizado exitosamente');
      } else {
        await createTechAsset(data);
        toast.success('Activo creado exitosamente');
      }
      
      navigate('/inventory/tech-assets');
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Error guardando activo:';
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  // TRADUCCIÓN: Estados en español
  const statusOptionsSpanish = [
    { value: AssetStatus.AVAILABLE, label: 'Disponible' },
    { value: AssetStatus.ASSIGNED, label: 'Asignado' },
    { value: AssetStatus.IN_MAINTENANCE, label: 'En Mantenimiento' },
    { value: AssetStatus.OUT_OF_ORDER, label: 'Fuera de Servicio' },
    { value: AssetStatus.RETIRED, label: 'Retirado' },
  ];

  // Opciones para los selects
  const categoryOptions = Object.entries(AssetCategory)
    .filter(([key]) => key !== 'DEFAULT' && key !== '_ERROR_MESSAGE')
    .map(([, value]) => ({
      value: value,
      label: value.replace(/_/g, ' '),
    }));
  

  if (isLoadingData) {
    return (
      <div>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando datos del activo...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditMode ? 'Editar Activo Tecnológico' : 'Nuevo Activo Tecnológico'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEditMode 
              ? 'Actualiza la información del activo' 
              : 'Completa el formulario para registrar un nuevo activo'}
          </p>
        </div>
        
        {/* Error Message */}
        {submitError && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
            <p className="font-medium">Error al guardar</p>
            <p className="text-sm">{submitError}</p>
          </div>
        )}
        
        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit, (errors) => {
          // Este segundo callback se ejecuta si hay errores de validación
          console.error('Errores de validación:', errors);
          alert('Por favor corrige los errores en el formulario antes de continuar.');
        })} className="space-y-8">
          
          {/* Información Básica */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Información Básica
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="Nombre del activo"
                name="name"
                placeholder="Ej: Laptop Dell Latitude"
                register={register}
                error={errors.name}
                required
              />
              
              <FormSelect
                label="Categoría"
                name="category"
                options={categoryOptions}
                register={register}
                error={errors.category}
                required
              />
              
              <FormInput
                label="Marca"
                name="brand"
                placeholder="Ej: Dell, HP, Lenovo"
                register={register}
                error={errors.brand}
                required
              />
              
              <FormInput
                label="Modelo"
                name="model"
                placeholder="Ej: Latitude 7490"
                register={register}
                error={errors.model}
                required
              />
              
              <FormInput
                label="Número de Serie"
                name="serial_number"
                placeholder="Ej: SN123456789"
                register={register}
                error={errors.serial_number}
                required
                helpText="Único para cada activo"
              />
              
              <div>
                <label htmlFor="asset_tag" className="form-label">
                  Etiqueta del Activo (Tag) <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    id="asset_tag"
                    type="text"
                    placeholder="Ej: NBK-001"
                    className={`form-input flex-1 ${errors.asset_tag ? 'border-red-500' : ''}`}
                    {...register('asset_tag')}
                    readOnly={isGeneratingTag}
                  />
                  <button
                    type="button"
                    onClick={generateAssetTag}
                    disabled={isGeneratingTag || !selectedCategory}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    title="Generar etiqueta automáticamente"
                  >
                    {isGeneratingTag ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Tag className="h-4 w-4" />
                    )}
                    Generar
                  </button>
                </div>
                {errors.asset_tag && (
                  <p className="text-sm text-red-600 mt-1">{errors.asset_tag.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Código único para seguimiento y trazabilidad
                </p>
              </div>
              
              <FormSelect
                label="Estado"
                name="status"
                options={statusOptionsSpanish}
                register={register}
                error={errors.status}
                required
              />
            </div>
            
            <div className="mt-6">
              <FormTextarea
                label="Descripción"
                name="description"
                placeholder="Describe el activo brevemente"
                rows={3}
                register={register}
                error={errors.description}
              />
            </div>
          </div>
          
          {/* Información de Compra */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Información de Compra
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="Fecha de Compra"
                name="purchase_date"
                type="date"
                register={register}
                error={errors.purchase_date}
                required
              />
              
              <FormInput
                label="Precio de Compra"
                name="purchase_price"
                type="number"
                step="0.01"
                placeholder="0.00"
                register={register}
                error={errors.purchase_price}
                helpText="En tu moneda local"
              />
                            
              <FormInput
                label="Proveedor"
                name="supplier"
                placeholder="Ej: TechSupplies SA"
                register={register}
                error={errors.supplier}
              />
              
              <FormInput
                label="Número de Factura"
                name="invoice"
                placeholder="A-0000-00000000"
                register={register}
                error={errors.invoice}
                helpText="Formato: A-0000-00000000"
              />
            </div>
          </div>
          
          {/* Garantía */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Garantía
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="Vencimiento de Garantía"
                name="warranty_expiry"
                type="date"
                register={register}
                error={errors.warranty_expiry}
              />
              
              <FormInput
                label="Proveedor de Garantía"
                name="warranty_provider"
                placeholder="Ej: Dell, HP"
                register={register}
                error={errors.warranty_provider}
              />
            </div>
          </div>
          
          {/* Ubicación */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Ubicación
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="Ubicación"
                name="location"
                placeholder="Ej: Oficina Central, Piso 3"
                register={register}
                error={errors.location}
              />
              
              <FormInput
                label="Departamento"
                name="department"
                placeholder="Ej: IT, RRHH, Ventas"
                register={register}
                error={errors.department}
              />
            </div>
          </div>
          
          {/* Especificaciones Técnicas */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Especificaciones Técnicas
            </h2>
            
            <FormTextarea
              label="Especificaciones"
              name="specifications"
              placeholder="Ej: Intel i7, 16GB RAM, SSD 512GB"
              rows={4}
              maxLength={2000}
              register={register}
              error={errors.specifications}
            />
            
            <div className="mt-6">
              <FormTextarea
                label="Notas Adicionales"
                name="notes"
                placeholder="Cualquier información adicional relevante"
                rows={3}
                maxLength={1000}
                register={register}
                error={errors.notes}
              />
            </div>
          </div>
          
          {/* Botones */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/inventory/tech-assets')}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={isLoading || isSubmitting}
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {(isSubmitting) && (
                <svg 
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  ></circle>
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              )}
              {isEditMode ? 'Actualizar Activo' : 'Crear Activo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssetFormPage;