/**
 * Roles del microservicio de Despachos (RF-A22).
 * El backend reserva la administración de usuarios y ajustes para admin/root.
 * El coordinador puede consultar usuarios y roles, además de operar sus catálogos.
 *
 * El cliente final NO es un rol: accede al portal público con un token
 * de seguimiento (RF-U14), sin iniciar sesión.
 *
 * Los ids son INTERNOS del front. El backend identifica los roles por nombre
 * (root, admin, coordinator, supervisor, driver): ver ROLE_BY_BACKEND_NAME.
 */
export const ROLES = {
  COORDINADOR: 1,
  SUPERVISOR: 2,
  REPARTIDOR: 3,
  /** Cuenta semilla del sistema. El backend le permite todo (RolesGuard). */
  ROOT: 4,
  /** Administra usuarios y ajustes del sistema. */
  ADMIN: 5,
} as const;

export type RoleId = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<RoleId, string> = {
  [ROLES.COORDINADOR]: "Coordinador de Despachos",
  [ROLES.SUPERVISOR]: "Supervisor de Flota",
  [ROLES.REPARTIDOR]: "Repartidor",
  [ROLES.ROOT]: "Root del sistema",
  [ROLES.ADMIN]: "Administrador",
};

/** roles.name del backend (delivery-dispatch-db/schema/auth/roles/data.sql) → id del front. */
export const ROLE_BY_BACKEND_NAME: Record<string, RoleId> = {
  root: ROLES.ROOT,
  admin: ROLES.ADMIN,
  coordinator: ROLES.COORDINADOR,
  supervisor: ROLES.SUPERVISOR,
  driver: ROLES.REPARTIDOR,
};

/** Roles que pueden entrar al portal web. El repartidor usa la app móvil. */
export const ROLES_WEB = [ROLES.COORDINADOR, ROLES.SUPERVISOR, ROLES.ADMIN, ROLES.ROOT] as const;

/** Igual que el backend: ROOT pasa cualquier verificación de rol. */
export const hasRole = (roleId: number | undefined, allowed: readonly RoleId[]) =>
  roleId !== undefined && (roleId === ROLES.ROOT || allowed.includes(roleId as RoleId));
