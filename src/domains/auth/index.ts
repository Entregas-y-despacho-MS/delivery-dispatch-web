// API pública del dominio. Lo que no esté aquí es privado del módulo.
export { authService } from "./services/auth.service";
export { useLogin, useLoginDestination } from "./hooks/use-login";
export { useLogout } from "./hooks/use-logout";
export { loginSchema, type LoginInput } from "./auth.schemas";
export { describeLoginError, type LoginErrorInfo, type LoginErrorKind } from "./auth.errors";
export type { LoginResponse, Session } from "./auth.types";
