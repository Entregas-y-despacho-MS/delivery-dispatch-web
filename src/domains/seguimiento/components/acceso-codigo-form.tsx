import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, KeyRound, MailCheck, RefreshCw } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { parseApiError } from "@/shared/lib/api-error";
import {
  esCodigoUnSoloUso,
  limpiarCodigoUnSoloUso,
  MAX_CODIGO_SEGUIMIENTO,
  mensajeErrorAcceso,
  problemaCodigoSeguimiento,
  segundosParaReenviar,
  textoCodigoPedido,
} from "../seguimiento.acceso";

const MensajeError = ({ id, texto }: { id?: string; texto: string | null }) =>
  texto ? <p id={id} role="alert" className="text-sm text-destructive">{texto}</p> : null;

const mensaje = (error: unknown) => (error ? mensajeErrorAcceso(parseApiError(error)) : null);

/** Paso 1: el código de seguimiento solo dice a quién mandar el código; el correo es siempre el registrado. */
export function PasoCodigoSeguimiento({ enviando, error, aviso, onPedir }: {
  enviando: boolean;
  error: unknown;
  /** Por qué se volvió a este paso (p. ej. la sesión venció). */
  aviso: string | null;
  onPedir: (codigo: string) => void;
}) {
  const [codigo, setCodigo] = useState("");
  const [problema, setProblema] = useState<string | null>(null);

  const enviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const encontrado = problemaCodigoSeguimiento(codigo);
    setProblema(encontrado);
    if (!encontrado) onPedir(codigo);
  };

  const textoError = problema ?? mensaje(error);
  return (
    <form onSubmit={enviar} className="space-y-3" noValidate aria-label="Acceder con código de seguimiento">
      {aviso && <p role="status" className="rounded-md bg-muted px-3 py-2 text-sm">{aviso}</p>}
      <div className="space-y-2">
        <Label htmlFor="codigo-seguimiento">Código de seguimiento</Label>
        <Input
          id="codigo-seguimiento"
          value={codigo}
          onChange={(evento) => setCodigo(evento.target.value)}
          autoComplete="off"
          maxLength={MAX_CODIGO_SEGUIMIENTO}
          aria-invalid={Boolean(textoError)}
          aria-describedby={textoError ? "codigo-seguimiento-error" : "codigo-seguimiento-ayuda"}
          placeholder="p. ej. DSP-2026-00001"
          className="h-11 font-mono uppercase"
          disabled={enviando}
        />
        {textoError ? (
          <MensajeError id="codigo-seguimiento-error" texto={textoError} />
        ) : (
          <p id="codigo-seguimiento-ayuda" className="text-xs text-muted-foreground">
            Está en tu comprobante. Te enviaremos un código de 6 dígitos al correo que registraste.
          </p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={enviando}>
        <MailCheck aria-hidden /> {enviando ? "Enviando..." : "Enviarme un código"}
      </Button>
    </form>
  );
}

/** Cuenta regresiva para «pedir otro código». El intervalo es el sistema externo: el render no cambia estado. */
function useSegundosParaReenviar(pedidoEn: number | null) {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    if (pedidoEn === null) return;
    const intervalo = window.setInterval(() => setAhora(Date.now()), 1000);
    return () => window.clearInterval(intervalo);
  }, [pedidoEn]);
  return segundosParaReenviar(pedidoEn, Math.max(ahora, pedidoEn ?? 0));
}

/** Paso 2: el código de un solo uso. Un error nunca dice si el código de seguimiento existe. */
export function PasoCodigoUnSoloUso({ codigoSeguimiento, expiraEnSegundos, pedidoEn, verificando, reenviando, error, onVerificar, onReenviar, onCambiarCodigo }: {
  codigoSeguimiento: string;
  expiraEnSegundos: number | null;
  pedidoEn: number | null;
  verificando: boolean;
  reenviando: boolean;
  error: unknown;
  onVerificar: (codigo: string) => void;
  onReenviar: () => void;
  onCambiarCodigo: () => void;
}) {
  const [codigo, setCodigo] = useState("");
  const espera = useSegundosParaReenviar(pedidoEn);
  const ocupado = verificando || reenviando;
  const textoError = mensaje(error);

  return (
    <div className="space-y-3">
      <p role="status" className="text-sm text-muted-foreground">
        {textoCodigoPedido(expiraEnSegundos ?? 600)}
      </p>
      <p className="text-xs text-muted-foreground">
        Pedido: <span className="font-mono">{codigoSeguimiento}</span>
      </p>
      <form
        className="space-y-3"
        aria-label="Verificar código de 6 dígitos"
        onSubmit={(evento) => {
          evento.preventDefault();
          if (esCodigoUnSoloUso(codigo)) onVerificar(codigo);
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="codigo-un-solo-uso">Código de 6 dígitos</Label>
          <Input
            id="codigo-un-solo-uso"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={codigo}
            onChange={(evento) => setCodigo(limpiarCodigoUnSoloUso(evento.target.value))}
            disabled={ocupado}
            aria-invalid={Boolean(textoError)}
            className="h-11 w-44 font-mono tracking-widest"
          />
          <p className="text-xs text-muted-foreground">No es el código que le das al repartidor al recibir.</p>
        </div>
        <MensajeError texto={textoError} />
        <Button type="submit" className="w-full" disabled={ocupado || !esCodigoUnSoloUso(codigo)}>
          <KeyRound aria-hidden /> {verificando ? "Verificando..." : "Ver mi pedido"}
        </Button>
      </form>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button type="button" size="sm" variant="link" className="px-0" onClick={onCambiarCodigo} disabled={ocupado}>
          <ArrowLeft aria-hidden /> Usar otro código de seguimiento
        </Button>
        <Button
          type="button"
          size="sm"
          variant="link"
          className="px-0"
          onClick={() => {
            setCodigo("");
            onReenviar();
          }}
          disabled={ocupado || espera > 0}
        >
          <RefreshCw aria-hidden />
          {reenviando ? "Enviando..." : espera > 0 ? `Pedir otro código en ${espera} s` : "No me llegó, pedir otro código"}
        </Button>
      </div>
    </div>
  );
}
