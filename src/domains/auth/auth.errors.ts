import { parseApiError } from "@/shared/lib/api-error";

/** Códigos de dominio que devuelve el backend en autenticación. */
export const AUTH_ERROR = {
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  ACCOUNT_LOCKED: "ACCOUNT_LOCKED",
  TOTP_REQUIRED: "TOTP_REQUIRED",
  INVALID_TOTP_CODE: "INVALID_TOTP_CODE",
  INVALID_RESET_TOKEN: "INVALID_RESET_TOKEN",
  PASSWORD_TOO_SHORT: "PASSWORD_TOO_SHORT",
  PASSWORD_RECENTLY_USED: "PASSWORD_RECENTLY_USED",
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

export type ResetPasswordErrorKind =
  | "invalid-token"
  | "recently-used"
  | "too-short"
  | "throttled"
  | "network"
  | "unknown";

export interface ResetPasswordErrorInfo {
  kind: ResetPasswordErrorKind;
  title: string;
  message: string;
  isTokenExpired?: boolean;
}

/** Traduce fallos al restablecer contraseña para mostrar feedback contextual al usuario. */
export function describeResetPasswordError(error: unknown): ResetPasswordErrorInfo {
  const { status, code, message } = parseApiError(error);

  if (code === AUTH_ERROR.INVALID_RESET_TOKEN || (status === 401 && /token/i.test(message))) {
    return {
      kind: "invalid-token",
      title: "Enlace inválido o expirado",
      message:
        "El enlace para restablecer tu contraseña ha expirado (15-30 min) o ya fue utilizado. Por favor, solicita uno nuevo.",
      isTokenExpired: true,
    };
  }

  if (code === AUTH_ERROR.PASSWORD_RECENTLY_USED) {
    return {
      kind: "recently-used",
      title: "Contraseña no permitida",
      message:
        "No puedes reutilizar tu contraseña actual ni ninguna de tus últimas 3 contraseñas (RF-A25).",
    };
  }

  if (code === AUTH_ERROR.PASSWORD_TOO_SHORT) {
    return {
      kind: "too-short",
      title: "Contraseña demasiado corta",
      message: "La contraseña debe tener al menos 8 caracteres.",
    };
  }

  if (status === 429) {
    return {
      kind: "throttled",
      title: "Demasiados intentos",
      message: "Demasiados intentos en poco tiempo. Espera un momento antes de volver a intentar.",
    };
  }

  if (status === undefined) {
    return {
      kind: "network",
      title: "Sin conexión con el servidor",
      message: "No se pudo conectar con el servidor. Revisa tu conexión a internet.",
    };
  }

  return {
    kind: "unknown",
    title: "Error al restablecer contraseña",
    message: message || "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
  };
}

