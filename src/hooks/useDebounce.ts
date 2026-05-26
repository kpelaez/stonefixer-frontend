import { useEffect, useState } from 'react';

/**
 * Hook personalizado para aplicar debounce a un valor.
 * Útil para búsquedas en tiempo real sin hacer una llamada al API con cada tecla.
 * 
 * @param value - El valor a debounce
 * @param delay - El delay en milisegundos (default: 500ms)
 * @returns El valor debounced
 * 
 * @example
 * ```tsx
 * const [searchInput, setSearchInput] = useState('');
 * const debouncedSearch = useDebounce(searchInput, 500);
 * 
 * useEffect(() => {
 *   // Esta llamada solo se ejecuta 500ms después de que el usuario deja de escribir
 *   fetchResults(debouncedSearch);
 * }, [debouncedSearch]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Crear un timer que actualiza el valor después del delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: cancelar el timer si el valor cambia antes de que expire
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}