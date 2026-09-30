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

  const { kind, code, message } = parseApiError(error);

  if (code === AUTH_ERROR.ACCOUNT_LOCKED) {
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
  if (kind === "rate-limit") {
    return { kind: "throttled", message };
  }
  if (kind === "network") {
    return { kind: "network", message };
  }
  return { kind: "unknown", message };
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
  const { kind, code, message } = parseApiError(error);

  if (code === AUTH_ERROR.INVALID_RESET_TOKEN) {
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

  if (kind === "rate-limit") {
    return {
      kind: "throttled",
      title: "Demasiados intentos",
      message,
    };
  }

  if (kind === "network") {
    return {
      kind: "network",
      title: "Sin conexión con el servidor",
      message,
    };
  }

  return {
    kind: "unknown",
    title: "Error al restablecer contraseña",
    message,
  };
}

/** El error del cambio autenticado se presenta junto al campo afectado. */
export function describeChangePasswordError(error: unknown): { field?: "currentPassword" | "newPassword"; message: string } {
  const { code, message } = parseApiError(error);
  if (code === AUTH_ERROR.INVALID_CREDENTIALS) {
    return { field: "currentPassword", message: "La contraseña actual no es correcta." };
  }
  if (code === AUTH_ERROR.PASSWORD_RECENTLY_USED) {
    return { field: "newPassword", message: "Usa una contraseña distinta de la actual y de las últimas tres." };
  }
  if (code === AUTH_ERROR.PASSWORD_TOO_SHORT) {
    return { field: "newPassword", message: "La contraseña no cumple la longitud mínima configurada." };
  }
  return { message };
}
