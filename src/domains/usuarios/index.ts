// API pública del dominio. Lo que no esté aquí es privado del módulo.
export { UsuariosTable } from "./components/usuarios-table";
export { DesactivarUsuarioDialog } from "./components/desactivar-usuario-dialog";
export { UsuarioDialog } from "./components/usuario-dialog";
export { useUsuarios } from "./hooks/use-usuarios";
export { describeDesactivacionError, describeUsuarioError, type UsuarioErrorInfo, type UsuarioErrorKind } from "./usuarios.errors";
export type { Rol, Usuario } from "./usuarios.types";
