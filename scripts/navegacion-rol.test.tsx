// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.stubEnv("VITE_API_URL", "http://localhost:3001/api");
// El sidebar pregunta si es celular; jsdom no trae matchMedia: se simula escritorio.
window.matchMedia ??= ((query: string) => ({ matches: false, media: query, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false })) as never;
const { PORTAL_ROUTES, portalHomeHref } = await import("@/config/portal-routes");
const { navigationForRole } = await import("@/config/navigation");
const { ROLES, ROLES_WEB } = await import("@/config/roles");
const { useAuthStore } = await import("@/shared/store/use-auth-store");
const { ProtectedRoute } = await import("@/shared/guards/protected-route");
const { SidebarProvider } = await import("@/shared/components/ui/sidebar");
// oxlint-disable-next-line no-restricted-imports -- las pruebas revisan la página «Sin permiso» del router.
const { default: AccesoDenegado } = await import("@/pages/auth/acceso-denegado");
const { DashboardSidebar } = await import("@/app/layouts/dashboard-sidebar");

type Rol = (typeof ROLES)[keyof typeof ROLES];
const NOMBRE: Record<number, string> = { 1: "coordinator", 2: "supervisor", 3: "driver", 4: "root", 5: "admin" };

function entrarComo(rol: Rol) {
  useAuthStore.setState({
    user: { id: "1", nombres: "Prueba", apellidos: "Rol", rol: { id: rol, nombre: NOMBRE[rol] } },
    access_token: "token",
    refresh_token: null,
  });
}

afterEach(() => {
  cleanup();
  useAuthStore.setState({ user: null, access_token: null, refresh_token: null });
});

const titulos = (rol: Rol) => navigationForRole(rol).flatMap((g) => g.items.map((i) => i.title));

/** Muestra la ruta final para comprobar a dónde llevó cada redirección. */
function Ubicacion() {
  return <output aria-label="ruta">{useLocation().pathname}</output>;
}

/**
 * Las mismas capas que AppRouter (sesión del portal → permiso de cada ruta → «Sin permiso»), con PORTAL_ROUTES
 * reales y una página de relleno por ruta para no cargar pantallas ni llamar al back.
 */
function abrir(ruta: string) {
  const rolId = useAuthStore.getState().user?.rol.id ?? 0;
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Ubicacion />
      <Routes>
        <Route path="/login" element={<h1>Iniciar sesión</h1>} />
        <Route path="/acceso-denegado" element={<AccesoDenegado />} />
        <Route element={<ProtectedRoute roles={ROLES_WEB} />}>
          <Route path="/app">
            <Route index element={<Navigate to={portalHomeHref(rolId)} replace />} />
            {Object.entries(PORTAL_ROUTES).map(([key, { path, roles }]) => (
              <Route key={key} element={<ProtectedRoute roles={roles} />}>
                <Route path={path} element={<h1>{`Página ${key}`}</h1>} />
              </Route>
            ))}
          </Route>
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

const rutaActual = () => screen.getByRole("status", { name: "ruta" }).textContent;

describe("inicio por rol (ST-59.3)", () => {
  it.each([
    ["el coordinador", "/app/tablero", ROLES.COORDINADOR, "Página tablero"],
    ["el supervisor", "/app/mapa", ROLES.SUPERVISOR, "Página mapa"],
    ["el administrador", "/app/usuarios", ROLES.ADMIN, "Página usuarios"],
  ] as const)("%s entra a su inicio (%s)", async (_quien, inicio, rol, pagina) => {
    entrarComo(rol);
    abrir("/app");
    expect(await screen.findByRole("heading", { name: pagina })).toBeTruthy();
    expect(rutaActual()).toBe(inicio);
  });

  it("sin sesión manda al login", async () => {
    abrir("/app/tablero");
    expect(await screen.findByRole("heading", { name: "Iniciar sesión" })).toBeTruthy();
  });
});

describe("menú por rol (ST-59.3)", () => {
  it("el supervisor ve exactamente los 8 módulos de la HU ES-59", () => {
    expect(titulos(ROLES.SUPERVISOR)).toEqual(["Mapa", "Flota", "KPIs", "Alertas", "Tablero", "Despachos", "Reportes", "Umbrales"]);
  });

  it("el coordinador ve la operación, sus catálogos y la administración que le toca, sin repetidos", () => {
    const menu = titulos(ROLES.COORDINADOR);
    expect(new Set(menu).size).toBe(menu.length);
    for (const titulo of ["Tablero", "Despachos", "Historial", "Solicitudes de cambio", "Planificación", "Recojos", "Reportes", "Zonas de reparto", "Fallas mecánicas", "Usuarios", "Parámetros operativos"]) {
      expect(menu).toContain(titulo);
    }
    for (const ajeno of ["KPIs", "Alertas", "Umbrales", "Vehículos", "Configuración"]) {
      expect(menu).not.toContain(ajeno);
    }
  });

  it("el administrador solo ve Usuarios y Configuración", () => {
    expect(titulos(ROLES.ADMIN)).toEqual(["Usuarios", "Configuración"]);
  });

  it("cada ítem del menú lleva a una ruta que su rol puede abrir", async () => {
    for (const rol of [ROLES.COORDINADOR, ROLES.SUPERVISOR, ROLES.ADMIN]) {
      entrarComo(rol);
      for (const item of navigationForRole(rol).flatMap((g) => g.items)) {
        const { unmount } = abrir(item.href);
        expect(await screen.findByRole("heading", { name: /^Página / })).toBeTruthy();
        expect(rutaActual()).toBe(item.href);
        unmount();
      }
    }
  });

  it("la barra lateral del supervisor muestra solo sus módulos", () => {
    entrarComo(ROLES.SUPERVISOR);
    const user = useAuthStore.getState().user!;
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={["/app/mapa"]}>
          <SidebarProvider>
            <DashboardSidebar user={user} />
          </SidebarProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    const enlaces = within(screen.getByRole("navigation")).getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(enlaces).toEqual(expect.arrayContaining(["/app/mapa", "/app/flota", "/app/kpis", "/app/umbrales"]));
    expect(enlaces).not.toContain("/app/usuarios");
    expect(enlaces).not.toContain("/app/planificacion");
  });
});

describe("página «Sin permiso» (ST-59.3)", () => {
  it.each([
    ["el supervisor", "/app/usuarios", ROLES.SUPERVISOR, "/app/mapa"],
    ["el supervisor", "/app/catalogos/tipos-incidente-vehiculo", ROLES.SUPERVISOR, "/app/mapa"],
    ["el coordinador", "/app/kpis", ROLES.COORDINADOR, "/app/tablero"],
    ["el administrador", "/app/tablero", ROLES.ADMIN, "/app/usuarios"],
  ] as const)("%s que escribe %s ve «Sin permiso» con el enlace a su inicio", async (_quien, ruta, rol, inicio) => {
    entrarComo(rol);
    abrir(ruta);
    expect(await screen.findByRole("heading", { name: "Sin permiso" })).toBeTruthy();
    expect(rutaActual()).toBe("/acceso-denegado");
    expect(screen.getByRole("link", { name: "Volver al inicio" }).getAttribute("href")).toBe(inicio);
  });

  it("el repartidor no entra al portal web", async () => {
    entrarComo(ROLES.REPARTIDOR);
    abrir("/app/tablero");
    expect(await screen.findByRole("heading", { name: "Sin permiso" })).toBeTruthy();
  });
});
