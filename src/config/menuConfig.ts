/*
 * CONFIGURACIÓN CENTRAL DEL MENÚ
 * 
 * ¿POR QUÉ ESTE ARCHIVO?
 * 1. Single Source of Truth: Un solo lugar para definir todas las rutas
 * 2. Type Safety: TypeScript nos protege de errores
 * 3. Fácil mantenimiento: Agregar/quitar rutas es trivial
 * 4. Reutilizable: Sidebar, MobileNav, Breadcrumbs pueden usar esto
 * 
 * REGLAS:
 * - Cada item DEBE tener un título único
 * - Los paths deben empezar con "/"
 * - Los roles deben coincidir con el sistema de autenticación
 */

import { LucideIcon, SquareKanban } from 'lucide-react';
import {
    Home,
    BarChart2,
    Users,
    Settings,
    PlusCircle,
    Laptop,
    Package,
    ClipboardList,
    FileText,
    ShieldAlert,
    Info,
    Building2,
} from 'lucide-react';

/**
 * Roles disponibles en el sistema
 * IMPORTANTE: Estos deben coincidir con el backend
 */
export type UserRole = 'admin' | 'manager' | 'user' | 'inventory_manager';

/**
 * Definicion de un item del menu
 */
export interface MenuItem {
    id: string;
    title: string;
    path?:string; /* Ruta a la que navega (opcional si tiene children) */
    icon?:LucideIcon;
    children?:MenuItem[];
    requiredRoles?:UserRole[]; /* Roles que pueden ver este item (si no se especifica, visible para todos) */
    badge?:string | number; /* Badge opcional (ej: "Beta", "Nuevo", número de notificaciones) */
    disabled?: boolean; /* Si está deshabilitado */
}

// CONFIGURACIÓN DEL MENÚ

/**
 * ¿POR QUÉ ESTA ESTRUCTURA?
 * - Permite crear jerarquías de cualquier profundidad
 * - Fácil de leer y modificar
 * - Los IDs permiten estado de expansión persistente
 * - Los iconos mejoran la UX y accesibilidad visual
 */

export const menuItems: MenuItem[] = [
  {
    id: 'home',
    title: 'Inicio',
    path: '/',
    icon: Home,
    requiredRoles: ['admin', 'manager', 'user']
  },
  {
    id: 'dashboards',
    title: 'Dashboards',
    icon: BarChart2,
    requiredRoles: ['admin', 'manager'],
    children: [
      {
        id: 'business-indicators',
        title: 'Indicadores',
        path: '/dashboards/dash-ppal',
        icon: SquareKanban,      
      },
      {
        id: 'contribucion-marginal',      
        title: 'Contribución Marginal',
        path: '/dashboards/contribucion-marginal',
        icon: BarChart2,
      }
    ]
  },

  {
    id: 'sectores',
    title: 'Sectores',
    icon: Building2,
    requiredRoles: ['admin', 'manager', 'user'],
    children: [
      { id: 'sectores-directorio', title: 'Directorio', path: '/teams/directorio' },
      { id: 'sectores-dat', title: 'D.A.T.', path: '/teams/desarrollo' },
      { 
        id: 'sectores-rrhh', 
        title: 'Recursos Humanos',  
        children: [
          {
          id: 'hr-survey',
          title: 'Encuesta Clima Laboral',
          path: '/teams/rrhh/dashboards/hr-survey',
          icon: BarChart2,
          badge: '2026',
          },
        ]
      },
      { id: 'sectores-comex', title: 'Comercio Exterior', path: '/teams/comex' },
      { id: 'sectores-vendedores', title: 'Vendedores', path: '/teams/vendedores' },
      { id: 'sectores-asistencia', title: 'Asistencia Técnica', path: '/teams/asistencia-tecnica' },
      { id: 'sectores-adminventas', title: 'Administración de Ventas', path: '/teams/admin-ventas' },
      { id: 'sectores-proveedores', title: 'Pago a Proveedores', path: '/teams/pago-proveedores' },
      { id: 'sectores-facturacion', title: 'Facturación', path: '/teams/facturacion' },
      { id: 'sectores-logistica', title: 'Logística', path: '/teams/logistica-inversa' },
      { id: 'sectores-tesoreria', title: 'Tesorería', path: '/teams/tesoreria' },
      {
        id: 'sectores-stock',
        title: 'Stock',
        children: [
          {
            id: 'sectores-stock-turnos',
            title: 'Turnos',
            path: '/teams/stock/schedule',
            requiredRoles: ['admin', 'manager', 'user'],
          },
          {
            id: 'sectores-stock-overtime',
            title: 'Mis Horas a Comp.',
            path: '/teams/stock/overtime',
            requiredRoles: ['admin', 'manager', 'user'],
          },
          {
            id: 'sectores-stock-overtime-manage',
            title: 'Gestión Horas Comp.',
            path: '/overtime/manage',
            requiredRoles: ['admin', 'manager'],   // Solo managers ven esto
          },
          {
            id: 'sectores-stock-inventario',
            title: 'Inventario de Stock',
            path: '/stock/inventario',
            requiredRoles: ['admin', 'manager'],
          },
          {
            id: 'sectores-stock-reportes',
            title: 'Reportes',
            icon: BarChart2,  
            requiredRoles: ['admin', 'manager', 'user'],
            children: [
              {
                id: 'stock-report-remitos-cx',
                title: 'Planificación CX',
                path: '/stock/reports/remitos-cx',
                requiredRoles: ['admin', 'manager', 'user'],
              },
            ],
          },
          
        ]
      },
    ]
  },  
  {
    id: 'tech-inventory',
    title: 'Inventario Tecnológico',
    icon: Laptop,
    requiredRoles: ['admin', 'manager', 'inventory_manager', 'user'],
    children: [
      {
        id: 'tech-assets',
        title: 'Activos',
        path: '/inventory/tech-assets',
        icon: Package,
        requiredRoles: ['admin', 'manager', 'inventory_manager', 'user'],
      },
      {
        id: 'tech-assignments',
        title: 'Asignaciones',
        path: '/inventory/assignments',
        icon: ClipboardList,
        requiredRoles: ['admin', 'manager', 'inventory_manager'],
      },
      {
        id: 'tech-maintenance',
        title: 'Mantenimiento',
        path: '/inventory/maintenance',        
        icon: ShieldAlert,
        requiredRoles: ['admin', 'manager', 'inventory_manager'],
      },
      {
        id: 'tech-reports',
        title: 'Reportes',
        path: '/tech-inventory/reports',
        icon: FileText,
        requiredRoles: ['admin', 'manager', 'inventory_manager'],
      }
    ]
  },
  
  {
    id: 'sf-admin',
    title: 'SF Administración',
    icon: Settings,
    requiredRoles: ['admin'],
    children: [
      {
        id: 'admin-register-user',
        title: 'Registrar Usuario',
        path: '/admin/register-user',
        icon: PlusCircle
      },
      {
        id: 'admin-users',
        title: 'Listar Usuarios',
        path: '/admin/users',
        icon: Users
      }
    ]
  },
  
  {
    id: 'about',
    title: 'Acerca de',
    path: '/about',
    icon: Info,
    requiredRoles: ['admin', 'manager', 'user']
  }
]

// UTILIDADES

/**
 * ¿POR QUÉ ESTAS FUNCIONES?
 * - Separan la lógica de negocio de la presentación
 * - Reutilizables en cualquier componente
 * - Fáciles de testear
 * - Type-safe
 */

/**
 * Filtra los items del menú según los roles del usuario
 * @param items - Items del menú
 * @param userRoles - Roles del usuario actual
 * @returns Items filtrados que el usuario puede ver
 */
export const filterMenuByRoles = ( items: MenuItem[], userRoles: UserRole[]): MenuItem[] => {
    return items
        .filter(item => {
            if(!item.requiredRoles || item.requiredRoles.length === 0) {
                return true;
            }

            return item.requiredRoles.some(role => userRoles.includes(role));
        })
        .map(item => {
            if(item.children && item.children.length > 0) {
                const filteredChildren = filterMenuByRoles(item.children, userRoles);

                if (filteredChildren.length === 0) {
                    return null;
                }

                return {
                    ...item,
                    children: filteredChildren
                };
            }

            return item;
        })
        .filter((item): item is MenuItem => item !== null);
};

/**
 * Encuentra un item del menú por su path
 * Útil para breadcrumbs, título de página, etc.
 */
export const findMenuItemByPath = (items: MenuItem[], path:string): MenuItem | null => {
    for( const item of items) {
        if(item.path === path){
            return item;
        }

        if (item.children) {
            const found = findMenuItemByPath(item.children, path);
            if (found) return found;
        }
    }

    return null;
}

/**
 * Obtiene todos los paths del menú (útil para validación de rutas)
 */
export const getAllMenuPaths = (items: MenuItem[]): string[] => {
    const paths: string[] = [];

    const traverse = (menuItems: MenuItem[]) => {
        menuItems.forEach(item => {
            if (item.path) {
                paths.push(item.path);
            }
            if (item.children) {
                traverse(item.children);
            }
        });
    };

    traverse(items);
    return paths;
};

/**
 * Verifica si un path está dentro de un item del menú (útil para "active state")
 */
export const isPathActive = (item: MenuItem, currentPath: string): boolean => {
    // Coincidencia exacta
    if (item.path === currentPath) {
        return true;
    }

    // Si tiene hijos, verificar recursivamente
    if (item.children) {
        return item.children.some(child => isPathActive(child, currentPath));
    }

    return false;
}