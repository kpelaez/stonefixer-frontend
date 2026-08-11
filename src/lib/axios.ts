/**
 * Instancia centralizada de Axios para StoneFixer.
 *
 * RESPONSABILIDADES:
 * - Manejar errores HTTP de forma consistente (401, 403, 500...)
 * - Redirigir al login cuando el token expira, sin repetir esa lógica en cada servicio
 * - Enviar cookies httpOnly automáticamente en cada request (withCredentials: true)
 * - Exponer la baseURL desde la variable de entorno VITE_API_URL
 *
 * USO:
 *   import api from '@/lib/axios';
 *   const data = await api.get('/inventory/tech-assets');
 */

import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';

// ─── Instancia base 

const api = axios.create({
  baseURL: import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL ?? ''),
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  timeout: 15000, // 15 segundos — evita requests colgados silenciosamente
  withCredentials: true,  // <-- agregar esto: envía la cookie en cada request automáticamente
});

// ─── Interceptor de REQUEST — inyectar token 

// Cookie httpOnly la envía el browser automáticamente via withCredentials
// No se requiere inyección manual de token
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// ─── Interceptor de RESPONSE — manejar errores globalmente 

api.interceptors.response.use(
  // Respuesta exitosa: pasar sin modificar
  (response) => response,

  // Error: manejar según el código HTTP
  (error: AxiosError) => {
    const status = error.response?.status;

    if (status === 401) {
      toast.error('Tu sesión expiró. Iniciá sesión nuevamente.');

      // Evitar redirigir si ya estamos en /login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    } else if (status === 403) {
      toast.error('No tenés permisos para realizar esta acción.');
    } else if (status === 404) {
      // 404 es silencioso: los servicios manejan este caso puntualmente
    } else if (status && status >= 500) {
      // Error del servidor: mostrar mensaje genérico
      const detail = (error.response?.data as { detail?: string })?.detail;
      toast.error(detail || 'Error del servidor. Intentá de nuevo más tarde.');
    } else if (!error.response) {
      // Sin respuesta: error de red / timeout
      toast.error('Sin conexión al servidor. Verificá tu red.');
    }

    return Promise.reject(error);
  }
);

export default api;

// ─── Helper tipado para extraer el mensaje de error 

/**
 * Extrae el mensaje de error de una respuesta de la API de StoneFixer.
 * Útil para mostrar errores específicos en formularios.
 *
 * @example
 * try {
 *   await api.post('/api/v1/auth/token', ...);
 * } catch (err) {
 *   setError(getApiError(err)); // "Email o contraseña incorrectos"
 * }
 */
export function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { detail?: string; message?: string } | undefined;
    return data?.detail || data?.message || error.message || 'Error inesperado';
  }
  if (error instanceof Error) return error.message;
  return 'Error inesperado';
}