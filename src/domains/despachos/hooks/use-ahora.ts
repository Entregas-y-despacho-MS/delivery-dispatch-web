import { useEffect, useState } from "react";

/**
 * Reloj que se actualiza cada `cadaMs` (por defecto 15 s). Sirve para saber si una URL firmada ya venció
 * sin llamar a `Date.now()` en pleno render. `fijo` lo congela (solo para pruebas).
 */
export function useAhora(fijo?: number, cadaMs = 15_000): number {
  const [ahora, setAhora] = useState(() => fijo ?? Date.now());
  useEffect(() => {
    if (fijo !== undefined) return;
    const reloj = setInterval(() => setAhora(Date.now()), cadaMs);
    return () => clearInterval(reloj);
  }, [fijo, cadaMs]);
  return fijo ?? ahora;
}
