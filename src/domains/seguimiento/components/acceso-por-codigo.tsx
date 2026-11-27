import { useAccesoPorCodigo } from "../hooks/use-acceso-codigo";
import { PasoCodigoSeguimiento, PasoCodigoUnSoloUso } from "./acceso-codigo-form";
import { SeguimientoSesionVista } from "./seguimiento-sesion-vista";

/**
 * Acceso por código de seguimiento + código al correo (ST-309.2, RF-U14). Alternativa al enlace del correo.
 * `key` en el paso 2 hace que pedir otro código o cambiar de pedido arranque con el campo vacío.
 */
export function AccesoPorCodigo() {
  const acceso = useAccesoPorCodigo();
  const { paso, pedir, verificar, vista } = acceso;

  if (paso === "viendo") {
    return (
      <SeguimientoSesionVista
        pedido={vista.data}
        cargando={vista.isPending}
        error={vista.error}
        recargando={vista.isFetching}
        expiraEn={acceso.sesionExpiraEn}
        onReintentar={() => void vista.refetch()}
        onSalir={acceso.salir}
      />
    );
  }
  if (paso === "verificar") {
    return (
      <PasoCodigoUnSoloUso
        key={acceso.pedidoEn ?? 0}
        codigoSeguimiento={acceso.codigoSeguimiento}
        expiraEnSegundos={acceso.expiraEnSegundos}
        pedidoEn={acceso.pedidoEn}
        verificando={verificar.isPending}
        reenviando={pedir.isPending}
        error={verificar.error ?? pedir.error}
        onVerificar={(codigo) => verificar.mutate(codigo)}
        onReenviar={acceso.reenviar}
        onCambiarCodigo={acceso.cambiarCodigo}
      />
    );
  }
  return <PasoCodigoSeguimiento enviando={pedir.isPending} error={pedir.error} aviso={acceso.aviso} onPedir={pedir.enviar} />;
}
