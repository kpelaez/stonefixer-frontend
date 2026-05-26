/**
 * ============================================
 * COMPONENTE: MainLayout
 * ============================================
 * 
 * ¿POR QUÉ ESTE COMPONENTE?
 * 1. COMPOSICIÓN: Integra Sidebar + Header + Content
 * 2. CONSISTENCIA: Todas las páginas usan el mismo layout
 * 3. RESPONSIVE: Se adapta automáticamente a cualquier tamaño
 * 4. PERFORMANCE: Layout optimizado para evitar reflows
 * 
 * ARQUITECTURA:
 * - CSS Grid en desktop (sidebar fijo + contenido flexible)
 * - Flexbox en mobile (layout vertical con drawer)
 * - Safe areas para iOS
 * - Optimizado para scroll
 */

import React from 'react';
import Sidebar from './Sidebar';

// TIPOS
interface MainLayoutProps {
    children: React.ReactNode;
    className?: string;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

/**
 * Layout principal de la aplicación
 * 
 * DECISIONES DE DISEÑO:
 * 
 * 1. ¿Por qué CSS Grid?
 *    - Perfecto para layouts de 2 columnas (sidebar + content)
 *    - Sidebar de ancho fijo, contenido flexible
 *    - Más mantenible que absolute positioning
 * 
 * 2. ¿Por qué height: 100vh?
 *    - Viewport completo sin scroll en el body
 *    - Scroll independiente en sidebar y content
 *    - Mejor performance (menos repaints)
 * 
 * 3. ¿Por qué overflow-hidden en el contenedor?
 *    - Previene scroll doble
 *    - Los hijos manejan su propio scroll
 * 
 * 4. ¿Por qué bg-gray-50?
 *    - Contraste visual con cards/contenido (bg-white)
 *    - Menos fatiga visual que blanco puro
 *    - Estándar en apps modernas
 */

export const MainLayout: React.FC<MainLayoutProps> = ({
    children, 
    className = ''
}) => {

    return (
        <div className="
      flex lg:grid lg:grid-cols-[auto_1fr]
      h-screen
      overflow-hidden
      bg-gray-50
    ">
      {/* 
        SIDEBAR
        - Mobile: Fixed overlay (controlado por Sidebar internamente)
        - Desktop: Columna fija del grid
        - Scroll independiente
      */}
      <Sidebar />
      
      {/* 
        CONTENIDO PRINCIPAL
        - Columna flexible del grid
        - Contiene Header + Content
        - Overflow-hidden para que Header sea sticky
      */}
      <div className="
        flex flex-col
        w-full
        overflow-hidden
      ">
        
        
        {/* 
          CONTENIDO
          - Flex-1: toma todo el espacio disponible
          - Overflow-y-auto: scroll vertical independiente
          - Padding: espacio para respirar
        */}
        <main className={`
          flex-1
          overflow-y-auto
          ${className}
        `}>
            {children}
        </main>
      </div>
      
      {/* 
        ESTILOS GLOBALES PARA EL LAYOUT
        ¿Por qué inline styles?
        - Específicos a este componente
        - Muy pequeños
        - No vale la pena un archivo CSS separado
      */}
      <style>{`
        /* 
          SMOOTH SCROLL
          ¿Por qué?
          - Mejor UX al hacer scroll programático (anchor links, etc)
          - Nativo del browser, no necesita JS
        */

        /* Fallback para navegadores antiguos */
        html, body, #root {
          height: 100vh;
          height: 100dvh;  /* Override con dvh si está soportado */
        }

        /* Aplicar a contenedores principales */
        .h-screen {
          height: 100vh;
          height: 100dvh;
        }

        html {
          scroll-behavior: smooth;
        }
        
        /* 
          WEBKIT SCROLLBAR PERSONALIZADO
          ¿Por qué?
          - Más delgado que el default (menos intrusivo)
          - Colores que coinciden con el diseño
          - Solo aplica a navegadores webkit (Chrome, Safari, Edge)
        */
        *::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        *::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        
        *::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        
        *::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        
        /* 
          SAFE AREAS PARA iOS
          ¿Por qué?
          - iPhone X+ tienen notch y home indicator
          - env() variables respetan estas áreas
          - Solo afecta dispositivos iOS modernos
        */
        @supports (padding: env(safe-area-inset-top)) {
          .safe-area-top {
            padding-top: env(safe-area-inset-top);
          }
          
          .safe-area-bottom {
            padding-bottom: env(safe-area-inset-bottom);
          }
          
          .safe-area-left {
            padding-left: env(safe-area-inset-left);
          }
          
          .safe-area-right {
            padding-right: env(safe-area-inset-right);
          }
        }
        
        /* 
          FOCUS VISIBLE
          ¿Por qué?
          - Accesibilidad: indicador visible de foco para keyboard nav
          - focus-visible solo muestra outline con teclado, no con mouse
          - Mejor UX que :focus tradicional
        */
        *:focus-visible {
          outline: 2px solid #10b981;
          outline-offset: 2px;
          border-radius: 4px;
        }
        
        /* 
          OPTIMIZACIONES DE RENDERING
          ¿Por qué?
          - transform y opacity activan GPU acceleration
          - Animaciones más suaves
          - Mejor performance
        */
        @media (prefers-reduced-motion: no-preference) {
          * {
            transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          }
        }
        
        /* 
          RESPETO POR PREFERENCIAS DE MOVIMIENTO
          ¿Por qué?
          - Accesibilidad: algunos usuarios tienen sensibilidad al movimiento
          - prefers-reduced-motion desactiva animaciones para ellos
          - Buena práctica de a11y
        */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
};

export default MainLayout;