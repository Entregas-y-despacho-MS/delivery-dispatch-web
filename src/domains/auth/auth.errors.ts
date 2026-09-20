import { parseApiError } from "@/shared/lib/api-error";

/** Códigos de dominio que devuelve POST /auth/login (ver el diccionario de errores del backend). */
export const AUTH_ERROR = {
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  ACCOUNT_LOCKED: "ACCOUNT_LOCKED",
  TOTP_REQUIRED: "TOTP_REQUIRED",
  INVALID_TOTP_CODE: "INVALID_TOTP_CODE",
} as const;

/** La cuenta es válida pero su rol no tiene pantallas en la web (ej. repartidor → app móvil). */
export class WebAccessDeniedError extends Error {
  constructor() {
    super("Esta cuenta no tiene acceso al portal web.");
    this.name = "WebAccessDeniedError";
  }
}

/** El backend devolvió un rol que el front no conoce. */
export class UnknownRoleError extends Error {
  constructor(roleName: string) {
    super(`Rol desconocido: ${roleName}`);
    this.name = "UnknownRoleError";
  }
}

export type LoginErrorKind =
  | "credentials"
  | "locked"
  | "totp-required"
  | "totp-invalid"
  | "web-denied"
  | "throttled"
  | "network"
  | "unknown";

export interface LoginErrorInfo {
  kind: LoginErrorKind;
  message: string;
}

/** Traduce cualquier fallo del login a un tipo + texto para mostrar en el formulario. */
export function describeLoginError(error: unknown): LoginErrorInfo {
  if (error instanceof WebAccessDeniedError) {
    return {
      kind: "web-denied",
      message: "Tu cuenta no tiene acceso al portal web. Los repartidores usan la app móvil.",
    };
  }
  if (error instanceof UnknownRoleError) {
    return {
      kind: "unknown",
      message: "Tu cuenta tiene un rol que este portal no reconoce. Avisa al administrador.",
    };
  }

  const { status, code, message } = parseApiError(error);

  // El criterio de Jira habla de HTTP 423, pero el backend responde 401 + ACCOUNT_LOCKED.
  // Se aceptan ambos para no depender de cuál de los dos quede como definitivo.
  if (code === AUTH_ERROR.ACCOUNT_LOCKED || status === 423) {
    return {
      kind: "locked",
      message:
        "Tu cuenta está bloqueada temporalmente por demasiados intentos fallidos. Inténtalo de nuevo en unos minutos.",
    };
  }
  if (code === AUTH_ERROR.TOTP_REQUIRED) {
    return {
      kind: "totp-required",
      message: "Esta cuenta usa verificación en dos pasos. Ingresa el código de 6 dígitos de tu app de autenticación.",
    };
  }
  if (code === AUTH_ERROR.INVALID_TOTP_CODE) {
    return { kind: "totp-invalid", message: "El código de verificación no es correcto." };
  }
  if (code === AUTH_ERROR.INVALID_CREDENTIALS) {
    return { kind: "credentials", message: "Usuario o contraseña incorrectos." };
  }
  if (status === 429) {
    return { kind: "throttled", message: "Demasiados intentos. Espera un momento e inténtalo de nuevo." };
  }
  if (status === undefined) {
    return { kind: "network", message: "No se pudo conectar con el servidor. Revisa tu conexión." };
  }
  return { kind: "unknown", message: message || "No se pudo iniciar sesión. Inténtalo de nuevo." };
}
