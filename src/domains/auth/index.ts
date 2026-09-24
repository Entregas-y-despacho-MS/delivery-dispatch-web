// API pública del dominio. Lo que no esté aquí es privado del módulo.
export { authService } from "./services/auth.service";
export { useLogin, useLoginDestination } from "./hooks/use-login";
export { useLogout } from "./hooks/use-logout";
export { useRecuperarPassword } from "./hooks/use-recuperar-password";
export { useRestablecerPassword } from "./hooks/use-restablecer-password";
export { LoginForm } from "./components/login-form";
export { LoginBrandPanel } from "./components/login-brand-panel";
export { RecuperarPasswordForm } from "./components/recuperar-password-form";
export { RestablecerPasswordForm } from "./components/restablecer-password-form";
export {
  loginSchema,
  type LoginInput,
  forgotPasswordSchema,
  type ForgotPasswordInput,
  resetPasswordSchema,
  type ResetPasswordInput,
} from "./auth.schemas";
export {
  describeLoginError,
  type LoginErrorInfo,
  type LoginErrorKind,
  describeResetPasswordError,
  type ResetPasswordErrorInfo,
  type ResetPasswordErrorKind,
  AUTH_ERROR,
} from "./auth.errors";
export type {
  LoginResponse,
  Session,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from "./auth.types";
