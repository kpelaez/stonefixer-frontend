import {
  Server,
  Layout,
  Database,
  Shield,
  Wrench,
  Users,
  BarChart2,
  Clock,
  Package,
} from 'lucide-react';

// ─── Datos 

const backendStack = [
  { name: 'FastAPI',        description: 'Framework principal de la API REST'          },
  { name: 'SQLModel',       description: 'ORM con tipado Pydantic v2 + SQLAlchemy'     },
  { name: 'PostgreSQL',     description: 'Base de datos relacional (Aiven Cloud)'      },
  { name: 'Alembic',        description: 'Migraciones de base de datos'                },
  { name: 'JWT + bcrypt',   description: 'Autenticación y seguridad de contraseñas'    },
  { name: 'Fernet',         description: 'Cifrado de datos sensibles (DNI)'            },
  { name: 'slowapi',        description: 'Rate limiting por IP'                        },
  { name: 'Python 3.11+',   description: 'Lenguaje del servidor'                       },
];

const frontendStack = [
  { name: 'React 19',               description: 'Biblioteca de UI'                          },
  { name: 'TypeScript 5.7',         description: 'Tipado estático'                           },
  { name: 'Vite 6',                 description: 'Build tool y dev server'                   },
  { name: 'TailwindCSS 4',          description: 'Estilos utilitarios'                       },
  { name: 'Zustand 5',              description: 'Estado global del cliente'                 },
  { name: 'React Router DOM 7',     description: 'Enrutamiento SPA'                          },
  { name: 'React Hook Form + Zod',  description: 'Formularios con validación tipada'         },
  { name: 'TanStack Table v8',      description: 'Tablas de datos con paginación y filtros'  },
  { name: 'Recharts 3',             description: 'Gráficos y visualizaciones'                },
  { name: 'FullCalendar 6',         description: 'Calendario de turnos'                      },
  { name: 'Axios',                  description: 'Cliente HTTP centralizado'                  },
];

const modules = [
  {
    icon: Package,
    title: 'Inventario Tecnológico',
    description:
      'Gestión completa de activos tecnológicos: alta, asignación a empleados, mantenimientos preventivos y correctivos, exportación a Excel y dashboard de métricas.',
  },
  {
    icon: Clock,
    title: 'Programación de Turnos',
    description:
      'Calendario de turnos early/regular por departamento con validaciones de capacidad, fechas límite de modificación y alertas de turnos sin cubrir.',
  },
  {
    icon: Wrench,
    title: 'Horas Compensatorias',
    description:
      'Solicitud y aprobación de horas extras y compensatorios con flujo manager → admin, balance por empleado e historial completo.',
  },
  {
    icon: BarChart2,
    title: 'Indicadores de Negocio',
    description:
      'KPIs de facturación vs cobranza consultados sobre la base de datos de producción (solo lectura), con historial y health check de indicadores.',
  },
  {
    icon: Users,
    title: 'Gestión de Usuarios',
    description:
      'Registro, asignación de roles (admin, manager, inventory_manager, user) y control de permisos por módulo. Cifrado de DNI con Fernet.',
  },
];

// ─── Subcomponentes 

const StackBadge: React.FC<{ name: string; description: string }> = ({ name, description }) => (
  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
    <span className="mt-0.5 inline-block w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
    <div>
      <p className="text-sm font-semibold text-gray-800">{name}</p>
      <p className="text-xs text-gray-500 mt-0.5">{description}</p>
    </div>
  </div>
);

const ModuleCard: React.FC<{ icon: React.ElementType; title: string; description: string }> = ({
  icon: Icon,
  title,
  description,
}) => (
  <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center gap-3 mb-3">
      <div className="p-2 bg-emerald-50 rounded-lg">
        <Icon size={20} className="text-emerald-600" />
      </div>
      <h3 className="font-semibold text-gray-800">{title}</h3>
    </div>
    <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
  </div>
);

// ─── Página principal 

const AboutPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-10">

      {/* Hero */}
      <section className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-200">
          Uso interno — Departamento de Tecnología
        </div>
        <h1 className="text-3xl font-bold text-gray-900">
          StoneFixer
        </h1>
        <p className="text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Plataforma interna desarrollada por el Departamento de Tecnología de MKL Coders
          para resolver los gaps operativos que el ERP de la empresa no cubre.
          Centraliza la gestión de inventario tecnológico, turnos, horas compensatorias e
          indicadores de negocio en un único sistema.
        </p>
      </section>

      {/* Módulos */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Layout size={18} className="text-emerald-600" />
          Módulos de la plataforma
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modules.map((mod) => (
            <ModuleCard key={mod.title} {...mod} />
          ))}
        </div>
      </section>

      {/* Stack técnico */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">

        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Server size={18} className="text-emerald-600" />
            Backend
          </h2>
          <div className="space-y-2">
            {backendStack.map((item) => (
              <StackBadge key={item.name} {...item} />
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Layout size={18} className="text-blue-500" />
            Frontend
          </h2>
          <div className="space-y-2">
            {frontendStack.map((item) => (
              <StackBadge key={item.name} {...item} />
            ))}
          </div>
        </div>
      </section>

      {/* Seguridad */}
      <section className="p-5 bg-emerald-50 rounded-xl border border-emerald-200">
        <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Shield size={18} className="text-emerald-600" />
          Seguridad
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
          {[
            'Autenticación JWT con expiración configurable',
            'Rate limiting por IP en endpoints críticos',
            'Swagger protegido con Basic Auth',
            'Cifrado Fernet para datos sensibles (DNI)',
            'CORS restringido a orígenes autorizados',
            'Hashing bcrypt para contraseñas',
            'Roles y permisos por endpoint',
            'Validación estricta de datos con Pydantic v2',
          ].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Infra */}
      <section className="p-5 bg-gray-50 rounded-xl border border-gray-200">
        <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Database size={18} className="text-gray-600" />
          Infraestructura
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-700">
          <div>
            <p className="font-semibold text-gray-800 mb-1">Base de datos principal</p>
            <p className="text-gray-500">PostgreSQL en Aiven Cloud — datos de la plataforma</p>
          </div>
          <div>
            <p className="font-semibold text-gray-800 mb-1">Base de datos KPI</p>
            <p className="text-gray-500">PostgreSQL en Aiven Cloud — solo lectura, datos de producción</p>
          </div>
          <div>
            <p className="font-semibold text-gray-800 mb-1">Deploy</p>
            <p className="text-gray-500">stonefixer.mklcoders.com.ar</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 pb-4">
        StoneFixer · Departamento de Tecnología · MKL Coders · {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default AboutPage;