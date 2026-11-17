/** Resumen de capacidades publicadas por la API. Mantener alineado con docs/API.md. */
export const PERMISOS_POR_ROL: Record<string, readonly { modulo: string; acciones: string }[]> = {
  root: [{ modulo: "Todos los módulos", acciones: "Acceso completo" }],
  admin: [
    { modulo: "Usuarios", acciones: "Consultar, crear, editar, desactivar y cambiar roles" },
    { modulo: "Roles", acciones: "Consultar" },
    { modulo: "Configuración", acciones: "Consultar y editar" },
  ],
  coordinator: [
    { modulo: "Usuarios y roles", acciones: "Consultar" },
    { modulo: "Zonas de reparto", acciones: "Consultar, crear, editar y eliminar" },
    { modulo: "Niveles de servicio", acciones: "Consultar, crear, editar y eliminar" },
    { modulo: "Vehículos", acciones: "Consultar, crear, editar y eliminar" },
    { modulo: "Motivos de incidencia", acciones: "Consultar, crear y editar" },
    { modulo: "Motivos de reprogramación", acciones: "Consultar, crear y editar" },
    { modulo: "Tipos de falla mecánica", acciones: "Consultar, crear y editar" },
    { modulo: "Mantenimiento vehicular", acciones: "Registrar" },
  ],
  supervisor: [
    { modulo: "Vehículos", acciones: "Consultar, crear, editar y eliminar" },
    { modulo: "Motivos de incidencia", acciones: "Consultar, crear y editar" },
    { modulo: "Motivos de reprogramación", acciones: "Consultar, crear y editar" },
    { modulo: "Tipos de falla mecánica", acciones: "Consultar, crear y editar" },
    { modulo: "Mantenimiento vehicular", acciones: "Registrar" },
  ],
  driver: [
    { modulo: "Motivos de incidencia", acciones: "Consultar" },
    { modulo: "Entregas", acciones: "Sincronizar eventos y evidencias desde la app móvil" },
    { modulo: "Ubicación", acciones: "Reportar posición desde la app móvil" },
  ],
};
