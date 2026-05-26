import React, {useEffect, useState} from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {useInventoryStore} from '../../stores/inventoryStore';
import { TechAsset } from '../../types/inventory';
import inventoryApi from '../../services/inventoryApi';
import { ArrowLeft, Edit, Trash2, MapPin, Calendar, DollarSign, Package, User, Wrench, AlertCircle, CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';

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

const statusIcons = {
  available: CheckCircle,
  assigned: User,
  in_maintenance: Wrench,
  out_of_order: XCircle,
  retired: Clock
};

const AssetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [asset, setAsset] = useState<TechAsset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteTechAsset = useInventoryStore(state => state.deleteTechAsset);

  useEffect(()=>{
    const fetchAssetDetail = async () =>{
        if (!id) return;

        try {
            setIsLoading(true);
            const assetData = await inventoryApi.getTechAsset(parseInt(id));
            setAsset(assetData);
        } catch (error) {
            console.error("Error fetching asset: ", error);
            setError(error instanceof Error ? error.message : 'Error al cargar el activo');
        } finally {
            setIsLoading(false);
        }
    };

    fetchAssetDetail();
  }, [id]);

  const handleDelete = async () =>{
    if (!asset || !window.confirm('¿Estás seguro de que quieres eliminar este activo?')){
        return;
    }

    setIsDeleting(true);
    try {
        await deleteTechAsset(asset.id);
        navigate('/inventory/tech-assets', {
            state: {message: 'Activo eliminado exitosamente'}
        });
    } catch (error) {
        console.error("Error deleting asset: ", error);
        alert(`Error al eliminar el activo: ${error instanceof Error ? error.message: 'Error desconocido'}`)
    } finally {
        setIsDeleting(false);
    }
  };

  if(isLoading) {
    return (
        <div>
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        </div>
    );
  }

  if (error || !asset) {
    return (
        <div>
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-800" />
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Error</h3>
                        <div className="mt-2 text-sm text-red-700">
                            <p>{error || 'Activo no encontrado'}</p>
                        </div>
                        <div className="mt-4">
                            <Link to="/inventory/tech-assets" className="text-sm font-medium text-red-600 hover:text-red-500">
                                Volver a la lista
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
  }

  const StatusIcon = statusIcons[asset.status];

  return (
    <div>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/inventory/tech-assets')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{asset.name}</h1>
              <p className="text-sm text-gray-500">
                {asset.brand} {asset.model} • {asset.asset_tag}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Link
              to={`/inventory/tech-assets/${asset.id}/edit`}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Link>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>

        {/* Estado del Activo */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <StatusIcon className={`h-8 w-8 ${asset.status === 'available' ? 'text-green-600' : 
                asset.status === 'assigned' ? 'text-blue-600' :
                asset.status === 'in_maintenance' ? 'text-yellow-600' :
                asset.status === 'out_of_order' ? 'text-red-600' : 'text-gray-600'}`} />
              <div className="ml-4">
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[asset.status]}`}>
                    {statusLabels[asset.status]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Estado actual del activo
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Información Principal */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Información del Activo
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Detalles técnicos y de inventario
            </p>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Etiqueta de Activo</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-mono">
                  {asset.asset_tag}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Categoría</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {asset.category}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Número de Serie</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-mono">
                  {asset.serial_number}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Ubicación
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {asset.location || 'No especificada'}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Departamento</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {asset.department || 'No asignado'}
                </dd>
              </div>
              {asset.description && (
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Descripción</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {asset.description}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Información de Compra */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Información de Compra
            </h3>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Fecha de Compra
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString('es-AR') : 'No registrada'}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  <DollarSign className="inline h-4 w-4 mr-1" />
                  Precio de Compra
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {asset.purchase_price ? `$${asset.purchase_price.toLocaleString('es-AR')}` : 'No registrado'}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Proveedor</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {asset.supplier || 'No registrado'}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Número de Factura</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {asset.invoice || 'No registrada'}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Información de Garantía */}
        {(asset.warranty_expiry || asset.warranty_provider) && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Información de Garantía
              </h3>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                {asset.warranty_expiry && (
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Vencimiento</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {new Date(asset.warranty_expiry).toLocaleDateString('es-AR')}
                    </dd>
                  </div>
                )}
                {asset.warranty_provider && (
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Proveedor de Garantía</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {asset.warranty_provider}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        )}

        {/* Especificaciones Técnicas */}
        {asset.specifications && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Especificaciones Técnicas
              </h3>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <div className="text-sm text-gray-900 whitespace-pre-wrap">
                {asset.specifications}
              </div>
            </div>
          </div>
        )}

        {/* Notas Adicionales */}
        {asset.notes && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Notas Adicionales
              </h3>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <div className="text-sm text-gray-900 whitespace-pre-wrap">
                {asset.notes}
              </div>
            </div>
          </div>
        )}

        {/* Acciones Rápidas */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Acciones Rápidas
            </h3>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Link
                to={`/inventory/assignments/new?asset_id=${asset.id}`}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                <User className="h-4 w-4 mr-2" />
                Asignar Activo
              </Link>
              <Link
                to={`/inventory/maintenance/new?asset_id=${asset.id}`}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                <Wrench className="h-4 w-4 mr-2" />
                Programar Mantenimiento
              </Link>
              <Link
                to={`/inventory/tech-assets/${asset.id}/history`}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                <Package className="h-4 w-4 mr-2" />
                Ver Historial
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetDetailPage;