# Reschedule Reasons: motivos de reprogramación

Referencia revisada el 2026-09-28 contra el [Swagger local](http://localhost:3000/api/docs#/Reschedule%20Reasons) y el controlador, DTO y servicio del backend `../../backend/delivery-dispatch-svc` (commit `8abe7fa`). El contrato estructurado está en [openapi.json](openapi.json); la [guía general](API.md) reúne el resto de endpoints.

## Uso y permisos

- Base URL del Swagger consultado: `http://localhost:3000/api`.
- Todas las rutas requieren `Authorization: Bearer <accessToken>` y rol `coordinator`, `supervisor` o `root`. `admin` y `driver` no tienen acceso por su rol.
- `POST` y `PUT` reciben JSON con `Content-Type: application/json`.
- `id` en la ruta: entero entre 1 y 2147483647.
- No existe un endpoint `DELETE`. Para retirar un motivo se envía `{"active": false}` a `PUT /api/reschedule-reasons/{id}`; `true` lo reactiva. Las reprogramaciones ya registradas conservan el motivo.

| Método y ruta | Uso | Respuesta correcta |
| --- | --- | --- |
| `GET /api/reschedule-reasons` | Listar, buscar, filtrar y ordenar | `200` |
| `POST /api/reschedule-reasons` | Crear | `201` |
| `GET /api/reschedule-reasons/{id}` | Consultar uno, incluso desactivado | `200` |
| `PUT /api/reschedule-reasons/{id}` | Actualizar parcialmente, desactivar o reactivar | `200` |

## Modelo de respuesta

Cada motivo devuelto tiene **ocho campos**:

| Campo | Tipo | Regla |
| --- | --- | --- |
| `id` | entero | Identificador que se usa como `rescheduleReasonId` al registrar una reprogramación o reasignación. |
| `code` | texto | Código de referencia único, normalizado a mayúsculas. |
| `name` | texto | Nombre único mostrado en el panel de operaciones. |
| `description` | texto o `null` | Detalle opcional. |
| `category` | `client`, `operations`, `force_majeure` | Causa atribuida al cliente, a operaciones o a fuerza mayor. |
| `active` | booleano | `false` indica que no se debe ofrecer para nuevas reprogramaciones o reasignaciones. |
| `affectsSla` | booleano | **Calculado y de solo lectura:** el controlador devuelve `true` exactamente cuando `category` es `client`. No existe columna de base de datos ni se envía al crear o actualizar. Según la descripción del backend, esa categoría excluye la reprogramación de la métrica interna de puntualidad. |
| `createdAt` | fecha ISO 8601 UTC | Fecha de creación; solo lectura. |

**Discrepancia del Swagger:** su ejemplo de respuesta combina `category: "client"` con `affectsSla: false`. El controlador real asigna `reason.affectsSla = reason.category === "client"`, por lo que el valor para `client` es `true`. Los ejemplos de esta guía siguen el código ejecutado.

Ejemplo coherente de un motivo devuelto:

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

Los valores de ejemplo no representan un registro real de la base.

## `GET /api/reschedule-reasons`

Devuelve una página de motivos no eliminados. Sin filtros incluye activos e inactivos. Ordena por `name` ascendente y desempata por `id` ascendente.

| Parámetro query | Tipo | Predeterminado | Regla |
| --- | --- | --- | --- |
| `page` | entero | `1` | Entre 1 y 1000000. |
| `limit` | entero | `10` | Entre 1 y 100. |
| `search` | texto | Sin búsqueda | Máximo 100 caracteres; se recortan espacios. Coincidencia parcial en `code`, `name` o `description`, sin distinguir mayúsculas; `%` y `_` se interpretan literalmente. |
| `category` | `client`, `operations`, `force_majeure` | Sin filtro | Solo motivos de esa categoría; un valor ajeno responde `400`. |
| `active` | `true` o `false` | Sin filtro | `true`: activos; `false`: inactivos. Ausente o vacío no filtra; otro valor responde `400`. |
| `sortBy` | `code`, `name`, `category`, `createdAt` | `name` | Campo de orden. |
| `sortOrder` | `asc` o `desc` | `asc` | Dirección de orden; el valor se pasa a minúsculas. |

La búsqueda se puede combinar con `category` y `active` sin perder esos filtros.

```bash
curl 'http://localhost:3000/api/reschedule-reasons?search=cliente&category=client&active=true&page=1&limit=10&sortBy=name&sortOrder=asc' \
  -H 'Authorization: Bearer <accessToken>'
```

Respuesta `200`: `data` contiene motivos con los ocho campos descritos arriba; `meta` contiene `page`, `limit`, `pages` y `total`. `total` cuenta todos los registros que cumplen los filtros y `pages` vale `0` cuando no hay resultados.

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
  "meta": { "page": 1, "limit": 10, "pages": 1, "total": 1 }
}
```

Errores: `400 Bad Request` por query inválida; `401 INVALID_TOKEN`; `403 INSUFFICIENT_PERMISSIONS`.

## `POST /api/reschedule-reasons`

| Campo del JSON | Obligatorio | Validación y efecto |
| --- | --- | --- |
| `code` | Sí | Texto no vacío, máximo 30 caracteres. Se recortan espacios y se convierte a mayúsculas. Único entre motivos no eliminados. |
| `name` | Sí | Texto no vacío, máximo 150 caracteres. Se recortan espacios. También debe ser único. |
| `description` | No | Texto de máximo 255 caracteres. Si se omite, llega vacío o `null`, se guarda `null`. |
| `category` | Sí | Una de `client`, `operations`, `force_majeure`; se debe elegir explícitamente. |

`active` y `affectsSla` **no se aceptan** en este cuerpo. El motivo nuevo se crea con `active: true` y `affectsSla` se calcula a partir de la categoría.

```bash
curl -X POST 'http://localhost:3000/api/reschedule-reasons' \
  -H 'Authorization: Bearer <accessToken>' \
  -H 'Content-Type: application/json' \
  -d '{"code":"RES-CLI-EXP","name":"Solicitud expresa del cliente","description":"El cliente pidió mover la entrega a la tarde","category":"client"}'
```

Respuesta `201`: el modelo completo de ocho campos, como el ejemplo anterior. Errores: `400 Bad Request` por validación o campos no admitidos; `401 INVALID_TOKEN`; `403 INSUFFICIENT_PERMISSIONS`; `409 RESCHEDULE_REASON_CODE_ALREADY_EXISTS` si **el código o el nombre** ya pertenecen a otro motivo. El código del error `409` menciona `CODE`, pero también cubre nombre duplicado.

## `GET /api/reschedule-reasons/{id}`

Devuelve el modelo completo con los ocho campos, incluso si `active` es `false`.

```bash
curl 'http://localhost:3000/api/reschedule-reasons/1' \
  -H 'Authorization: Bearer <accessToken>'
```

Errores: `400 Bad Request` por ID inválido; `401 INVALID_TOKEN`; `403 INSUFFICIENT_PERMISSIONS`; `404 RESCHEDULE_REASON_NOT_FOUND` si no existe.

## `PUT /api/reschedule-reasons/{id}`

Actualiza solo los campos enviados. `{}` no cambia nada y devuelve el motivo actual. **Ningún campo se puede enviar como `null`, excepto `description`.** Si una validación falla, no se guarda ningún cambio.

| Campo del JSON | Obligatorio | Validación y efecto |
| --- | --- | --- |
| `code` | No | Texto no vacío, máximo 30 caracteres; se recorta y se convierte a mayúsculas. Debe seguir siendo único. |
| `name` | No | Texto no vacío, máximo 150 caracteres; se recorta. Debe seguir siendo único. |
| `description` | No | Texto de máximo 255 caracteres. `null` o texto vacío después del recorte borra la descripción y devuelve `null`. |
| `category` | No | `client`, `operations` o `force_majeure`; al cambiarla también cambia el valor calculado de `affectsSla`. |
| `active` | No | Booleano JSON real. `false` desactiva el motivo; `true` lo reactiva. |

Ejemplo con **todos los campos editables**:

```bash
curl -X PUT 'http://localhost:3000/api/reschedule-reasons/1' \
  -H 'Authorization: Bearer <accessToken>' \
  -H 'Content-Type: application/json' \
  -d '{"code":"RES-CLI-EXP","name":"Solicitud expresa del cliente","description":"El cliente pidió mover la entrega a la tarde","category":"operations","active":false}'
```

La respuesta `200` devuelve el modelo completo. En este ejemplo, `category` será `operations`, `active` será `false` y `affectsSla` será `false`. Para cambiar solo uno de ellos puede enviarse `{"active":false}` o `{"category":"operations"}`.

Errores: `400 Bad Request` por cuerpo o ID inválido; `401 INVALID_TOKEN`; `403 INSUFFICIENT_PERMISSIONS`; `404 RESCHEDULE_REASON_NOT_FOUND`; `409 RESCHEDULE_REASON_CODE_ALREADY_EXISTS` por código o nombre duplicado.

## Formato de error

El cuerpo usa `{ statusCode, error, message, path, timestamp }`. En validación de campos, `message` es una lista; para ID inválido o errores de negocio es un texto. El ejemplo llamado `INVALID_ID` en Swagger usa realmente `error: "Bad Request"`.
