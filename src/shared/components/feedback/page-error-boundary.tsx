import { Outlet, useLocation } from "react-router-dom";
import { ErrorBoundary } from "./error-boundary";

/** Conserva el layout y reinicia el límite al navegar a otra pantalla. */
export function PageErrorBoundary() {
  const { pathname } = useLocation();
  return (
    <ErrorBoundary key={pathname} scope="page">
      <Outlet />
    </ErrorBoundary>
  );
}
