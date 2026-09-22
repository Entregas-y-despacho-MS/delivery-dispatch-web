import { parseApiError } from "@/shared/lib/api-error";

/** Código de dominio que devuelve el backend cuando el usuario o el correo ya existen (HTTP 409). */
export const USER_ALREADY_EXISTS = "USER_ALREADY_EXISTS";

export type UsuarioErrorKind =
  | "duplicado"
  | "datos"
  | "permisos"
  | "no-encontrado"
  | "red"
  | "desconocido";

export interface UsuarioErrorInfo {
  kind: UsuarioErrorKind;
  message: string;
}

/** Traduce cualquier fallo de las operaciones de usuarios a un tipo + texto en español. */
export function describeUsuarioError(error: unknown): UsuarioErrorInfo {
  const { status, code, message } = parseApiError(error);

  // El backend responde "usuario o correo ya existe" sin decir cuál de los dos choca,
  // por eso el aviso nombra a ambos.
  if (status === 409 || code === USER_ALREADY_EXISTS) {
    return { kind: "duplicado", message: "Ya existe un usuario con ese nombre de usuario o ese correo." };
  }
  if (status === 400) {
    // El detalle viene en inglés desde el backend (class-validator); se muestra tal cual.
    return { kind: "datos", message: `El servidor rechazó los datos. ${message}` };
  }
  if (status === 403) {
    return { kind: "permisos", message: "No tienes permiso para gestionar usuarios." };
  }
  if (status === 404) {
    return { kind: "no-encontrado", message: "El usuario ya no existe. Actualiza la lista." };
  }
  if (status === undefined) {
    return { kind: "red", message: "No se pudo conectar con el servidor. Revisa tu conexión." };
  }
  return { kind: "desconocido", message: "No se pudo completar la operación. Inténtalo de nuevo." };
}
