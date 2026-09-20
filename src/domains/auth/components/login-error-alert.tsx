import { LockKeyhole, TriangleAlert } from "lucide-react";
import type { LoginErrorInfo } from "../auth.errors";

interface LoginErrorAlertProps {
  error: LoginErrorInfo;
}

/** Aviso de fallo del login. La cuenta bloqueada tiene su propio título e icono. */
export function LoginErrorAlert({ error }: LoginErrorAlertProps) {
  const locked = error.kind === "locked";

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
    >
      {locked
        ? <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        : <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />}
      <div>
        {locked && <p className="font-medium">Cuenta bloqueada</p>}
        <p>{error.message}</p>
      </div>
    </div>
  );
}
