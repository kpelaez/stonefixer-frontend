/**
 * COMPONENTE: MenuItem
 * 
 * ¿POR QUÉ ESTE COMPONENTE?
 * 1. RECURSIVIDAD: Los menús son árboles, necesitamos renderizar niveles anidados
 * 2. REUTILIZACIÓN: Un solo componente para desktop, móvil, colapsado, expandido
 * 3. MANTENIBILIDAD: Cambiar la UI del menú = tocar un solo archivo
 * 4. COMPOSICIÓN: React best practice (composition over inheritance)
 * 
 * CARACTERÍSTICAS:
 * - Recursivo: Renderiza sus propios hijos
 * - Responsive: Se adapta a mobile/desktop automáticamente
 * - Accesible: Usa semántica HTML correcta
 * - Animado: Transiciones suaves con Tailwind
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { MenuItem as MenuItemType } from '../../config/menuConfig';

// TIPOS

interface MenuItemProps {
    item: MenuItemType;
    level?: number;
    isExpanded?: boolean;
    expandedItems?: Record<string, boolean>;
    isActive?: boolean;
    onToggle?: (itemId: string) => void;
    onClick?: () => void;
    variant?: 'default' | 'collapsed' | 'mobile';
}

export const MenuItem: React.FC<MenuItemProps> = ({
  item, 
  level = 0, 
  isExpanded = false,
  expandedItems = {},
  isActive = false, 
  onToggle, 
  onClick, 
  variant = 'default'
}) => {
  const location = useLocation();
  const hasChildren = item.children && item.children.length > 0;
  const isDisabled = item.disabled === true;

  // CALCULAR ESTILOS
  
  /**
   * ¿POR QUÉ CALCULAR ESTILOS DINÁMICAMENTE?
   * - Responsive: diferentes estilos para mobile/desktop/collapsed
   * - Accesibilidad: estados claros (hover, active, focus)
   * - Performance: Tailwind purge elimina clases no usadas
   */
  const paddingLeft = variant === 'collapsed' ? 'px-3' : level === 0 ? 'pl-4' :`pl-${4 + level * 4}`;
  const heightClass = variant === 'mobile' ? 'min-h-[48px]' : `min-h-[40px]`;

  // Estilos base del contenedor
  const baseStyles = `
    flex items-center w-full
    ${heightClass}
    ${paddingLeft}
    pr-3
    transition-all duration-150
    relative
    rounded-lg
    my-0.5
  `;

  // Estilos cuando esta activo
  const activeStyles = isDisabled
    ? 'text-gray-400 cursor-not-allowed opacity-60'
    : isActive
      ? 'bg-emerald-50 text-emerald-700 font-semibold border-l-4 border-emerald-600 shadow-sm'
      : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 border-l-4 border-transparent';

   // Estilos para items con children (no clickeables)
   const parentStyles = hasChildren && !item.path ? 'font-medium text-gray-800' : '';

   // Estilos para modo colapsado
  const collapsedStyles = variant === 'collapsed'
    ? 'justify-center p-3 mx-2 rounded-xl hover:bg-emerald-50'
    : '';
  
  const itemStyles = `
    ${baseStyles}
    ${activeStyles}
    ${parentStyles}
    ${collapsedStyles}
    group
  `;

  const renderIcon = () => {
    if (!item.icon) return null;

    const Icon = item.icon;
    const iconSize = variant === 'collapsed' ? 24 : 20;

    const iconColor = isDisabled
      ? 'text-gray-300'
      : isActive
        ? 'text-emerald-600'
        : 'text-emerald-600 opacity-70 group-hover:opacity-100';

    return (
        <Icon
          size={iconSize}
          className={`
            flex-shrink-0
            ${variant === 'collapsed' ? '' : 'mr-3'}
            ${iconColor}
            transition-opacity duration-150
            `}
        />
    );
  };

  // ==========================================
  // RENDERIZAR CHEVRON (para items con children)
  // ==========================================
  
  const renderChevron = () => {
    if (!hasChildren || variant === 'collapsed') return null;
    
    const ChevronIcon = isExpanded ? ChevronDown : ChevronRight;
    
    return (
      <ChevronIcon 
        size={16} 
        className="ml-auto text-emerald-600 opacity-70 flex-shrink-0 transition-transform duration-200"
        style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(0deg)' }}
      />
    );
  };
  
  // ==========================================
  // RENDERIZAR BADGE
  // ==========================================
  
  const renderBadge = () => {
    if (!item.badge || variant === 'collapsed') return null;
    
    return (
      <span className="ml-auto px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full">
        {item.badge}
      </span>
    );
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isDisabled) {
      e.preventDefault();
      return;
    }
    if (hasChildren && !item.path) {
      e.preventDefault();
      onToggle?.(item.id);
      return;
    }
    onClick?.();
  };

  // RENDERIZAR CONTENIDO
  
  const renderContent = () => (
    <>
      {renderIcon()}
      
      {variant !== 'collapsed' && (
        <>
          <span className="flex-1 truncate">
            {item.title}
          </span>
          {renderBadge()}
          {renderChevron()}
        </>
      )}
    </>
  );

  // RENDERIZAR ELEMENTO
  
  /**
   * ¿POR QUÉ ESTA LÓGICA?
   * - Si tiene path: usar <Link> para navegación SPA
   * - Si tiene children sin path: usar <button> (es una acción, no navegación)
   * - Semántica correcta = mejor accesibilidad
   */

  const element = item.path && !isDisabled ? (
   <Link
      to={item.path}
      className={itemStyles}
      onClick={handleClick}
      aria-current={isActive ? 'page' : undefined}
      title={variant === 'collapsed' ? item.title : undefined}
    >
      {renderContent()}
    </Link>
  ) : (
    <button
      type="button"
      className={itemStyles}
      onClick={handleClick}
      aria-expanded={hasChildren ? isExpanded : undefined}
      title={variant === 'collapsed' ? item.title : undefined}
      disabled={isDisabled}
    >
      {renderContent()}
    </button>
  );

  // RENDERIZAR CHILDREN (RECURSIVO)
  
  /**
   * ¿POR QUÉ RECURSIVIDAD?
   * - Los menús son árboles de profundidad variable
   * - Un MenuItem puede renderizar otros MenuItems
   * - Esto permite jerarquías de cualquier nivel
   * 
   * NOTA: En modo collapsed no mostramos children
   */
  
  const renderChildren = () => {
    if (!hasChildren || !isExpanded || variant === 'collapsed') {
      return null;
    }
    
    return (
      <div 
        className="overflow-hidden transition-all duration-200"
        style={{
          // Animación suave de altura
          maxHeight: isExpanded ? '1000px' : '0'
        }}
      >
        {item.children!.map(child => (
          <MenuItem
            key={child.id}
            item={child}
            level={level + 1}
            isExpanded={expandedItems[child.id] ?? false}
            expandedItems={expandedItems} 
            isActive={child.path === location.pathname}
            onToggle={onToggle}
            onClick={onClick}
            variant={variant}
          />
        ))}
      </div>
    );
  };
  
  // RENDER FINAL
  
  return (
    <div className={variant === 'mobile' ? 'border-b border-gray-100 last:border-0' : ''}>
      {element}
      {renderChildren()}
    </div>
  );
};

// ============================================
// MEMOIZACIÓN
// ============================================

/**
 * ¿POR QUÉ React.memo?
 * - Los menús pueden tener muchos items (50+)
 * - Sin memo, cada item se re-renderiza cuando cualquier cosa cambia
 * - Con memo, solo se re-renderiza si sus props cambian
 * - Mejora significativa de performance en menús grandes
 * 
 * IMPORTANTE: Por eso usamos useCallback en los handlers del hook
 */
export default React.memo(MenuItem);