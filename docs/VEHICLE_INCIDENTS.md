# Incidentes vehiculares y registro de mantenimiento

Referencia de los cinco endpoints añadidos por el backend para RF-A34. Se contrastaron el [Swagger local actualizado](http://localhost:3000/api/docs/), los controladores, los DTO y los servicios del commit `c87a858`. La instantánea completa está en [openapi.json](openapi.json) y el índice de todos los endpoints en [API.md](API.md).

## Uso común

- Base URL del Swagger revisado: `http://localhost:3000/api`.
- Todas las rutas requieren `Authorization: Bearer <accessToken>` y rol `supervisor`, `coordinator` o `root`.
- `POST` y `PUT` usan `Content-Type: application/json`.
- Los `id` de la ruta son enteros entre 1 y 2147483647.
- La gravedad `severity` clasifica el incidente; el booleano `disablesVehicle` decide por separado si registrar ese tipo cambia el estado del vehículo.

| Método y ruta | Uso | Éxito |
| --- | --- | --- |
| `GET /api/vehicle-incident-types` | Listar tipos de incidente | `200` |
| `POST /api/vehicle-incident-types` | Crear un tipo | `201` |
| `GET /api/vehicle-incident-types/{id}` | Consultar un tipo | `200` |
| `PUT /api/vehicle-incident-types/{id}` | Actualizar parcialmente un tipo | `200` |
| `POST /api/vehicle-maintenances` | Registrar un incidente de un vehículo | `201` |

## Modelo `VehicleIncidentTypeDto`

Las lecturas, la creación y la actualización del catálogo devuelven estos **seis campos**:

| Campo | Tipo | Regla |
| --- | --- | --- |
| `id` | entero | Identificador que se envía como `vehicleIncidentTypeId` al registrar el incidente. |
| `code` | texto | Código único, normalizado a mayúsculas. |
| `name` | texto | Nombre único del tipo de incidente. |
| `severity` | `minor`, `moderate`, `critical` | Gravedad para clasificación y presentación. |
| `disablesVehicle` | booleano | Si es `true`, el registro de un incidente de este tipo mueve el vehículo a `maintenance`. |
| `createdAt` | fecha ISO 8601 UTC | Fecha de creación, de solo lectura. |

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

El catálogo actual **no tiene `active` ni endpoint `DELETE`**. Tampoco hay filtro de activos.

## `GET /api/vehicle-incident-types`

Lista paginada, ordenada por `name` ascendente por defecto y por `id` ascendente cuando hay empate.

| Query | Tipo | Predeterminado | Regla |
| --- | --- | --- | --- |
| `page` | entero | `1` | De 1 a 1000000. |
| `limit` | entero | `10` | De 1 a 100. |
| `search` | texto | Sin búsqueda | Máximo 100 caracteres; busca parcialmente en `code` o `name`, sin distinguir mayúsculas. `%` y `_` son literales. |
| `severity` | `minor`, `moderate`, `critical` | Sin filtro | Solo una gravedad. Otro valor responde `400`. |
| `disablesVehicle` | `true` o `false` | Sin filtro | Ausente o vacío no filtra; otro valor responde `400`. |
| `sortBy` | `code`, `name`, `severity`, `createdAt` | `name` | Campo de orden. |
| `sortOrder` | `asc` o `desc` | `asc` | Dirección de orden; se pasa a minúsculas. |

`search`, `severity` y `disablesVehicle` se pueden combinar.

```bash
curl 'http://localhost:3000/api/vehicle-incident-types?search=frenos&severity=critical&disablesVehicle=true&page=1&limit=10&sortBy=name&sortOrder=asc' \
  -H 'Authorization: Bearer <accessToken>'
```

Respuesta `200`: `data` contiene los tipos de la página, cada uno con los seis campos del modelo; `meta` contiene `page`, `limit`, `pages` y `total`. `total` cuenta los registros que cumplen los filtros y `pages` vale `0` cuando no hay resultados.

Errores: `400 Bad Request` por query inválida; `401 INVALID_TOKEN`; `403 INSUFFICIENT_PERMISSIONS`.

## `POST /api/vehicle-incident-types`

**Todos los campos del cuerpo son obligatorios.**

| Campo JSON | Tipo | Validación |
| --- | --- | --- |
| `code` | texto | No vacío; máximo 30 caracteres. Se recortan espacios y se convierte a mayúsculas; debe ser único. |
| `name` | texto | No vacío; máximo 100 caracteres. Se recortan espacios; debe ser único. |
| `severity` | `minor`, `moderate`, `critical` | Obligatorio; se escribe exactamente en minúsculas. |
| `disablesVehicle` | booleano JSON | Obligatorio; `true` o `false` real, sin comillas. |

```bash
curl -X POST 'http://localhost:3000/api/vehicle-incident-types' \
  -H 'Authorization: Bearer <accessToken>' \
  -H 'Content-Type: application/json' \
  -d '{"code":"MEC-FRE-01","name":"Falla en sistema de frenos","severity":"critical","disablesVehicle":true}'
```

Respuesta `201`: `VehicleIncidentTypeDto` completo. Errores: `400 Bad Request` por validación o campos adicionales; `401 INVALID_TOKEN`; `403 INSUFFICIENT_PERMISSIONS`; `409 VEHICLE_INCIDENT_TYPE_CODE_ALREADY_EXISTS` si el **código o el nombre** ya está en uso. El código del error menciona `CODE`, pero cubre ambos duplicados.

## `GET /api/vehicle-incident-types/{id}`

Devuelve el `VehicleIncidentTypeDto` completo con seis campos.

```bash
curl 'http://localhost:3000/api/vehicle-incident-types/1' \
  -H 'Authorization: Bearer <accessToken>'
```

Errores: `400 Bad Request` por ID inválido; `401 INVALID_TOKEN`; `403 INSUFFICIENT_PERMISSIONS`; `404 VEHICLE_INCIDENT_TYPE_NOT_FOUND` si no existe.

## `PUT /api/vehicle-incident-types/{id}`

Actualización parcial: los cuatro campos son opcionales y solo cambian los enviados. `{}` devuelve el registro sin cambiarlo. Si se envía `null` en cualquiera de ellos, responde `400`; si hay un campo inválido no se guarda ningún cambio.

| Campo JSON | Tipo | Validación |
| --- | --- | --- |
| `code` | texto | No vacío, máximo 30 caracteres; se recorta y se pasa a mayúsculas; debe seguir siendo único. |
| `name` | texto | No vacío, máximo 100 caracteres; se recorta; debe seguir siendo único. |
| `severity` | `minor`, `moderate`, `critical` | Nueva clasificación de gravedad. |
| `disablesVehicle` | booleano JSON | Nueva regla para incidentes que se registren con este tipo. |

```bash
curl -X PUT 'http://localhost:3000/api/vehicle-incident-types/1' \
  -H 'Authorization: Bearer <accessToken>' \
  -H 'Content-Type: application/json' \
  -d '{"code":"MEC-FRE-01","name":"Falla en sistema de frenos","severity":"moderate","disablesVehicle":false}'
```

Respuesta `200`: el tipo completo actualizado. Errores: `400 Bad Request` por ID o cuerpo inválido; `401 INVALID_TOKEN`; `403 INSUFFICIENT_PERMISSIONS`; `404 VEHICLE_INCIDENT_TYPE_NOT_FOUND`; `409 VEHICLE_INCIDENT_TYPE_CODE_ALREADY_EXISTS` por código o nombre duplicado.

## `POST /api/vehicle-maintenances`

Registra un incidente concreto de un vehículo. Este endpoint solo crea registros; **no hay `GET`, `PUT` ni `DELETE` para `vehicle-maintenances` en esta versión**.

| Campo JSON | Tipo | Validación |
| --- | --- | --- |
| `vehicleId` | entero | Obligatorio; de 1 a 2147483647; debe existir un vehículo. |
| `vehicleIncidentTypeId` | entero | Obligatorio; de 1 a 2147483647; debe existir un tipo de incidente. |
| `description` | texto | Obligatorio, no vacío; se recortan espacios; máximo 1000 caracteres. |

```bash
curl -X POST 'http://localhost:3000/api/vehicle-maintenances' \
  -H 'Authorization: Bearer <accessToken>' \
  -H 'Content-Type: application/json' \
  -d '{"vehicleId":7,"vehicleIncidentTypeId":3,"description":"Se sintió ruido metálico en las pastillas de freno delanteras"}'
```

El registro se crea con `status: "pending"`. Si el tipo referido tiene `disablesVehicle: true`, el backend cambia el estado operacional del vehículo a `maintenance` **en la misma transacción**. Si vale `false`, conserva su estado. `severity` no determina ese cambio.

Respuesta `201`, modelo `VehicleMaintenanceDto` de **siete campos**:

| Campo | Tipo | Significado |
| --- | --- | --- |
| `id` | entero | ID del registro de mantenimiento/incidente. |
| `vehicleId` | entero | Vehículo afectado. |
| `vehicleIncidentTypeId` | entero | Tipo de incidente registrado. |
| `description` | texto | Descripción guardada. |
| `status` | texto | `pending` inmediatamente después de crear; el modelo también menciona `in_progress` y `completed` como estados de un flujo posterior. |
| `createdAt` | fecha ISO 8601 UTC | Fecha de creación. |
| `vehicleStatus` | texto | Estado operacional del vehículo después del registro; `maintenance` si el tipo lo inhabilita, o el estado anterior en caso contrario. |

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

No se aceptan `id`, `status` ni `vehicleStatus` en la solicitud: los decide el servidor. Errores: `400 Bad Request` por validación o campos adicionales; `401 INVALID_TOKEN`; `403 INSUFFICIENT_PERMISSIONS`; `404 VEHICLE_NOT_FOUND` si falta el vehículo; `404 VEHICLE_INCIDENT_TYPE_NOT_FOUND` si falta el tipo.

## Formato de errores

Las respuestas de error usan `{ statusCode, error, message, path, timestamp }`. En validaciones de campos, `error` es `"Bad Request"` y `message` suele ser una lista; los errores de negocio usan los códigos indicados arriba. El ejemplo de ID inválido se llama `INVALID_ID` en Swagger, pero el valor real del campo JSON `error` es `"Bad Request"`.
