import { useCallback, useEffect, useRef, useState } from "react";

/** Eventos que cuentan como actividad del usuario (RF-A24). */
const EVENTOS_ACTIVIDAD = ["mousemove", "keydown", "scroll", "click"] as const;
/** Última actividad compartida entre pestañas: trabajar en una no debe cerrar la sesión en otra. */
const CLAVE_ULTIMA_ACTIVIDAD = "delivery-dispatch-web-last-activity";
/** mousemove dispara decenas de eventos por segundo: basta con registrar uno por segundo. */
const THROTTLE_MS = 1000;

interface UseIdleTimeoutOptions {
  /** Tiempo total sin actividad tras el cual se ejecuta `onTimeout`. */
  timeoutMs: number;
  /** A partir de cuánto tiempo sin actividad se entra en fase de aviso (`isWarning`). */
  warningMs: number;
  onTimeout: () => void;
  enabled?: boolean;
}

export interface IdleTimeoutState {
  /** true entre `warningMs` y `timeoutMs`. Mientras dura, la actividad no lo cierra: hay que llamar a `reset`. */
  isWarning: boolean;
  /** Milisegundos que faltan para `onTimeout` (útil para la cuenta regresiva). */
  remainingMs: number;
  /** Reinicia el conteo (ej. botón "Seguir conectado"). */
  reset: () => void;
}

/**
 * Detecta inactividad del usuario. Compara la hora real contra la última actividad en vez de
 * usar un setTimeout largo: si la laptop se suspende o la pestaña queda en segundo plano, los
 * timers se congelan, pero la hora no.
 */
export function useIdleTimeout({ timeoutMs, warningMs, onTimeout, enabled = true }: UseIdleTimeoutOptions): IdleTimeoutState {
  const ultimaActividad = useRef(Date.now());
  const enAviso = useRef(false);
  const [isWarning, setIsWarning] = useState(false);
  const [remainingMs, setRemainingMs] = useState(timeoutMs - warningMs);

  // Siempre la versión más reciente del callback, sin reiniciar el efecto en cada render.
  const onTimeoutRef = useRef(onTimeout);
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  });

  const registrarActividad = useCallback(() => {
    const ahora = Date.now();
    ultimaActividad.current = ahora;
    try {
      localStorage.setItem(CLAVE_ULTIMA_ACTIVIDAD, String(ahora));
    } catch {
      /* storage bloqueado: igual funciona dentro de esta pestaña */
    }
  }, []);

  const reset = useCallback(() => {
    registrarActividad();
    enAviso.current = false;
    setIsWarning(false);
  }, [registrarActividad]);

  useEffect(() => {
    if (!enabled) return;
    reset();

    let ultimoRegistro = 0;
    const onActividad = () => {
      if (enAviso.current) return; // con el aviso abierto solo cuenta la decisión explícita
      const ahora = Date.now();
      if (ahora - ultimoRegistro < THROTTLE_MS) return;
      ultimoRegistro = ahora;
      registrarActividad();
    };

    // Actividad en otra pestaña: reinicia el conteo aquí también.
    const onStorage = (event: StorageEvent) => {
      if (event.key !== CLAVE_ULTIMA_ACTIVIDAD || !event.newValue) return;
      ultimaActividad.current = Math.max(ultimaActividad.current, Number(event.newValue));
      enAviso.current = false;
      setIsWarning(false);
    };

    // capture: el scroll de un contenedor interno no burbujea hasta window.
    EVENTOS_ACTIVIDAD.forEach((ev) => window.addEventListener(ev, onActividad, { passive: true, capture: true }));
    window.addEventListener("storage", onStorage);

    const intervalo = window.setInterval(() => {
      const inactivo = Date.now() - ultimaActividad.current;
      if (inactivo >= timeoutMs) {
        window.clearInterval(intervalo);
        onTimeoutRef.current();
        return;
      }
      if (inactivo >= warningMs) {
        if (!enAviso.current) {
          enAviso.current = true;
          setIsWarning(true);
        }
        setRemainingMs(timeoutMs - inactivo);
      }
    }, 1000);

    return () => {
      EVENTOS_ACTIVIDAD.forEach((ev) => window.removeEventListener(ev, onActividad, { capture: true }));
      window.removeEventListener("storage", onStorage);
      window.clearInterval(intervalo);
    };
  }, [enabled, timeoutMs, warningMs, reset, registrarActividad]);

  return { isWarning, remainingMs, reset };
}
