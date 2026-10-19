import { useState } from "react";

import { Skeleton } from "@/shared/components/ui/skeleton";
import { parseApiError } from "@/shared/lib/api-error";
import { useReprogramacion } from "../hooks/use-reprogramacion";
import { useRespuestaCliente, useSeguimientoPublico } from "../hooks/use-seguimiento-publico";
import { mensajeErrorSeguimiento, vistaError } from "../seguimiento.errores";
import { AccionesAutoservicio } from "./acciones-autoservicio";
import { PasoElegirFranja, PasoPedirCodigo, PasoVerificarCodigo } from "./reprogramacion-pasos";
import { SeguimientoError } from "./seguimiento-error";
import { SeguimientoResumen } from "./seguimiento-resumen";
import { SolicitarCambioForm } from "./solicitar-cambio-form";

type Panel = "acciones" | "cambio" | "reprogramar";

const mensaje = (error: unknown) => (error ? mensajeErrorSeguimiento(parseApiError(error)) : null);

/**
 * Página pública de seguimiento y reprogramación (ST-224.2, RF-U14 y RF-U21).
 * Sin login: el token del enlace es la única credencial.
 */
export function SeguimientoPublicoVista({ token }: { token: string }) {
  const seguimiento = useSeguimientoPublico(token);
  const respuesta = useRespuestaCliente(token);
  const [panel, setPanel] = useState<Panel>("acciones");
  const volver = () => setPanel("acciones");

  const reprogramacion = useReprogramacion({
    token,
    alReprogramar: (pedido) => {
      respuesta.guardar(pedido);
      volver();
    },
    alCerrarse: () => {
      void respuesta.recargar();
      volver();
    },
  });
  const cancelarReprogramacion = () => {
    reprogramacion.reiniciar();
    volver();
  };

  if (seguimiento.isPending) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }
  if (seguimiento.isError) {
    return (
      <SeguimientoError
        vista={vistaError(parseApiError(seguimiento.error))}
        onReintentar={() => void seguimiento.refetch()}
        reintentando={seguimiento.isFetching}
      />
    );
  }

  const pedido = seguimiento.data;
  const { paso, envio, pedirCodigo, verificar, franjas, reprogramar } = reprogramacion;

  return (
    <div className="space-y-4">
      <SeguimientoResumen pedido={pedido} />

      {panel === "acciones" && (
        <AccionesAutoservicio
          autoservicio={pedido.selfService}
          confirmando={respuesta.confirmar.isPending}
          error={mensaje(respuesta.confirmar.error)}
          onConfirmar={() => respuesta.confirmar.mutate()}
          onReprogramar={() => setPanel("reprogramar")}
          onSolicitarCambio={() => {
            respuesta.cambio.reset();
            setPanel("cambio");
          }}
        />
      )}

      {panel === "cambio" && (
        <SolicitarCambioForm
          enviando={respuesta.cambio.isPending}
          error={mensaje(respuesta.cambio.error)}
          onEnviar={(detalle) => respuesta.cambio.mutate(detalle, { onSuccess: volver })}
          onCancelar={volver}
        />
      )}

      {panel === "reprogramar" && paso === "pedir-codigo" && (
        <PasoPedirCodigo
          enviando={pedirCodigo.isPending}
          error={mensaje(pedirCodigo.error)}
          onPedir={() => pedirCodigo.mutate()}
          onCancelar={cancelarReprogramacion}
        />
      )}
      {panel === "reprogramar" && paso === "verificar" && envio && (
        <PasoVerificarCodigo
          envio={envio}
          verificando={verificar.isPending}
          reenviando={pedirCodigo.isPending}
          error={mensaje(verificar.error ?? pedirCodigo.error)}
          intentos={verificar.error ? reprogramacion.intentos : null}
          onVerificar={(codigo) => verificar.mutate(codigo)}
          onReenviar={() => {
            verificar.reset();
            pedirCodigo.mutate();
          }}
          onCancelar={cancelarReprogramacion}
        />
      )}
      {panel === "reprogramar" && paso === "elegir-franja" && (
        <PasoElegirFranja
          franjas={franjas.data}
          cargando={franjas.isFetching && !franjas.data}
          error={mensaje(franjas.error)}
          eligiendo={reprogramar.isPending}
          errorEleccion={mensaje(reprogramar.error)}
          onElegir={(slotId) => reprogramar.mutate(slotId)}
          onReintentar={() => void franjas.refetch()}
          onSolicitarCambio={() => {
            reprogramacion.reiniciar();
            setPanel("cambio");
          }}
          onCancelar={cancelarReprogramacion}
        />
      )}
    </div>
  );
}
