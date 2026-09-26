import { LockKeyhole, TriangleAlert, UserRoundX, WifiOff, Timer } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import type { LoginErrorInfo, LoginErrorKind } from "../auth.errors";

interface LoginErrorAlertProps {
  error: LoginErrorInfo;
}

/**
 * Aviso de fallo del login. Cada tipo aporta título, icono y token de estado:
 * rojo cuando el intento no puede prosperar tal como está, ámbar cuando es
 * temporal y basta con reintentar.
 */
interface Presentacion {
  titulo?: string;
  icono: typeof TriangleAlert;
  variante: "destructive" | "warning";
  borde: string;
}

const PRESENTACION: Record<LoginErrorKind, Presentacion> = {
  credentials: { icono: TriangleAlert, variante: "destructive", borde: "border-destructive/30 bg-destructive/5" },
  "totp-invalid": { icono: TriangleAlert, variante: "destructive", borde: "border-destructive/30 bg-destructive/5" },
  locked: { titulo: "Cuenta bloqueada", icono: LockKeyhole, variante: "destructive", borde: "border-destructive/30 bg-destructive/5" },
  "web-denied": { titulo: "Sin acceso al portal web", icono: UserRoundX, variante: "destructive", borde: "border-destructive/30 bg-destructive/5" },
  unknown: { icono: TriangleAlert, variante: "destructive", borde: "border-destructive/30 bg-destructive/5" },
  throttled: { titulo: "Demasiados intentos", icono: Timer, variante: "warning", borde: "border-warning/30 bg-warning/5" },
  network: { titulo: "Sin conexión con el servidor", icono: WifiOff, variante: "warning", borde: "border-warning/30 bg-warning/5" },
  // Se muestra como ayuda junto al campo, no como alerta; se define por completitud.
  "totp-required": { icono: TriangleAlert, variante: "warning", borde: "border-warning/30 bg-warning/5" },
};

export function LoginErrorAlert({ error }: LoginErrorAlertProps) {
  const { titulo, icono: Icono, variante, borde } = PRESENTACION[error.kind];

  return (
    <Alert variant={variante} className={borde}>
      <Icono aria-hidden />
      {titulo && <AlertTitle>{titulo}</AlertTitle>}
      <AlertDescription>
        <p>{error.message}</p>
      </AlertDescription>
    </Alert>
  );
}
