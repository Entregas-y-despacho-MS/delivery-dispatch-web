import { useEffect, useState } from "react";

/**
 * Retrasa la actualización de un valor hasta que haya transcurrido un tiempo de espera especificado.
 *
 * @param value Valor reactivo a someter a debounce.
 * @param delay Tiempo de retardo en milisegundos (por defecto 300ms).
 * @returns Valor actualizado tras el retardo.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
