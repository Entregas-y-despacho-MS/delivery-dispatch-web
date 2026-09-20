/**
 * Roles internos del microservicio de Despachos (RF-A22).
 * El coordinador concentra además toda la administración del sistema
 * (usuarios, catálogos, seguridad y auditoría) — ver sección 4.2 del taller.
 *
 * El cliente final NO es un rol: accede al portal público con un token
 * de seguimiento (RF-U14), sin iniciar sesión.
 *
 * ⚠ Ajusta los ids a los que devuelva el backend.
 */
export const ROLES = {
  COORDINADOR: 1,
  SUPERVISOR: 2,
  REPARTIDOR: 3,
} as const;

export type RoleId = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<RoleId, string> = {
  [ROLES.COORDINADOR]: "Coordinador de Despachos",
  [ROLES.SUPERVISOR]: "Supervisor de Flota",
  [ROLES.REPARTIDOR]: "Repartidor",
};

/** Roles que pueden entrar al portal web. El repartidor usa la app móvil. */
export const ROLES_WEB = [ROLES.COORDINADOR, ROLES.SUPERVISOR] as const;

export const hasRole = (roleId: number | undefined, allowed: readonly RoleId[]) =>
  roleId !== undefined && allowed.includes(roleId as RoleId);
