import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { parseApiError } from "@/shared/lib/api-error";
import { createQueryKeys } from "@/shared/lib/query-keys";
import { desenlaceAcceso, normalizarCodigoSeguimiento } from "../seguimiento.acceso";
import { intervaloRefresco } from "../seguimiento.en-vivo";
import { pedirCodigoAcceso, verificarCodigoAcceso, verSeguimientoPorSesion } from "../services/tracking-acceso.service";
import type { SesionSeguimiento } from "../types/seguimiento.types";

export const accesoKeys = createQueryKeys("public-tracking-access");

const VENCIO = "Tu acceso venció. Vuelve a verificarte para seguir viendo tu pedido.";

export type PasoAcceso = "codigo" | "verificar" | "viendo";

/** Ni 401 ni 429 mejoran reintentando solos. */
const reintentar = (fallos: number, error: unknown) => fallos < 2 && parseApiError(error).retryable;

/**
 * Flujo del acceso por código (ST-309.2): pedir el código, escribir los 6 dígitos y ver el pedido.
 * La sesión vive solo en memoria de esta pantalla (nunca URL ni almacenamiento): al recargar o al vencer se pide otra.
 * La clave de la consulta usa un número de sesión, no la sesión misma.
 */
export function useAccesoPorCodigo() {
  const queryClient = useQueryClient();
  const [paso, setPaso] = useState<PasoAcceso>("codigo");
  const [codigoSeguimiento, setCodigoSeguimiento] = useState("");
  const [pedidoEn, setPedidoEn] = useState<number | null>(null);
  const [expiraEnSegundos, setExpiraEnSegundos] = useState<number | null>(null);
  const [sesion, setSesion] = useState<SesionSeguimiento | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const numeroSesion = useRef(0);
  const [idSesion, setIdSesion] = useState(0);

  const pedir = useMutation({
    mutationFn: (codigo: string) => pedirCodigoAcceso(codigo),
    onSuccess: (respuesta, codigo) => {
      setCodigoSeguimiento(codigo);
      setExpiraEnSegundos(respuesta.expiresInSeconds);
      setPedidoEn(Date.now());
      setSesion(null);
      setAviso(null);
      setPaso("verificar");
    },
  });

  const verificar = useMutation({
    mutationFn: (codigo: string) => verificarCodigoAcceso(codigoSeguimiento, codigo),
    onSuccess: (nueva) => {
      numeroSesion.current += 1;
      setIdSesion(numeroSesion.current);
      setSesion(nueva);
      setAviso(null);
      setPaso("viendo");
    },
  });

  // 401 del back: la sesión ya no sirve. Se vuelve al inicio sin pedirla otra vez.
  const [rechazada, setRechazada] = useState<number | null>(null);
  const vista = useQuery({
    queryKey: accesoKeys.detail(idSesion),
    queryFn: async ({ signal }) => {
      try {
        return await verSeguimientoPorSesion(sesion?.session ?? "", signal);
      } catch (error) {
        if (desenlaceAcceso(parseApiError(error)) === "sesion-vencida") setRechazada(idSesion);
        throw error;
      }
    },
    enabled: sesion !== null && rechazada !== idSesion,
    retry: reintentar,
    staleTime: 30_000,
    gcTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => intervaloRefresco(query.state.data),
    refetchIntervalInBackground: false,
  });

  /** Vuelve al inicio y olvida la sesión y lo que se mostró con ella. */
  const salir = (mensaje: string | null = null) => {
    queryClient.removeQueries({ queryKey: accesoKeys.all });
    setSesion(null);
    setPedidoEn(null);
    setExpiraEnSegundos(null);
    pedir.reset();
    verificar.reset();
    setAviso(mensaje);
    setPaso("codigo");
  };

  const alVencer = useEffectEvent(() => salir(VENCIO));

  // Al llegar expiresAt se sale sin esperar al próximo 401.
  useEffect(() => {
    if (!sesion) return;
    const restante = Math.max(0, new Date(sesion.expiresAt).getTime() - Date.now());
    const temporizador = window.setTimeout(() => alVencer(), Math.min(restante, 2_147_483_647));
    return () => window.clearTimeout(temporizador);
  }, [sesion]);

  const sesionRechazada = sesion !== null && rechazada === idSesion;

  return {
    paso: sesionRechazada ? ("codigo" as const) : paso,
    codigoSeguimiento,
    pedidoEn,
    expiraEnSegundos,
    sesionExpiraEn: sesionRechazada ? null : (sesion?.expiresAt ?? null),
    aviso: sesionRechazada ? VENCIO : aviso,
    pedir: { ...pedir, enviar: (valor: string) => pedir.mutate(normalizarCodigoSeguimiento(valor)) },
    /** Pide otro código para el mismo código de seguimiento. */
    reenviar: () => {
      verificar.reset();
      pedir.mutate(codigoSeguimiento);
    },
    verificar,
    vista,
    cambiarCodigo: () => salir(null),
    salir: () => salir(null),
  };
}
