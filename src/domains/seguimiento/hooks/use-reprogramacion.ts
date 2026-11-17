import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { parseApiError } from "@/shared/lib/api-error";
import { intentosRestantes, reprogramacionCerrada, requiereNuevoCodigo } from "../seguimiento.errores";
import type { CodigoEnviado, SeguimientoPublico } from "../types/seguimiento.types";
import {
  enviarCodigo,
  listarFranjas,
  reprogramarEntrega,
  verificarCodigo,
} from "../services/tracking-publico.service";
import { seguimientoKeys } from "./use-seguimiento-publico";

/** Paso del flujo de reprogramación: pedir código → escribirlo → elegir franja. */
export type PasoReprogramacion = "pedir-codigo" | "verificar" | "elegir-franja";

interface Opciones {
  token: string;
  /** El back reprogramó: el pedido actualizado reemplaza al de la caché. */
  alReprogramar: (pedido: SeguimientoPublico) => void;
  /** La reprogramación ya no está disponible: hay que recargar el pedido y cerrar el flujo. */
  alCerrarse: () => void;
}

/**
 * Reprogramación con verificación por correo (ST-224.2, escenario 2).
 * La prueba vive solo en memoria: nunca en la URL ni en el almacenamiento del navegador.
 */
export function useReprogramacion({ token, alReprogramar, alCerrarse }: Opciones) {
  const [paso, setPaso] = useState<PasoReprogramacion>("pedir-codigo");
  const [envio, setEnvio] = useState<CodigoEnviado | null>(null);
  const [prueba, setPrueba] = useState<string | null>(null);
  const [intentos, setIntentos] = useState<number | null>(null);

  const reiniciar = () => {
    setPaso("pedir-codigo");
    setPrueba(null);
    setIntentos(null);
  };
  const tratarError = (error: unknown) => {
    const apiError = parseApiError(error);
    if (reprogramacionCerrada(apiError)) alCerrarse();
    else if (requiereNuevoCodigo(apiError)) reiniciar();
  };

  const pedirCodigo = useMutation({
    mutationFn: () => enviarCodigo(token),
    onSuccess: (enviado) => {
      setEnvio(enviado);
      setIntentos(null);
      setPaso("verificar");
    },
    onError: tratarError,
  });

  const verificar = useMutation({
    mutationFn: (codigo: string) => verificarCodigo(token, codigo),
    onSuccess: ({ proof }) => {
      setPrueba(proof);
      setPaso("elegir-franja");
    },
    onError: (error) => {
      setIntentos(intentosRestantes(error));
      tratarError(error);
    },
  });

  const franjas = useQuery({
    queryKey: [...seguimientoKeys.detail(token), "slots", prueba],
    queryFn: ({ signal }) => listarFranjas(token, prueba as string, signal),
    enabled: paso === "elegir-franja" && prueba !== null,
    retry: false,
    staleTime: 0,
  });

  const reprogramar = useMutation({
    mutationFn: (slotId: string) => reprogramarEntrega(token, slotId, prueba as string),
    onSuccess: (pedido) => {
      reiniciar();
      alReprogramar(pedido);
    },
    onError: (error) => {
      // La franja se ocupó mientras elegía: se vuelven a listar con la misma prueba.
      if (parseApiError(error).code === "SLOT_NO_LONGER_AVAILABLE") void franjas.refetch();
      else tratarError(error);
    },
  });

  return { paso, envio, intentos, pedirCodigo, verificar, franjas, reprogramar, reiniciar };
}
