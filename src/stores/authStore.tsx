import { create } from 'zustand';
import toast from 'react-hot-toast';
import type { AxiosError } from 'axios';
import api, { getApiError } from '../lib/axios';

interface LoginCredentials {
  email: string;
  password: string;
}

interface User { 
  id: number;
  email: string;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
}

export interface RegisterData extends LoginCredentials {
  full_name?: string;
  is_active?: boolean;
  roles?: string[];
}

interface AuthState {
    token: string | null;
    user: User | null;
    roles: string[];
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () =>void;
    getUser: () =>Promise<void>;
    register:(credentials: LoginCredentials & {full_name?:string, is_active?: boolean ,roles?: string[]}) => Promise<void>;
    hasRole: (role:string) => boolean;
    hasAnyRole:(roles: string[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get)=>({
  token: null,
  user: null,
  roles: [],
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (credentials: LoginCredentials) => {
    set({ isLoading: true, error: null});

    try {
      const formData = new URLSearchParams();
      formData.append('username', credentials.email);
      formData.append('password', credentials.password);

      const response = await api.post('/api/v1/auth/token', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      set({
        roles: response.data.roles || [],
        isAuthenticated: true,
        isLoading: false,
      });

      await get().getUser();
    } catch (error) {
      const errorMessage = getApiError(error);
      set({ error: errorMessage, isLoading: false, roles: [], isAuthenticated: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.post('/api/v1/auth/logout');
    } catch (error) {
      // Si el backend no responde, igual limpiamos la sesión local —
      // no tiene sentido dejar al usuario "atrapado" logueado en el cliente.
      console.warn('[AuthStore] Error al cerrar sesión en el servidor:', error);
    } finally {
      set({ token: null, user: null, roles: [], isAuthenticated: false, error: null });
      toast.success('Sesión cerrada exitosamente');
    }
  },

  getUser: async ()=>{
    const { user } = get();
    if (user) {
      set({ isLoading: false });
      return;
    }
    set({ isLoading: true });

    try {
      const response = await api.get('/api/v1/users/me');
      const userData = response.data;
      set({
        user: userData,
        roles: userData.roles?.length ? userData.roles : get().roles,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      const status = (error as AxiosError)?.response?.status;
      if (status === 401 || status === 403) {
        set({ user: null, roles: [], isAuthenticated: false, isLoading: false, token: null });
        return;
      }
      console.warn('[AuthStore] Error de red — manteniendo sesión:', error);
      set({ isLoading: false });
    }
  },

  register: async (credentials)=>{
    set({isLoading: true, error: null});

    try {
      await api.post('/api/v1/auth/register', {
        email: credentials.email,
        password: credentials.password,
        full_name: credentials.full_name || null,
        is_active: credentials.is_active ?? true,
        roles: credentials.roles || ['user'],
      });

      set({ isLoading: false });
    } catch (error) {
      const errorMessage = getApiError(error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  //Funciones de utilidad para verificar roles
  hasRole: (role: string) => {
    const { roles } = get();
    return roles.includes(role);
  },

  hasAnyRole: (requiredRoles: string[]) => {
    const { roles } = get();
    return requiredRoles.some(role => roles.includes(role));
  },
}));