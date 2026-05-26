import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarStore {
  isCollapsed: boolean;
  isMobileMenuOpen: boolean;
  toggleCollapse: () => void;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  openMobileMenu: () => void;
}

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set) => ({
      isCollapsed: false,
      isMobileMenuOpen: false,
      toggleCollapse: () => set((s) => ({ isCollapsed: !s.isCollapsed })),
      toggleMobileMenu: () => set((s) => ({ isMobileMenuOpen: !s.isMobileMenuOpen })),
      closeMobileMenu: () => set({ isMobileMenuOpen: false }),
      openMobileMenu: () => set({ isMobileMenuOpen: true }),
    }),
    {
      name: 'sf-sidebar-state',
      // Solo persistir isCollapsed, NO isMobileMenuOpen
      partialize: (state) => ({ isCollapsed: state.isCollapsed }),
    }
  )
);