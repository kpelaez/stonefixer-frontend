/**
 *
 * Sidebar unificado de StoneFixer.
 *
 * REEMPLAZA: Sidebar.tsx · Sidebar2.tsx · CollapsedSidebar.tsx
 *
 * COMPORTAMIENTO:
 * - Mobile  (<768px) : drawer deslizante con overlay backdrop
 * - Desktop (≥768px) : sidebar fijo, colapsable con animación suave
 *
 * DEPENDENCIAS:
 * - useMenu()        → lógica del menú (filtrado por roles, expansión, ruta activa)
 * - useSidebarStore  → estado colapsado/abierto (persistido en localStorage)
 * - MenuItem         → componente recursivo de ítem del menú
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import MenuItem from './MenuItem';
import { useMenu } from '../../hooks/useMenu';
import { useSidebarStore } from '../../stores/sidebarStore';
import { useAuthStore } from '../../stores/authStore';

// ─── Logo

const SFLogoIcon: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="sfGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   style={{ stopColor: '#047857', stopOpacity: 1 }} />
        <stop offset="33%"  style={{ stopColor: '#10b981', stopOpacity: 1 }} />
        <stop offset="66%"  style={{ stopColor: '#0ea5e9', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="16" fill="url(#sfGradient)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
    <text x="32" y="42" fontFamily="Space Grotesk, system-ui, Arial" fontSize="22" fontWeight="800" textAnchor="middle" fill="white">
      SF
    </text>
  </svg>
);

const StonefixerFullLogo: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex items-center space-x-3 ${className}`}>
    <SFLogoIcon size={40} />
    <div className="flex flex-col">
      <span className="text-lg font-bold bg-gradient-to-r from-emerald-700 to-blue-600 bg-clip-text text-transparent">
        StoneFixer
      </span>
    </div>
  </div>
);

// ─── Componente principal 

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const navigate = useNavigate();

  const { visibleMenuItems, expandedItems, toggleExpand, isActive } = useMenu();

  const {
    isCollapsed,
    isMobileMenuOpen,
    toggleCollapse,
    toggleMobileMenu,
    closeMobileMenu,
  } = useSidebarStore();

  const user   = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);

  // Cerrar el menú móvil al redimensionar a desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) closeMobileMenu();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [closeMobileMenu]);

  // Cerrar con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) closeMobileMenu();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen, closeMobileMenu]);

  // Bloquear scroll del body cuando el drawer está abierto en móvil
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  const handleMenuItemClick = () => {
    // En móvil, cerrar el drawer al navegar
    if (window.innerWidth < 768) closeMobileMenu();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
 
  const getUserInitials = () => {
    if (!user?.full_name) return 'U';
    return user.full_name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // ─── Secciones del sidebar 

  const renderHeader = () => (
    <div className={`
      flex-shrink-0 flex items-center justify-between
      ${isCollapsed ? 'p-3 flex-col gap-2' : 'p-4'}
      border-b border-gray-200 bg-white
    `}>
      {isCollapsed ? (
        <>
          <SFLogoIcon size={32} />
          <button
            type="button"
            onClick={toggleCollapse}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Expandir sidebar"
          >
            <ChevronRight size={16} />
          </button>
        </>
      ) : (
        <>
          <StonefixerFullLogo />
          <div className="flex items-center gap-1">
            {/* Botón colapsar — solo desktop */}
            <button
              type="button"
              onClick={toggleCollapse}
              className="hidden lg:flex p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              aria-label="Colapsar sidebar"
            >
              <ChevronLeft size={18} />
            </button>
            {/* Botón cerrar — solo mobile */}
            <button
              type="button"
              onClick={closeMobileMenu}
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              aria-label="Cerrar menú"
            >
              <X size={18} />
            </button>
          </div>
        </>
      )}
    </div>
  );

  const renderNav = () => (
    <nav
      className="flex-1 overflow-y-auto py-4 custom-scrollbar"
      aria-label="Navegación principal"
    >
      <div className="space-y-1 px-2">
        {visibleMenuItems.map((item) => (
          <MenuItem
            key={item.id}
            item={item}
            isExpanded={expandedItems[item.id] ?? false}
            expandedItems={expandedItems} 
            isActive={isActive(item)}
            onToggle={toggleExpand}
            onClick={handleMenuItemClick}
            variant={isCollapsed ? 'collapsed' : 'default'}
          />
        ))}
      </div>
    </nav>
  );

  const renderFooter = () => (
    <div className={`
      flex-shrink-0 border-t border-gray-200 bg-gray-50
      ${isCollapsed ? 'p-2' : 'p-3'}
    `}>
      {isCollapsed ? (
        // Colapsado: avatar + logout centrados
        <div className="flex flex-col items-center gap-2">
          <div
            className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center text-sm font-semibold"
            title={user?.full_name || 'Usuario'}
          >
            {getUserInitials()}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <LogOut size={16} />
          </button>
        </div>
      ) : (
        // Expandido: avatar + nombre/email + logout en fila
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
            {getUserInitials()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">
              {user?.full_name || 'Usuario'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex-shrink-0 p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <LogOut size={18} />
          </button>
        </div>
      )}
    </div>
  );

  // ─── Render 

  return (
    <>
      {/* Botón hamburger — visible solo en móvil */}
      <button
        type="button"
        onClick={toggleMobileMenu}
        className="
          md:hidden
          fixed top-4 left-4 z-50
          p-2 rounded-lg
          bg-white shadow-md border border-gray-200
          text-gray-600 hover:bg-gray-50
          transition-colors
        "
        aria-label="Abrir menú"
        aria-expanded={isMobileMenuOpen}
      >
        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Backdrop — solo móvil cuando el drawer está abierto */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          ${className}
          fixed md:sticky
          top-0 left-0
          h-screen z-40
          transition-all duration-300 ease-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          w-[85vw] max-w-[320px]
          ${isCollapsed ? 'lg:w-20' : 'lg:w-[280px]'}
          bg-white border-r border-gray-200
          shadow-2xl lg:shadow-none
          flex flex-col overflow-hidden
          safe-area-inset-left
        `}
        aria-label="Sidebar"
      >
        {renderHeader()}
        {renderNav()}
        {renderFooter()}
      </aside>

      {/* Estilos del scrollbar personalizado */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .safe-area-inset-left { padding-left: env(safe-area-inset-left, 0); }
      `}</style>
    </>
  );
};

export default Sidebar;