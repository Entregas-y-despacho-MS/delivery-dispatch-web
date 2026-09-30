# API de Delivery Dispatch

Referencia para implementar clientes y reutilizar en otros chats del mismo proyecto. Fuente: `../../backend/delivery-dispatch-svc/src`, commit `c87a858`; generada el 2026-09-28. La especificación completa está en [openapi.json](openapi.json).

**Cobertura:** 52 operaciones HTTP, 34 rutas y 56 esquemas. Se contrastaron las rutas y modelos con el Swagger disponible y los decoradores del backend. Los ejemplos se generaron desde los DTO; no se ejecutaron operaciones contra la base de datos.

Las descripciones de reglas y campos conservan el texto original de Swagger en inglés; el índice, la estructura y las notas de uso están en español.

**Guías detalladas por catálogo:** [Motivos de incidencia / Incident Reasons](INCIDENT_REASONS.md), [Motivos de reprogramación / Reschedule Reasons](RESCHEDULE_REASONS.md) e [Incidentes vehiculares y mantenimiento](VEHICLE_INCIDENTS.md).

## Uso rápido

- URL base del enlace proporcionado: `http://localhost:3000/api`; Swagger: `http://localhost:3000/api/docs/`. El backend usa el puerto 3000 y el prefijo `api` por defecto, mientras que `.env.example` de esta web apunta a `http://localhost:3001/api`. Usa la dirección donde esté ejecutándose el backend.
- Para operaciones protegidas, enviar `Authorization: Bearer <accessToken>`. Obtenerlo con `POST /api/auth/login` y renovarlo con `POST /api/auth/refresh`.
- Los roles no se heredan entre sí. `root` puede acceder a rutas limitadas por rol; los demás roles solo a las que indiquen sus permisos.
- En operaciones con `id`, usar un entero positivo. Las listas paginadas usan `page=1` y `limit=10` por defecto (máximo 100).
- Los errores tienen `{ statusCode, error, message, path, timestamp }`; `message` es una lista para validación y texto para errores de negocio. Las tablas de errores enumeran cada ejemplo que publica Swagger.
- Puede haber `429` por límite de peticiones; el límite es más estricto en cambio de contraseña y 2FA. Algunos `403` de negocio se detallan debajo de su endpoint aunque Swagger solo muestre el ejemplo genérico.
- Cuando `mustChangePassword` sea `true`, cambiar la contraseña con `PATCH /api/auth/change-password`; también se permite `POST /api/auth/logout`. Otras rutas protegidas responden 403 `PASSWORD_CHANGE_REQUIRED`.

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"usuario","password":"ContraseñaSegura1!"}'

curl http://localhost:3000/api/users \
  -H "Authorization: Bearer <accessToken>"
```

## Roles y acceso

Los IDs de roles se consultan con `GET /api/roles`; usa el `id` devuelto para `roleId`. Los roles comunes no heredan permisos entre sí. Todas las personas autenticadas pueden cerrar sesión, cambiar su propia contraseña y administrar su 2FA.

| Rol | Acceso específico publicado en Swagger |
| --- | --- |
| `root` | Todas las rutas protegidas; solo root administra cuentas y rol root. |
| `admin` | Usuarios (excepto root), lectura de roles, ajustes. |
| `coordinator` | Lectura de usuarios y roles; zonas, vehículos, niveles de servicio, motivos de incidencia y reprogramación, tipos de incidente vehicular y registro de mantenimiento. |
| `supervisor` | Vehículos, motivos de incidencia y reprogramación, tipos de incidente vehicular y registro de mantenimiento. |
| `driver` | Sincronización de eventos/evidencias, reporte GPS y lectura de motivos de incidencia. |

## Índice de operaciones

| Método | Ruta | Propósito | Acceso |
| --- | --- | --- | --- |
| `POST` | [`/api/auth/login`](#post-apiauthlogin) | Iniciar sesión | Público |
| `POST` | [`/api/auth/register`](#post-apiauthregister) | Registrar usuario interno | admin (o root) |
| `POST` | [`/api/auth/refresh`](#post-apiauthrefresh) | Renovar tokens | Público |
| `POST` | [`/api/auth/logout`](#post-apiauthlogout) | Cerrar sesión | JWT Bearer |
| `PATCH` | [`/api/auth/change-password`](#patch-apiauthchange-password) | Cambiar contraseña propia | JWT Bearer |
| `POST` | [`/api/auth/forgot-password`](#post-apiauthforgot-password) | Solicitar recuperación de contraseña | Público |
| `POST` | [`/api/auth/reset-password`](#post-apiauthreset-password) | Restablecer contraseña con token | Público |
| `POST` | [`/api/auth/2fa/enable`](#post-apiauth2faenable) | Iniciar activación de 2FA | JWT Bearer |
| `POST` | [`/api/auth/2fa/confirm`](#post-apiauth2faconfirm) | Confirmar activación de 2FA | JWT Bearer |
| `POST` | [`/api/auth/2fa/disable`](#post-apiauth2fadisable) | Desactivar 2FA | JWT Bearer |
| `GET` | [`/api/health`](#get-apihealth) | Estado de salud del servicio | Público |
| `POST` | [`/api/sync/events`](#post-apisyncevents) | Sincronizar eventos sin conexión | driver (o root) |
| `POST` | [`/api/sync/evidences`](#post-apisyncevidences) | Sincronizar evidencia de entrega | driver (o root) |
| `POST` | [`/api/tracking/locations`](#post-apitrackinglocations) | Reportar ubicaciones GPS | driver (o root) |
| `GET` | [`/api/roles`](#get-apiroles) | Listar roles | admin, coordinator (o root) |
| `GET` | [`/api/roles/{id}`](#get-apirolesid) | Consultar rol por ID | admin, coordinator (o root) |
| `GET` | [`/api/users`](#get-apiusers) | Listar usuarios | admin, coordinator (o root) |
| `POST` | [`/api/users`](#post-apiusers) | Crear usuario | admin (o root) |
| `GET` | [`/api/users/{id}`](#get-apiusersid) | Consultar usuario por ID | admin (o root) |
| `PUT` | [`/api/users/{id}`](#put-apiusersid) | Actualizar usuario | admin (o root) |
| `DELETE` | [`/api/users/{id}`](#delete-apiusersid) | Eliminar usuario | admin (o root) |
| `PATCH` | [`/api/users/{id}/role`](#patch-apiusersidrole) | Cambiar rol de usuario | admin (o root) |
| `GET` | [`/api/delivery-zones`](#get-apidelivery-zones) | Listar zonas de entrega | coordinator (o root) |
| `POST` | [`/api/delivery-zones`](#post-apidelivery-zones) | Crear zona de entrega | coordinator (o root) |
| `GET` | [`/api/delivery-zones/{id}`](#get-apidelivery-zonesid) | Consultar zona por ID | coordinator (o root) |
| `PUT` | [`/api/delivery-zones/{id}`](#put-apidelivery-zonesid) | Actualizar zona | coordinator (o root) |
| `DELETE` | [`/api/delivery-zones/{id}`](#delete-apidelivery-zonesid) | Eliminar zona | coordinator (o root) |
| `GET` | [`/api/incident-reasons`](#get-apiincident-reasons) | Listar motivos de incidencia | coordinator, supervisor, driver (o root) |
| `POST` | [`/api/incident-reasons`](#post-apiincident-reasons) | Crear motivo de incidencia | coordinator, supervisor (o root) |
| `GET` | [`/api/incident-reasons/{id}`](#get-apiincident-reasonsid) | Consultar motivo de incidencia | coordinator, supervisor, driver (o root) |
| `PUT` | [`/api/incident-reasons/{id}`](#put-apiincident-reasonsid) | Actualizar motivo de incidencia | coordinator, supervisor (o root) |
| `GET` | [`/api/reschedule-reasons`](#get-apireschedule-reasons) | Listar motivos de reprogramación | coordinator, supervisor (o root) |
| `POST` | [`/api/reschedule-reasons`](#post-apireschedule-reasons) | Crear motivo de reprogramación | coordinator, supervisor (o root) |
| `GET` | [`/api/reschedule-reasons/{id}`](#get-apireschedule-reasonsid) | Consultar motivo de reprogramación | coordinator, supervisor (o root) |
| `PUT` | [`/api/reschedule-reasons/{id}`](#put-apireschedule-reasonsid) | Actualizar motivo de reprogramación | coordinator, supervisor (o root) |
| `GET` | [`/api/service-levels`](#get-apiservice-levels) | Listar niveles de servicio | coordinator (o root) |
| `POST` | [`/api/service-levels`](#post-apiservice-levels) | Crear nivel de servicio | coordinator (o root) |
| `GET` | [`/api/service-levels/{id}`](#get-apiservice-levelsid) | Consultar nivel por ID | coordinator (o root) |
| `PUT` | [`/api/service-levels/{id}`](#put-apiservice-levelsid) | Actualizar nivel | coordinator (o root) |
| `DELETE` | [`/api/service-levels/{id}`](#delete-apiservice-levelsid) | Eliminar nivel | coordinator (o root) |
| `GET` | [`/api/vehicles`](#get-apivehicles) | Listar vehículos | supervisor, coordinator (o root) |
| `POST` | [`/api/vehicles`](#post-apivehicles) | Registrar vehículo | supervisor, coordinator (o root) |
| `GET` | [`/api/vehicles/{id}`](#get-apivehiclesid) | Consultar vehículo por ID | supervisor, coordinator (o root) |
| `PUT` | [`/api/vehicles/{id}`](#put-apivehiclesid) | Actualizar vehículo | supervisor, coordinator (o root) |
| `DELETE` | [`/api/vehicles/{id}`](#delete-apivehiclesid) | Retirar vehículo de la flota | supervisor, coordinator (o root) |
| `GET` | [`/api/settings`](#get-apisettings) | Listar ajustes | admin (o root) |
| `PUT` | [`/api/settings/{key}`](#put-apisettingskey) | Actualizar ajuste | admin (o root) |
| `GET` | [`/api/vehicle-incident-types`](#get-apivehicle-incident-types) | Listar tipos de incidente vehicular | supervisor, coordinator (o root) |
| `POST` | [`/api/vehicle-incident-types`](#post-apivehicle-incident-types) | Crear tipo de incidente vehicular | supervisor, coordinator (o root) |
| `GET` | [`/api/vehicle-incident-types/{id}`](#get-apivehicle-incident-typesid) | Consultar tipo de incidente vehicular | supervisor, coordinator (o root) |
| `PUT` | [`/api/vehicle-incident-types/{id}`](#put-apivehicle-incident-typesid) | Actualizar tipo de incidente vehicular | supervisor, coordinator (o root) |
| `POST` | [`/api/vehicle-maintenances`](#post-apivehicle-maintenances) | Registrar incidente de vehículo | supervisor, coordinator (o root) |

## Endpoints

### Auth

#### POST /api/auth/login

**Función.** Exchanges a `username` and `password` for an access token (short-lived, sent as `Authorization: Bearer <token>`) and a refresh token (long-lived, used only in POST /auth/refresh). If the account has 2FA enabled, `totpCode` is also required (401 TOTP_REQUIRED without it). Check `mustChangePassword` in the response: when true the client must send the user to change their password, because until then every endpoint except `PATCH /auth/change-password` and `POST /auth/logout` answers 403 `PASSWORD_CHANGE_REQUIRED`. Repeated wrong passwords lock the account for a while (401 ACCOUNT_LOCKED, shown only when the password is right; a wrong password on a locked account is the generic INVALID_CREDENTIALS and does not count). A wrong username, wrong password or deactivated account all return the same INVALID_CREDENTIALS, so it never reveals which accounts exist. Public.

**Acceso:** Público.

**Cuerpo de solicitud:** `application/json`; esquema [`LoginDto`](#logindto).

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `username` | `string` | Sí | Login name of the account (not the email); ejemplo: "atorrez" |
| `password` | `string` | Sí | Account password; ejemplo: "Passw0rd!" |
| `totpCode` | `string` | No | Current 6-digit code from the authenticator app. Send it only if the account has 2FA enabled: without it the answer is 401 TOTP_REQUIRED (and a wrong one 401 INVALID_TOTP_CODE), which is the signal to ask the user for the code and repeat the request; ejemplo: "123456" |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "username": "atorrez",
  "password": "Passw0rd!"
}
```

**Respuesta correcta:** `200` → `AuthResponseDto`.

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `accessToken` | `string` | Sí | Short-lived access token (JWT_TIME_EXPIRE, default 15 min). Send as Authorization: Bearer <token> on every request; ejemplo: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." |
| `refreshToken` | `string` | Sí | Long-lived refresh token (JWT_REFRESH_TIME_EXPIRE, default 7 days). Use only at POST /auth/refresh. Store securely (httpOnly cookie or secure storage); ejemplo: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." |
| `user` | `UserDto` | Sí | The authenticated user |
| `user.id` | `integer` | Sí | User ID; ejemplo: 1 |
| `user.fullName` | `string` | Sí | The user's full name; ejemplo: "Ana Torrez" |
| `user.username` | `string` | Sí | Login name, unique among users; ejemplo: "atorrez" |
| `user.email` | `string / null` | Sí | Email address. null when none was given; ejemplo: "ana@hipermaxi.com" |
| `user.role` | `RoleDto` | Sí | The user's role, which decides what they can do |
| `user.role.id` | `integer` | Sí | Role ID. Use it as `roleId` when creating or updating users; ejemplo: 1 |
| `user.role.name` | `string: root, admin, coordinator, supervisor, driver` | Sí | Role name. root: the system account, can do everything (only root manages root accounts) · admin: users and settings · coordinator: delivery zones, service levels and vehicles, and reads users and roles · supervisor: vehicles · driver: the mobile app (sync). admin, coordinator, supervisor and driver are independent of each other; ejemplo: "admin" |
| `user.role.createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC); ejemplo: "2024-01-01T00:00:00.000Z" |
| `user.active` | `boolean` | Sí | false = deactivated by an admin: cannot log in; ejemplo: true |
| `user.twoFactorEnabled` | `boolean` | Sí | true when two-factor authentication is on for this account (login then needs a TOTP code); ejemplo: false |
| `user.requiresPwdChange` | `boolean` | Sí | true if the user must change their password before continuing; ejemplo: false |
| `user.status` | `string: active, inactive, locked` | Sí | inactive = deactivated by an admin · locked = temporarily locked after failed logins · active = everything else; ejemplo: "active" |
| `user.lockedUntil` | `string (date-time) / null` | Sí | While in the future, the account is locked (RF-A21). Null when never locked; ejemplo: null |
| `user.lastLoginAt` | `string (date-time) / null` | Sí | Last successful login. Null if the user has never logged in; ejemplo: "2026-09-24T14:03:00.000Z" |
| `user.createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC); ejemplo: "2024-01-01T00:00:00.000Z" |
| `mustChangePassword` | `boolean` | Sí | true if the client must redirect to a forced password-change screen before continuing — either an admin flagged the account, or the password is past password_expiration_days (RF-A25); ejemplo: false |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "fullName": "Ana Torrez",
    "username": "atorrez",
    "email": "ana@hipermaxi.com",
    "role": {
      "id": 1,
      "name": "admin",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "active": true,
    "twoFactorEnabled": false,
    "requiresPwdChange": false,
    "status": "active",
    "lockedUntil": null,
    "lastLoginAt": "2026-09-24T14:03:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "mustChangePassword": false
}
```

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | Username is required. |
| `401` | `INVALID_CREDENTIALS` | Invalid credentials. |
| `401` | `ACCOUNT_LOCKED` | Account is temporarily locked due to too many failed login attempts. |
| `401` | `TOTP_REQUIRED` | A TOTP code is required to complete login. |
| `401` | `INVALID_TOTP_CODE` | Invalid TOTP code. |

#### POST /api/auth/register

**Función.** Creates an internal account. Same body and rules as POST /users (admin-only, not a public sign-up; giving the root role needs a root caller, 403 ROOT_ACCOUNT_PROTECTED). Returns the created user, not tokens: the caller is the admin, not the new user. Requires admin role or root.

**Acceso:** JWT Bearer; roles: admin (o root).

**Cuerpo de solicitud:** `application/json`; esquema [`CreateUserDto`](#createuserdto).

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `fullName` | `string` | Sí | The user's full name, as shown in the app; longitud máx. 150; ejemplo: "Ana Torrez" |
| `username` | `string` | Sí | Login name. Must not belong to another user; longitud máx. 50; ejemplo: "atorrez" |
| `email` | `string` | No | Optional. A valid email address that must not belong to another user. Needed to recover the password by email; longitud máx. 150; ejemplo: "ana@hipermaxi.com" |
| `password` | `string` | Sí | Must be at least 8 characters with an uppercase letter, a lowercase letter, a number and a symbol, and meet the minimum length set in settings (password_min_length). It is stored hashed and never returned; longitud mín. 8; longitud máx. 255; ejemplo: "Passw0rd!" |
| `roleId` | `integer` | Sí | ID of the role to assign, from GET /roles (root, admin, coordinator, supervisor or driver). An unknown ID is a 400 INVALID_ROLE; ejemplo: 3 |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "fullName": "Ana Torrez",
  "username": "atorrez",
  "password": "Passw0rd!",
  "roleId": 3
}
```

**Respuesta correcta:** `201` → `UserDto`.

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `id` | `integer` | Sí | User ID; ejemplo: 1 |
| `fullName` | `string` | Sí | The user's full name; ejemplo: "Ana Torrez" |
| `username` | `string` | Sí | Login name, unique among users; ejemplo: "atorrez" |
| `email` | `string / null` | Sí | Email address. null when none was given; ejemplo: "ana@hipermaxi.com" |
| `role` | `RoleDto` | Sí | The user's role, which decides what they can do |
| `role.id` | `integer` | Sí | Role ID. Use it as `roleId` when creating or updating users; ejemplo: 1 |
| `role.name` | `string: root, admin, coordinator, supervisor, driver` | Sí | Role name. root: the system account, can do everything (only root manages root accounts) · admin: users and settings · coordinator: delivery zones, service levels and vehicles, and reads users and roles · supervisor: vehicles · driver: the mobile app (sync). admin, coordinator, supervisor and driver are independent of each other; ejemplo: "admin" |
| `role.createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC); ejemplo: "2024-01-01T00:00:00.000Z" |
| `active` | `boolean` | Sí | false = deactivated by an admin: cannot log in; ejemplo: true |
| `twoFactorEnabled` | `boolean` | Sí | true when two-factor authentication is on for this account (login then needs a TOTP code); ejemplo: false |
| `requiresPwdChange` | `boolean` | Sí | true if the user must change their password before continuing; ejemplo: false |
| `status` | `string: active, inactive, locked` | Sí | inactive = deactivated by an admin · locked = temporarily locked after failed logins · active = everything else; ejemplo: "active" |
| `lockedUntil` | `string (date-time) / null` | Sí | While in the future, the account is locked (RF-A21). Null when never locked; ejemplo: null |
| `lastLoginAt` | `string (date-time) / null` | Sí | Last successful login. Null if the user has never logged in; ejemplo: "2026-09-24T14:03:00.000Z" |
| `createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC); ejemplo: "2024-01-01T00:00:00.000Z" |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "id": 1,
  "fullName": "Ana Torrez",
  "username": "atorrez",
  "email": "ana@hipermaxi.com",
  "role": {
    "id": 1,
    "name": "admin",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "active": true,
  "twoFactorEnabled": false,
  "requiresPwdChange": false,
  "status": "active",
  "lockedUntil": null,
  "lastLoginAt": "2026-09-24T14:03:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | Full name is required.; Role ID must be an integer. |
| `400` | `PASSWORD_TOO_SHORT` | Password must be at least 8 characters. |
| `400` | `INVALID_ROLE` | The given role does not exist. |
| `401` | `INVALID_TOKEN` | Invalid or expired token. |
| `403` | `INSUFFICIENT_PERMISSIONS` | You do not have permission to perform this action. |
| `409` | `USER_ALREADY_EXISTS` | A user with this username or email already exists. |

**Otros `403` de negocio descritos por el controlador:** `ROOT_ACCOUNT_PROTECTED`: solo root puede crear una cuenta root.

#### POST /api/auth/refresh

**Función.** Exchanges a valid refresh token for a new access + refresh pair. The old refresh token stops working immediately (rotation); presenting an already-used one closes every session of that user (401 INVALID_REFRESH_TOKEN). A session that stayed inactive longer than the configured limit is closed (401 SESSION_EXPIRED), except for the driver role, whose mobile app keeps long sessions while on a route. Public: authenticated by the refresh token in the body.

**Acceso:** Público.

**Cuerpo de solicitud:** `application/json`; esquema [`RefreshDto`](#refreshdto).

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `refreshToken` | `string` | Sí | Refresh token received from the last successful login, register, or refresh; ejemplo: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Respuesta correcta:** `200` → `AuthResponseDto`.

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `accessToken` | `string` | Sí | Short-lived access token (JWT_TIME_EXPIRE, default 15 min). Send as Authorization: Bearer <token> on every request; ejemplo: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." |
| `refreshToken` | `string` | Sí | Long-lived refresh token (JWT_REFRESH_TIME_EXPIRE, default 7 days). Use only at POST /auth/refresh. Store securely (httpOnly cookie or secure storage); ejemplo: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." |
| `user` | `UserDto` | Sí | The authenticated user |
| `user.id` | `integer` | Sí | User ID; ejemplo: 1 |
| `user.fullName` | `string` | Sí | The user's full name; ejemplo: "Ana Torrez" |
| `user.username` | `string` | Sí | Login name, unique among users; ejemplo: "atorrez" |
| `user.email` | `string / null` | Sí | Email address. null when none was given; ejemplo: "ana@hipermaxi.com" |
| `user.role` | `RoleDto` | Sí | The user's role, which decides what they can do |
| `user.role.id` | `integer` | Sí | Role ID. Use it as `roleId` when creating or updating users; ejemplo: 1 |
| `user.role.name` | `string: root, admin, coordinator, supervisor, driver` | Sí | Role name. root: the system account, can do everything (only root manages root accounts) · admin: users and settings · coordinator: delivery zones, service levels and vehicles, and reads users and roles · supervisor: vehicles · driver: the mobile app (sync). admin, coordinator, supervisor and driver are independent of each other; ejemplo: "admin" |
| `user.role.createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC); ejemplo: "2024-01-01T00:00:00.000Z" |
| `user.active` | `boolean` | Sí | false = deactivated by an admin: cannot log in; ejemplo: true |
| `user.twoFactorEnabled` | `boolean` | Sí | true when two-factor authentication is on for this account (login then needs a TOTP code); ejemplo: false |
| `user.requiresPwdChange` | `boolean` | Sí | true if the user must change their password before continuing; ejemplo: false |
| `user.status` | `string: active, inactive, locked` | Sí | inactive = deactivated by an admin · locked = temporarily locked after failed logins · active = everything else; ejemplo: "active" |
| `user.lockedUntil` | `string (date-time) / null` | Sí | While in the future, the account is locked (RF-A21). Null when never locked; ejemplo: null |
| `user.lastLoginAt` | `string (date-time) / null` | Sí | Last successful login. Null if the user has never logged in; ejemplo: "2026-09-24T14:03:00.000Z" |
| `user.createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC); ejemplo: "2024-01-01T00:00:00.000Z" |
| `mustChangePassword` | `boolean` | Sí | true if the client must redirect to a forced password-change screen before continuing — either an admin flagged the account, or the password is past password_expiration_days (RF-A25); ejemplo: false |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "fullName": "Ana Torrez",
    "username": "atorrez",
    "email": "ana@hipermaxi.com",
    "role": {
      "id": 1,
      "name": "admin",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "active": true,
    "twoFactorEnabled": false,
    "requiresPwdChange": false,
    "status": "active",
    "lockedUntil": null,
    "lastLoginAt": "2026-09-24T14:03:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "mustChangePassword": false
}
```

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | Refresh token is required. |
| `401` | `INVALID_REFRESH_TOKEN` | Invalid or expired refresh token. |
| `401` | `SESSION_EXPIRED` | Session closed due to inactivity. Please log in again. |

#### POST /api/auth/logout

**Función.** Revokes the user's refresh token, so the session cannot be renewed. The current access token stays valid until it expires: the client must discard it. Allowed even while the account must change its password. Requires any authenticated user.

**Acceso:** JWT Bearer.

**Respuesta correcta:** `204` → sin cuerpo (Logged out successfully.).

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `401` | `INVALID_TOKEN` | Invalid or expired token. |

#### PATCH /api/auth/change-password

**Función.** Changes the password of the logged-in user. Requires the current password (401 INVALID_CREDENTIALS if wrong). The new password must be at least 8 characters with an uppercase letter, a lowercase letter, a number and a symbol, meet the configured minimum length (400 PASSWORD_TOO_SHORT), and differ from the current one and the last 3 used (400 PASSWORD_RECENTLY_USED). On success the session is revoked and every access token issued before the change stops working: the client must log in again with the new password. Allowed even while the account must change its password. Limited to a few attempts per minute (429). Requires any authenticated user.

**Acceso:** JWT Bearer.

**Cuerpo de solicitud:** `application/json`; esquema [`ChangePasswordDto`](#changepassworddto).

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `currentPassword` | `string` | Sí | The password you use now, to confirm it is really you; ejemplo: "OldPassw0rd!" |
| `newPassword` | `string` | Sí | Must be at least 8 characters with an uppercase letter, a lowercase letter, a number and a symbol, and meet the minimum length set in settings. It must also differ from the current password and the last 3 used; longitud mín. 8; longitud máx. 255; ejemplo: "NewPassw0rd!" |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "currentPassword": "OldPassw0rd!",
  "newPassword": "NewPassw0rd!"
}
```

**Respuesta correcta:** `204` → sin cuerpo (Password changed.).

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | New password is required. |
| `400` | `PASSWORD_TOO_SHORT` | Password must be at least 8 characters. |
| `400` | `PASSWORD_RECENTLY_USED` | You cannot reuse your current password or any of your last 3 passwords. |
| `401` | `INVALID_CREDENTIALS` | Invalid credentials. |
| `401` | `INVALID_TOKEN` | Invalid or expired token. |

#### POST /api/auth/forgot-password

**Función.** Starts the password recovery flow: if `email` belongs to an active account, an email with a single-use reset token is sent (valid for a limited time, 30 minutes by default). The response is always 204 whether the email exists or not, so it never reveals which addresses are registered. Public.

**Acceso:** Público.

**Cuerpo de solicitud:** `application/json`; esquema [`ForgotPasswordDto`](#forgotpassworddto).

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `email` | `string` | Sí | Email address registered on the account. A reset link/token is sent there if it matches an active account; ejemplo: "ana@hipermaxi.com" |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "email": "ana@hipermaxi.com"
}
```

**Respuesta correcta:** `204` → sin cuerpo (Request accepted.).

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | Email must be a valid email address. |

#### POST /api/auth/reset-password

**Función.** Finishes the recovery flow started with POST /auth/forgot-password: sets a new password using the emailed `token`. The token is single-use and expires (401 INVALID_RESET_TOKEN once used or expired). The new password follows the same rules as in change-password. Also clears any account lock and closes the user's sessions. Public: authenticated by the token.

**Acceso:** Público.

**Cuerpo de solicitud:** `application/json`; esquema [`ResetPasswordDto`](#resetpassworddto).

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `token` | `string` | Sí | Token received by email after POST /auth/forgot-password. Single-use, and it expires; ejemplo: "9f2c1e7a4b6d..." |
| `newPassword` | `string` | Sí | The new password. Must be at least 8 characters with an uppercase letter, a lowercase letter, a number and a symbol, and meet the minimum length set in settings. It must also differ from the current password and the last 3 used; longitud mín. 8; longitud máx. 255; ejemplo: "NewPassw0rd!" |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "token": "9f2c1e7a4b6d...",
  "newPassword": "NewPassw0rd!"
}
```

**Respuesta correcta:** `204` → sin cuerpo (Password reset.).

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | Token is required. |
| `400` | `PASSWORD_TOO_SHORT` | Password must be at least 8 characters. |
| `400` | `PASSWORD_RECENTLY_USED` | You cannot reuse your current password or any of your last 3 passwords. |
| `401` | `INVALID_RESET_TOKEN` | Invalid or expired password reset token. |

### Auth — 2FA

#### POST /api/auth/2fa/enable

**Función.** Step 1 of 2 to turn on two-factor authentication for your own account. Send your current password (401 INVALID_CREDENTIALS if wrong), so a stolen access token alone cannot do it. Generates a TOTP secret and returns it with a QR code to scan in an authenticator app (Google Authenticator, Authy, etc.). 2FA is NOT active yet: confirm it with POST /auth/2fa/confirm. Until then, calling it again generates a new secret that replaces the previous one. Once 2FA is enabled this answers 409 TWO_FACTOR_ALREADY_ENABLED: disable it first (POST /auth/2fa/disable, which asks for the password). Requires any authenticated user.

**Acceso:** JWT Bearer.

**Cuerpo de solicitud:** `application/json`; esquema [`EnableTwoFactorDto`](#enabletwofactordto).

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `password` | `string` | Sí | Your current password, to confirm that it is really you who is turning 2FA on (a stolen access token alone is not enough); ejemplo: "Passw0rd!" |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "password": "Passw0rd!"
}
```

**Respuesta correcta:** `200` → `TwoFactorSecretDto`.

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `secret` | `string` | Sí | Base32 secret, to type by hand in the authenticator app if the QR code cannot be scanned. Keep it private; ejemplo: "JBSWY3DPEHPK3PXP" |
| `qrCodeDataUrl` | `string` | Sí | otpauth:// URI encoded as a QR code data URL (PNG), scannable by any authenticator app. |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCodeDataUrl": "data:image/png;base64,<PNG-en-base64>"
}
```

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | Password is required. |
| `401` | `INVALID_CREDENTIALS` | Invalid credentials. |
| `401` | `INVALID_TOKEN` | Invalid or expired token. |
| `409` | `TWO_FACTOR_ALREADY_ENABLED` | Two-factor authentication is already enabled. Disable it first (POST /auth/2fa/disable) to enrol a new device. |

#### POST /api/auth/2fa/confirm

**Función.** Step 2: send the current 6-digit code shown by the authenticator app to prove the secret was scanned. On success 2FA is enabled and every future login must include `totpCode` (401 INVALID_TOTP_CODE if the code does not match). Requires any authenticated user.

**Acceso:** JWT Bearer.

**Cuerpo de solicitud:** `application/json`; esquema [`ConfirmTwoFactorDto`](#confirmtwofactordto).

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `code` | `string` | Sí | Current 6-digit code shown by the authenticator app after scanning the QR from POST /auth/2fa/enable; longitud mín. 6; longitud máx. 6; ejemplo: "123456" |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "code": "123456"
}
```

**Respuesta correcta:** `204` → sin cuerpo (2FA enabled.).

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | Code must be 6 digits. |
| `401` | `INVALID_TOTP_CODE` | Invalid TOTP code. |
| `401` | `INVALID_TOKEN` | Invalid or expired token. |

#### POST /api/auth/2fa/disable

**Función.** Turns off two-factor authentication for your own account and discards the secret. Requires the current password as confirmation (401 INVALID_CREDENTIALS if wrong). Limited to a few attempts per minute (429). Requires any authenticated user.

**Acceso:** JWT Bearer.

**Cuerpo de solicitud:** `application/json`; esquema [`DisableTwoFactorDto`](#disabletwofactordto).

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `password` | `string` | Sí | Your current password, required to confirm that you want to disable 2FA; ejemplo: "Passw0rd!" |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "password": "Passw0rd!"
}
```

**Respuesta correcta:** `204` → sin cuerpo (2FA disabled.).

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | Password is required. |
| `401` | `INVALID_CREDENTIALS` | Invalid credentials. |
| `401` | `INVALID_TOKEN` | Invalid or expired token. |

### Health

#### GET /api/health

**Función.** Public, no token needed. Checks that the database answers, that the memory heap is under 300 MB and that the disk is under 90% full. Returns 200 when every check passes and 503 when any fails; in both cases `details` lists each check. Meant for Docker, load balancers and uptime monitors.

**Acceso:** Público.

**Respuesta correcta:** `200` → `object` (Every check passed. The Health Check is successful).

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `status` | `string: ok, degraded` | No | ejemplo: "ok" |
| `info` | `object / null` | No |  |
| `info.database` | `object` | Si existe el objeto padre |  |
| `info.database.status` | `string` | Si existe el objeto padre | ejemplo: "up" |
| `info.database.responseTime` | `integer` | Si existe el objeto padre | ejemplo: 12 |
| `error` | `object / null` | No |  |
| `details` | `object` | No |  |
| `details.database` | `object` | Si existe el objeto padre |  |
| `details.database.status` | `string` | Si existe el objeto padre | ejemplo: "up" |
| `details.database.responseTime` | `integer` | Si existe el objeto padre | ejemplo: 12 |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up",
      "responseTime": 12
    }
  },
  "error": {},
  "details": {
    "database": {
      "status": "up",
      "responseTime": 12
    }
  }
}
```

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `503` | `—` | At least one check failed (see `error` for which one). The Health Check is not successful |

### Sync

#### POST /api/sync/events

**Función.** Used by the driver's mobile app to upload what happened while offline. Send the events in the order they occurred: they are applied one by one in exactly that order (FIFO) and never reordered. Each event carries its own `clientEventId` (a UUID v7 generated on the device), which makes the call safe to retry: an event already applied answers `already_processed` instead of being duplicated. The HTTP status is 201 even when some events fail: read `results`, where each event reports `applied`, `already_processed` or `failed` (with an `error` text, e.g. dispatch not found), and a failed event does not stop the ones after it. The device should keep only the failed ones for the next retry. A driver can only sync events of dispatches on a route assigned to them: any other dispatch id (unknown or someone else's) is reported as `failed` with "Dispatch not found.". Requires driver role.

**Acceso:** JWT Bearer; roles: driver (o root).

**Cuerpo de solicitud:** `application/json`; esquema [`SyncEventsBatchDto`](#synceventsbatchdto).

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `events` | `SyncEventDto[]` | Sí | Events in the order they happened on the device (oldest first). At least one. They are applied in exactly this order; elementos mín. 1 |
| `events[].type` | `string: status_change, incident` | Sí | status_change = the dispatch changed status (send `dispatchStatusId`) · incident = a problem happened during delivery (send `incidentReasonId`) |
| `events[].clientEventId` | `string` | Sí | UUID v7 generated by the device when the event happened. It is the idempotency key: sending the same one again never duplicates the event (the answer is `already_processed`); ejemplo: "01933b6e-7f2a-7c3d-9a1b-2f8e6c4d5a10" |
| `events[].dispatchId` | `integer` | Sí | ID of the dispatch the event is about; ejemplo: 42 |
| `events[].occurredAt` | `string` | Sí | When it really happened on the device, ISO 8601 in UTC (not when it was synced); ejemplo: "2026-09-22T14:03:00.000Z" |
| `events[].dispatchStatusId` | `integer` | No | Required when type = status_change: the new dispatch status ID (1 = pending, 2 = in_transit, 3 = delivered, 4 = not_delivered, 5 = returned); ejemplo: 3 |
| `events[].incidentReasonId` | `integer` | No | Required when type = incident: the ID of the incident reason; ejemplo: 2 |
| `events[].detail` | `string` | No | Optional free text: why the status changed, or a description of the incident; longitud máx. 1000; ejemplo: "Client not at home" |

Ejemplo del Swagger:

```json
{
  "events": [
    {
      "type": "status_change",
      "clientEventId": "01933b6e-7f2a-7c3d-9a1b-2f8e6c4d5a10",
      "dispatchId": 42,
      "occurredAt": "2026-09-22T14:03:00.000Z",
      "dispatchStatusId": 2,
      "detail": "Left the warehouse"
    },
    {
      "type": "incident",
      "clientEventId": "01933b6e-9c41-7b02-8e5d-3a7f1b2c6d44",
      "dispatchId": 42,
      "occurredAt": "2026-09-22T14:41:00.000Z",
      "incidentReasonId": 2,
      "detail": "Client not at home"
    }
  ]
}
```

**Respuesta correcta:** `201` → `SyncEventsBatchResultDto` (The batch was processed. Read each result: 201 does not mean every event was saved.).

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `results` | `SyncEventResultDto[]` | Sí | One result per event, in the same order as sent |
| `results[].clientEventId` | `string` | Sí | The `clientEventId` of the event this result is about; ejemplo: "01933b6e-7f2a-7c3d-9a1b-2f8e6c4d5a10" |
| `results[].outcome` | `string: applied, already_processed, failed` | Sí | applied = saved now · already_processed = it had been saved by an earlier attempt, nothing changed · failed = not saved, see `error`; keep it on the device and retry once fixed |
| `results[].error` | `string` | No | Why it failed (e.g. "Dispatch not found."). Only present when outcome = failed |

Ejemplo del Swagger:

```json
{
  "results": [
    {
      "clientEventId": "01933b6e-7f2a-7c3d-9a1b-2f8e6c4d5a10",
      "outcome": "applied"
    },
    {
      "clientEventId": "01933b6e-9c41-7b02-8e5d-3a7f1b2c6d44",
      "outcome": "already_processed"
    },
    {
      "clientEventId": "01933b6e-b3d0-7e11-a4c2-5d9e8f7a1b23",
      "outcome": "failed",
      "error": "Dispatch not found."
    }
  ]
}
```

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | events must contain at least 1 elements |
| `401` | `INVALID_TOKEN` | Invalid or expired token. |
| `403` | `INSUFFICIENT_PERMISSIONS` | You do not have permission to perform this action. |

#### POST /api/sync/evidences

**Función.** Used by the driver's mobile app to upload a delivery evidence. Sent as `multipart/form-data`: `clientEventId` (UUID v7, also the evidence's own ID, so a retry is safe), `dispatchId`, `type` (photo \| signature \| otp), plus the `file` (typically for photo and signature) or the `otpCode` (typically for otp). The file must be an image (jpeg, png, webp, heic, heif) of at most 10 MB, otherwise 400 (413 when too big). A photo or signature needs its `file` and an otp needs its `otpCode`, otherwise the result is `failed`. Answers 201 with a single result: `applied`, `already_processed`, or `failed` with an `error` (e.g. dispatch not found). Requires driver role.

**Acceso:** JWT Bearer; roles: driver (o root).

**Cuerpo de solicitud:** `multipart/form-data`.

| Campo form-data | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `file` | `string (binary)` | No | The photo or signature image (jpeg, png, webp, heic or heif, up to 10 MB). Required for photo and signature; not needed for an otp evidence |
| `clientEventId` | `string` | Sí | UUID v7 generated by the device; it becomes the evidence ID, so a retry is safe; ejemplo: "01933b6e-7f2a-7c3d-9a1b-2f8e6c4d5a10" |
| `dispatchId` | `integer` | Sí | ID of the dispatch this evidence belongs to; ejemplo: 42 |
| `type` | `string: photo, signature, otp` | Sí | Kind of evidence |
| `otpCode` | `string` | No | The OTP code the recipient gave. Required when type = otp; longitud máx. 10; ejemplo: "123456" |

Ejemplo para una foto (para `type=otp`, enviar `otpCode` en lugar de `file`):

```bash
curl -X POST http://localhost:3000/api/sync/evidences \
  -H "Authorization: Bearer <accessToken>" \
  -F "clientEventId=01933b6e-7f2a-7c3d-9a1b-2f8e6c4d5a10" \
  -F "dispatchId=42" -F "type=photo" -F "file=@foto.jpg"
```

**Respuesta correcta:** `201` → `SyncEventResultDto` (Read `outcome`: 201 does not mean the evidence was saved.).

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `clientEventId` | `string` | Sí | The `clientEventId` of the event this result is about; ejemplo: "01933b6e-7f2a-7c3d-9a1b-2f8e6c4d5a10" |
| `outcome` | `string: applied, already_processed, failed` | Sí | applied = saved now · already_processed = it had been saved by an earlier attempt, nothing changed · failed = not saved, see `error`; keep it on the device and retry once fixed |
| `error` | `string` | No | Why it failed (e.g. "Dispatch not found."). Only present when outcome = failed |

Ejemplo del Swagger:

```json
{
  "clientEventId": "01933b6e-7f2a-7c3d-9a1b-2f8e6c4d5a10",
  "outcome": "applied"
}
```

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | clientEventId must be a UUID |
| `401` | `INVALID_TOKEN` | Invalid or expired token. |
| `403` | `INSUFFICIENT_PERMISSIONS` | You do not have permission to perform this action. |

Un archivo de más de 10 MB responde `413`, según el controlador.

### Tracking

#### POST /api/tracking/locations

**Función.** Used by the driver's mobile app to report its position in the background (RF-U11). Send one point per call while online, or several at once after regaining signal (RF-U11, Escenario 3) — order in the request does not matter, they are applied oldest-first by their own `recordedAt`. The HTTP status is 201 even when some points fail: read `results`, where each point reports `applied` (saved and pushed live to the dispatch board), `stale` (an equal-or-newer point already won, nothing to do) or `failed` (with an `error`, e.g. dispatch not found or someone else's). A driver can only report on a dispatch of a route assigned to them: any other dispatch id (unknown or someone else's) is reported as `failed` with "Dispatch not found.". Requires driver role.

**Acceso:** JWT Bearer; roles: driver (o root).

**Cuerpo de solicitud:** `application/json`; esquema [`ReportLocationsDto`](#reportlocationsdto).

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `locations` | `LocationPointDto[]` | Sí | One or more GPS points captured while the route was active. Order does not matter — they are applied oldest-first regardless of how they are sent, so a buffered batch synced after regaining signal (RF-U11, Escenario 3) works the same as a single live point; elementos mín. 1 |
| `locations[].dispatchId` | `integer` | Sí | ID of the dispatch this position belongs to — must be on a route assigned to the reporting driver; ejemplo: 42 |
| `locations[].latitude` | `number` | Sí | Latitude, decimal degrees (WGS84), between -90 and 90; ejemplo: -17.783 |
| `locations[].longitude` | `number` | Sí | Longitude, decimal degrees (WGS84), between -180 and 180; ejemplo: -63.182 |
| `locations[].recordedAt` | `string` | Sí | When the device captured this point, ISO 8601 in UTC (not when it was sent); ejemplo: "2026-09-29T14:03:00.000Z" |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "locations": [
    {
      "dispatchId": 42,
      "latitude": -17.783,
      "longitude": -63.182,
      "recordedAt": "2026-09-29T14:03:00.000Z"
    }
  ]
}
```

**Respuesta correcta:** `201` → `LocationsReportResultDto` (The batch was processed. Read each result: 201 does not mean every point was saved.).

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `results` | `LocationReportResultDto[]` | Sí | One result per point sent, in the same order as the request |
| `results[].dispatchId` | `integer` | Sí | The `dispatchId` of the point this result is about; ejemplo: 42 |
| `results[].outcome` | `string: applied, stale, failed` | Sí | applied = it was the newest point for this dispatch, saved and broadcast · stale = an equal-or-newer point was already stored (from an earlier report or another point in this same batch) — not an error, safe to ignore · failed = not saved, see `error` |
| `results[].error` | `string` | No | Why it failed (e.g. "Dispatch not found."). Only present when outcome = failed |

Ejemplo del Swagger:

```json
{
  "results": [
    {
      "dispatchId": 42,
      "outcome": "applied"
    },
    {
      "dispatchId": 42,
      "outcome": "stale"
    },
    {
      "dispatchId": 99,
      "outcome": "failed",
      "error": "Dispatch not found."
    }
  ]
}
```

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | locations must contain at least 1 elements |
| `401` | `INVALID_TOKEN` | Invalid or expired token. |
| `403` | `INSUFFICIENT_PERMISSIONS` | You do not have permission to perform this action. |

**Regla adicional del servicio:** un `recordedAt` más de 2 minutos en el futuro produce `outcome: "failed"` para ese punto; no cancela los demás. Los puntos se aplican en orden cronológico, pero `results` se devuelve en el mismo orden de la solicitud.

### Roles

#### GET /api/roles

**Función.** Returns the roles, paginated (10 per page by default, up to 100). Roles are a fixed catalog of 5 (root, admin, coordinator, supervisor, driver) that cannot be created, edited or deleted through the API; use a role's `id` as `roleId` when creating or updating a user, or to filter `GET /users`. Each role comes with `userCount` and `activeUserCount`. All filters are optional and combine with "and": `search` (name contains), `name` (exactly one role), and `assignable=true` (only the roles the caller may give to a user: no `root` unless the caller is root, which is what the user form's role selector needs). Sorted by `sortBy` / `sortOrder` (default: id, ascending). Requires admin or coordinator role, or root.

**Acceso:** JWT Bearer; roles: admin, coordinator (o root).

**Parámetros:**

| Lugar | Nombre | Tipo | Obligatorio | Descripción | Restricciones / ejemplo |
| --- | --- | --- | --- | --- | --- |
| query | `page` | `integer` | No | Page number (starts at 1, up to 1000000). Default: 1. | mín. 1; máx. 1000000; defecto 1; ejemplo: 1 |
| query | `limit` | `integer` | No | Results per page. Default: 10, maximum: 100. | mín. 1; máx. 100; defecto 10; ejemplo: 10 |
| query | `search` | `string` | No | E.g. admin. Text contained in the role name (case-insensitive; % and _ are matched literally) | longitud máx. 100 |
| query | `name` | `string: root, admin, coordinator, supervisor, driver` | No | Only the role with exactly this name — the quickest way to find the `id` of, say, `driver`. Combine with the other filters with "and" |  |
| query | `assignable` | `boolean` | No | true = only the roles YOU may give to a user: everything except `root` unless you are root (an admin cannot create root users, 403 ROOT_ACCOUNT_PROTECTED). Use it to fill the role selector of the user form. Omit (or send it empty) for all roles |  |
| query | `sortBy` | `string: id, name, createdAt` | No | Field to sort by. Default: id (the order of the catalog). Ties are broken by id | defecto id |
| query | `sortOrder` | `string: asc, desc` | No | Sort direction. Default: asc | defecto asc |

**Respuesta correcta:** `200` → `FindAllRolesResponseDto`.

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `data` | `RoleDetailDto[]` | Sí | Items on the current page |
| `data[].id` | `integer` | Sí | Role ID. Use it as `roleId` when creating or updating users; ejemplo: 1 |
| `data[].name` | `string: root, admin, coordinator, supervisor, driver` | Sí | Role name. root: the system account, can do everything (only root manages root accounts) · admin: users and settings · coordinator: delivery zones, service levels and vehicles, and reads users and roles · supervisor: vehicles · driver: the mobile app (sync). admin, coordinator, supervisor and driver are independent of each other; ejemplo: "admin" |
| `data[].createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC); ejemplo: "2024-01-01T00:00:00.000Z" |
| `data[].userCount` | `integer` | Sí | How many users (not deleted) have this role, active or not; ejemplo: 4 |
| `data[].activeUserCount` | `integer` | Sí | How many of those users are active (can log in); ejemplo: 3 |
| `meta` | `MetadataDto` | Sí | Pagination metadata |
| `meta.page` | `integer` | Sí | Current page number; ejemplo: 1 |
| `meta.limit` | `integer` | Sí | Items per page; ejemplo: 10 |
| `meta.pages` | `integer` | Sí | Total number of pages (0 when there are no results); ejemplo: 5 |
| `meta.total` | `integer` | Sí | Total number of records matching the filters; ejemplo: 42 |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "data": [
    {
      "id": 1,
      "name": "admin",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "userCount": 4,
      "activeUserCount": 3
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "pages": 5,
    "total": 42
  }
}
```

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | The 'sortBy' parameter must be one of: id, name, createdAt. |
| `401` | `INVALID_TOKEN` | Invalid or expired token. |
| `403` | `INSUFFICIENT_PERMISSIONS` | You do not have permission to perform this action. |

#### GET /api/roles/{id}

**Función.** Returns one role by ID, with its `userCount` and `activeUserCount`. Requires admin or coordinator role, or root.

**Acceso:** JWT Bearer; roles: admin, coordinator (o root).

**Parámetros:**

| Lugar | Nombre | Tipo | Obligatorio | Descripción | Restricciones / ejemplo |
| --- | --- | --- | --- | --- | --- |
| path | `id` | `integer` | Sí | Role ID (a whole number from 1 to 2147483647, as returned by the list endpoint). Anything else is a 400. | ejemplo: 1 |

**Respuesta correcta:** `200` → `RoleDetailDto`.

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `id` | `integer` | Sí | Role ID. Use it as `roleId` when creating or updating users; ejemplo: 1 |
| `name` | `string: root, admin, coordinator, supervisor, driver` | Sí | Role name. root: the system account, can do everything (only root manages root accounts) · admin: users and settings · coordinator: delivery zones, service levels and vehicles, and reads users and roles · supervisor: vehicles · driver: the mobile app (sync). admin, coordinator, supervisor and driver are independent of each other; ejemplo: "admin" |
| `createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC); ejemplo: "2024-01-01T00:00:00.000Z" |
| `userCount` | `integer` | Sí | How many users (not deleted) have this role, active or not; ejemplo: 4 |
| `activeUserCount` | `integer` | Sí | How many of those users are active (can log in); ejemplo: 3 |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "id": 1,
  "name": "admin",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "userCount": 4,
  "activeUserCount": 3
}
```

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | Validation failed (numeric string is expected) |
| `401` | `INVALID_TOKEN` | Invalid or expired token. |
| `403` | `INSUFFICIENT_PERMISSIONS` | You do not have permission to perform this action. |
| `404` | `ROLE_NOT_FOUND` | Role not found. |

### Users

#### GET /api/users

**Función.** Returns a paginated list of users (10 per page by default, up to 100), newest first unless `sortBy`/`sortOrder` say otherwise. All filters are optional and combine with "and": `roleId` (see GET /roles), `status` (active \| inactive \| locked) or `active` (true/false; do not send both, that is a 400 CONFLICTING_USER_FILTERS), and `search` over full name, username and email. Each user carries its derived `status` and last login date. Requires admin or coordinator role, or root.

**Acceso:** JWT Bearer; roles: admin, coordinator (o root).

**Parámetros:**

| Lugar | Nombre | Tipo | Obligatorio | Descripción | Restricciones / ejemplo |
| --- | --- | --- | --- | --- | --- |
| query | `page` | `integer` | No | Page number (starts at 1, up to 1000000). Default: 1. | mín. 1; máx. 1000000; defecto 1; ejemplo: 1 |
| query | `limit` | `integer` | No | Results per page. Default: 10, maximum: 100. | mín. 1; máx. 100; defecto 10; ejemplo: 10 |
| query | `roleId` | `integer` | No | Only users with this role. Use an ID from GET /roles (e.g. 2) |  |
| query | `status` | `string: active, inactive, locked` | No | Only users in this status: inactive (deactivated by an admin), locked (active but temporarily locked after failed logins) or active (everything else). Cannot be combined with `active` (400 CONFLICTING_USER_FILTERS). |  |
| query | `active` | `boolean` | No | true = only active accounts, false = only deactivated ones (it looks at the `active` flag only; to tell locked users apart use `status`). Omit or send it empty for all. Cannot be combined with `status`. |  |
| query | `search` | `string` | No | E.g. carlos. Text contained in the full name, username or email (case-insensitive). Combined with the other filters using "and". | longitud máx. 100 |
| query | `sortBy` | `string: fullName, username, createdAt, lastLoginAt` | No | Field to sort by. Default: createdAt. | defecto createdAt |
| query | `sortOrder` | `string: asc, desc` | No | Sort direction. Default: desc (newest / last first). | defecto desc |

**Respuesta correcta:** `200` → `FindAllUsersResponseDto`.

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `data` | `UserDto[]` | Sí | Items on the current page |
| `data[].id` | `integer` | Sí | User ID; ejemplo: 1 |
| `data[].fullName` | `string` | Sí | The user's full name; ejemplo: "Ana Torrez" |
| `data[].username` | `string` | Sí | Login name, unique among users; ejemplo: "atorrez" |
| `data[].email` | `string / null` | Sí | Email address. null when none was given; ejemplo: "ana@hipermaxi.com" |
| `data[].role` | `RoleDto` | Sí | The user's role, which decides what they can do |
| `data[].role.id` | `integer` | Sí | Role ID. Use it as `roleId` when creating or updating users; ejemplo: 1 |
| `data[].role.name` | `string: root, admin, coordinator, supervisor, driver` | Sí | Role name. root: the system account, can do everything (only root manages root accounts) · admin: users and settings · coordinator: delivery zones, service levels and vehicles, and reads users and roles · supervisor: vehicles · driver: the mobile app (sync). admin, coordinator, supervisor and driver are independent of each other; ejemplo: "admin" |
| `data[].role.createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC); ejemplo: "2024-01-01T00:00:00.000Z" |
| `data[].active` | `boolean` | Sí | false = deactivated by an admin: cannot log in; ejemplo: true |
| `data[].twoFactorEnabled` | `boolean` | Sí | true when two-factor authentication is on for this account (login then needs a TOTP code); ejemplo: false |
| `data[].requiresPwdChange` | `boolean` | Sí | true if the user must change their password before continuing; ejemplo: false |
| `data[].status` | `string: active, inactive, locked` | Sí | inactive = deactivated by an admin · locked = temporarily locked after failed logins · active = everything else; ejemplo: "active" |
| `data[].lockedUntil` | `string (date-time) / null` | Sí | While in the future, the account is locked (RF-A21). Null when never locked; ejemplo: null |
| `data[].lastLoginAt` | `string (date-time) / null` | Sí | Last successful login. Null if the user has never logged in; ejemplo: "2026-09-24T14:03:00.000Z" |
| `data[].createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC); ejemplo: "2024-01-01T00:00:00.000Z" |
| `meta` | `MetadataDto` | Sí | Pagination metadata |
| `meta.page` | `integer` | Sí | Current page number; ejemplo: 1 |
| `meta.limit` | `integer` | Sí | Items per page; ejemplo: 10 |
| `meta.pages` | `integer` | Sí | Total number of pages (0 when there are no results); ejemplo: 5 |
| `meta.total` | `integer` | Sí | Total number of records matching the filters; ejemplo: 42 |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "data": [
    {
      "id": 1,
      "fullName": "Ana Torrez",
      "username": "atorrez",
      "email": "ana@hipermaxi.com",
      "role": {
        "id": 1,
        "name": "admin",
        "createdAt": "2024-01-01T00:00:00.000Z"
      },
      "active": true,
      "twoFactorEnabled": false,
      "requiresPwdChange": false,
      "status": "active",
      "lockedUntil": null,
      "lastLoginAt": "2026-09-24T14:03:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "pages": 5,
    "total": 42
  }
}
```

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | The 'limit' parameter must be <= 100. |
| `400` | `CONFLICTING_USER_FILTERS` | Use either the 'active' or the 'status' filter, not both. |
| `401` | `INVALID_TOKEN` | Invalid or expired token. |
| `403` | `INSUFFICIENT_PERMISSIONS` | You do not have permission to perform this action. |

#### POST /api/users

**Función.** Creates an internal user account. `fullName`, `username`, `password` and `roleId` are required; `email` is optional. `username` (and `email`, if given) must not belong to another user (409 USER_ALREADY_EXISTS). The password must be at least 8 characters with an uppercase letter, a lowercase letter, a number and a symbol, and at least the length configured in settings (`password_min_length`, 400 PASSWORD_TOO_SHORT). The account is created active, and the user is asked to change the password at first login. Requires admin role or root.

**Acceso:** JWT Bearer; roles: admin (o root).

**Cuerpo de solicitud:** `application/json`; esquema [`CreateUserDto`](#createuserdto).

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `fullName` | `string` | Sí | The user's full name, as shown in the app; longitud máx. 150; ejemplo: "Ana Torrez" |
| `username` | `string` | Sí | Login name. Must not belong to another user; longitud máx. 50; ejemplo: "atorrez" |
| `email` | `string` | No | Optional. A valid email address that must not belong to another user. Needed to recover the password by email; longitud máx. 150; ejemplo: "ana@hipermaxi.com" |
| `password` | `string` | Sí | Must be at least 8 characters with an uppercase letter, a lowercase letter, a number and a symbol, and meet the minimum length set in settings (password_min_length). It is stored hashed and never returned; longitud mín. 8; longitud máx. 255; ejemplo: "Passw0rd!" |
| `roleId` | `integer` | Sí | ID of the role to assign, from GET /roles (root, admin, coordinator, supervisor or driver). An unknown ID is a 400 INVALID_ROLE; ejemplo: 3 |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "fullName": "Ana Torrez",
  "username": "atorrez",
  "password": "Passw0rd!",
  "roleId": 3
}
```

**Respuesta correcta:** `201` → `UserDto`.

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `id` | `integer` | Sí | User ID; ejemplo: 1 |
| `fullName` | `string` | Sí | The user's full name; ejemplo: "Ana Torrez" |
| `username` | `string` | Sí | Login name, unique among users; ejemplo: "atorrez" |
| `email` | `string / null` | Sí | Email address. null when none was given; ejemplo: "ana@hipermaxi.com" |
| `role` | `RoleDto` | Sí | The user's role, which decides what they can do |
| `role.id` | `integer` | Sí | Role ID. Use it as `roleId` when creating or updating users; ejemplo: 1 |
| `role.name` | `string: root, admin, coordinator, supervisor, driver` | Sí | Role name. root: the system account, can do everything (only root manages root accounts) · admin: users and settings · coordinator: delivery zones, service levels and vehicles, and reads users and roles · supervisor: vehicles · driver: the mobile app (sync). admin, coordinator, supervisor and driver are independent of each other; ejemplo: "admin" |
| `role.createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC); ejemplo: "2024-01-01T00:00:00.000Z" |
| `active` | `boolean` | Sí | false = deactivated by an admin: cannot log in; ejemplo: true |
| `twoFactorEnabled` | `boolean` | Sí | true when two-factor authentication is on for this account (login then needs a TOTP code); ejemplo: false |
| `requiresPwdChange` | `boolean` | Sí | true if the user must change their password before continuing; ejemplo: false |
| `status` | `string: active, inactive, locked` | Sí | inactive = deactivated by an admin · locked = temporarily locked after failed logins · active = everything else; ejemplo: "active" |
| `lockedUntil` | `string (date-time) / null` | Sí | While in the future, the account is locked (RF-A21). Null when never locked; ejemplo: null |
| `lastLoginAt` | `string (date-time) / null` | Sí | Last successful login. Null if the user has never logged in; ejemplo: "2026-09-24T14:03:00.000Z" |
| `createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC); ejemplo: "2024-01-01T00:00:00.000Z" |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "id": 1,
  "fullName": "Ana Torrez",
  "username": "atorrez",
  "email": "ana@hipermaxi.com",
  "role": {
    "id": 1,
    "name": "admin",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "active": true,
  "twoFactorEnabled": false,
  "requiresPwdChange": false,
  "status": "active",
  "lockedUntil": null,
  "lastLoginAt": "2026-09-24T14:03:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | Full name is required.; Role ID must be an integer. |
| `400` | `PASSWORD_TOO_SHORT` | Password must be at least 8 characters. |
| `400` | `INVALID_ROLE` | The given role does not exist. |
| `401` | `INVALID_TOKEN` | Invalid or expired token. |
| `403` | `INSUFFICIENT_PERMISSIONS` | You do not have permission to perform this action. |
| `409` | `USER_ALREADY_EXISTS` | A user with this username or email already exists. |

#### GET /api/users/{id}

**Función.** Returns one user by ID, including its role, derived status, 2FA flag and last login. A deleted user is not found. Requires admin role or root.

**Acceso:** JWT Bearer; roles: admin (o root).

**Parámetros:**

| Lugar | Nombre | Tipo | Obligatorio | Descripción | Restricciones / ejemplo |
| --- | --- | --- | --- | --- | --- |
| path | `id` | `integer` | Sí | User ID (a whole number from 1 to 2147483647, as returned by the list endpoint). Anything else is a 400. | ejemplo: 1 |

**Respuesta correcta:** `200` → `UserDto`.

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `id` | `integer` | Sí | User ID; ejemplo: 1 |
| `fullName` | `string` | Sí | The user's full name; ejemplo: "Ana Torrez" |
| `username` | `string` | Sí | Login name, unique among users; ejemplo: "atorrez" |
| `email` | `string / null` | Sí | Email address. null when none was given; ejemplo: "ana@hipermaxi.com" |
| `role` | `RoleDto` | Sí | The user's role, which decides what they can do |
| `role.id` | `integer` | Sí | Role ID. Use it as `roleId` when creating or updating users; ejemplo: 1 |
| `role.name` | `string: root, admin, coordinator, supervisor, driver` | Sí | Role name. root: the system account, can do everything (only root manages root accounts) · admin: users and settings · coordinator: delivery zones, service levels and vehicles, and reads users and roles · supervisor: vehicles · driver: the mobile app (sync). admin, coordinator, supervisor and driver are independent of each other; ejemplo: "admin" |
| `role.createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC); ejemplo: "2024-01-01T00:00:00.000Z" |
| `active` | `boolean` | Sí | false = deactivated by an admin: cannot log in; ejemplo: true |
| `twoFactorEnabled` | `boolean` | Sí | true when two-factor authentication is on for this account (login then needs a TOTP code); ejemplo: false |
| `requiresPwdChange` | `boolean` | Sí | true if the user must change their password before continuing; ejemplo: false |
| `status` | `string: active, inactive, locked` | Sí | inactive = deactivated by an admin · locked = temporarily locked after failed logins · active = everything else; ejemplo: "active" |
| `lockedUntil` | `string (date-time) / null` | Sí | While in the future, the account is locked (RF-A21). Null when never locked; ejemplo: null |
| `lastLoginAt` | `string (date-time) / null` | Sí | Last successful login. Null if the user has never logged in; ejemplo: "2026-09-24T14:03:00.000Z" |
| `createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC); ejemplo: "2024-01-01T00:00:00.000Z" |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "id": 1,
  "fullName": "Ana Torrez",
  "username": "atorrez",
  "email": "ana@hipermaxi.com",
  "role": {
    "id": 1,
    "name": "admin",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "active": true,
  "twoFactorEnabled": false,
  "requiresPwdChange": false,
  "status": "active",
  "lockedUntil": null,
  "lastLoginAt": "2026-09-24T14:03:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | Validation failed (numeric string is expected) |
| `401` | `INVALID_TOKEN` | Invalid or expired token. |
| `403` | `INSUFFICIENT_PERMISSIONS` | You do not have permission to perform this action. |
| `404` | `USER_NOT_FOUND` | User not found. |

#### PUT /api/users/{id}

**Función.** Partially updates a user: only the fields sent are changed (an empty body is a no-op). `email` can be cleared by sending `null`; every other field rejects `null`. `active: false` deactivates the account (the user can no longer log in) and `true` reactivates it. A new `password` resets the user's password (admin action: the password history is not checked, and the user's own sessions are not closed). A changed `username` or `email` must not belong to another user (409). To change the role use `PATCH /users/:id/role` instead — it is a separate endpoint because it also revokes the session (RF-A27). Root accounts can only be edited by root (403 ROOT_ACCOUNT_PROTECTED). You cannot deactivate your own account (403 CANNOT_MODIFY_OWN_ACCOUNT). A deactivated or deleted user loses access on their very next request, and a password change closes every access token issued before it. Requires admin role or root.

**Acceso:** JWT Bearer; roles: admin (o root).

**Parámetros:**

| Lugar | Nombre | Tipo | Obligatorio | Descripción | Restricciones / ejemplo |
| --- | --- | --- | --- | --- | --- |
| path | `id` | `integer` | Sí | User ID (a whole number from 1 to 2147483647, as returned by the list endpoint). Anything else is a 400. | ejemplo: 1 |

**Cuerpo de solicitud:** `application/json`; esquema [`UpdateUserDto`](#updateuserdto).

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `fullName` | `string` | No | New full name. null is rejected; longitud máx. 150; ejemplo: "Ana Torrez" |
| `username` | `string` | No | New login name. Must not belong to another user. null is rejected; longitud máx. 50; ejemplo: "atorrez" |
| `email` | `string / null` | No | New email, which must not belong to another user. null clears it; longitud máx. 150; ejemplo: "ana@hipermaxi.com" |
| `password` | `string` | No | Resets the password (admin action). Must be at least 8 characters with an uppercase letter, a lowercase letter, a number and a symbol, and meet the minimum length set in settings (password_min_length). null is rejected; longitud mín. 8; longitud máx. 255; ejemplo: "NewPassw0rd!" |
| `active` | `boolean` | No | false deactivates the user (cannot log in) without deleting it; true reactivates. null is rejected; ejemplo: false |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "fullName": "Ana Torrez"
}
```

**Respuesta correcta:** `200` → `UserDto`.

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `id` | `integer` | Sí | User ID; ejemplo: 1 |
| `fullName` | `string` | Sí | The user's full name; ejemplo: "Ana Torrez" |
| `username` | `string` | Sí | Login name, unique among users; ejemplo: "atorrez" |
| `email` | `string / null` | Sí | Email address. null when none was given; ejemplo: "ana@hipermaxi.com" |
| `role` | `RoleDto` | Sí | The user's role, which decides what they can do |
| `role.id` | `integer` | Sí | Role ID. Use it as `roleId` when creating or updating users; ejemplo: 1 |
| `role.name` | `string: root, admin, coordinator, supervisor, driver` | Sí | Role name. root: the system account, can do everything (only root manages root accounts) · admin: users and settings · coordinator: delivery zones, service levels and vehicles, and reads users and roles · supervisor: vehicles · driver: the mobile app (sync). admin, coordinator, supervisor and driver are independent of each other; ejemplo: "admin" |
| `role.createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC); ejemplo: "2024-01-01T00:00:00.000Z" |
| `active` | `boolean` | Sí | false = deactivated by an admin: cannot log in; ejemplo: true |
| `twoFactorEnabled` | `boolean` | Sí | true when two-factor authentication is on for this account (login then needs a TOTP code); ejemplo: false |
| `requiresPwdChange` | `boolean` | Sí | true if the user must change their password before continuing; ejemplo: false |
| `status` | `string: active, inactive, locked` | Sí | inactive = deactivated by an admin · locked = temporarily locked after failed logins · active = everything else; ejemplo: "active" |
| `lockedUntil` | `string (date-time) / null` | Sí | While in the future, the account is locked (RF-A21). Null when never locked; ejemplo: null |
| `lastLoginAt` | `string (date-time) / null` | Sí | Last successful login. Null if the user has never logged in; ejemplo: "2026-09-24T14:03:00.000Z" |
| `createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC); ejemplo: "2024-01-01T00:00:00.000Z" |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "id": 1,
  "fullName": "Ana Torrez",
  "username": "atorrez",
  "email": "ana@hipermaxi.com",
  "role": {
    "id": 1,
    "name": "admin",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "active": true,
  "twoFactorEnabled": false,
  "requiresPwdChange": false,
  "status": "active",
  "lockedUntil": null,
  "lastLoginAt": "2026-09-24T14:03:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | Email must be a valid email address. |
| `400` | `Bad Request` | Validation failed (numeric string is expected) |
| `400` | `PASSWORD_TOO_SHORT` | Password must be at least 8 characters. |
| `401` | `INVALID_TOKEN` | Invalid or expired token. |
| `403` | `INSUFFICIENT_PERMISSIONS` | You do not have permission to perform this action. |
| `404` | `USER_NOT_FOUND` | User not found. |
| `409` | `USER_ALREADY_EXISTS` | A user with this username or email already exists. |

**Cambio de rol:** `roleId` no forma parte de este cuerpo. Usa `PATCH /api/users/{id}/role` para cambiarlo.

**Otros `403` de negocio descritos por el controlador:** `ROOT_ACCOUNT_PROTECTED`: solo root puede modificar una cuenta root; `CANNOT_MODIFY_OWN_ACCOUNT`: no puedes desactivar tu propia cuenta.

#### DELETE /api/users/{id}

**Función.** Soft-deletes the user: the record stays in the database but no longer appears in lists or lookups. To only block access, deactivate the user instead (PUT `active: false`). A root account can only be deleted by root (403 ROOT_ACCOUNT_PROTECTED for an admin). You cannot delete your own account (403 CANNOT_MODIFY_OWN_ACCOUNT). Requires admin role or root.

**Acceso:** JWT Bearer; roles: admin (o root).

**Parámetros:**

| Lugar | Nombre | Tipo | Obligatorio | Descripción | Restricciones / ejemplo |
| --- | --- | --- | --- | --- | --- |
| path | `id` | `integer` | Sí | User ID (a whole number from 1 to 2147483647, as returned by the list endpoint). Anything else is a 400. | ejemplo: 1 |

**Respuesta correcta:** `204` → sin cuerpo (User deleted successfully.).

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | Validation failed (numeric string is expected) |
| `401` | `INVALID_TOKEN` | Invalid or expired token. |
| `403` | `INSUFFICIENT_PERMISSIONS` | You do not have permission to perform this action. |
| `404` | `USER_NOT_FOUND` | User not found. |

**Otros `403` de negocio descritos por el controlador:** `ROOT_ACCOUNT_PROTECTED`: solo root puede eliminar una cuenta root; `CANNOT_MODIFY_OWN_ACCOUNT`: no puedes eliminar tu propia cuenta.

#### PATCH /api/users/{id}/role

**Función.** RF-A27 — the only way to change a user's role (not part of PUT /users/:id). `roleId` is required, an ID from GET /roles (an unknown ID is 400 INVALID_ROLE). If it actually changes the role, the user's refresh token is revoked: they keep whatever access their current access token still allows (which already reflects the new role right away, see PUT /users/:id) but must log in again to get a fresh session. Sending the role the user already has is a no-op and does not revoke anything. Only root may give or take away the root role, and nobody may change their own role (403 ROOT_ACCOUNT_PROTECTED / CANNOT_MODIFY_OWN_ACCOUNT). Requires admin role or root.

**Acceso:** JWT Bearer; roles: admin (o root).

**Parámetros:**

| Lugar | Nombre | Tipo | Obligatorio | Descripción | Restricciones / ejemplo |
| --- | --- | --- | --- | --- | --- |
| path | `id` | `integer` | Sí | User ID (a whole number from 1 to 2147483647, as returned by the list endpoint). Anything else is a 400. | ejemplo: 1 |

**Cuerpo de solicitud:** `application/json`; esquema [`UpdateUserRoleDto`](#updateuserroledto).

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `roleId` | `integer` | Sí | New role, an ID from GET /roles. Required — this endpoint only changes the role. An unknown ID is a 400 INVALID_ROLE; ejemplo: 2 |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "roleId": 2
}
```

**Respuesta correcta:** `200` → `UserDto`.

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `id` | `integer` | Sí | User ID; ejemplo: 1 |
| `fullName` | `string` | Sí | The user's full name; ejemplo: "Ana Torrez" |
| `username` | `string` | Sí | Login name, unique among users; ejemplo: "atorrez" |
| `email` | `string / null` | Sí | Email address. null when none was given; ejemplo: "ana@hipermaxi.com" |
| `role` | `RoleDto` | Sí | The user's role, which decides what they can do |
| `role.id` | `integer` | Sí | Role ID. Use it as `roleId` when creating or updating users; ejemplo: 1 |
| `role.name` | `string: root, admin, coordinator, supervisor, driver` | Sí | Role name. root: the system account, can do everything (only root manages root accounts) · admin: users and settings · coordinator: delivery zones, service levels and vehicles, and reads users and roles · supervisor: vehicles · driver: the mobile app (sync). admin, coordinator, supervisor and driver are independent of each other; ejemplo: "admin" |
| `role.createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC); ejemplo: "2024-01-01T00:00:00.000Z" |
| `active` | `boolean` | Sí | false = deactivated by an admin: cannot log in; ejemplo: true |
| `twoFactorEnabled` | `boolean` | Sí | true when two-factor authentication is on for this account (login then needs a TOTP code); ejemplo: false |
| `requiresPwdChange` | `boolean` | Sí | true if the user must change their password before continuing; ejemplo: false |
| `status` | `string: active, inactive, locked` | Sí | inactive = deactivated by an admin · locked = temporarily locked after failed logins · active = everything else; ejemplo: "active" |
| `lockedUntil` | `string (date-time) / null` | Sí | While in the future, the account is locked (RF-A21). Null when never locked; ejemplo: null |
| `lastLoginAt` | `string (date-time) / null` | Sí | Last successful login. Null if the user has never logged in; ejemplo: "2026-09-24T14:03:00.000Z" |
| `createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC); ejemplo: "2024-01-01T00:00:00.000Z" |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "id": 1,
  "fullName": "Ana Torrez",
  "username": "atorrez",
  "email": "ana@hipermaxi.com",
  "role": {
    "id": 1,
    "name": "admin",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "active": true,
  "twoFactorEnabled": false,
  "requiresPwdChange": false,
  "status": "active",
  "lockedUntil": null,
  "lastLoginAt": "2026-09-24T14:03:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | Role ID must be an integer. |
| `400` | `Bad Request` | Validation failed (numeric string is expected) |
| `400` | `INVALID_ROLE` | The given role does not exist. |
| `401` | `INVALID_TOKEN` | Invalid or expired token. |
| `403` | `INSUFFICIENT_PERMISSIONS` | You do not have permission to perform this action. |
| `404` | `USER_NOT_FOUND` | User not found. |

**Otros `403` de negocio descritos por el controlador:** `ROOT_ACCOUNT_PROTECTED`: solo root puede asignar o retirar el rol root; `CANNOT_MODIFY_OWN_ACCOUNT`: no puedes cambiar tu propio rol.

### Delivery Zones

#### GET /api/delivery-zones

**Función.** Returns a paginated list of delivery zones (10 per page by default, up to 100). `search` matches the code or the name (case-insensitive). Requires coordinator role or root.

**Acceso:** JWT Bearer; roles: coordinator (o root).

**Parámetros:**

| Lugar | Nombre | Tipo | Obligatorio | Descripción | Restricciones / ejemplo |
| --- | --- | --- | --- | --- | --- |
| query | `page` | `integer` | No | Page number (starts at 1, up to 1000000). Default: 1. | mín. 1; máx. 1000000; defecto 1; ejemplo: 1 |
| query | `limit` | `integer` | No | Results per page. Default: 10, maximum: 100. | mín. 1; máx. 100; defecto 10; ejemplo: 10 |
| query | `search` | `string` | No | E.g. Sur. Text contained in the zone code or name (case-insensitive) |  |

**Respuesta correcta:** `200` → `FindAllDeliveryZonesResponseDto`.

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `data` | `DeliveryZoneDto[]` | Sí | Items on the current page |
| `data[].id` | `integer` | Sí | Delivery zone ID; ejemplo: 1 |
| `data[].code` | `string` | Sí | Unique short code of the zone; ejemplo: "ZON-SUR" |
| `data[].name` | `string` | Sí | Display name of the zone; ejemplo: "Zona Sur" |
| `data[].estimatedTimeMin` | `integer` | Sí | Base estimated delivery time in this zone, in minutes; ejemplo: 45 |
| `data[].createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC); ejemplo: "2024-01-01T00:00:00.000Z" |
| `meta` | `MetadataDto` | Sí | Pagination metadata |
| `meta.page` | `integer` | Sí | Current page number; ejemplo: 1 |
| `meta.limit` | `integer` | Sí | Items per page; ejemplo: 10 |
| `meta.pages` | `integer` | Sí | Total number of pages (0 when there are no results); ejemplo: 5 |
| `meta.total` | `integer` | Sí | Total number of records matching the filters; ejemplo: 42 |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "data": [
    {
      "id": 1,
      "code": "ZON-SUR",
      "name": "Zona Sur",
      "estimatedTimeMin": 45,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "pages": 5,
    "total": 42
  }
}
```

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | The 'limit' parameter must be <= 100. |
| `401` | `INVALID_TOKEN` | Invalid or expired token. |
| `403` | `INSUFFICIENT_PERMISSIONS` | You do not have permission to perform this action. |

#### POST /api/delivery-zones

**Función.** Creates a delivery zone. All three fields are required: a unique `code` (409 DELIVERY_ZONE_CODE_ALREADY_EXISTS if another zone uses it), a `name` and the base `estimatedTimeMin` (a positive whole number of minutes). Requires coordinator role or root.

**Acceso:** JWT Bearer; roles: coordinator (o root).

**Cuerpo de solicitud:** `application/json`; esquema [`CreateDeliveryZoneDto`](#createdeliveryzonedto).

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `code` | `string` | Sí | Short unique code of the zone, used to refer to it (e.g. ZON-SUR). Must not belong to another zone; longitud máx. 20; ejemplo: "ZON-SUR" |
| `name` | `string` | Sí | Display name of the zone; longitud máx. 100; ejemplo: "Zona Sur" |
| `estimatedTimeMin` | `integer` | Sí | Base estimated delivery time in this zone, in minutes (a whole number from 1 to 43200); mín. 1; máx. 43200; ejemplo: 45 |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "code": "ZON-SUR",
  "name": "Zona Sur",
  "estimatedTimeMin": 45
}
```

**Respuesta correcta:** `201` → `DeliveryZoneDto`.

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `id` | `integer` | Sí | Delivery zone ID; ejemplo: 1 |
| `code` | `string` | Sí | Unique short code of the zone; ejemplo: "ZON-SUR" |
| `name` | `string` | Sí | Display name of the zone; ejemplo: "Zona Sur" |
| `estimatedTimeMin` | `integer` | Sí | Base estimated delivery time in this zone, in minutes; ejemplo: 45 |
| `createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC); ejemplo: "2024-01-01T00:00:00.000Z" |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "id": 1,
  "code": "ZON-SUR",
  "name": "Zona Sur",
  "estimatedTimeMin": 45,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | Code is required.; Estimated time must be a positive number. |
| `401` | `INVALID_TOKEN` | Invalid or expired token. |
| `403` | `INSUFFICIENT_PERMISSIONS` | You do not have permission to perform this action. |
| `409` | `DELIVERY_ZONE_CODE_ALREADY_EXISTS` | This code already belongs to another delivery zone. |

#### GET /api/delivery-zones/{id}

**Función.** Returns one delivery zone by ID. A deleted zone is not found. Requires coordinator role or root.

**Acceso:** JWT Bearer; roles: coordinator (o root).

**Parámetros:**

| Lugar | Nombre | Tipo | Obligatorio | Descripción | Restricciones / ejemplo |
| --- | --- | --- | --- | --- | --- |
| path | `id` | `integer` | Sí | Delivery zone ID (a whole number from 1 to 2147483647, as returned by the list endpoint). Anything else is a 400. | ejemplo: 1 |

**Respuesta correcta:** `200` → `DeliveryZoneDto`.

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `id` | `integer` | Sí | Delivery zone ID; ejemplo: 1 |
| `code` | `string` | Sí | Unique short code of the zone; ejemplo: "ZON-SUR" |
| `name` | `string` | Sí | Display name of the zone; ejemplo: "Zona Sur" |
| `estimatedTimeMin` | `integer` | Sí | Base estimated delivery time in this zone, in minutes; ejemplo: 45 |
| `createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC); ejemplo: "2024-01-01T00:00:00.000Z" |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "id": 1,
  "code": "ZON-SUR",
  "name": "Zona Sur",
  "estimatedTimeMin": 45,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | Validation failed (numeric string is expected) |
| `401` | `INVALID_TOKEN` | Invalid or expired token. |
| `403` | `INSUFFICIENT_PERMISSIONS` | You do not have permission to perform this action. |
| `404` | `DELIVERY_ZONE_NOT_FOUND` | Delivery zone not found. |

#### PUT /api/delivery-zones/{id}

**Función.** Partially updates a delivery zone: only the fields sent are changed, and `null` is rejected. A changed `code` must not belong to another zone (409). Requires coordinator role or root.

**Acceso:** JWT Bearer; roles: coordinator (o root).

**Parámetros:**

| Lugar | Nombre | Tipo | Obligatorio | Descripción | Restricciones / ejemplo |
| --- | --- | --- | --- | --- | --- |
| path | `id` | `integer` | Sí | Delivery zone ID (a whole number from 1 to 2147483647, as returned by the list endpoint). Anything else is a 400. | ejemplo: 1 |

**Cuerpo de solicitud:** `application/json`; esquema [`UpdateDeliveryZoneDto`](#updatedeliveryzonedto).

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `code` | `string` | No | New code. Must not belong to another zone. null is rejected; longitud máx. 20; ejemplo: "ZON-SUR" |
| `name` | `string` | No | New display name. null is rejected; longitud máx. 100; ejemplo: "Zona Sur" |
| `estimatedTimeMin` | `integer` | No | New base estimated delivery time, in minutes (a whole number from 1 to 43200). null is rejected; mín. 1; máx. 43200; ejemplo: 45 |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "code": "ZON-SUR"
}
```

**Respuesta correcta:** `200` → `DeliveryZoneDto`.

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `id` | `integer` | Sí | Delivery zone ID; ejemplo: 1 |
| `code` | `string` | Sí | Unique short code of the zone; ejemplo: "ZON-SUR" |
| `name` | `string` | Sí | Display name of the zone; ejemplo: "Zona Sur" |
| `estimatedTimeMin` | `integer` | Sí | Base estimated delivery time in this zone, in minutes; ejemplo: 45 |
| `createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC); ejemplo: "2024-01-01T00:00:00.000Z" |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "id": 1,
  "code": "ZON-SUR",
  "name": "Zona Sur",
  "estimatedTimeMin": 45,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | Estimated time must be an integer. |
| `400` | `Bad Request` | Validation failed (numeric string is expected) |
| `401` | `INVALID_TOKEN` | Invalid or expired token. |
| `403` | `INSUFFICIENT_PERMISSIONS` | You do not have permission to perform this action. |
| `404` | `DELIVERY_ZONE_NOT_FOUND` | Delivery zone not found. |
| `409` | `DELIVERY_ZONE_CODE_ALREADY_EXISTS` | This code already belongs to another delivery zone. |

#### DELETE /api/delivery-zones/{id}

**Función.** Soft-deletes the delivery zone: it no longer appears in lists or lookups. Requires coordinator role or root.

**Acceso:** JWT Bearer; roles: coordinator (o root).

**Parámetros:**

| Lugar | Nombre | Tipo | Obligatorio | Descripción | Restricciones / ejemplo |
| --- | --- | --- | --- | --- | --- |
| path | `id` | `integer` | Sí | Delivery zone ID (a whole number from 1 to 2147483647, as returned by the list endpoint). Anything else is a 400. | ejemplo: 1 |

**Respuesta correcta:** `204` → sin cuerpo (Delivery zone deleted successfully.).

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | Validation failed (numeric string is expected) |
| `401` | `INVALID_TOKEN` | Invalid or expired token. |
| `403` | `INSUFFICIENT_PERMISSIONS` | You do not have permission to perform this action. |
| `404` | `DELIVERY_ZONE_NOT_FOUND` | Delivery zone not found. |

### Incident Reasons

Guía en español con validaciones y ejemplos completos: [Incident Reasons](INCIDENT_REASONS.md).

#### GET /api/incident-reasons

**Función.** Returns a paginated list (10 per page by default, up to 100) of the incident reasons that have not been deleted, ordered by name by default (`sortBy`/`sortOrder`; ties broken by id). `search` matches the name or the code; `active` and `requiresEvidence` narrow the list and are kept when a search is also given. The driver's mobile app uses this (with `active=true&limit=100`) to download and cache the whole catalog offline for RF-U06. Requires coordinator, supervisor or driver role, or root.

**Acceso:** JWT Bearer; roles: coordinator, supervisor, driver (o root).

**Parámetros:**

| Lugar | Nombre | Tipo | Obligatorio | Descripción | Restricciones / ejemplo |
| --- | --- | --- | --- | --- | --- |
| query | `page` | `integer` | No | Page number (starts at 1, up to 1000000). Default: 1. | mín. 1; máx. 1000000; defecto 1; ejemplo: 1 |
| query | `limit` | `integer` | No | Results per page. Default: 10, maximum: 100. | mín. 1; máx. 100; defecto 10; ejemplo: 10 |
| query | `search` | `string` | No | E.g. absent. Text contained in the name or the code (case-insensitive; % and _ are matched literally) | longitud máx. 100 |
| query | `active` | `boolean` | No | true = only enabled reasons, false = only disabled ones. Omit (or send it empty) for all. Any other value is rejected with 400 |  |
| query | `requiresEvidence` | `boolean` | No | true = only reasons that require a photo, false = only the ones that do not. Omit (or send it empty) for all |  |
| query | `sortBy` | `string: name, code, createdAt` | No | Field to sort by. Default: name | defecto name |
| query | `sortOrder` | `string: asc, desc` | No | Sort direction. Default: asc | defecto asc |

**Respuesta correcta:** `200` → `FindAllIncidentReasonsResponseDto`.

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `data` | `IncidentReasonDto[]` | Sí | Items on the current page |
| `data[].id` | `integer` | Sí | Incident reason ID. Use it as `incidentReasonId` when reporting a delivery incident (POST /sync/events); ejemplo: 1 |
| `data[].code` | `string` | Sí | Unique reference code, in uppercase. Must not belong to another reason; ejemplo: "INC-CLI-AUS" |
| `data[].name` | `string` | Sí | Display name shown to the driver on the mobile app; ejemplo: "Cliente ausente" |
| `data[].requiresEvidence` | `boolean` | Sí | true = logging an incident with this reason requires a photo of evidence. The mobile app reads this to demand (or not) a photo before letting the driver submit the report; ejemplo: true |
| `data[].active` | `boolean` | Sí | false = disabled: cannot be assigned to new incidents. Incidents already logged with it are not affected; ejemplo: true |
| `data[].createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC); ejemplo: "2024-01-01T00:00:00.000Z" |
| `meta` | `MetadataDto` | Sí | Pagination metadata |
| `meta.page` | `integer` | Sí | Current page number; ejemplo: 1 |
| `meta.limit` | `integer` | Sí | Items per page; ejemplo: 10 |
| `meta.pages` | `integer` | Sí | Total number of pages (0 when there are no results); ejemplo: 5 |
| `meta.total` | `integer` | Sí | Total number of records matching the filters; ejemplo: 42 |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "data": [
    {
      "id": 1,
      "code": "INC-CLI-AUS",
      "name": "Cliente ausente",
      "requiresEvidence": true,
      "active": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "pages": 5,
    "total": 42
  }
}
```

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | The 'sortBy' parameter must be one of: name, code, createdAt. |
| `401` | `INVALID_TOKEN` | Invalid or expired token. |
| `403` | `INSUFFICIENT_PERMISSIONS` | You do not have permission to perform this action. |

#### POST /api/incident-reasons

**Función.** Creates an incident reason with its unique `code`, its display `name`, and whether it `requiresEvidence` (a photo) — all three are required. The code is trimmed and uppercased. The new reason is always created enabled (`active: true`), so `active` is not accepted here. 409 when the code is taken. Requires coordinator or supervisor role, or root.

**Acceso:** JWT Bearer; roles: coordinator, supervisor (o root).

**Cuerpo de solicitud:** `application/json`; esquema [`CreateIncidentReasonDto`](#createincidentreasondto).

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `code` | `string` | Sí | Unique reference code. Trimmed and uppercased before validation; must not belong to another reason; longitud máx. 30; ejemplo: "INC-CLI-AUS" |
| `name` | `string` | Sí | Display name shown to the driver on the mobile app; longitud máx. 150; ejemplo: "Cliente ausente" |
| `requiresEvidence` | `boolean` | Sí | Whether logging an incident with this reason requires a photo of evidence. Required — the coordinator must decide it explicitly for every reason; ejemplo: true |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "code": "INC-CLI-AUS",
  "name": "Cliente ausente",
  "requiresEvidence": true
}
```

**Respuesta correcta:** `201` → `IncidentReasonDto`.

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `id` | `integer` | Sí | Incident reason ID. Use it as `incidentReasonId` when reporting a delivery incident (POST /sync/events); ejemplo: 1 |
| `code` | `string` | Sí | Unique reference code, in uppercase. Must not belong to another reason; ejemplo: "INC-CLI-AUS" |
| `name` | `string` | Sí | Display name shown to the driver on the mobile app; ejemplo: "Cliente ausente" |
| `requiresEvidence` | `boolean` | Sí | true = logging an incident with this reason requires a photo of evidence. The mobile app reads this to demand (or not) a photo before letting the driver submit the report; ejemplo: true |
| `active` | `boolean` | Sí | false = disabled: cannot be assigned to new incidents. Incidents already logged with it are not affected; ejemplo: true |
| `createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC); ejemplo: "2024-01-01T00:00:00.000Z" |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "id": 1,
  "code": "INC-CLI-AUS",
  "name": "Cliente ausente",
  "requiresEvidence": true,
  "active": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | Code is required.; Name is required.; Requires evidence must be true or false. |
| `401` | `INVALID_TOKEN` | Invalid or expired token. |
| `403` | `INSUFFICIENT_PERMISSIONS` | You do not have permission to perform this action. |
| `409` | `INCIDENT_REASON_CODE_ALREADY_EXISTS` | An incident reason with this code already exists. |

#### GET /api/incident-reasons/{id}

**Función.** Returns a single incident reason by its numeric ID, whether it is enabled or disabled. A deleted reason is not found. Requires coordinator, supervisor or driver role, or root.

**Acceso:** JWT Bearer; roles: coordinator, supervisor, driver (o root).

**Parámetros:**

| Lugar | Nombre | Tipo | Obligatorio | Descripción | Restricciones / ejemplo |
| --- | --- | --- | --- | --- | --- |
| path | `id` | `integer` | Sí | Incident reason ID (a whole number from 1 to 2147483647, as returned by the list endpoint). Anything else is a 400. | ejemplo: 1 |

**Respuesta correcta:** `200` → `IncidentReasonDto`.

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `id` | `integer` | Sí | Incident reason ID. Use it as `incidentReasonId` when reporting a delivery incident (POST /sync/events); ejemplo: 1 |
| `code` | `string` | Sí | Unique reference code, in uppercase. Must not belong to another reason; ejemplo: "INC-CLI-AUS" |
| `name` | `string` | Sí | Display name shown to the driver on the mobile app; ejemplo: "Cliente ausente" |
| `requiresEvidence` | `boolean` | Sí | true = logging an incident with this reason requires a photo of evidence. The mobile app reads this to demand (or not) a photo before letting the driver submit the report; ejemplo: true |
| `active` | `boolean` | Sí | false = disabled: cannot be assigned to new incidents. Incidents already logged with it are not affected; ejemplo: true |
| `createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC); ejemplo: "2024-01-01T00:00:00.000Z" |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "id": 1,
  "code": "INC-CLI-AUS",
  "name": "Cliente ausente",
  "requiresEvidence": true,
  "active": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | Validation failed (numeric string is expected) |
| `401` | `INVALID_TOKEN` | Invalid or expired token. |
| `403` | `INSUFFICIENT_PERMISSIONS` | You do not have permission to perform this action. |
| `404` | `INCIDENT_REASON_NOT_FOUND` | Incident reason not found. |

#### PUT /api/incident-reasons/{id}

**Función.** Partially updates an incident reason: only the fields sent are changed, and an empty body changes nothing. `null` is rejected on every field. If any field is invalid nothing is saved. `active: false` disables the reason (RF-A32, Escenario 2 — it stops being offered for new incidents, but incidents already logged with it, and their evidence, are not affected) and `active: true` enables it again; there is no delete endpoint for this catalog. 409 when a changed code is taken. Requires coordinator or supervisor role, or root.

**Acceso:** JWT Bearer; roles: coordinator, supervisor (o root).

**Parámetros:**

| Lugar | Nombre | Tipo | Obligatorio | Descripción | Restricciones / ejemplo |
| --- | --- | --- | --- | --- | --- |
| path | `id` | `integer` | Sí | Incident reason ID (a whole number from 1 to 2147483647, as returned by the list endpoint). Anything else is a 400. | ejemplo: 1 |

**Cuerpo de solicitud:** `application/json`; esquema [`UpdateIncidentReasonDto`](#updateincidentreasondto).

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `code` | `string` | No | New code. Must not belong to another reason. null is rejected; longitud máx. 30; ejemplo: "INC-CLI-AUS" |
| `name` | `string` | No | New display name. null is rejected; longitud máx. 150; ejemplo: "Cliente ausente" |
| `requiresEvidence` | `boolean` | No | Whether logging an incident with this reason requires a photo of evidence. null is rejected; ejemplo: true |
| `active` | `boolean` | No | false disables the reason for new incidents; incidents already logged with it are not affected. true enables it again. null is rejected; ejemplo: false |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "code": "INC-CLI-AUS",
  "name": "Cliente ausente",
  "requiresEvidence": true,
  "active": false
}
```

**Respuesta correcta:** `200` → `IncidentReasonDto`.

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `id` | `integer` | Sí | Incident reason ID. Use it as `incidentReasonId` when reporting a delivery incident (POST /sync/events); ejemplo: 1 |
| `code` | `string` | Sí | Unique reference code, in uppercase. Must not belong to another reason; ejemplo: "INC-CLI-AUS" |
| `name` | `string` | Sí | Display name shown to the driver on the mobile app; ejemplo: "Cliente ausente" |
| `requiresEvidence` | `boolean` | Sí | true = logging an incident with this reason requires a photo of evidence. The mobile app reads this to demand (or not) a photo before letting the driver submit the report; ejemplo: true |
| `active` | `boolean` | Sí | false = disabled: cannot be assigned to new incidents. Incidents already logged with it are not affected; ejemplo: true |
| `createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC); ejemplo: "2024-01-01T00:00:00.000Z" |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "id": 1,
  "code": "INC-CLI-AUS",
  "name": "Cliente ausente",
  "requiresEvidence": true,
  "active": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | Code must not be empty. |
| `400` | `Bad Request` | Validation failed (numeric string is expected) |
| `401` | `INVALID_TOKEN` | Invalid or expired token. |
| `403` | `INSUFFICIENT_PERMISSIONS` | You do not have permission to perform this action. |
| `404` | `INCIDENT_REASON_NOT_FOUND` | Incident reason not found. |
| `409` | `INCIDENT_REASON_CODE_ALREADY_EXISTS` | An incident reason with this code already exists. |

### Reschedule Reasons

Guía en español con validaciones y ejemplos completos: [Reschedule Reasons](RESCHEDULE_REASONS.md).

**Nota de consistencia:** el Swagger muestra `affectsSla: false` junto con `category: client` en su ejemplo, pero el controlador devuelve `true` para esa categoría. Los ejemplos ilustrativos de esta guía siguen el controlador.

#### GET /api/reschedule-reasons

**Función.** Returns a paginated list (10 per page by default, up to 100) of the reschedule reasons that have not been deleted, ordered by name by default (`sortBy`/`sortOrder`; ties broken by id). `search` matches the code, the name or the description; `category` and `active` narrow the list and are kept when a search is also given. Requires coordinator or supervisor role, or root.

**Acceso:** JWT Bearer; roles: coordinator, supervisor (o root).

**Parámetros:**

| Lugar | Nombre | Tipo | Obligatorio | Descripción | Restricciones / ejemplo |
| --- | --- | --- | --- | --- | --- |
| query | `page` | `integer` | No | Page number (starts at 1, up to 1000000). Default: 1. | mín. 1; máx. 1000000; defecto 1; ejemplo: 1 |
| query | `limit` | `integer` | No | Results per page. Default: 10, maximum: 100. | mín. 1; máx. 100; defecto 10; ejemplo: 10 |
| query | `search` | `string` | No | E.g. client. Text contained in the code, the name or the description (case-insensitive; % and _ are matched literally) | longitud máx. 100 |
| query | `category` | `string: client, operations, force_majeure` | No | Only reasons in this category. Omit for all |  |
| query | `active` | `boolean` | No | true = only enabled reasons, false = only disabled ones. Omit (or send it empty) for all. Any other value is rejected with 400 |  |
| query | `sortBy` | `string: code, name, category, createdAt` | No | Field to sort by. Default: name | defecto name |
| query | `sortOrder` | `string: asc, desc` | No | Sort direction. Default: asc | defecto asc |

**Respuesta correcta:** `200` → `FindAllRescheduleReasonsResponseDto`.

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `data` | `RescheduleReasonDto[]` | Sí | Items on the current page |
| `data[].id` | `integer` | Sí | Reschedule reason ID. Use it as `rescheduleReasonId` when recording a dispatch reschedule/reassignment; ejemplo: 1 |
| `data[].code` | `string` | Sí | Unique reference code. Must not belong to another reason; ejemplo: "RES-CLI-EXP" |
| `data[].name` | `string` | Sí | Display name shown in the reschedule/reassignment modal of the operations panel. Must not belong to another reason; ejemplo: "Solicitud expresa del cliente" |
| `data[].description` | `string / null` | Sí | Optional free-text detail. null when none was given; ejemplo: "El cliente pidió mover la entrega a la tarde" |
| `data[].category` | `string: client, operations, force_majeure` | Sí | Who/what the delay is attributed to. client: the reschedule does not count against the team's internal punctuality metric · operations: an internal operational cause (e.g. route replanning) · force_majeure: outside anyone's control (e.g. a mechanical breakdown, weather); ejemplo: "client" |
| `data[].active` | `boolean` | Sí | false = disabled: cannot be assigned to new reschedules/reassignments. Reschedules already logged with it are not affected; ejemplo: true |
| `data[].affectsSla` | `boolean` | Sí | Computed, read-only: true only when `category` is `client` (RF-A33, Escenario 2) — a reschedule using this reason does not count against the team's internal punctuality metric. Not accepted on create/update, only category is; ejemplo: false; nota: el ejemplo `false` para `category=client` contradice el controlador, que devuelve `true` |
| `data[].createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC); ejemplo: "2024-01-01T00:00:00.000Z" |
| `meta` | `MetadataDto` | Sí | Pagination metadata |
| `meta.page` | `integer` | Sí | Current page number; ejemplo: 1 |
| `meta.limit` | `integer` | Sí | Items per page; ejemplo: 10 |
| `meta.pages` | `integer` | Sí | Total number of pages (0 when there are no results); ejemplo: 5 |
| `meta.total` | `integer` | Sí | Total number of records matching the filters; ejemplo: 42 |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "data": [
    {
      "id": 1,
      "code": "RES-CLI-EXP",
      "name": "Solicitud expresa del cliente",
      "description": "El cliente pidió mover la entrega a la tarde",
      "category": "client",
      "active": true,
      "affectsSla": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "pages": 5,
    "total": 42
  }
}
```

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | The 'sortBy' parameter must be one of: code, name, category, createdAt. |
| `401` | `INVALID_TOKEN` | Invalid or expired token. |
| `403` | `INSUFFICIENT_PERMISSIONS` | You do not have permission to perform this action. |

#### POST /api/reschedule-reasons

**Función.** Creates a reschedule reason with its `code`, its `name`, its `category` (client, operations or force_majeure — required, the coordinator must classify it explicitly) and an optional `description`. The new reason is always created enabled (`active: true`), so `active` is not accepted here. 409 when the code or the name is taken. Requires coordinator or supervisor role, or root.

**Acceso:** JWT Bearer; roles: coordinator, supervisor (o root).

**Cuerpo de solicitud:** `application/json`; esquema [`CreateRescheduleReasonDto`](#createreschedulereasondto).

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `code` | `string` | Sí | Unique reference code. Trimmed and uppercased before validation; must not belong to another reason; longitud máx. 30; ejemplo: "RES-CLI-EXP" |
| `name` | `string` | Sí | Display name. Trimmed; must not belong to another reason; longitud máx. 150; ejemplo: "Solicitud expresa del cliente" |
| `description` | `string` | No | Optional free-text detail; longitud máx. 255; ejemplo: "El cliente pidió mover la entrega a la tarde" |
| `category` | `string: client, operations, force_majeure` | Sí | Who/what the delay is attributed to. Required — the coordinator must classify it explicitly; ejemplo: "client" |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "code": "RES-CLI-EXP",
  "name": "Solicitud expresa del cliente",
  "category": "client"
}
```

**Respuesta correcta:** `201` → `RescheduleReasonDto`.

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `id` | `integer` | Sí | Reschedule reason ID. Use it as `rescheduleReasonId` when recording a dispatch reschedule/reassignment; ejemplo: 1 |
| `code` | `string` | Sí | Unique reference code. Must not belong to another reason; ejemplo: "RES-CLI-EXP" |
| `name` | `string` | Sí | Display name shown in the reschedule/reassignment modal of the operations panel. Must not belong to another reason; ejemplo: "Solicitud expresa del cliente" |
| `description` | `string / null` | Sí | Optional free-text detail. null when none was given; ejemplo: "El cliente pidió mover la entrega a la tarde" |
| `category` | `string: client, operations, force_majeure` | Sí | Who/what the delay is attributed to. client: the reschedule does not count against the team's internal punctuality metric · operations: an internal operational cause (e.g. route replanning) · force_majeure: outside anyone's control (e.g. a mechanical breakdown, weather); ejemplo: "client" |
| `active` | `boolean` | Sí | false = disabled: cannot be assigned to new reschedules/reassignments. Reschedules already logged with it are not affected; ejemplo: true |
| `affectsSla` | `boolean` | Sí | Computed, read-only: true only when `category` is `client` (RF-A33, Escenario 2) — a reschedule using this reason does not count against the team's internal punctuality metric. Not accepted on create/update, only category is; ejemplo: false; nota: el ejemplo `false` para `category=client` contradice el controlador, que devuelve `true` |
| `createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC); ejemplo: "2024-01-01T00:00:00.000Z" |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "id": 1,
  "code": "RES-CLI-EXP",
  "name": "Solicitud expresa del cliente",
  "description": "El cliente pidió mover la entrega a la tarde",
  "category": "client",
  "active": true,
  "affectsSla": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | Code is required.; Name is required.; Category must be one of: client, operations, force_majeure. |
| `401` | `INVALID_TOKEN` | Invalid or expired token. |
| `403` | `INSUFFICIENT_PERMISSIONS` | You do not have permission to perform this action. |
| `409` | `RESCHEDULE_REASON_CODE_ALREADY_EXISTS` | A reschedule reason with this name or code already exists. |

#### GET /api/reschedule-reasons/{id}

**Función.** Returns a single reschedule reason by its numeric ID, whether it is enabled or disabled. A deleted reason is not found. Requires coordinator or supervisor role, or root.

**Acceso:** JWT Bearer; roles: coordinator, supervisor (o root).

**Parámetros:**

| Lugar | Nombre | Tipo | Obligatorio | Descripción | Restricciones / ejemplo |
| --- | --- | --- | --- | --- | --- |
| path | `id` | `integer` | Sí | Reschedule reason ID (a whole number from 1 to 2147483647, as returned by the list endpoint). Anything else is a 400. | ejemplo: 1 |

**Respuesta correcta:** `200` → `RescheduleReasonDto`.

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `id` | `integer` | Sí | Reschedule reason ID. Use it as `rescheduleReasonId` when recording a dispatch reschedule/reassignment; ejemplo: 1 |
| `code` | `string` | Sí | Unique reference code. Must not belong to another reason; ejemplo: "RES-CLI-EXP" |
| `name` | `string` | Sí | Display name shown in the reschedule/reassignment modal of the operations panel. Must not belong to another reason; ejemplo: "Solicitud expresa del cliente" |
| `description` | `string / null` | Sí | Optional free-text detail. null when none was given; ejemplo: "El cliente pidió mover la entrega a la tarde" |
| `category` | `string: client, operations, force_majeure` | Sí | Who/what the delay is attributed to. client: the reschedule does not count against the team's internal punctuality metric · operations: an internal operational cause (e.g. route replanning) · force_majeure: outside anyone's control (e.g. a mechanical breakdown, weather); ejemplo: "client" |
| `active` | `boolean` | Sí | false = disabled: cannot be assigned to new reschedules/reassignments. Reschedules already logged with it are not affected; ejemplo: true |
| `affectsSla` | `boolean` | Sí | Computed, read-only: true only when `category` is `client` (RF-A33, Escenario 2) — a reschedule using this reason does not count against the team's internal punctuality metric. Not accepted on create/update, only category is; ejemplo: false; nota: el ejemplo `false` para `category=client` contradice el controlador, que devuelve `true` |
| `createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC); ejemplo: "2024-01-01T00:00:00.000Z" |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "id": 1,
  "code": "RES-CLI-EXP",
  "name": "Solicitud expresa del cliente",
  "description": "El cliente pidió mover la entrega a la tarde",
  "category": "client",
  "active": true,
  "affectsSla": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | Validation failed (numeric string is expected) |
| `401` | `INVALID_TOKEN` | Invalid or expired token. |
| `403` | `INSUFFICIENT_PERMISSIONS` | You do not have permission to perform this action. |
| `404` | `RESCHEDULE_REASON_NOT_FOUND` | Reschedule reason not found. |

#### PUT /api/reschedule-reasons/{id}

**Función.** Partially updates a reschedule reason: only the fields sent are changed, and an empty body changes nothing. `null` is rejected on every field except `description`, where it (or an empty text) clears the value. If any field is invalid nothing is saved. `active: false` disables the reason (it stops being offered for new reschedules/reassignments, but ones already logged with it are not affected) and `active: true` enables it again; there is no delete endpoint for this catalog. 409 when a changed code or name is taken. Requires coordinator or supervisor role, or root.

**Acceso:** JWT Bearer; roles: coordinator, supervisor (o root).

**Parámetros:**

| Lugar | Nombre | Tipo | Obligatorio | Descripción | Restricciones / ejemplo |
| --- | --- | --- | --- | --- | --- |
| path | `id` | `integer` | Sí | Reschedule reason ID (a whole number from 1 to 2147483647, as returned by the list endpoint). Anything else is a 400. | ejemplo: 1 |

**Cuerpo de solicitud:** `application/json`; esquema [`UpdateRescheduleReasonDto`](#updatereschedulereasondto).

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `code` | `string` | No | New reference code. Trimmed and uppercased before validation; must not belong to another reason. null is rejected; longitud máx. 30; ejemplo: "RES-CLI-EXP" |
| `name` | `string` | No | New display name. Must not belong to another reason. null is rejected; longitud máx. 150; ejemplo: "Solicitud expresa del cliente" |
| `description` | `string / null` | No | New description. null or empty text clears it; longitud máx. 255; ejemplo: "El cliente pidió mover la entrega a la tarde" |
| `category` | `string: client, operations, force_majeure` | No | New category. null is rejected; ejemplo: "operations" |
| `active` | `boolean` | No | false disables the reason for new reschedules/reassignments; ones already logged with it are not affected. true enables it again. null is rejected; ejemplo: false |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "code": "RES-CLI-EXP",
  "name": "Solicitud expresa del cliente",
  "description": "El cliente pidió mover la entrega a la tarde",
  "category": "operations",
  "active": false
}
```

**Respuesta correcta:** `200` → `RescheduleReasonDto`.

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `id` | `integer` | Sí | Reschedule reason ID. Use it as `rescheduleReasonId` when recording a dispatch reschedule/reassignment; ejemplo: 1 |
| `code` | `string` | Sí | Unique reference code. Must not belong to another reason; ejemplo: "RES-CLI-EXP" |
| `name` | `string` | Sí | Display name shown in the reschedule/reassignment modal of the operations panel. Must not belong to another reason; ejemplo: "Solicitud expresa del cliente" |
| `description` | `string / null` | Sí | Optional free-text detail. null when none was given; ejemplo: "El cliente pidió mover la entrega a la tarde" |
| `category` | `string: client, operations, force_majeure` | Sí | Who/what the delay is attributed to. client: the reschedule does not count against the team's internal punctuality metric · operations: an internal operational cause (e.g. route replanning) · force_majeure: outside anyone's control (e.g. a mechanical breakdown, weather); ejemplo: "client" |
| `active` | `boolean` | Sí | false = disabled: cannot be assigned to new reschedules/reassignments. Reschedules already logged with it are not affected; ejemplo: true |
| `affectsSla` | `boolean` | Sí | Computed, read-only: true only when `category` is `client` (RF-A33, Escenario 2) — a reschedule using this reason does not count against the team's internal punctuality metric. Not accepted on create/update, only category is; ejemplo: false; nota: el ejemplo `false` para `category=client` contradice el controlador, que devuelve `true` |
| `createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC); ejemplo: "2024-01-01T00:00:00.000Z" |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "id": 1,
  "code": "RES-CLI-EXP",
  "name": "Solicitud expresa del cliente",
  "description": "El cliente pidió mover la entrega a la tarde",
  "category": "client",
  "active": true,
  "affectsSla": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | Name must not be empty. |
| `400` | `Bad Request` | Validation failed (numeric string is expected) |
| `401` | `INVALID_TOKEN` | Invalid or expired token. |
| `403` | `INSUFFICIENT_PERMISSIONS` | You do not have permission to perform this action. |
| `404` | `RESCHEDULE_REASON_NOT_FOUND` | Reschedule reason not found. |
| `409` | `RESCHEDULE_REASON_CODE_ALREADY_EXISTS` | A reschedule reason with this name or code already exists. |

### Service Levels

#### GET /api/service-levels

**Función.** Returns a paginated list (10 per page by default, up to 100) of the service levels that have not been deleted, ordered by the priority hierarchy: priority 1 first, then the tighter target time, then ID. The order is fixed. `search` matches the name or the description; `active` narrows to enabled or disabled levels, and it is kept when a search is also given. Requires coordinator role or root.

**Acceso:** JWT Bearer; roles: coordinator (o root).

**Parámetros:**

| Lugar | Nombre | Tipo | Obligatorio | Descripción | Restricciones / ejemplo |
| --- | --- | --- | --- | --- | --- |
| query | `page` | `integer` | No | Page number (starts at 1, up to 1000000). Default: 1. | mín. 1; máx. 1000000; defecto 1; ejemplo: 1 |
| query | `limit` | `integer` | No | Results per page. Default: 10, maximum: 100. | mín. 1; máx. 100; defecto 10; ejemplo: 10 |
| query | `search` | `string` | No | E.g. express. Text contained in the name or the description (case-insensitive; % and _ are matched literally). Combined with `active`, both apply | longitud máx. 100 |
| query | `active` | `boolean` | No | true = only enabled levels, false = only disabled ones. Omit (or send it empty) for all. Any other value is rejected with 400 |  |

**Respuesta correcta:** `200` → `FindAllServiceLevelsResponseDto`.

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `data` | `ServiceLevelDto[]` | Sí | Items on the current page |
| `data[].id` | `integer` | Sí | Service level ID; ejemplo: 1 |
| `data[].name` | `string` | Sí | Unique name among the levels that have not been deleted; ejemplo: "Express 2 Horas" |
| `data[].description` | `string / null` | Sí | Free-text description. null when none was given; ejemplo: "Entrega prioritaria en 2 horas" |
| `data[].targetTimeMin` | `integer` | Sí | Target delivery time (SLA), in minutes; ejemplo: 120 |
| `data[].priorityLevel` | `integer` | Sí | Priority hierarchy: 1 is the highest. Different levels may share a value; the list breaks ties by target time; ejemplo: 1 |
| `data[].active` | `boolean` | Sí | false = disabled: cannot be assigned to new orders; ejemplo: true |
| `data[].createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC); ejemplo: "2024-01-01T00:00:00.000Z" |
| `meta` | `MetadataDto` | Sí | Pagination metadata |
| `meta.page` | `integer` | Sí | Current page number; ejemplo: 1 |
| `meta.limit` | `integer` | Sí | Items per page; ejemplo: 10 |
| `meta.pages` | `integer` | Sí | Total number of pages (0 when there are no results); ejemplo: 5 |
| `meta.total` | `integer` | Sí | Total number of records matching the filters; ejemplo: 42 |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "data": [
    {
      "id": 1,
      "name": "Express 2 Horas",
      "description": "Entrega prioritaria en 2 horas",
      "targetTimeMin": 120,
      "priorityLevel": 1,
      "active": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "pages": 5,
    "total": 42
  }
}
```

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | The 'limit' parameter must be <= 100. |
| `401` | `INVALID_TOKEN` | Invalid or expired token. |
| `403` | `INSUFFICIENT_PERMISSIONS` | You do not have permission to perform this action. |

#### POST /api/service-levels

**Función.** Creates a service level with its target time (SLA: an integer number of minutes, from 15 to 43200) and its place in the priority hierarchy (1 = highest; levels may share a value). The name is required, is trimmed, and must not be used by another level. The description is optional. The new level is always created enabled (`active: true`), so `active` is not accepted here. 400 when a value is invalid (a target time under 15 minutes is rejected and nothing is saved); 409 when the name is taken. Requires coordinator role or root.

**Acceso:** JWT Bearer; roles: coordinator (o root).

**Cuerpo de solicitud:** `application/json`; esquema [`CreateServiceLevelDto`](#createserviceleveldto).

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `name` | `string` | Sí | Unique name (leading/trailing spaces are trimmed; uniqueness is case-sensitive). Required; longitud máx. 50; ejemplo: "Express 2 Horas" |
| `description` | `string` | No | Optional free-text description. Empty or blank text is stored as null; longitud máx. 255; ejemplo: "Entrega prioritaria en 2 horas" |
| `targetTimeMin` | `integer` | Sí | Target delivery time (SLA) in minutes. An integer from 15 (a shorter time is not a realistic commitment, RF-A31) to 43200 (30 days); mín. 15; máx. 43200; ejemplo: 120 |
| `priorityLevel` | `integer` | Sí | Priority hierarchy: 1 is the highest. Levels may share a value; the list breaks ties by target time; mín. 1; máx. 32767; ejemplo: 1 |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "name": "Express 2 Horas",
  "targetTimeMin": 120,
  "priorityLevel": 1
}
```

**Respuesta correcta:** `201` → `ServiceLevelDto`.

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `id` | `integer` | Sí | Service level ID; ejemplo: 1 |
| `name` | `string` | Sí | Unique name among the levels that have not been deleted; ejemplo: "Express 2 Horas" |
| `description` | `string / null` | Sí | Free-text description. null when none was given; ejemplo: "Entrega prioritaria en 2 horas" |
| `targetTimeMin` | `integer` | Sí | Target delivery time (SLA), in minutes; ejemplo: 120 |
| `priorityLevel` | `integer` | Sí | Priority hierarchy: 1 is the highest. Different levels may share a value; the list breaks ties by target time; ejemplo: 1 |
| `active` | `boolean` | Sí | false = disabled: cannot be assigned to new orders; ejemplo: true |
| `createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC); ejemplo: "2024-01-01T00:00:00.000Z" |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "id": 1,
  "name": "Express 2 Horas",
  "description": "Entrega prioritaria en 2 horas",
  "targetTimeMin": 120,
  "priorityLevel": 1,
  "active": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | Name is required.; Target time must be at least 15 minutes. |
| `401` | `INVALID_TOKEN` | Invalid or expired token. |
| `403` | `INSUFFICIENT_PERMISSIONS` | You do not have permission to perform this action. |
| `409` | `SERVICE_LEVEL_NAME_ALREADY_EXISTS` | A service level with this name already exists. |

#### GET /api/service-levels/{id}

**Función.** Returns a single service level by its numeric ID, whether it is enabled or disabled. A deleted level is not found. Requires coordinator role or root.

**Acceso:** JWT Bearer; roles: coordinator (o root).

**Parámetros:**

| Lugar | Nombre | Tipo | Obligatorio | Descripción | Restricciones / ejemplo |
| --- | --- | --- | --- | --- | --- |
| path | `id` | `integer` | Sí | Service level ID (a whole number from 1 to 2147483647, as returned by the list endpoint). Anything else is a 400. | ejemplo: 1 |

**Respuesta correcta:** `200` → `ServiceLevelDto`.

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `id` | `integer` | Sí | Service level ID; ejemplo: 1 |
| `name` | `string` | Sí | Unique name among the levels that have not been deleted; ejemplo: "Express 2 Horas" |
| `description` | `string / null` | Sí | Free-text description. null when none was given; ejemplo: "Entrega prioritaria en 2 horas" |
| `targetTimeMin` | `integer` | Sí | Target delivery time (SLA), in minutes; ejemplo: 120 |
| `priorityLevel` | `integer` | Sí | Priority hierarchy: 1 is the highest. Different levels may share a value; the list breaks ties by target time; ejemplo: 1 |
| `active` | `boolean` | Sí | false = disabled: cannot be assigned to new orders; ejemplo: true |
| `createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC); ejemplo: "2024-01-01T00:00:00.000Z" |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "id": 1,
  "name": "Express 2 Horas",
  "description": "Entrega prioritaria en 2 horas",
  "targetTimeMin": 120,
  "priorityLevel": 1,
  "active": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | Validation failed (numeric string is expected) |
| `401` | `INVALID_TOKEN` | Invalid or expired token. |
| `403` | `INSUFFICIENT_PERMISSIONS` | You do not have permission to perform this action. |
| `404` | `SERVICE_LEVEL_NOT_FOUND` | Service level not found. |

#### PUT /api/service-levels/{id}

**Función.** Partially updates a service level: only the fields sent are changed, and an empty body changes nothing. The same rules as on creation apply to each field; `null` is rejected on every field except `description`, where it (or an empty text) clears the value. If any field is invalid nothing is saved. `active: false` disables the level (it can no longer be assigned to new orders; dispatches already using it are not affected) and `active: true` enables it again — this is how a level with dispatches in progress is taken out of use, since it cannot be deleted. Requires coordinator role or root.

**Acceso:** JWT Bearer; roles: coordinator (o root).

**Parámetros:**

| Lugar | Nombre | Tipo | Obligatorio | Descripción | Restricciones / ejemplo |
| --- | --- | --- | --- | --- | --- |
| path | `id` | `integer` | Sí | Service level ID (a whole number from 1 to 2147483647, as returned by the list endpoint). Anything else is a 400. | ejemplo: 1 |

**Cuerpo de solicitud:** `application/json`; esquema [`UpdateServiceLevelDto`](#updateserviceleveldto).

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `name` | `string` | No | New name (trimmed). Must not be used by another level. null is rejected; longitud máx. 50; ejemplo: "Express 2 Horas" |
| `description` | `string / null` | No | New description. null or empty text clears it; longitud máx. 255; ejemplo: "Entrega prioritaria en 2 horas" |
| `targetTimeMin` | `integer` | No | Target delivery time in minutes: an integer from 15 to 43200. null is rejected; mín. 15; máx. 43200; ejemplo: 120 |
| `priorityLevel` | `integer` | No | Priority hierarchy: 1 is the highest. null is rejected; mín. 1; máx. 32767; ejemplo: 1 |
| `active` | `boolean` | No | false disables the level for new orders; dispatches that already use it are not affected. true enables it again. null is rejected; ejemplo: false |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "name": "Express 2 Horas"
}
```

**Respuesta correcta:** `200` → `ServiceLevelDto`.

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `id` | `integer` | Sí | Service level ID; ejemplo: 1 |
| `name` | `string` | Sí | Unique name among the levels that have not been deleted; ejemplo: "Express 2 Horas" |
| `description` | `string / null` | Sí | Free-text description. null when none was given; ejemplo: "Entrega prioritaria en 2 horas" |
| `targetTimeMin` | `integer` | Sí | Target delivery time (SLA), in minutes; ejemplo: 120 |
| `priorityLevel` | `integer` | Sí | Priority hierarchy: 1 is the highest. Different levels may share a value; the list breaks ties by target time; ejemplo: 1 |
| `active` | `boolean` | Sí | false = disabled: cannot be assigned to new orders; ejemplo: true |
| `createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC); ejemplo: "2024-01-01T00:00:00.000Z" |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "id": 1,
  "name": "Express 2 Horas",
  "description": "Entrega prioritaria en 2 horas",
  "targetTimeMin": 120,
  "priorityLevel": 1,
  "active": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | Target time must be at least 15 minutes. |
| `400` | `Bad Request` | Validation failed (numeric string is expected) |
| `401` | `INVALID_TOKEN` | Invalid or expired token. |
| `403` | `INSUFFICIENT_PERMISSIONS` | You do not have permission to perform this action. |
| `404` | `SERVICE_LEVEL_NOT_FOUND` | Service level not found. |
| `409` | `SERVICE_LEVEL_NAME_ALREADY_EXISTS` | A service level with this name already exists. |

#### DELETE /api/service-levels/{id}

**Función.** Deletes the level (soft delete: dispatches that were already finished keep pointing at it, and its name can be reused afterwards). Rejected with 409 `SERVICE_LEVEL_IN_USE` while any dispatch that is pending or in transit still uses it — disable it instead with `PUT active: false`. Dispatches that are delivered, returned or not delivered do not block the deletion. Requires coordinator role or root.

**Acceso:** JWT Bearer; roles: coordinator (o root).

**Parámetros:**

| Lugar | Nombre | Tipo | Obligatorio | Descripción | Restricciones / ejemplo |
| --- | --- | --- | --- | --- | --- |
| path | `id` | `integer` | Sí | Service level ID (a whole number from 1 to 2147483647, as returned by the list endpoint). Anything else is a 400. | ejemplo: 1 |

**Respuesta correcta:** `204` → sin cuerpo (Service level deleted.).

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | Validation failed (numeric string is expected) |
| `401` | `INVALID_TOKEN` | Invalid or expired token. |
| `403` | `INSUFFICIENT_PERMISSIONS` | You do not have permission to perform this action. |
| `404` | `SERVICE_LEVEL_NOT_FOUND` | Service level not found. |
| `409` | `SERVICE_LEVEL_IN_USE` | This service level has active dispatches and cannot be deleted. Disable it instead (active: false) so it only applies to future orders. |

### Vehicles

#### GET /api/vehicles

**Función.** Returns a paginated list of vehicles (10 per page by default, up to 100). `search` matches the plate, model or type (case-insensitive); `vehicleStatusId` keeps only vehicles in that operational status (1 = active, 2 = maintenance, 3 = out_of_service). Requires supervisor or coordinator role, or root.

**Acceso:** JWT Bearer; roles: supervisor, coordinator (o root).

**Parámetros:**

| Lugar | Nombre | Tipo | Obligatorio | Descripción | Restricciones / ejemplo |
| --- | --- | --- | --- | --- | --- |
| query | `page` | `integer` | No | Page number (starts at 1, up to 1000000). Default: 1. | mín. 1; máx. 1000000; defecto 1; ejemplo: 1 |
| query | `limit` | `integer` | No | Results per page. Default: 10, maximum: 100. | mín. 1; máx. 100; defecto 10; ejemplo: 10 |
| query | `search` | `string` | No | E.g. ABC. Text contained in the plate, model or type (case-insensitive) |  |
| query | `vehicleStatusId` | `integer` | No | Only vehicles in this operational status: 1 = active, 2 = maintenance, 3 = out_of_service |  |

**Respuesta correcta:** `200` → `FindAllVehiclesResponseDto`.

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `data` | `VehicleDto[]` | Sí | Items on the current page |
| `data[].id` | `integer` | Sí | Vehicle ID; ejemplo: 1 |
| `data[].type` | `string` | Sí | Kind of vehicle; ejemplo: "camioneta" |
| `data[].model` | `string` | Sí | Make and model; ejemplo: "Toyota Hilux 2022" |
| `data[].plate` | `string` | Sí | License plate, uppercase, unique among vehicles; ejemplo: "1234-ABC" |
| `data[].capacityKg` | `number (double)` | Sí | Maximum load weight, in kg; ejemplo: 1200.5 |
| `data[].capacityM3` | `number (double)` | Sí | Maximum load volume, in m3; ejemplo: 8.5 |
| `data[].vehicleStatus` | `VehicleStatusDto` | Sí | Current operational status |
| `data[].vehicleStatus.id` | `integer` | Sí | Status ID: 1 = active, 2 = maintenance, 3 = out_of_service. Use it as `vehicleStatusId`; ejemplo: 1 |
| `data[].vehicleStatus.name` | `string: active, maintenance, out_of_service` | Sí | active = available for route assignment · maintenance = temporarily unavailable · out_of_service = withdrawn; ejemplo: "active" |
| `data[].createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC); ejemplo: "2024-01-01T00:00:00.000Z" |
| `meta` | `MetadataDto` | Sí | Pagination metadata |
| `meta.page` | `integer` | Sí | Current page number; ejemplo: 1 |
| `meta.limit` | `integer` | Sí | Items per page; ejemplo: 10 |
| `meta.pages` | `integer` | Sí | Total number of pages (0 when there are no results); ejemplo: 5 |
| `meta.total` | `integer` | Sí | Total number of records matching the filters; ejemplo: 42 |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "data": [
    {
      "id": 1,
      "type": "camioneta",
      "model": "Toyota Hilux 2022",
      "plate": "1234-ABC",
      "capacityKg": 1200.5,
      "capacityM3": 8.5,
      "vehicleStatus": {
        "id": 1,
        "name": "active"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "pages": 5,
    "total": 42
  }
}
```

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | The 'limit' parameter must be <= 100. |
| `401` | `INVALID_TOKEN` | Invalid or expired token. |
| `403` | `INSUFFICIENT_PERMISSIONS` | You do not have permission to perform this action. |

#### POST /api/vehicles

**Función.** Registers a vehicle. All five fields are required: `type`, `model`, `plate`, `capacityKg` and `capacityM3` (both greater than zero, up to 2 decimals). The plate is trimmed and uppercased, and must not belong to another vehicle (409 VEHICLE_PLATE_ALREADY_EXISTS). The vehicle starts in the `active` status, ready for route assignment. Requires supervisor or coordinator role, or root.

**Acceso:** JWT Bearer; roles: supervisor, coordinator (o root).

**Cuerpo de solicitud:** `application/json`; esquema [`CreateVehicleDto`](#createvehicledto).

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `type` | `string` | Sí | Kind of vehicle, free text (moto, camioneta, camión, etc.); longitud máx. 50; ejemplo: "camioneta" |
| `model` | `string` | Sí | Make and model, free text; longitud máx. 100; ejemplo: "Toyota Hilux 2022" |
| `plate` | `string` | Sí | License plate. Trimmed and converted to uppercase; must not belong to another vehicle; longitud máx. 15; ejemplo: "1234-ABC" |
| `capacityKg` | `number (double)` | Sí | Maximum load weight in kg (greater than zero, up to 2 decimals); mín. 0; máx. 99999999.99; ejemplo: 1200.5 |
| `capacityM3` | `number (double)` | Sí | Maximum load volume in m3 (greater than zero, up to 2 decimals); mín. 0; máx. 99999999.99; ejemplo: 8.5 |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "type": "camioneta",
  "model": "Toyota Hilux 2022",
  "plate": "1234-ABC",
  "capacityKg": 1200.5,
  "capacityM3": 8.5
}
```

**Respuesta correcta:** `201` → `VehicleDto`.

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `id` | `integer` | Sí | Vehicle ID; ejemplo: 1 |
| `type` | `string` | Sí | Kind of vehicle; ejemplo: "camioneta" |
| `model` | `string` | Sí | Make and model; ejemplo: "Toyota Hilux 2022" |
| `plate` | `string` | Sí | License plate, uppercase, unique among vehicles; ejemplo: "1234-ABC" |
| `capacityKg` | `number (double)` | Sí | Maximum load weight, in kg; ejemplo: 1200.5 |
| `capacityM3` | `number (double)` | Sí | Maximum load volume, in m3; ejemplo: 8.5 |
| `vehicleStatus` | `VehicleStatusDto` | Sí | Current operational status |
| `vehicleStatus.id` | `integer` | Sí | Status ID: 1 = active, 2 = maintenance, 3 = out_of_service. Use it as `vehicleStatusId`; ejemplo: 1 |
| `vehicleStatus.name` | `string: active, maintenance, out_of_service` | Sí | active = available for route assignment · maintenance = temporarily unavailable · out_of_service = withdrawn; ejemplo: "active" |
| `createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC); ejemplo: "2024-01-01T00:00:00.000Z" |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "id": 1,
  "type": "camioneta",
  "model": "Toyota Hilux 2022",
  "plate": "1234-ABC",
  "capacityKg": 1200.5,
  "capacityM3": 8.5,
  "vehicleStatus": {
    "id": 1,
    "name": "active"
  },
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | Plate is required.; Capacity in kg must be greater than zero. |
| `401` | `INVALID_TOKEN` | Invalid or expired token. |
| `403` | `INSUFFICIENT_PERMISSIONS` | You do not have permission to perform this action. |
| `409` | `VEHICLE_PLATE_ALREADY_EXISTS` | A vehicle with this plate already exists. |

#### GET /api/vehicles/{id}

**Función.** Returns one vehicle by ID, with its operational status. A removed vehicle is not found. Requires supervisor or coordinator role, or root.

**Acceso:** JWT Bearer; roles: supervisor, coordinator (o root).

**Parámetros:**

| Lugar | Nombre | Tipo | Obligatorio | Descripción | Restricciones / ejemplo |
| --- | --- | --- | --- | --- | --- |
| path | `id` | `integer` | Sí | Vehicle ID (a whole number from 1 to 2147483647, as returned by the list endpoint). Anything else is a 400. | ejemplo: 1 |

**Respuesta correcta:** `200` → `VehicleDto`.

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `id` | `integer` | Sí | Vehicle ID; ejemplo: 1 |
| `type` | `string` | Sí | Kind of vehicle; ejemplo: "camioneta" |
| `model` | `string` | Sí | Make and model; ejemplo: "Toyota Hilux 2022" |
| `plate` | `string` | Sí | License plate, uppercase, unique among vehicles; ejemplo: "1234-ABC" |
| `capacityKg` | `number (double)` | Sí | Maximum load weight, in kg; ejemplo: 1200.5 |
| `capacityM3` | `number (double)` | Sí | Maximum load volume, in m3; ejemplo: 8.5 |
| `vehicleStatus` | `VehicleStatusDto` | Sí | Current operational status |
| `vehicleStatus.id` | `integer` | Sí | Status ID: 1 = active, 2 = maintenance, 3 = out_of_service. Use it as `vehicleStatusId`; ejemplo: 1 |
| `vehicleStatus.name` | `string: active, maintenance, out_of_service` | Sí | active = available for route assignment · maintenance = temporarily unavailable · out_of_service = withdrawn; ejemplo: "active" |
| `createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC); ejemplo: "2024-01-01T00:00:00.000Z" |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "id": 1,
  "type": "camioneta",
  "model": "Toyota Hilux 2022",
  "plate": "1234-ABC",
  "capacityKg": 1200.5,
  "capacityM3": 8.5,
  "vehicleStatus": {
    "id": 1,
    "name": "active"
  },
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | Validation failed (numeric string is expected) |
| `401` | `INVALID_TOKEN` | Invalid or expired token. |
| `403` | `INSUFFICIENT_PERMISSIONS` | You do not have permission to perform this action. |
| `404` | `VEHICLE_NOT_FOUND` | Vehicle not found. |

#### PUT /api/vehicles/{id}

**Función.** Partially updates a vehicle: only the fields sent are changed, and `null` is rejected. This is also how the operational status is changed (`vehicleStatusId`: 1 = active, 2 = maintenance, 3 = out_of_service; an unknown ID is a 400 INVALID_VEHICLE_STATUS). A changed plate must not belong to another vehicle (409). Requires supervisor or coordinator role, or root.

**Acceso:** JWT Bearer; roles: supervisor, coordinator (o root).

**Parámetros:**

| Lugar | Nombre | Tipo | Obligatorio | Descripción | Restricciones / ejemplo |
| --- | --- | --- | --- | --- | --- |
| path | `id` | `integer` | Sí | Vehicle ID (a whole number from 1 to 2147483647, as returned by the list endpoint). Anything else is a 400. | ejemplo: 1 |

**Cuerpo de solicitud:** `application/json`; esquema [`UpdateVehicleDto`](#updatevehicledto).

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `type` | `string` | No | New vehicle type. null or empty is rejected; longitud máx. 50; ejemplo: "camioneta" |
| `model` | `string` | No | New make and model. null or empty is rejected; longitud máx. 100; ejemplo: "Toyota Hilux 2022" |
| `plate` | `string` | No | New plate, trimmed and uppercased. Must not belong to another vehicle. null or empty is rejected; longitud máx. 15; ejemplo: "1234-ABC" |
| `capacityKg` | `number (double)` | No | New maximum load weight in kg (greater than zero, up to 2 decimals). null is rejected; mín. 0; máx. 99999999.99; ejemplo: 1200.5 |
| `capacityM3` | `number (double)` | No | New maximum load volume in m3 (greater than zero, up to 2 decimals). null is rejected; mín. 0; máx. 99999999.99; ejemplo: 8.5 |
| `vehicleStatusId` | `integer` | No | New operational status: 1 = active (available for routes), 2 = maintenance, 3 = out_of_service. Any other ID is a 400 INVALID_VEHICLE_STATUS. null is rejected; ejemplo: 2 |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "type": "camioneta"
}
```

**Respuesta correcta:** `200` → `VehicleDto`.

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `id` | `integer` | Sí | Vehicle ID; ejemplo: 1 |
| `type` | `string` | Sí | Kind of vehicle; ejemplo: "camioneta" |
| `model` | `string` | Sí | Make and model; ejemplo: "Toyota Hilux 2022" |
| `plate` | `string` | Sí | License plate, uppercase, unique among vehicles; ejemplo: "1234-ABC" |
| `capacityKg` | `number (double)` | Sí | Maximum load weight, in kg; ejemplo: 1200.5 |
| `capacityM3` | `number (double)` | Sí | Maximum load volume, in m3; ejemplo: 8.5 |
| `vehicleStatus` | `VehicleStatusDto` | Sí | Current operational status |
| `vehicleStatus.id` | `integer` | Sí | Status ID: 1 = active, 2 = maintenance, 3 = out_of_service. Use it as `vehicleStatusId`; ejemplo: 1 |
| `vehicleStatus.name` | `string: active, maintenance, out_of_service` | Sí | active = available for route assignment · maintenance = temporarily unavailable · out_of_service = withdrawn; ejemplo: "active" |
| `createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC); ejemplo: "2024-01-01T00:00:00.000Z" |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "id": 1,
  "type": "camioneta",
  "model": "Toyota Hilux 2022",
  "plate": "1234-ABC",
  "capacityKg": 1200.5,
  "capacityM3": 8.5,
  "vehicleStatus": {
    "id": 1,
    "name": "active"
  },
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | Capacity in m3 must be greater than zero. |
| `400` | `Bad Request` | Validation failed (numeric string is expected) |
| `400` | `INVALID_VEHICLE_STATUS` | The given vehicle status does not exist. |
| `401` | `INVALID_TOKEN` | Invalid or expired token. |
| `403` | `INSUFFICIENT_PERMISSIONS` | You do not have permission to perform this action. |
| `404` | `VEHICLE_NOT_FOUND` | Vehicle not found. |
| `409` | `VEHICLE_PLATE_ALREADY_EXISTS` | A vehicle with this plate already exists. |

#### DELETE /api/vehicles/{id}

**Función.** Soft-deletes the vehicle: historical dispatches and maintenances keep referencing it, but it stops appearing in lists and its plate can be reused. To only take it out of service temporarily, change its status instead (PUT `vehicleStatusId`). Requires supervisor or coordinator role, or root.

**Acceso:** JWT Bearer; roles: supervisor, coordinator (o root).

**Parámetros:**

| Lugar | Nombre | Tipo | Obligatorio | Descripción | Restricciones / ejemplo |
| --- | --- | --- | --- | --- | --- |
| path | `id` | `integer` | Sí | Vehicle ID (a whole number from 1 to 2147483647, as returned by the list endpoint). Anything else is a 400. | ejemplo: 1 |

**Respuesta correcta:** `204` → sin cuerpo (Vehicle removed.).

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | Validation failed (numeric string is expected) |
| `401` | `INVALID_TOKEN` | Invalid or expired token. |
| `403` | `INSUFFICIENT_PERMISSIONS` | You do not have permission to perform this action. |
| `404` | `VEHICLE_NOT_FOUND` | Vehicle not found. |

### Settings

#### GET /api/settings

**Función.** Returns every business-configuration entry (delivery window, password policy, lockout and session rules, OTP, SLA alert threshold). Each has a `key`, a text `value` and a `description` of what it controls. Requires admin role or root.

**Acceso:** JWT Bearer; roles: admin (o root).

**Respuesta correcta:** `200` → `SettingDto[]`.

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `[].key` | `string` | Sí | Unique key of the setting; use it in PUT /settings/{key}; ejemplo: "max_failed_login_attempts" |
| `[].value` | `string` | Sí | Current value, always text (numbers and times are sent as text too, e.g. "5", "08:00"); ejemplo: "5" |
| `[].description` | `string / null` | Sí | What the setting controls; ejemplo: "Failed login attempts before an account is locked" |
| `[].updatedAt` | `string (date-time)` | Sí | Last time the value was changed (UTC); ejemplo: "2024-01-01T00:00:00.000Z" |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
[
  {
    "key": "max_failed_login_attempts",
    "value": "5",
    "description": "Failed login attempts before an account is locked",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `401` | `INVALID_TOKEN` | Invalid or expired token. |
| `403` | `INSUFFICIENT_PERMISSIONS` | You do not have permission to perform this action. |

#### PUT /api/settings/{key}

**Función.** Changes the `value` of the setting identified by `key` (see GET /settings for the valid keys; an unknown key is 404 SETTING_NOT_FOUND). Values are always sent as text (e.g. "5", "08:00"). Each key checks its own range: whole numbers within a sensible minimum and maximum (max_failed_login_attempts 1 to 100, password_min_length 8 to 128, session_inactivity_minutes 1 to 10080, sla_alert_threshold_pct 1 to 100, and so on) and HH:mm for the delivery window; anything else is 400 INVALID_SETTING_VALUE, whose message states the accepted range. The change applies immediately, with no restart. Requires admin role or root.

**Acceso:** JWT Bearer; roles: admin (o root).

**Parámetros:**

| Lugar | Nombre | Tipo | Obligatorio | Descripción | Restricciones / ejemplo |
| --- | --- | --- | --- | --- | --- |
| path | `key` | `string` | Sí | Key of the setting, as listed by GET /settings | ejemplo: "max_failed_login_attempts" |

**Cuerpo de solicitud:** `application/json`; esquema [`UpdateSettingDto`](#updatesettingdto).

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `value` | `string` | Sí | New value, as text, valid for that key (e.g. "5" for a number of minutes, "08:00" for a time; an out-of-range value is 400 INVALID_SETTING_VALUE). Cannot be empty; longitud mín. 1; ejemplo: "5" |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "value": "5"
}
```

**Respuesta correcta:** `200` → `SettingDto`.

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `key` | `string` | Sí | Unique key of the setting; use it in PUT /settings/{key}; ejemplo: "max_failed_login_attempts" |
| `value` | `string` | Sí | Current value, always text (numbers and times are sent as text too, e.g. "5", "08:00"); ejemplo: "5" |
| `description` | `string / null` | Sí | What the setting controls; ejemplo: "Failed login attempts before an account is locked" |
| `updatedAt` | `string (date-time)` | Sí | Last time the value was changed (UTC); ejemplo: "2024-01-01T00:00:00.000Z" |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "key": "max_failed_login_attempts",
  "value": "5",
  "description": "Failed login attempts before an account is locked",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | Value is required. |
| `400` | `INVALID_SETTING_VALUE` | session_inactivity_minutes must be a whole number of minutes from 1 to 10080. |
| `401` | `INVALID_TOKEN` | Invalid or expired token. |
| `403` | `INSUFFICIENT_PERMISSIONS` | You do not have permission to perform this action. |
| `404` | `SETTING_NOT_FOUND` | Setting not found. |

### Vehicle Incident Types

Guía en español: [Incidentes vehiculares y mantenimiento](VEHICLE_INCIDENTS.md).

#### GET /api/vehicle-incident-types

**Función.** Returns a paginated list (10 per page by default, up to 100) of the vehicle incident types that have not been deleted, ordered by name by default (`sortBy`/`sortOrder`; ties broken by id). `search` matches the code or the name; `severity` and `disablesVehicle` narrow the list and are kept when a search is also given. Requires supervisor or coordinator role, or root.

**Acceso:** JWT Bearer; roles: supervisor, coordinator (o root).

**Parámetros:**

| Lugar | Nombre | Tipo | Obligatorio | Descripción | Restricciones / ejemplo |
| --- | --- | --- | --- | --- | --- |
| query | `page` | `integer` | No | Page number (starts at 1, up to 1000000). Default: 1. | mín. 1; máx. 1000000; defecto 1; ejemplo: 1 |
| query | `limit` | `integer` | No | Results per page. Default: 10, maximum: 100. | mín. 1; máx. 100; defecto 10; ejemplo: 10 |
| query | `search` | `string` | No | E.g. frenos. Text contained in the code or the name (case-insensitive; % and _ are matched literally) | longitud máx. 100 |
| query | `severity` | `string: minor, moderate, critical` | No | Only incident types of this severity. Omit for all |  |
| query | `disablesVehicle` | `boolean` | No | true = only types that disable the vehicle, false = only the ones that don't. Omit (or send it empty) for all. Any other value is rejected with 400 |  |
| query | `sortBy` | `string: code, name, severity, createdAt` | No | Field to sort by. Default: name | defecto name |
| query | `sortOrder` | `string: asc, desc` | No | Sort direction. Default: asc | defecto asc |

**Respuesta correcta:** `200` → `FindAllVehicleIncidentTypesResponseDto`.

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `data` | `VehicleIncidentTypeDto[]` | Sí | Items on the current page |
| `data[].id` | `integer` | Sí | Vehicle incident type ID. Use it as `vehicleIncidentTypeId` when registering a maintenance/incident on a vehicle; ejemplo: 1 |
| `data[].code` | `string` | Sí | Unique reference code. Must not belong to another incident type; ejemplo: "MEC-FRE-01" |
| `data[].name` | `string` | Sí | Display name. Must not belong to another incident type; ejemplo: "Falla en sistema de frenos" |
| `data[].severity` | `string: minor, moderate, critical` | Sí | Severity classification, for reporting (e.g. the mobile/web badge color); ejemplo: "critical" |
| `data[].disablesVehicle` | `boolean` | Sí | Whether registering an incident of this type on a vehicle (`POST /vehicle-maintenances`) immediately sets that vehicle to `maintenance` (RF-A34, Escenario 2). Independent of `severity`; ejemplo: true |
| `data[].createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC); ejemplo: "2024-01-01T00:00:00.000Z" |
| `meta` | `MetadataDto` | Sí | Pagination metadata |
| `meta.page` | `integer` | Sí | Current page number; ejemplo: 1 |
| `meta.limit` | `integer` | Sí | Items per page; ejemplo: 10 |
| `meta.pages` | `integer` | Sí | Total number of pages (0 when there are no results); ejemplo: 5 |
| `meta.total` | `integer` | Sí | Total number of records matching the filters; ejemplo: 42 |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "data": [
    {
      "id": 1,
      "code": "MEC-FRE-01",
      "name": "Falla en sistema de frenos",
      "severity": "critical",
      "disablesVehicle": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "pages": 5,
    "total": 42
  }
}
```

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | The 'sortBy' parameter must be one of: code, name, severity, createdAt. |
| `401` | `INVALID_TOKEN` | Invalid or expired token. |
| `403` | `INSUFFICIENT_PERMISSIONS` | You do not have permission to perform this action. |

#### POST /api/vehicle-incident-types

**Función.** Creates a vehicle incident type with its `code`, its `name`, its `severity` (minor, moderate or critical — required, the supervisor must classify it explicitly) and `disablesVehicle` (required, whether registering an incident of this type immediately sets the vehicle to `maintenance` — RF-A34, Escenario 2). 409 when the code or the name is taken. Requires supervisor or coordinator role, or root.

**Acceso:** JWT Bearer; roles: supervisor, coordinator (o root).

**Cuerpo de solicitud:** `application/json`; esquema [`CreateVehicleIncidentTypeDto`](#createvehicleincidenttypedto).

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `code` | `string` | Sí | Unique reference code. Trimmed and uppercased before validation; must not belong to another incident type; longitud máx. 30; ejemplo: "MEC-FRE-01" |
| `name` | `string` | Sí | Display name. Trimmed; must not belong to another incident type; longitud máx. 100; ejemplo: "Falla en sistema de frenos" |
| `severity` | `string: minor, moderate, critical` | Sí | Severity classification. Required — must be classified explicitly; ejemplo: "critical" |
| `disablesVehicle` | `boolean` | Sí | Whether registering an incident of this type on a vehicle immediately sets it to `maintenance`. Required — the supervisor must decide it explicitly for every type; ejemplo: true |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "code": "MEC-FRE-01",
  "name": "Falla en sistema de frenos",
  "severity": "critical",
  "disablesVehicle": true
}
```

**Respuesta correcta:** `201` → `VehicleIncidentTypeDto`.

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `id` | `integer` | Sí | Vehicle incident type ID. Use it as `vehicleIncidentTypeId` when registering a maintenance/incident on a vehicle; ejemplo: 1 |
| `code` | `string` | Sí | Unique reference code. Must not belong to another incident type; ejemplo: "MEC-FRE-01" |
| `name` | `string` | Sí | Display name. Must not belong to another incident type; ejemplo: "Falla en sistema de frenos" |
| `severity` | `string: minor, moderate, critical` | Sí | Severity classification, for reporting (e.g. the mobile/web badge color); ejemplo: "critical" |
| `disablesVehicle` | `boolean` | Sí | Whether registering an incident of this type on a vehicle (`POST /vehicle-maintenances`) immediately sets that vehicle to `maintenance` (RF-A34, Escenario 2). Independent of `severity`; ejemplo: true |
| `createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC); ejemplo: "2024-01-01T00:00:00.000Z" |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "id": 1,
  "code": "MEC-FRE-01",
  "name": "Falla en sistema de frenos",
  "severity": "critical",
  "disablesVehicle": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | Code is required.; Name is required.; Severity must be one of: minor, moderate, critical.; Disables vehicle must be true or false. |
| `401` | `INVALID_TOKEN` | Invalid or expired token. |
| `403` | `INSUFFICIENT_PERMISSIONS` | You do not have permission to perform this action. |
| `409` | `VEHICLE_INCIDENT_TYPE_CODE_ALREADY_EXISTS` | A vehicle incident type with this name or code already exists. |

#### GET /api/vehicle-incident-types/{id}

**Función.** Returns a single vehicle incident type by its numeric ID. A deleted type is not found. Requires supervisor or coordinator role, or root.

**Acceso:** JWT Bearer; roles: supervisor, coordinator (o root).

**Parámetros:**

| Lugar | Nombre | Tipo | Obligatorio | Descripción | Restricciones / ejemplo |
| --- | --- | --- | --- | --- | --- |
| path | `id` | `integer` | Sí | Vehicle incident type ID (a whole number from 1 to 2147483647, as returned by the list endpoint). Anything else is a 400. | ejemplo: 1 |

**Respuesta correcta:** `200` → `VehicleIncidentTypeDto`.

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `id` | `integer` | Sí | Vehicle incident type ID. Use it as `vehicleIncidentTypeId` when registering a maintenance/incident on a vehicle; ejemplo: 1 |
| `code` | `string` | Sí | Unique reference code. Must not belong to another incident type; ejemplo: "MEC-FRE-01" |
| `name` | `string` | Sí | Display name. Must not belong to another incident type; ejemplo: "Falla en sistema de frenos" |
| `severity` | `string: minor, moderate, critical` | Sí | Severity classification, for reporting (e.g. the mobile/web badge color); ejemplo: "critical" |
| `disablesVehicle` | `boolean` | Sí | Whether registering an incident of this type on a vehicle (`POST /vehicle-maintenances`) immediately sets that vehicle to `maintenance` (RF-A34, Escenario 2). Independent of `severity`; ejemplo: true |
| `createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC); ejemplo: "2024-01-01T00:00:00.000Z" |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "id": 1,
  "code": "MEC-FRE-01",
  "name": "Falla en sistema de frenos",
  "severity": "critical",
  "disablesVehicle": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | Validation failed (numeric string is expected) |
| `401` | `INVALID_TOKEN` | Invalid or expired token. |
| `403` | `INSUFFICIENT_PERMISSIONS` | You do not have permission to perform this action. |
| `404` | `VEHICLE_INCIDENT_TYPE_NOT_FOUND` | Vehicle incident type not found. |

#### PUT /api/vehicle-incident-types/{id}

**Función.** Partially updates a vehicle incident type: only the fields sent are changed, and an empty body changes nothing. `null` is rejected on every field. If any field is invalid nothing is saved. There is no delete endpoint for this catalog. 409 when a changed code or name is taken. Requires supervisor or coordinator role, or root.

**Acceso:** JWT Bearer; roles: supervisor, coordinator (o root).

**Parámetros:**

| Lugar | Nombre | Tipo | Obligatorio | Descripción | Restricciones / ejemplo |
| --- | --- | --- | --- | --- | --- |
| path | `id` | `integer` | Sí | Vehicle incident type ID (a whole number from 1 to 2147483647, as returned by the list endpoint). Anything else is a 400. | ejemplo: 1 |

**Cuerpo de solicitud:** `application/json`; esquema [`UpdateVehicleIncidentTypeDto`](#updatevehicleincidenttypedto).

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `code` | `string` | No | New reference code. Trimmed and uppercased before validation; must not belong to another incident type. null is rejected; longitud máx. 30; ejemplo: "MEC-FRE-01" |
| `name` | `string` | No | New display name. Must not belong to another incident type. null is rejected; longitud máx. 100; ejemplo: "Falla en sistema de frenos" |
| `severity` | `string: minor, moderate, critical` | No | New severity classification. null is rejected; ejemplo: "moderate" |
| `disablesVehicle` | `boolean` | No | New disablesVehicle value. null is rejected; ejemplo: false |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "code": "MEC-FRE-01",
  "name": "Falla en sistema de frenos",
  "severity": "moderate",
  "disablesVehicle": false
}
```

**Respuesta correcta:** `200` → `VehicleIncidentTypeDto`.

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `id` | `integer` | Sí | Vehicle incident type ID. Use it as `vehicleIncidentTypeId` when registering a maintenance/incident on a vehicle; ejemplo: 1 |
| `code` | `string` | Sí | Unique reference code. Must not belong to another incident type; ejemplo: "MEC-FRE-01" |
| `name` | `string` | Sí | Display name. Must not belong to another incident type; ejemplo: "Falla en sistema de frenos" |
| `severity` | `string: minor, moderate, critical` | Sí | Severity classification, for reporting (e.g. the mobile/web badge color); ejemplo: "critical" |
| `disablesVehicle` | `boolean` | Sí | Whether registering an incident of this type on a vehicle (`POST /vehicle-maintenances`) immediately sets that vehicle to `maintenance` (RF-A34, Escenario 2). Independent of `severity`; ejemplo: true |
| `createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC); ejemplo: "2024-01-01T00:00:00.000Z" |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "id": 1,
  "code": "MEC-FRE-01",
  "name": "Falla en sistema de frenos",
  "severity": "critical",
  "disablesVehicle": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | Severity must be one of: minor, moderate, critical. |
| `400` | `Bad Request` | Validation failed (numeric string is expected) |
| `401` | `INVALID_TOKEN` | Invalid or expired token. |
| `403` | `INSUFFICIENT_PERMISSIONS` | You do not have permission to perform this action. |
| `404` | `VEHICLE_INCIDENT_TYPE_NOT_FOUND` | Vehicle incident type not found. |
| `409` | `VEHICLE_INCIDENT_TYPE_CODE_ALREADY_EXISTS` | A vehicle incident type with this name or code already exists. |

### Vehicle Maintenances

Guía en español: [Incidentes vehiculares y mantenimiento](VEHICLE_INCIDENTS.md).

#### POST /api/vehicle-maintenances

**Función.** Registers that an incident of the given `vehicleIncidentTypeId` happened to `vehicleId` (RF-A34, Escenario 1). The record always starts in `pending` status. If that incident type's `disablesVehicle` is true, the vehicle is moved to `maintenance` in the same transaction (Escenario 2) — the response's `vehicleStatus` reflects it right away. Requires supervisor or coordinator role, or root.

**Acceso:** JWT Bearer; roles: supervisor, coordinator (o root).

**Cuerpo de solicitud:** `application/json`; esquema [`CreateVehicleMaintenanceDto`](#createvehiclemaintenancedto).

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `vehicleId` | `integer` | Sí | Vehicle the incident happened to; ejemplo: 7 |
| `vehicleIncidentTypeId` | `integer` | Sí | Vehicle incident type that happened. Required — this endpoint is for registering an incident, not a routine maintenance; ejemplo: 3 |
| `description` | `string` | Sí | Free-text detail of what happened. Trimmed; longitud máx. 1000; ejemplo: "Se sintió ruido metálico en las pastillas de freno delanteras" |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "vehicleId": 7,
  "vehicleIncidentTypeId": 3,
  "description": "Se sintió ruido metálico en las pastillas de freno delanteras"
}
```

**Respuesta correcta:** `201` → `VehicleMaintenanceDto`.

| Campo JSON | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `id` | `integer` | Sí | Maintenance/incident record ID; ejemplo: 1 |
| `vehicleId` | `integer` | Sí | Vehicle this record is about; ejemplo: 7 |
| `vehicleIncidentTypeId` | `integer` | Sí | Vehicle incident type registered; ejemplo: 3 |
| `description` | `string` | Sí | Free-text detail of what happened; ejemplo: "Se sintió ruido metálico en las pastillas de freno delanteras" |
| `status` | `string` | Sí | pending, in_progress or completed — always pending right after registering (RF-A17 tracks it from here on, out of scope of this endpoint); ejemplo: "pending" |
| `createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC); ejemplo: "2024-01-01T00:00:00.000Z" |
| `vehicleStatus` | `string` | Sí | The vehicle's current operational status, right after this write — `maintenance` if the incident type's `disablesVehicle` was true, unchanged otherwise; ejemplo: "maintenance" |

Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:

```json
{
  "id": 1,
  "vehicleId": 7,
  "vehicleIncidentTypeId": 3,
  "description": "Se sintió ruido metálico en las pastillas de freno delanteras",
  "status": "pending",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "vehicleStatus": "maintenance"
}
```

**Errores y códigos:**

| HTTP | `error` | `message` de ejemplo |
| --- | --- | --- |
| `400` | `Bad Request` | Description is required. |
| `401` | `INVALID_TOKEN` | Invalid or expired token. |
| `403` | `INSUFFICIENT_PERMISSIONS` | You do not have permission to perform this action. |
| `404` | `VEHICLE_NOT_FOUND` | Vehicle not found. |
| `404` | `VEHICLE_INCIDENT_TYPE_NOT_FOUND` | Vehicle incident type not found. |

## Claves de configuración

`GET /api/settings` devuelve las claves existentes en la base de datos; `PUT /api/settings/{key}` recibe `{"value": "..."}`. Los valores se envían siempre como texto. La tabla combina los valores iniciales de `../../backend/delivery-dispatch-db/schema/settings/data.sql` con las reglas actuales de `setting-value.validator.ts`. Una base de datos en ejecución puede tener valores distintos a los iniciales.

| `key` | Valor inicial | Valor aceptado |
| --- | --- | --- |
| `delivery_window_start` | `08:00` | Hora `HH:mm`, `00:00` a `23:59` |
| `delivery_window_end` | `20:00` | Hora `HH:mm`, `00:00` a `23:59` |
| `max_wait_time_min` | `15` | Entero de 1 a 1440 minutos |
| `sla_alert_threshold_pct` | `90` | Entero de 1 a 100 % |
| `password_min_length` | `8` | Entero de 8 a 128 caracteres |
| `password_expiration_days` | `90` | Entero de 1 a 3650 días |
| `otp_code_length` | `6` | Entero de 4 a 10 dígitos |
| `otp_expiry_minutes` | `60` | Entero de 1 a 1440 minutos |
| `max_failed_login_attempts` | `5` | Entero de 1 a 100 intentos |
| `account_lockout_minutes` | `15` | Entero de 1 a 10080 minutos |
| `password_reset_expiry_minutes` | `30` | Entero de 1 a 1440 minutos |
| `session_inactivity_minutes` | `30` | Entero de 1 a 10080 minutos; no aplica al repartidor en ruta |

## WebSocket: seguimiento en vivo

Socket.IO usa el namespace `app` por defecto (`WEBSOCKET_NAMESPACE` puede cambiarlo). Conectar a `http://localhost:3000/app` con `auth: { token: accessToken }` en el handshake o con el encabezado `Authorization: Bearer <accessToken>`. Un token inválido causa desconexión inmediata. En producción usar la URL y el protocolo TLS del servidor.

| Evento recibido | Quién lo recibe | Cuerpo | Origen |
| --- | --- | --- | --- |
| `dispatch.location.updated` | `root`, `admin`, `coordinator`, `supervisor` (sala `dispatch-board`, asignada al conectar) | `{ dispatchId, latitude, longitude, recordedAt }` | Se emite cuando `POST /api/tracking/locations` guarda un punto nuevo. |

El repartidor reporta sus ubicaciones por REST. No recibe este evento de tablero. WebSocket no aparece como operación en OpenAPI.

## Esquemas de datos

Los campos y restricciones siguientes provienen de Swagger. `openapi.json` contiene los ejemplos, las estructuras anidadas y los formatos exactos.

### LoginDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `username` | `string` | Sí | Login name of the account (not the email) |
| `password` | `string` | Sí | Account password |
| `totpCode` | `string` | No | Current 6-digit code from the authenticator app. Send it only if the account has 2FA enabled: without it the answer is 401 TOTP_REQUIRED (and a wrong one 401 INVALID_TOTP_CODE), which is the signal to ask the user for the code and repeat the request |

### RoleDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `id` | `integer` | Sí | Role ID. Use it as `roleId` when creating or updating users |
| `name` | `string: root, admin, coordinator, supervisor, driver` | Sí | Role name. root: the system account, can do everything (only root manages root accounts) · admin: users and settings · coordinator: delivery zones, service levels and vehicles, and reads users and roles · supervisor: vehicles · driver: the mobile app (sync). admin, coordinator, supervisor and driver are independent of each other |
| `createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC) |

### UserDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `id` | `integer` | Sí | User ID |
| `fullName` | `string` | Sí | The user's full name |
| `username` | `string` | Sí | Login name, unique among users |
| `email` | `string / null` | Sí | Email address. null when none was given |
| `role` | `RoleDto` | Sí | The user's role, which decides what they can do |
| `active` | `boolean` | Sí | false = deactivated by an admin: cannot log in |
| `twoFactorEnabled` | `boolean` | Sí | true when two-factor authentication is on for this account (login then needs a TOTP code) |
| `requiresPwdChange` | `boolean` | Sí | true if the user must change their password before continuing. |
| `status` | `string: active, inactive, locked` | Sí | inactive = deactivated by an admin · locked = temporarily locked after failed logins · active = everything else. |
| `lockedUntil` | `string (date-time) / null` | Sí | While in the future, the account is locked (RF-A21). Null when never locked. |
| `lastLoginAt` | `string (date-time) / null` | Sí | Last successful login. Null if the user has never logged in. |
| `createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC) |

### AuthResponseDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `accessToken` | `string` | Sí | Short-lived access token (JWT_TIME_EXPIRE, default 15 min). Send as Authorization: Bearer <token> on every request. |
| `refreshToken` | `string` | Sí | Long-lived refresh token (JWT_REFRESH_TIME_EXPIRE, default 7 days). Use only at POST /auth/refresh. Store securely (httpOnly cookie or secure storage). |
| `user` | `UserDto` | Sí | The authenticated user |
| `mustChangePassword` | `boolean` | Sí | true if the client must redirect to a forced password-change screen before continuing — either an admin flagged the account, or the password is past password_expiration_days (RF-A25). |

### CreateUserDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `fullName` | `string` | Sí | The user's full name, as shown in the app; longitud máx. 150 |
| `username` | `string` | Sí | Login name. Must not belong to another user; longitud máx. 50 |
| `email` | `string` | No | Optional. A valid email address that must not belong to another user. Needed to recover the password by email; longitud máx. 150 |
| `password` | `string` | Sí | Must be at least 8 characters with an uppercase letter, a lowercase letter, a number and a symbol, and meet the minimum length set in settings (password_min_length). It is stored hashed and never returned; longitud mín. 8; longitud máx. 255 |
| `roleId` | `integer` | Sí | ID of the role to assign, from GET /roles (root, admin, coordinator, supervisor or driver). An unknown ID is a 400 INVALID_ROLE |

### RefreshDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `refreshToken` | `string` | Sí | Refresh token received from the last successful login, register, or refresh. |

### ChangePasswordDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `currentPassword` | `string` | Sí | The password you use now, to confirm it is really you |
| `newPassword` | `string` | Sí | Must be at least 8 characters with an uppercase letter, a lowercase letter, a number and a symbol, and meet the minimum length set in settings. It must also differ from the current password and the last 3 used; longitud mín. 8; longitud máx. 255 |

### ForgotPasswordDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `email` | `string` | Sí | Email address registered on the account. A reset link/token is sent there if it matches an active account |

### ResetPasswordDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `token` | `string` | Sí | Token received by email after POST /auth/forgot-password. Single-use, and it expires |
| `newPassword` | `string` | Sí | The new password. Must be at least 8 characters with an uppercase letter, a lowercase letter, a number and a symbol, and meet the minimum length set in settings. It must also differ from the current password and the last 3 used; longitud mín. 8; longitud máx. 255 |

### EnableTwoFactorDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `password` | `string` | Sí | Your current password, to confirm that it is really you who is turning 2FA on (a stolen access token alone is not enough) |

### TwoFactorSecretDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `secret` | `string` | Sí | Base32 secret, to type by hand in the authenticator app if the QR code cannot be scanned. Keep it private |
| `qrCodeDataUrl` | `string` | Sí | otpauth:// URI encoded as a QR code data URL (PNG), scannable by any authenticator app. |

### ConfirmTwoFactorDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `code` | `string` | Sí | Current 6-digit code shown by the authenticator app after scanning the QR from POST /auth/2fa/enable; longitud mín. 6; longitud máx. 6 |

### DisableTwoFactorDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `password` | `string` | Sí | Your current password, required to confirm that you want to disable 2FA |

### SyncEventResultDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `clientEventId` | `string` | Sí | The `clientEventId` of the event this result is about |
| `outcome` | `string: applied, already_processed, failed` | Sí | applied = saved now · already_processed = it had been saved by an earlier attempt, nothing changed · failed = not saved, see `error`; keep it on the device and retry once fixed |
| `error` | `string` | No | Why it failed (e.g. "Dispatch not found."). Only present when outcome = failed |

### SyncEventsBatchResultDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `results` | `SyncEventResultDto[]` | Sí | One result per event, in the same order as sent |

### SyncEventDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `type` | `string: status_change, incident` | Sí | status_change = the dispatch changed status (send `dispatchStatusId`) · incident = a problem happened during delivery (send `incidentReasonId`) |
| `clientEventId` | `string` | Sí | UUID v7 generated by the device when the event happened. It is the idempotency key: sending the same one again never duplicates the event (the answer is `already_processed`) |
| `dispatchId` | `integer` | Sí | ID of the dispatch the event is about |
| `occurredAt` | `string` | Sí | When it really happened on the device, ISO 8601 in UTC (not when it was synced) |
| `dispatchStatusId` | `integer` | No | Required when type = status_change: the new dispatch status ID (1 = pending, 2 = in_transit, 3 = delivered, 4 = not_delivered, 5 = returned) |
| `incidentReasonId` | `integer` | No | Required when type = incident: the ID of the incident reason |
| `detail` | `string` | No | Optional free text: why the status changed, or a description of the incident; longitud máx. 1000 |

### SyncEventsBatchDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `events` | `SyncEventDto[]` | Sí | Events in the order they happened on the device (oldest first). At least one. They are applied in exactly this order; elementos mín. 1 |

### LocationReportResultDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `dispatchId` | `integer` | Sí | The `dispatchId` of the point this result is about |
| `outcome` | `string: applied, stale, failed` | Sí | applied = it was the newest point for this dispatch, saved and broadcast · stale = an equal-or-newer point was already stored (from an earlier report or another point in this same batch) — not an error, safe to ignore · failed = not saved, see `error` |
| `error` | `string` | No | Why it failed (e.g. "Dispatch not found."). Only present when outcome = failed |

### LocationsReportResultDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `results` | `LocationReportResultDto[]` | Sí | One result per point sent, in the same order as the request |

### LocationPointDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `dispatchId` | `integer` | Sí | ID of the dispatch this position belongs to — must be on a route assigned to the reporting driver |
| `latitude` | `number` | Sí | Latitude, decimal degrees (WGS84), between -90 and 90 |
| `longitude` | `number` | Sí | Longitude, decimal degrees (WGS84), between -180 and 180 |
| `recordedAt` | `string` | Sí | When the device captured this point, ISO 8601 in UTC (not when it was sent) |

### ReportLocationsDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `locations` | `LocationPointDto[]` | Sí | One or more GPS points captured while the route was active. Order does not matter — they are applied oldest-first regardless of how they are sent, so a buffered batch synced after regaining signal (RF-U11, Escenario 3) works the same as a single live point; elementos mín. 1 |

### RoleDetailDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `id` | `integer` | Sí | Role ID. Use it as `roleId` when creating or updating users |
| `name` | `string: root, admin, coordinator, supervisor, driver` | Sí | Role name. root: the system account, can do everything (only root manages root accounts) · admin: users and settings · coordinator: delivery zones, service levels and vehicles, and reads users and roles · supervisor: vehicles · driver: the mobile app (sync). admin, coordinator, supervisor and driver are independent of each other |
| `createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC) |
| `userCount` | `integer` | Sí | How many users (not deleted) have this role, active or not |
| `activeUserCount` | `integer` | Sí | How many of those users are active (can log in) |

### MetadataDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `page` | `integer` | Sí | Current page number |
| `limit` | `integer` | Sí | Items per page |
| `pages` | `integer` | Sí | Total number of pages (0 when there are no results) |
| `total` | `integer` | Sí | Total number of records matching the filters |

### FindAllRolesResponseDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `data` | `RoleDetailDto[]` | Sí | Items on the current page |
| `meta` | `MetadataDto` | Sí | Pagination metadata |

### FindAllUsersResponseDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `data` | `UserDto[]` | Sí | Items on the current page |
| `meta` | `MetadataDto` | Sí | Pagination metadata |

### UpdateUserDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `fullName` | `string` | No | New full name. null is rejected; longitud máx. 150 |
| `username` | `string` | No | New login name. Must not belong to another user. null is rejected; longitud máx. 50 |
| `email` | `string / null` | No | New email, which must not belong to another user. null clears it; longitud máx. 150 |
| `password` | `string` | No | Resets the password (admin action). Must be at least 8 characters with an uppercase letter, a lowercase letter, a number and a symbol, and meet the minimum length set in settings (password_min_length). null is rejected; longitud mín. 8; longitud máx. 255 |
| `active` | `boolean` | No | false deactivates the user (cannot log in) without deleting it; true reactivates. null is rejected |

### UpdateUserRoleDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `roleId` | `integer` | Sí | New role, an ID from GET /roles. Required — this endpoint only changes the role. An unknown ID is a 400 INVALID_ROLE |

### DeliveryZoneDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `id` | `integer` | Sí | Delivery zone ID |
| `code` | `string` | Sí | Unique short code of the zone |
| `name` | `string` | Sí | Display name of the zone |
| `estimatedTimeMin` | `integer` | Sí | Base estimated delivery time in this zone, in minutes |
| `createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC) |

### FindAllDeliveryZonesResponseDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `data` | `DeliveryZoneDto[]` | Sí | Items on the current page |
| `meta` | `MetadataDto` | Sí | Pagination metadata |

### CreateDeliveryZoneDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `code` | `string` | Sí | Short unique code of the zone, used to refer to it (e.g. ZON-SUR). Must not belong to another zone; longitud máx. 20 |
| `name` | `string` | Sí | Display name of the zone; longitud máx. 100 |
| `estimatedTimeMin` | `integer` | Sí | Base estimated delivery time in this zone, in minutes (a whole number from 1 to 43200); mín. 1; máx. 43200 |

### UpdateDeliveryZoneDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `code` | `string` | No | New code. Must not belong to another zone. null is rejected; longitud máx. 20 |
| `name` | `string` | No | New display name. null is rejected; longitud máx. 100 |
| `estimatedTimeMin` | `integer` | No | New base estimated delivery time, in minutes (a whole number from 1 to 43200). null is rejected; mín. 1; máx. 43200 |

### IncidentReasonDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `id` | `integer` | Sí | Incident reason ID. Use it as `incidentReasonId` when reporting a delivery incident (POST /sync/events) |
| `code` | `string` | Sí | Unique reference code, in uppercase. Must not belong to another reason |
| `name` | `string` | Sí | Display name shown to the driver on the mobile app |
| `requiresEvidence` | `boolean` | Sí | true = logging an incident with this reason requires a photo of evidence. The mobile app reads this to demand (or not) a photo before letting the driver submit the report |
| `active` | `boolean` | Sí | false = disabled: cannot be assigned to new incidents. Incidents already logged with it are not affected |
| `createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC) |

### FindAllIncidentReasonsResponseDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `data` | `IncidentReasonDto[]` | Sí | Items on the current page |
| `meta` | `MetadataDto` | Sí | Pagination metadata |

### CreateIncidentReasonDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `code` | `string` | Sí | Unique reference code. Trimmed and uppercased before validation; must not belong to another reason; longitud máx. 30 |
| `name` | `string` | Sí | Display name shown to the driver on the mobile app; longitud máx. 150 |
| `requiresEvidence` | `boolean` | Sí | Whether logging an incident with this reason requires a photo of evidence. Required — the coordinator must decide it explicitly for every reason |

### UpdateIncidentReasonDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `code` | `string` | No | New code. Must not belong to another reason. null is rejected; longitud máx. 30 |
| `name` | `string` | No | New display name. null is rejected; longitud máx. 150 |
| `requiresEvidence` | `boolean` | No | Whether logging an incident with this reason requires a photo of evidence. null is rejected |
| `active` | `boolean` | No | false disables the reason for new incidents; incidents already logged with it are not affected. true enables it again. null is rejected |

### RescheduleReasonDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `id` | `integer` | Sí | Reschedule reason ID. Use it as `rescheduleReasonId` when recording a dispatch reschedule/reassignment |
| `code` | `string` | Sí | Unique reference code. Must not belong to another reason |
| `name` | `string` | Sí | Display name shown in the reschedule/reassignment modal of the operations panel. Must not belong to another reason |
| `description` | `string / null` | Sí | Optional free-text detail. null when none was given |
| `category` | `string: client, operations, force_majeure` | Sí | Who/what the delay is attributed to. client: the reschedule does not count against the team's internal punctuality metric · operations: an internal operational cause (e.g. route replanning) · force_majeure: outside anyone's control (e.g. a mechanical breakdown, weather) |
| `active` | `boolean` | Sí | false = disabled: cannot be assigned to new reschedules/reassignments. Reschedules already logged with it are not affected |
| `affectsSla` | `boolean` | Sí | Computed, read-only: true only when `category` is `client` (RF-A33, Escenario 2) — a reschedule using this reason does not count against the team's internal punctuality metric. Not accepted on create/update, only category is |
| `createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC) |

### FindAllRescheduleReasonsResponseDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `data` | `RescheduleReasonDto[]` | Sí | Items on the current page |
| `meta` | `MetadataDto` | Sí | Pagination metadata |

### CreateRescheduleReasonDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `code` | `string` | Sí | Unique reference code. Trimmed and uppercased before validation; must not belong to another reason; longitud máx. 30 |
| `name` | `string` | Sí | Display name. Trimmed; must not belong to another reason; longitud máx. 150 |
| `description` | `string` | No | Optional free-text detail; longitud máx. 255 |
| `category` | `string: client, operations, force_majeure` | Sí | Who/what the delay is attributed to. Required — the coordinator must classify it explicitly |

### UpdateRescheduleReasonDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `code` | `string` | No | New reference code. Trimmed and uppercased before validation; must not belong to another reason. null is rejected; longitud máx. 30 |
| `name` | `string` | No | New display name. Must not belong to another reason. null is rejected; longitud máx. 150 |
| `description` | `string / null` | No | New description. null or empty text clears it; longitud máx. 255 |
| `category` | `string: client, operations, force_majeure` | No | New category. null is rejected |
| `active` | `boolean` | No | false disables the reason for new reschedules/reassignments; ones already logged with it are not affected. true enables it again. null is rejected |

### ServiceLevelDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `id` | `integer` | Sí | Service level ID |
| `name` | `string` | Sí | Unique name among the levels that have not been deleted |
| `description` | `string / null` | Sí | Free-text description. null when none was given |
| `targetTimeMin` | `integer` | Sí | Target delivery time (SLA), in minutes |
| `priorityLevel` | `integer` | Sí | Priority hierarchy: 1 is the highest. Different levels may share a value; the list breaks ties by target time |
| `active` | `boolean` | Sí | false = disabled: cannot be assigned to new orders |
| `createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC) |

### FindAllServiceLevelsResponseDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `data` | `ServiceLevelDto[]` | Sí | Items on the current page |
| `meta` | `MetadataDto` | Sí | Pagination metadata |

### CreateServiceLevelDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `name` | `string` | Sí | Unique name (leading/trailing spaces are trimmed; uniqueness is case-sensitive). Required; longitud máx. 50 |
| `description` | `string` | No | Optional free-text description. Empty or blank text is stored as null; longitud máx. 255 |
| `targetTimeMin` | `integer` | Sí | Target delivery time (SLA) in minutes. An integer from 15 (a shorter time is not a realistic commitment, RF-A31) to 43200 (30 days); mín. 15; máx. 43200 |
| `priorityLevel` | `integer` | Sí | Priority hierarchy: 1 is the highest. Levels may share a value; the list breaks ties by target time; mín. 1; máx. 32767 |

### UpdateServiceLevelDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `name` | `string` | No | New name (trimmed). Must not be used by another level. null is rejected; longitud máx. 50 |
| `description` | `string / null` | No | New description. null or empty text clears it; longitud máx. 255 |
| `targetTimeMin` | `integer` | No | Target delivery time in minutes: an integer from 15 to 43200. null is rejected; mín. 15; máx. 43200 |
| `priorityLevel` | `integer` | No | Priority hierarchy: 1 is the highest. null is rejected; mín. 1; máx. 32767 |
| `active` | `boolean` | No | false disables the level for new orders; dispatches that already use it are not affected. true enables it again. null is rejected |

### VehicleStatusDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `id` | `integer` | Sí | Status ID: 1 = active, 2 = maintenance, 3 = out_of_service. Use it as `vehicleStatusId` |
| `name` | `string: active, maintenance, out_of_service` | Sí | active = available for route assignment · maintenance = temporarily unavailable · out_of_service = withdrawn |

### VehicleDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `id` | `integer` | Sí | Vehicle ID |
| `type` | `string` | Sí | Kind of vehicle |
| `model` | `string` | Sí | Make and model |
| `plate` | `string` | Sí | License plate, uppercase, unique among vehicles |
| `capacityKg` | `number (double)` | Sí | Maximum load weight, in kg |
| `capacityM3` | `number (double)` | Sí | Maximum load volume, in m3 |
| `vehicleStatus` | `VehicleStatusDto` | Sí | Current operational status |
| `createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC) |

### FindAllVehiclesResponseDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `data` | `VehicleDto[]` | Sí | Items on the current page |
| `meta` | `MetadataDto` | Sí | Pagination metadata |

### CreateVehicleDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `type` | `string` | Sí | Kind of vehicle, free text (moto, camioneta, camión, etc.); longitud máx. 50 |
| `model` | `string` | Sí | Make and model, free text; longitud máx. 100 |
| `plate` | `string` | Sí | License plate. Trimmed and converted to uppercase; must not belong to another vehicle; longitud máx. 15 |
| `capacityKg` | `number (double)` | Sí | Maximum load weight in kg (greater than zero, up to 2 decimals); mín. 0; máx. 99999999.99 |
| `capacityM3` | `number (double)` | Sí | Maximum load volume in m3 (greater than zero, up to 2 decimals); mín. 0; máx. 99999999.99 |

### UpdateVehicleDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `type` | `string` | No | New vehicle type. null or empty is rejected; longitud máx. 50 |
| `model` | `string` | No | New make and model. null or empty is rejected; longitud máx. 100 |
| `plate` | `string` | No | New plate, trimmed and uppercased. Must not belong to another vehicle. null or empty is rejected; longitud máx. 15 |
| `capacityKg` | `number (double)` | No | New maximum load weight in kg (greater than zero, up to 2 decimals). null is rejected; mín. 0; máx. 99999999.99 |
| `capacityM3` | `number (double)` | No | New maximum load volume in m3 (greater than zero, up to 2 decimals). null is rejected; mín. 0; máx. 99999999.99 |
| `vehicleStatusId` | `integer` | No | New operational status: 1 = active (available for routes), 2 = maintenance, 3 = out_of_service. Any other ID is a 400 INVALID_VEHICLE_STATUS. null is rejected |

### SettingDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `key` | `string` | Sí | Unique key of the setting; use it in PUT /settings/{key} |
| `value` | `string` | Sí | Current value, always text (numbers and times are sent as text too, e.g. "5", "08:00") |
| `description` | `string / null` | Sí | What the setting controls |
| `updatedAt` | `string (date-time)` | Sí | Last time the value was changed (UTC) |

### UpdateSettingDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `value` | `string` | Sí | New value, as text, valid for that key (e.g. "5" for a number of minutes, "08:00" for a time; an out-of-range value is 400 INVALID_SETTING_VALUE). Cannot be empty; longitud mín. 1 |

### VehicleIncidentTypeDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `id` | `integer` | Sí | Vehicle incident type ID. Use it as `vehicleIncidentTypeId` when registering a maintenance/incident on a vehicle |
| `code` | `string` | Sí | Unique reference code. Must not belong to another incident type |
| `name` | `string` | Sí | Display name. Must not belong to another incident type |
| `severity` | `string: minor, moderate, critical` | Sí | Severity classification, for reporting (e.g. the mobile/web badge color) |
| `disablesVehicle` | `boolean` | Sí | Whether registering an incident of this type on a vehicle (`POST /vehicle-maintenances`) immediately sets that vehicle to `maintenance` (RF-A34, Escenario 2). Independent of `severity` |
| `createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC) |

### FindAllVehicleIncidentTypesResponseDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `data` | `VehicleIncidentTypeDto[]` | Sí | Items on the current page |
| `meta` | `MetadataDto` | Sí | Pagination metadata |

### CreateVehicleIncidentTypeDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `code` | `string` | Sí | Unique reference code. Trimmed and uppercased before validation; must not belong to another incident type; longitud máx. 30 |
| `name` | `string` | Sí | Display name. Trimmed; must not belong to another incident type; longitud máx. 100 |
| `severity` | `string: minor, moderate, critical` | Sí | Severity classification. Required — must be classified explicitly |
| `disablesVehicle` | `boolean` | Sí | Whether registering an incident of this type on a vehicle immediately sets it to `maintenance`. Required — the supervisor must decide it explicitly for every type |

### UpdateVehicleIncidentTypeDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `code` | `string` | No | New reference code. Trimmed and uppercased before validation; must not belong to another incident type. null is rejected; longitud máx. 30 |
| `name` | `string` | No | New display name. Must not belong to another incident type. null is rejected; longitud máx. 100 |
| `severity` | `string: minor, moderate, critical` | No | New severity classification. null is rejected |
| `disablesVehicle` | `boolean` | No | New disablesVehicle value. null is rejected |

### CreateVehicleMaintenanceDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `vehicleId` | `integer` | Sí | Vehicle the incident happened to |
| `vehicleIncidentTypeId` | `integer` | Sí | Vehicle incident type that happened. Required — this endpoint is for registering an incident, not a routine maintenance |
| `description` | `string` | Sí | Free-text detail of what happened. Trimmed; longitud máx. 1000 |

### VehicleMaintenanceDto

| Campo | Tipo | Obligatorio | Descripción y reglas |
| --- | --- | --- | --- |
| `id` | `integer` | Sí | Maintenance/incident record ID |
| `vehicleId` | `integer` | Sí | Vehicle this record is about |
| `vehicleIncidentTypeId` | `integer` | Sí | Vehicle incident type registered |
| `description` | `string` | Sí | Free-text detail of what happened |
| `status` | `string` | Sí | pending, in_progress or completed — always pending right after registering (RF-A17 tracks it from here on, out of scope of this endpoint) |
| `createdAt` | `string (date-time)` | Sí | Creation timestamp (UTC) |
| `vehicleStatus` | `string` | Sí | The vehicle's current operational status, right after this write — `maintenance` if the incident type's `disablesVehicle` was true, unchanged otherwise |
