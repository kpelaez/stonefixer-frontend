import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import {
  Laptop,
  Clock,
  BarChart2,
  Users,
  Package,
  TrendingUp,
  ChevronRight,
  Wrench,
} from 'lucide-react';

// ─── Módulos activos 

const modules = [
  {
    icon: Laptop,
    color: 'bg-blue-50 text-blue-600',
    title: 'Inventario Tecnológico',
    description: 'Gestioná activos, asignaciones y mantenimientos del equipamiento de la empresa.',
    path: '/inventory/tech-assets',
    roles: ['admin', 'manager', 'inventory_manager', 'user'],
  },
  {
    icon: Clock,
    color: 'bg-emerald-50 text-emerald-600',
    title: 'Turnos',
    description: 'Programación de turnos early/regular para el equipo de Stock.',
    path: '/teams/stock/schedule',
    roles: ['admin', 'manager', 'user'],
  },
  {
    icon: TrendingUp,
    color: 'bg-purple-50 text-purple-600',
    title: 'Horas Compensatorias',
    description: 'Solicitud y seguimiento de horas compensatorios.',
    path: '/teams/stock/overtime',
    roles: ['admin', 'manager', 'user'],
  },
  {
    icon: BarChart2,
    color: 'bg-orange-50 text-orange-600',
    title: 'Contribución Marginal',
    description: 'KPIs de facturación vs cobranza por cliente en tiempo real.',
    path: '/dashboards/contribucion-marginal',
    roles: ['admin', 'manager'],
  },
  {
    icon: Users,
    color: 'bg-cyan-50 text-cyan-600',
    title: 'Sectores',
    description: 'Directorio de personal organizado por departamento.',
    path: '/',
    roles: ['admin', 'manager', 'user'],
  },
  {
    icon: Wrench,
    color: 'bg-red-50 text-red-600',
    title: 'Mantenimientos',
    description: 'Seguimiento de mantenimientos preventivos y correctivos de activos.',
    path: '/inventory/maintenance',
    roles: ['admin', 'manager', 'inventory_manager'],
  },
];

// ─── Próximamente 

const upcoming = [
  {
    icon: Package,
    title: 'Tracker de Importaciones',
    description: 'Línea de tiempo con P.O. solicitadas y fechas estimadas de llegada.',
    badge: 'En planificación',
    badgeColor: 'bg-amber-100 text-amber-700',
  },
  {
    icon: Users,
    title: 'Administración de Roles Avanzados',
    description: 'Permisos granulares y personalizables por módulo y área.',
    badge: 'En diseño',
    badgeColor: 'bg-purple-100 text-purple-700',
  },
];

// ─── Subcomponentes 

const ModuleCard = ({
  icon: Icon,
  color,
  title,
  description,
  path,
  roles,
}: (typeof modules)[0]) => {
  const navigate = useNavigate();
  const hasAnyRole = useAuthStore(state => state.hasAnyRole);
  const canAccess = hasAnyRole(roles as string[]);

  if (!canAccess) return null;

  return (
    <button
      onClick={() => navigate(path)}
      className="group text-left p-5 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all duration-200"
    >
      <div className={`inline-flex p-2.5 rounded-lg ${color} mb-3`}>
        <Icon size={20} />
      </div>
      <h3 className="font-semibold text-gray-800 mb-1 group-hover:text-emerald-700 transition-colors">
        {title}
      </h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
      <div className="mt-3 flex items-center text-xs text-emerald-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
        Ir al módulo <ChevronRight size={12} className="ml-1" />
      </div>
    </button>
  );
};

// ─── Página principal 

const HomePage = () => {
  const user = useAuthStore(state => state.user);
  const firstName = user?.full_name?.split(' ')[0] || 'bienvenido';

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-10">

      {/* Hero */}
      <section>
        <p className="text-sm text-gray-400 mb-1">Hola, {firstName} 👋</p>
        <h1 className="text-3xl font-bold text-gray-900">Bienvenido a StoneFixer</h1>
        <p className="text-gray-500 mt-2">
          Tu plataforma interna para gestión de inventario, turnos, horas compensatorias e indicadores de negocio.
        </p>
      </section>

      {/* Módulos activos */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Módulos disponibles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((mod) => (
            <ModuleCard key={mod.title} {...mod} />
          ))}
        </div>
      </section>

      {/* Próximamente */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-700">Próximamente</h2>
          <span className="text-xs font-medium bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
            Roadmap 2026
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {upcoming.map((item) => (
            <div
              key={item.title}
              className="relative p-5 bg-gray-50 rounded-xl border border-dashed border-gray-300"
            >
              <span className={`absolute top-3 right-3 text-xs font-medium px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                {item.badge}
              </span>
              <div className="inline-flex p-2.5 rounded-lg bg-gray-100 text-gray-400 mb-3">
                <item.icon size={20} />
              </div>
              <h3 className="font-semibold text-gray-600 mb-1">{item.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

export default HomePage;