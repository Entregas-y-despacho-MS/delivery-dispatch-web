import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { useCrud } from "@/shared/hooks/use-crud";
import { parseApiError } from "@/shared/lib/api-error";
import { createQueryKeys } from "@/shared/lib/query-keys";
import { errorEnlace } from "../solicitudes-cambio.reglas";
import { revelarEnlaceSeguimiento, solicitudesCambioService } from "../services/solicitudes-cambio.service";
import type { SolicitudCambio, SolicitudesCambioParams } from "../solicitudes-cambio.types";
import {
  escribirFiltrosSolicitudes,
  leerFiltrosSolicitudes,
  paramsSolicitudes,
  type FiltrosSolicitudes,
} from "../solicitudes-cambio.url";

const SCOPE = "dispatch-change-requests";
const DEBOUNCE_MS = 300;

/** Llave de la bandeja; la reprogramación la invalida para que la solicitud resuelta salga de la lista. */
export const solicitudesCambioKeys = createQueryKeys<SolicitudesCambioParams>(SCOPE);

/**
 * Bandeja del coordinador con las solicitudes de cambio del cliente (ST-224.3): filtros por zona, fecha
 * y búsqueda en la URL, más antiguas primero (orden del back). Se refresca al volver a la pestaña porque
 * otro coordinador puede resolver una mientras tanto.
 */
export function useSolicitudesCambio() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filtros = useMemo(() => leerFiltrosSolicitudes(searchParams), [searchParams]);

  const actualizar = (cambios: Partial<FiltrosSolicitudes>) => {
    setSearchParams((actuales) => escribirFiltrosSolicitudes({ ...leerFiltrosSolicitudes(actuales), pagina: 1, ...cambios }, actuales), { replace: true });
  };

  const [busqueda, setBusquedaTexto] = useState(filtros.buscar);
  const temporizador = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(temporizador.current), []);
  const setBusqueda = (valor: string) => {
    setBusquedaTexto(valor);
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => actualizar({ buscar: valor.trim() }), DEBOUNCE_MS);
  };

  const params = useMemo(() => paramsSolicitudes(filtros), [filtros]);
  const solicitudes = useCrud<SolicitudCambio, never, never, SolicitudesCambioParams>(
    solicitudesCambioService,
    SCOPE,
    { policy: "live", params },
  );

  const hayFiltros = Boolean(busqueda.trim() || filtros.fecha) || filtros.zona !== "all";

  return {
    solicitudes,
    filtros,
    busqueda,
    setBusqueda,
    setZona: (zona: FiltrosSolicitudes["zona"]) => actualizar({ zona }),
    setFecha: (fecha: string) => actualizar({ fecha }),
    setPagina: (pagina: number) => actualizar({ pagina }),
    totalPaginas: Math.max(solicitudes.pages ?? 0, 1),
    hayFiltros,
    limpiarFiltros: () => {
      clearTimeout(temporizador.current);
      setBusquedaTexto("");
      actualizar({ buscar: "", zona: "all", fecha: "" });
    },
    refrescar: () => solicitudes.refetch(),
  };
}

/** Copia al portapapeles; false si el navegador no lo permite (p. ej. sin HTTPS). */
async function copiar(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return false;
  }
}

/**
 * «Mostrar enlace» para clientes sin correo. El enlace es la credencial del cliente: se pide al hacer clic,
 * se copia al portapapeles y no se guarda en la caché ni en la URL. Si el navegador no deja copiar, se
 * devuelve para mostrarlo una sola vez y se olvida al cerrar.
 */
export function useEnlaceSeguimiento() {
  const queryClient = useQueryClient();
  const [pendienteDeCopiar, setPendienteDeCopiar] = useState<{ codigo: string; url: string } | null>(null);

  const mutacion = useMutation({
    mutationFn: async (solicitud: Pick<SolicitudCambio, "dispatchId" | "trackingCode">) => {
      const { trackingUrl } = await revelarEnlaceSeguimiento(solicitud.dispatchId);
      return { codigo: solicitud.trackingCode, url: trackingUrl, copiado: await copiar(trackingUrl) };
    },
    onSuccess: ({ codigo, url, copiado }) => {
      if (copiado) toast.success(`Enlace de ${codigo} copiado. Compártelo solo con el cliente.`);
      else setPendienteDeCopiar({ codigo, url });
      mutacion.reset();
    },
    onError: (error) => {
      const { mensaje, recargar } = errorEnlace(parseApiError(error));
      toast.error(mensaje);
      if (recargar) void queryClient.invalidateQueries({ queryKey: solicitudesCambioKeys.all });
    },
  });

  return {
    mostrar: (solicitud: Pick<SolicitudCambio, "dispatchId" | "trackingCode">) => mutacion.mutate(solicitud),
    pidiendoId: mutacion.isPending ? mutacion.variables?.dispatchId : undefined,
    pendienteDeCopiar,
    olvidar: () => setPendienteDeCopiar(null),
  };
}
