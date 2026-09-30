import assert from "node:assert/strict";
import { after, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const server = await createServer({
  configFile: false,
  resolve: { alias: { "@": fileURLToPath(new URL("../src", import.meta.url)) } },
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: "custom",
});
after(async () => server.close());

const { PORTAL_ROUTES, portalHref, portalHomeHref } = await server.ssrLoadModule("/src/config/portal-routes.ts");
const { NAV_GROUPS } = await server.ssrLoadModule("/src/config/navigation.ts");
const { PAGE_ROUTES } = await server.ssrLoadModule("/src/app/page-routes.ts");
const { ROLES, ROLES_WEB, hasRole } = await server.ssrLoadModule("/src/config/roles.ts");
const { PermisosRolPanel } = await server.ssrLoadModule("/src/domains/usuarios/components/permisos-rol-panel.tsx");

test("cada ruta del panel tiene página y cada elemento del menú usa su ruta y roles", () => {
  assert.deepEqual(new Set(PAGE_ROUTES.map(([key]) => key)), new Set(Object.keys(PORTAL_ROUTES)));
  assert.equal(PAGE_ROUTES.length, Object.keys(PORTAL_ROUTES).length);
  const menuItems = NAV_GROUPS.flatMap((group) => group.items);
  assert.equal(new Set(menuItems.map((item) => item.href)).size, menuItems.length);
  for (const item of menuItems) {
    const [key] = Object.entries(PORTAL_ROUTES).find(([routeKey]) => portalHref(routeKey) === item.href) ?? [];
    assert.ok(key, `Sin ruta para ${item.title}`);
    assert.deepEqual(item.roles, PORTAL_ROUTES[key].roles);
  }
});

test("admin, coordinador, supervisor y root llegan solo a sus pantallas", () => {
  const can = (role, key) => hasRole(role, PORTAL_ROUTES[key].roles);
  assert.equal(can(ROLES.COORDINADOR, "usuarios"), true);
  assert.equal(can(ROLES.COORDINADOR, "configuracion"), false);
  assert.equal(can(ROLES.COORDINADOR, "flota"), false);
  assert.equal(can(ROLES.SUPERVISOR, "flota"), true);
  assert.equal(can(ROLES.SUPERVISOR, "usuarios"), false);
  assert.equal(can(ROLES.SUPERVISOR, "zonas"), false);
  assert.equal(can(ROLES.SUPERVISOR, "tiposIncidenteVehiculo"), true);
  assert.equal(can(ROLES.ROOT, "usuarios"), true);
  assert.equal(can(ROLES.ROOT, "flotaMantenimiento"), true);
  assert.equal(can(ROLES.ADMIN, "usuarios"), true);
  assert.equal(can(ROLES.ADMIN, "configuracion"), true);
  assert.equal(can(ROLES.ADMIN, "tablero"), false);
  assert.equal(can(ROLES.REPARTIDOR, "tablero"), false);
  assert.equal(hasRole(ROLES.REPARTIDOR, ROLES_WEB), false);
  assert.equal(hasRole(ROLES.ADMIN, ROLES_WEB), true);
  assert.equal(portalHomeHref(ROLES.ADMIN), portalHref("usuarios"));
  assert.equal(portalHomeHref(ROLES.COORDINADOR), portalHref("tablero"));
  assert.deepEqual(PORTAL_ROUTES.despachoDetalle.roles, PORTAL_ROUTES.despachos.roles);
  assert.deepEqual(PORTAL_ROUTES.flotaMantenimiento.roles, PORTAL_ROUTES.flota.roles);
});

test("el panel muestra los permisos de API de cada rol antes de asignarlo", () => {
  const supervisor = renderToStaticMarkup(createElement(PermisosRolPanel, { rolNombre: "supervisor" }));
  assert.match(supervisor, /Vehículos/);
  assert.match(supervisor, /Tipos de falla mecánica/);
  assert.match(supervisor, /Consultar, crear, editar y eliminar/);
  assert.doesNotMatch(supervisor, /Usuarios/);
  const coordinator = renderToStaticMarkup(createElement(PermisosRolPanel, { rolNombre: "coordinator" }));
  assert.match(coordinator, /Usuarios/);
  assert.match(coordinator, /Vehículos/);
  assert.doesNotMatch(coordinator, /cambiar roles/);
  const admin = renderToStaticMarkup(createElement(PermisosRolPanel, { rolNombre: "admin" }));
  assert.match(admin, /cambiar roles/);
  assert.match(admin, /Configuración/);
  const driver = renderToStaticMarkup(createElement(PermisosRolPanel, { rolNombre: "driver" }));
  assert.match(driver, /app móvil/);
  assert.doesNotMatch(driver, /Usuarios/);
});

test("el generador registra una página nueva en rutas, permisos y menú", () => {
  const root = mkdtempSync(join(tmpdir(), "dispatch-routes-"));
  try {
    for (const directory of ["scripts", "src/app", "src/config", "src/pages/dashboard"]) {
      mkdirSync(join(root, directory), { recursive: true });
    }
    for (const file of ["src/app/page-routes.ts", "src/config/portal-routes.ts", "src/config/navigation.ts", "scripts/nuevo-dominio.sh"]) {
      copyFileSync(file, join(root, file));
    }
    execFileSync("bash", ["scripts/nuevo-dominio.sh", "clientes", "supervisor"], { cwd: root });
    assert.match(readFileSync(join(root, "src/app/page-routes.ts"), "utf8"), /\["clientes", ClientesPage\]/);
    assert.match(readFileSync(join(root, "src/config/portal-routes.ts"), "utf8"), /clientes: \{ path: "clientes", roles: SUPERVISOR \}/);
    assert.match(readFileSync(join(root, "src/config/navigation.ts"), "utf8"), /navItem\("clientes", "Clientes", LayoutDashboard\)/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
