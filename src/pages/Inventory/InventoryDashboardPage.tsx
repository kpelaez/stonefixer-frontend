import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, 
  Users, 
  Settings, 
  AlertTriangle, 
  TrendingUp,
  Clock,
  DollarSign,
  Activity
} from 'lucide-react';
import { useInventoryStore } from '../../stores/inventoryStore';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  change?: string;
  link?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color, 
  change,
  link 
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200'
  };

  const CardContent = () => (
    <div className={`p-6 rounded-lg border ${colorClasses[color]} hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{subtitle}</p>
          {change && (
            <p className="text-xs text-green-600 font-medium mt-1">
              {change}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return link ? (
    <Link to={link} className="block">
      <CardContent />
    </Link>
  ) : (
    <CardContent />
  );
};

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  color: string;
}

const QuickAction: React.FC<QuickActionProps> = ({ title, description, icon, link, color }) => {
  const colorVariants: { [key: string]: string } = {
    blue: 'hover:border-blue-300 bg-blue-50 text-blue-600 group-hover:bg-blue-100',
    green: 'hover:border-green-300 bg-green-50 text-green-600 group-hover:bg-green-100',
    yellow: 'hover:border-yellow-300 bg-yellow-50 text-yellow-600 group-hover:bg-yellow-100',
    purple: 'hover:border-purple-300 bg-purple-50 text-purple-600 group-hover:bg-purple-100'
  };

  return (
    <Link
      to={link}
      className={`block p-4 rounded-lg border border-gray-200 ${colorVariants[color]?.split(' ')[0]} hover:shadow-md transition-all group`}
    >
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${colorVariants[color]?.substring(colorVariants[color].indexOf('bg-'))}`}>
          {icon}
        </div>
        <div>
          <h3 className="font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
    </Link>
  );
};

const InventoryDashboardPage: React.FC = () => {
  const dashboardMetrics = useInventoryStore(state => state.dashboardMetrics); 
  const fetchDashboardMetrics = useInventoryStore(state => state.fetchDashboardMetrics); 
  const isLoading = useInventoryStore(state => state.isLoading); 
  const error = useInventoryStore(state => state.error);

  useEffect(() => {
    fetchDashboardMetrics();
  }, [fetchDashboardMetrics]);

  const quickActions = [
    {
      title: 'Nuevo Activo',
      description: 'Registrar un nuevo activo tecnológico',
      icon: <Package size={20} />,
      link: '/inventory/tech-assets/new',
      color: 'blue'
    },
    {
      title: 'Asignar Activo',
      description: 'Asignar activo a un usuario',
      icon: <Users size={20} />,
      link: '/inventory/assignments/new',
      color: 'green'
    },
    {
      title: 'Programar Mantenimiento',
      description: 'Crear nuevo mantenimiento',
      icon: <Settings size={20} />,
      link: '/inventory/maintenance/new',
      color: 'yellow'
    },
    {
      title: 'Ver Reportes',
      description: 'Generar reportes de inventario',
      icon: <TrendingUp size={20} />,
      link: '/inventory/reports',
      color: 'purple'
    }
  ];

  if (isLoading) {
    return (
      <div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error al cargar dashboard</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => fetchDashboardMetrics()}
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
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Dashboard de Inventario Tecnológico
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Resumen general de activos, asignaciones y mantenimientos
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              onClick={() => fetchDashboardMetrics()}
              className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              <Activity className="h-4 w-4 mr-2" />
              Actualizar
            </button>
          </div>
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total de Activos"
            value={dashboardMetrics?.total_assets || 0}
            subtitle="Activos registrados"
            icon={<Package size={24} />}
            color="blue"
            link="/inventory/assets"
          />
          <MetricCard
            title="Activos Disponibles"
            value={dashboardMetrics?.available_assets || 0}
            subtitle="Listos para asignar"
            icon={<Users size={24} />}
            color="green"
            link="/inventory/assets?status=available"
          />
          <MetricCard
            title="Activos Asignados"
            value={dashboardMetrics?.assigned_assets || 0}
            subtitle="En uso actualmente"
            icon={<Activity size={24} />}
            color="purple"
            link="/inventory/assignments?status=active"
          />
          <MetricCard
            title="En Mantenimiento"
            value={dashboardMetrics?.maintenance_assets || 0}
            subtitle="Requieren atención"
            icon={<Settings size={24} />}
            color="yellow"
            link="/inventory/assets?status=in_maintenance"
          />
        </div>

        {/* Segunda fila de métricas */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            title="Asignaciones Activas"
            value={dashboardMetrics?.active_assignments || 0}
            subtitle="Usuarios con activos"
            icon={<Users size={24} />}
            color="blue"
            link="/inventory/assignments"
          />
          <MetricCard
            title="Mantenimientos Pendientes"
            value={dashboardMetrics?.pending_maintenances || 0}
            subtitle="Por realizar"
            icon={<Clock size={24} />}
            color="yellow"
            link="/inventory/maintenance?status=scheduled"
          />
          <MetricCard
            title="Mantenimientos Vencidos"
            value={dashboardMetrics?.overdue_maintenances || 0}
            subtitle="Atención requerida"
            icon={<AlertTriangle size={24} />}
            color="red"
            link="/inventory/maintenance?status=overdue"
          />
        </div>

        {/* Valor total del inventario */}
        {dashboardMetrics?.total_value && (
          <div className="bg-gradient-to-r from-emerald-50 to-blue-50 p-6 rounded-lg border border-emerald-200">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-emerald-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-emerald-800">Valor Total del Inventario</p>
                <p className="text-3xl font-bold text-emerald-900">
                  ${dashboardMetrics.total_value.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-emerald-700">Valor de todos los activos registrados</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Acciones rápidas */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Acciones Rápidas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <QuickAction key={index} {...action} />
              ))}
            </div>
          </div>

          {/* Información adicional */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Estado del Sistema</h3>
            <div className="space-y-3">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Última actualización</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date().toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Estado del sistema</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Operativo
                  </span>
                </div>
              </div>

              <Link
                to="/inventory/reports"
                className="block w-full bg-emerald-50 hover:bg-emerald-100 p-4 rounded-lg border border-emerald-200 transition-colors"
              >
                <div className="text-center">
                  <TrendingUp className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
                  <span className="text-sm font-medium text-emerald-800">Ver Reportes Completos</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryDashboardPage;