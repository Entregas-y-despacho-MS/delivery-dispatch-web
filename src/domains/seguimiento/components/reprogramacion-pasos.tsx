import { useState, type ReactNode } from "react";
import { MailCheck, RefreshCw } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { formatearFechaEntrega, formatearFranjaEntrega, formatearHora } from "../seguimiento.format";
import type { CodigoEnviado, FranjasDisponibles } from "../types/seguimiento.types";

const CODIGO_VALIDO = /^\d{6}$/;

function Marco({ titulo, children, onCancelar, ocupado }: { titulo: string; children: ReactNode; onCancelar: () => void; ocupado: boolean }) {
  return (
    <section className="space-y-3 rounded-xl border bg-card p-5 shadow-sm" aria-label={titulo}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">{titulo}</h2>
        <Button type="button" size="sm" variant="ghost" onClick={onCancelar} disabled={ocupado}>Cancelar</Button>
      </div>
      {children}
    </section>
  );
}

const MensajeError = ({ texto }: { texto: string | null }) => (texto ? <p role="alert" className="text-sm text-destructive">{texto}</p> : null);

/** Paso 1: el código va al correo registrado, nunca a uno que escriba el cliente. */
export function PasoPedirCodigo({ enviando, error, onPedir, onCancelar }: {
  enviando: boolean;
  error: string | null;
  onPedir: () => void;
  onCancelar: () => void;
}) {
  return (
    <Marco titulo="Elegir otro horario" onCancelar={onCancelar} ocupado={enviando}>
      <p className="text-sm text-muted-foreground">
        Para proteger tu pedido te enviaremos un código de 6 dígitos al correo que registraste. No es el código de entrega.
      </p>
      <MensajeError texto={error} />
      <Button type="button" onClick={onPedir} disabled={enviando}>
        <MailCheck aria-hidden /> {enviando ? "Enviando código..." : "Enviarme el código"}
      </Button>
    </Marco>
  );
}

/** Paso 2: el código tiene vencimiento propio y 5 intentos. */
export function PasoVerificarCodigo({ envio, verificando, reenviando, error, intentos, onVerificar, onReenviar, onCancelar }: {
  envio: CodigoEnviado;
  verificando: boolean;
  reenviando: boolean;
  error: string | null;
  /** Intentos que quedan tras un código incorrecto; null si no aplica. */
  intentos: number | null;
  onVerificar: (codigo: string) => void;
  onReenviar: () => void;
  onCancelar: () => void;
}) {
  const [codigo, setCodigo] = useState("");
  const ocupado = verificando || reenviando;
  return (
    <Marco titulo="Escribe el código" onCancelar={onCancelar} ocupado={ocupado}>
      <p className="text-sm text-muted-foreground">
        {`Lo enviamos a ${envio.sentTo}. Vence a las ${formatearHora(envio.expiresAt)}.`}
      </p>
      <form
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
        onSubmit={(evento) => {
          evento.preventDefault();
          if (CODIGO_VALIDO.test(codigo)) onVerificar(codigo);
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="codigo-verificacion">Código de 6 dígitos</Label>
          <Input
            id="codigo-verificacion"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={codigo}
            onChange={(evento) => setCodigo(evento.target.value.replace(/\D/g, ""))}
            disabled={ocupado}
            className="w-40 font-mono tracking-widest"
          />
        </div>
        <Button type="submit" disabled={ocupado || !CODIGO_VALIDO.test(codigo)}>{verificando ? "Verificando..." : "Verificar"}</Button>
      </form>
      <MensajeError texto={error && intentos !== null ? `${error} Te ${intentos === 1 ? "queda 1 intento" : `quedan ${intentos} intentos`}.` : error} />
      <Button type="button" size="sm" variant="link" className="px-0" onClick={onReenviar} disabled={ocupado}>
        <RefreshCw aria-hidden /> {reenviando ? "Enviando..." : "No me llegó, enviar otro código"}
      </Button>
    </Marco>
  );
}

const SIN_FRANJAS = "No hay otros horarios disponibles para tu zona. Comunícate con Despacho o solicita un cambio.";

/** Paso 3 (escenario 3): solo franjas de lotes abiertos de su zona que Almacén pueda preparar. */
export function PasoElegirFranja({ franjas, cargando, error, eligiendo, errorEleccion, onElegir, onReintentar, onSolicitarCambio, onCancelar }: {
  franjas: FranjasDisponibles | undefined;
  cargando: boolean;
  error: string | null;
  eligiendo: boolean;
  errorEleccion: string | null;
  onElegir: (slotId: string) => void;
  onReintentar: () => void;
  onSolicitarCambio: () => void;
  onCancelar: () => void;
}) {
  const [elegida, setElegida] = useState<string | null>(null);
  const lista = franjas?.slots ?? [];

  return (
    <Marco titulo="Elige tu nuevo horario" onCancelar={onCancelar} ocupado={eligiendo}>
      {cargando && <p className="text-sm text-muted-foreground">Buscando horarios disponibles...</p>}
      {error && (
        <div className="space-y-2">
          <MensajeError texto={error} />
          <Button type="button" size="sm" variant="outline" onClick={onReintentar}><RefreshCw aria-hidden /> Reintentar</Button>
        </div>
      )}
      {franjas && lista.length === 0 && (
        <div className="space-y-2">
          <p className="rounded-md bg-muted/60 p-3 text-sm">{SIN_FRANJAS}</p>
          <Button type="button" size="sm" variant="outline" onClick={onSolicitarCambio}>Solicitar un cambio</Button>
        </div>
      )}
      {lista.length > 0 && (
        <>
          <ul className="grid gap-2 sm:grid-cols-2" aria-label="Horarios disponibles">
            {lista.map((franja) => (
              <li key={franja.slotId}>
                <button
                  type="button"
                  aria-pressed={elegida === franja.slotId}
                  onClick={() => setElegida(franja.slotId)}
                  disabled={eligiendo}
                  className="w-full rounded-lg border p-3 text-left text-sm transition-colors hover:bg-muted aria-pressed:border-primary aria-pressed:bg-primary/10"
                >
                  <span className="block font-medium first-letter:uppercase">{formatearFechaEntrega(franja.deliveryDate)}</span>
                  <span className="text-muted-foreground">{formatearFranjaEntrega(franja.windowStart, franja.windowEnd)}</span>
                </button>
              </li>
            ))}
          </ul>
          <MensajeError texto={errorEleccion} />
          <Button type="button" onClick={() => elegida && onElegir(elegida)} disabled={eligiendo || !elegida}>
            {eligiendo ? "Guardando..." : "Cambiar a este horario"}
          </Button>
        </>
      )}
    </Marco>
  );
}
