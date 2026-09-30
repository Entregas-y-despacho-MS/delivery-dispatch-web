# Incident Reasons: motivos de incidencia

Contrato comprobado contra la sección [Incident Reasons del Swagger local](http://localhost:3000/api/docs#/Incident%20Reasons), los DTO y el servicio del backend hermano `../../backend/delivery-dispatch-svc`. Para el resto de la API, consulta [API.md](API.md) y [openapi.json](openapi.json).

## Datos comunes

- URL base en el Swagger enlazado: `http://localhost:3000/api`.
- Todas las operaciones requieren `Authorization: Bearer <accessToken>`; `POST` y `PUT` también requieren `Content-Type: application/json`.
- Lectura: `coordinator`, `supervisor`, `driver` o `root`. Escritura: `coordinator`, `supervisor` o `root`. El rol `admin` no tiene acceso por sí solo.
- `id` en la ruta: entero positivo entre 1 y 2147483647.
- No existe `DELETE /api/incident-reasons/{id}`. Se desactiva con `PUT` y `active: false`; se reactiva con `active: true`.

| Operación | Uso | Éxito |
| --- | --- | --- |
| `GET /api/incident-reasons` | Listar, buscar y filtrar | `200` |
| `POST /api/incident-reasons` | Crear | `201` |
| `GET /api/incident-reasons/{id}` | Consultar uno, incluso desactivado | `200` |
| `PUT /api/incident-reasons/{id}` | Actualizar parcialmente, desactivar o reactivar | `200` |

## Modelo de respuesta: `IncidentReasonDto`

Los elementos del listado y las respuestas de crear, consultar y actualizar tienen **estos seis campos**:

| Campo | Tipo | Significado |
| --- | --- | --- |
| `id` | entero | Identificador del motivo. Se envía como `incidentReasonId` al registrar una incidencia con `POST /api/sync/events`. |
| `code` | texto | Código único normalizado a mayúsculas; máximo 30 caracteres al escribirlo. |
| `name` | texto | Nombre mostrado al repartidor; máximo 150 caracteres al escribirlo. |
| `requiresEvidence` | booleano | `true` indica al cliente móvil que debe solicitar una foto de evidencia al elegir este motivo. |
| `active` | booleano | `false` indica que no debe ofrecerse para incidencias nuevas; las ya registradas conservan su motivo. |
| `createdAt` | fecha ISO 8601 UTC | Fecha de creación; no se envía en solicitudes de creación o actualización. |

Ejemplo de respuesta:

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

Los valores del ejemplo ilustran el contrato; la API devuelve los datos reales de la base.

## `GET /api/incident-reasons`

Devuelve motivos paginados. Sin filtros incluye activos e inactivos. Ordena por `name` ascendente por defecto y usa `id` ascendente para desempatar.

| Query | Tipo | Valor por defecto | Regla |
| --- | --- | --- | --- |
| `page` | entero | `1` | Desde 1 hasta 1000000. |
| `limit` | entero | `10` | Desde 1 hasta 100. |
| `search` | texto | Sin búsqueda | Máximo 100 caracteres; se recortan espacios. Busca una subcadena en `name` o `code` sin distinguir mayúsculas. `%` y `_` se interpretan literalmente. |
| `active` | `true` o `false` | Sin filtro | `true` solo activos; `false` solo inactivos. Ausente o vacío no filtra. Otro valor responde `400`. |
| `requiresEvidence` | `true` o `false` | Sin filtro | Filtra según necesidad de foto. Ausente o vacío no filtra. Otro valor responde `400`. |
| `sortBy` | `name`, `code` o `createdAt` | `name` | Solo acepta esos tres nombres. |
| `sortOrder` | `asc` o `desc` | `asc` | Orden de `sortBy`; convierte mayúsculas a minúsculas. |

`search`, `active` y `requiresEvidence` se pueden combinar; los filtros booleanos también se aplican a ambas ramas de la búsqueda.

```bash
curl 'http://localhost:3000/api/incident-reasons?active=true&requiresEvidence=true&search=cliente&page=1&limit=10&sortBy=name&sortOrder=asc' \
  -H 'Authorization: Bearer <accessToken>'
```

Respuesta `200`:

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
    "pages": 1,
    "total": 1
  }
}
```

`data` contiene solo la página solicitada. `meta.total` cuenta todos los registros que cumplen los filtros y `meta.pages` es el número de páginas (`0` si no hay resultados). Para descargar el catálogo activo en la app móvil, se puede usar `active=true&limit=100` y recorrer las páginas si `meta.pages` es mayor que 1.

Errores: `400 Bad Request` por query inválida; `401 INVALID_TOKEN`; `403 INSUFFICIENT_PERMISSIONS`.

## `POST /api/incident-reasons`

Los tres campos del cuerpo son obligatorios. **`active` no se acepta al crear**: el servidor guarda siempre el motivo como activo.

| Campo | Tipo | Validación |
| --- | --- | --- |
| `code` | texto | Obligatorio, no vacío, máximo 30 caracteres. Se recortan espacios y se convierte a mayúsculas antes de validar y guardar. Debe ser único. |
| `name` | texto | Obligatorio, no vacío, máximo 150 caracteres. Se recortan espacios. |
| `requiresEvidence` | booleano JSON | Obligatorio: `true` o `false` real, sin comillas. No se acepta `null`, `"true"`, `1` ni omitirlo. |

```bash
curl -X POST 'http://localhost:3000/api/incident-reasons' \
  -H 'Authorization: Bearer <accessToken>' \
  -H 'Content-Type: application/json' \
  -d '{"code":"INC-CLI-AUS","name":"Cliente ausente","requiresEvidence":true}'
```

Respuesta `201`: un `IncidentReasonDto` completo, como el ejemplo del modelo anterior, con `active: true` e `id` asignado por el servidor.

Errores: `400 Bad Request` por validación o campos no admitidos; `401 INVALID_TOKEN`; `403 INSUFFICIENT_PERMISSIONS`; `409 INCIDENT_REASON_CODE_ALREADY_EXISTS` si el código ya pertenece a otro motivo.

## `GET /api/incident-reasons/{id}`

Consulta por `id`, también cuando el motivo está desactivado. La respuesta `200` es un `IncidentReasonDto` completo con los seis campos del modelo.

```bash
curl 'http://localhost:3000/api/incident-reasons/1' \
  -H 'Authorization: Bearer <accessToken>'
```

Errores: `400 Bad Request` si el ID no es un entero positivo válido; `401 INVALID_TOKEN`; `403 INSUFFICIENT_PERMISSIONS`; `404 INCIDENT_REASON_NOT_FOUND` si no existe.

## `PUT /api/incident-reasons/{id}`

Actualización parcial: los cuatro campos son opcionales; se modifican solo los que se envían. Un cuerpo `{}` no cambia nada y devuelve el registro. Si un campo se envía con `null`, tipo incorrecto o valor inválido, responde `400` sin guardar cambios.

| Campo | Tipo | Validación y efecto |
| --- | --- | --- |
| `code` | texto | No vacío; máximo 30 caracteres; se recortan espacios y se convierte a mayúsculas. Debe seguir siendo único. |
| `name` | texto | No vacío; máximo 150 caracteres; se recortan espacios. |
| `requiresEvidence` | booleano JSON | Cambia si el motivo pide foto; `true` o `false` real. |
| `active` | booleano JSON | `false` desactiva el motivo para nuevos reportes; `true` lo reactiva. |

Ejemplo que incluye **todos los campos disponibles**, como el esquema de Swagger:

```bash
curl -X PUT 'http://localhost:3000/api/incident-reasons/1' \
  -H 'Authorization: Bearer <accessToken>' \
  -H 'Content-Type: application/json' \
  -d '{"code":"INC-CLI-AUS","name":"Cliente ausente","requiresEvidence":true,"active":false}'
```

Para desactivar únicamente, basta con `{"active":false}`. La respuesta `200` devuelve el `IncidentReasonDto` completo; en ambos ejemplos de desactivación, `active` será `false`.

Errores: `400 Bad Request` por validación, campos no admitidos o ID inválido; `401 INVALID_TOKEN`; `403 INSUFFICIENT_PERMISSIONS`; `404 INCIDENT_REASON_NOT_FOUND`; `409 INCIDENT_REASON_CODE_ALREADY_EXISTS` si el nuevo código ya se usa.

## Forma de los errores

El cuerpo de error tiene `statusCode`, `error`, `message`, `path` y `timestamp`. En errores de validación de campos, `message` es una lista; para un ID inválido o un error de negocio, es un texto. Por ejemplo, si el código ya existe:

```json
{
  "statusCode": 409,
  "error": "INCIDENT_REASON_CODE_ALREADY_EXISTS",
  "message": "An incident reason with this code already exists.",
  "path": "/api/incident-reasons",
  "timestamp": "2026-09-27T00:00:00.000Z"
}
```

`path` y `timestamp` reflejan la solicitud real. Aunque Swagger llama `INVALID_ID` a un ejemplo de respuesta `400`, el campo JSON `error` de ese ejemplo es `"Bad Request"`.

## Relación con incidencias

El catálogo entrega el `id` que se envía en `events[].incidentReasonId` de `POST /api/sync/events` cuando `events[].type` es `incident`. `requiresEvidence` es información para que la app móvil pida la foto al usuario; la evidencia se sincroniza mediante `POST /api/sync/evidences`, que tiene su propio contrato. Consulta ambas operaciones en [API.md](API.md). El servicio actual de sincronización de eventos recibe el ID del motivo, pero no consulta `active` ni `requiresEvidence` para validar el evento: el cliente debe aplicar esas reglas al ofrecer motivos y solicitar la foto.
