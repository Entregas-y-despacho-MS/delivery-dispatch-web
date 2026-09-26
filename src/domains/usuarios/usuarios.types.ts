// ── Forma que devuelve el backend (UserDto / RoleDto / PaginationResponseDto) ──────────────────
export interface BackendRole {
  id: number;
  name: string;
  createdAt: string;
}

export interface BackendUser {
  id: number;
  fullName: string;
  username: string;
  email: string | null;
  role: BackendRole;
  active: boolean;
  twoFactorEnabled: boolean;
  requiresPwdChange: boolean;
  status: "active" | "inactive" | "locked";
  lockedUntil: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface BackendPage<T> {
  data: T[];
  meta: { page: number; limit: number; pages: number; total: number };
}

// ── Modelo del front (lo único que ven los componentes) ─────────────────────────────────────
export interface Rol {
  /** id del backend: es el que se manda como roleId al crear o editar. */
  id: number;
  /** roles.name del backend (root, admin, coordinator, supervisor, driver). */
  nombre: string;
  /** Texto para mostrar en pantalla. */
  etiqueta: string;
}

export type UsuarioEstado = "active" | "inactive" | "locked";

export interface Usuario {
  id: number;
  nombreCompleto: string;
  username: string;
  email: string | null;
  rol: Rol;
  activo: boolean;
  estado: UsuarioEstado;
  ultimoAcceso: string | null;
  bloqueadoHasta: string | null;
}

export interface UsuariosPagina {
  items: Usuario[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface UsuariosFiltrosParams {
  page?: number;
  limit?: number;
  roleId?: number;
  status?: UsuarioEstado;
  search?: string;
  sortBy?: "fullName" | "username" | "createdAt" | "lastLoginAt";
  sortOrder?: "asc" | "desc";
}

// ── Cuerpos que acepta el backend (CreateUserDto / UpdateUserDto) ───────────────────────────
export interface CrearUsuarioPayload {
  fullName: string;
  username: string;
  /** Se omite si viene vacío: el backend rechaza "" porque exige un correo válido. */
  email?: string;
  password: string;
  roleId: number;
}

export interface ActualizarUsuarioPayload {
  fullName?: string;
  username?: string;
  email?: string;
  roleId?: number;
  /** false desactiva la cuenta (soft delete: sigue en la lista como Inactivo). */
  active?: boolean;
}
