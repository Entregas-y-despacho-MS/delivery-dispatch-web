"""Render docs/API.md from the backend's OpenAPI snapshot in docs/openapi.json."""

import json
import re
import subprocess
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT.parent / "backend" / "delivery-dispatch-svc"
SPEC = json.loads((ROOT / "docs/openapi.json").read_text())
SCHEMAS = SPEC["components"]["schemas"]
PROVENANCE = SPEC.get("x-documentation-provenance", {})
METHODS = {"get", "post", "put", "patch", "delete"}
OPERATIONS = [
    (path, method, operation)
    for path, item in SPEC["paths"].items()
    for method, operation in item.items()
    if method in METHODS
]
COMMIT = subprocess.check_output(
    ["git", "rev-parse", "--short", "HEAD"], cwd=BACKEND, text=True
).strip()

SPANISH_SUMMARIES = {
    "Login": "Iniciar sesión",
    "Register a new internal user": "Registrar usuario interno",
    "Refresh tokens": "Renovar tokens",
    "Logout": "Cerrar sesión",
    "Change own password": "Cambiar contraseña propia",
    "Request a password reset": "Solicitar recuperación de contraseña",
    "Reset password with a token": "Restablecer contraseña con token",
    "Start 2FA enrollment": "Iniciar activación de 2FA",
    "Confirm 2FA enrollment": "Confirmar activación de 2FA",
    "Disable 2FA": "Desactivar 2FA",
    "Application health": "Estado de salud del servicio",
    "Sync a batch of offline status-change/incident events": "Sincronizar eventos sin conexión",
    "Sync a delivery evidence (photo/signature/OTP)": "Sincronizar evidencia de entrega",
    "Report one or more GPS points captured while a route was active": "Reportar ubicaciones GPS",
    "List roles": "Listar roles",
    "Get a role by ID": "Consultar rol por ID",
    "List users": "Listar usuarios",
    "Create a user": "Crear usuario",
    "Get a user by ID": "Consultar usuario por ID",
    "Update a user": "Actualizar usuario",
    "Change a user's role": "Cambiar rol de usuario",
    "Delete a user": "Eliminar usuario",
    "List delivery zones": "Listar zonas de entrega",
    "Create a delivery zone": "Crear zona de entrega",
    "Get a delivery zone by ID": "Consultar zona por ID",
    "Update a delivery zone": "Actualizar zona",
    "Delete a delivery zone": "Eliminar zona",
    "List incident reasons": "Listar motivos de incidencia",
    "Get an incident reason by ID": "Consultar motivo de incidencia",
    "Create an incident reason": "Crear motivo de incidencia",
    "Update an incident reason": "Actualizar motivo de incidencia",
    "List reschedule reasons": "Listar motivos de reprogramación",
    "Get a reschedule reason by ID": "Consultar motivo de reprogramación",
    "Create a reschedule reason": "Crear motivo de reprogramación",
    "Update a reschedule reason": "Actualizar motivo de reprogramación",
    "List service levels": "Listar niveles de servicio",
    "Create a service level": "Crear nivel de servicio",
    "Get a service level by ID": "Consultar nivel por ID",
    "Update a service level": "Actualizar nivel",
    "Delete a service level": "Eliminar nivel",
    "List vehicles": "Listar vehículos",
    "Register a vehicle": "Registrar vehículo",
    "Get a vehicle by ID": "Consultar vehículo por ID",
    "Update a vehicle": "Actualizar vehículo",
    "Remove a vehicle from the fleet": "Retirar vehículo de la flota",
    "List settings": "Listar ajustes",
    "Update a setting": "Actualizar ajuste",
    "List vehicle incident types": "Listar tipos de incidente vehicular",
    "Get a vehicle incident type by ID": "Consultar tipo de incidente vehicular",
    "Create a vehicle incident type": "Crear tipo de incidente vehicular",
    "Update a vehicle incident type": "Actualizar tipo de incidente vehicular",
    "Register an incident on a vehicle": "Registrar incidente de vehículo",
}


def clean(value):
    return " ".join(str(value or "").split()).replace("|", "\\|")


def anchor(value):
    return re.sub(r"[^a-z0-9-]", "", re.sub(r"\s+", "-", value.lower()))


def type_name(schema):
    if "$ref" in schema:
        return schema["$ref"].split("/")[-1]
    if "allOf" in schema:
        return " + ".join(type_name(item) for item in schema["allOf"])
    if "oneOf" in schema:
        return " o ".join(type_name(item) for item in schema["oneOf"])
    if schema.get("type") == "array":
        return type_name(schema.get("items", {})) + "[]"
    result = schema.get("type", "objeto")
    if schema.get("format"):
        result += f" ({schema['format']})"
    if schema.get("nullable"):
        result += " / null"
    if schema.get("enum"):
        result += ": " + ", ".join(map(str, schema["enum"]))
    return result


def fields_table(schema):
    if not schema.get("properties"):
        return []
    rows = [
        "| Campo | Tipo | Obligatorio | Descripción y reglas |",
        "| --- | --- | --- | --- |",
    ]
    required = set(schema.get("required", []))
    limits = {
        "minimum": "mín.",
        "maximum": "máx.",
        "minLength": "longitud mín.",
        "maxLength": "longitud máx.",
        "minItems": "elementos mín.",
        "maxItems": "elementos máx.",
        "default": "defecto",
    }
    for name, field in schema["properties"].items():
        description = clean(field.get("description"))
        extras = [f"{label} {field[key]}" for key, label in limits.items() if key in field]
        if extras:
            description += ("; " if description else "") + "; ".join(extras)
        rows.append(
            f"| `{name}` | `{clean(type_name(field))}` | "
            f"{'Sí' if name in required else 'No'} | {description} |"
        )
    return rows


def resolve_schema(schema):
    """Follow OpenAPI references and allOf wrappers without losing local metadata."""
    if "$ref" in schema:
        name = schema["$ref"].split("/")[-1]
        return {**SCHEMAS[name], **{k: v for k, v in schema.items() if k != "$ref"}}
    if "allOf" in schema:
        merged = {k: v for k, v in schema.items() if k != "allOf"}
        for part in schema["allOf"]:
            resolved = resolve_schema(part)
            merged["properties"] = {**merged.get("properties", {}), **resolved.get("properties", {})}
            merged["required"] = list(dict.fromkeys(merged.get("required", []) + resolved.get("required", [])))
        return merged
    return schema


def schema_from_example(value):
    """Describe inline Swagger examples such as the health-check response."""
    if isinstance(value, dict):
        return {
            "type": "object",
            "properties": {key: schema_from_example(item) for key, item in value.items()},
            "required": list(value),
        }
    if isinstance(value, list):
        return {"type": "array", "items": schema_from_example(value[0]) if value else {}}
    if value is None:
        return {"type": "objeto", "nullable": True}
    if isinstance(value, bool):
        return {"type": "boolean", "example": value}
    if isinstance(value, int):
        return {"type": "integer", "example": value}
    if isinstance(value, float):
        return {"type": "number", "example": value}
    return {"type": "string", "example": value}


def constraints(schema):
    labels = {
        "minimum": "mín.", "maximum": "máx.", "minLength": "longitud mín.",
        "maxLength": "longitud máx.", "minItems": "elementos mín.",
        "maxItems": "elementos máx.", "default": "defecto",
    }
    parts = [f"{label} {schema[key]}" for key, label in labels.items() if key in schema]
    if "example" in schema and not isinstance(schema["example"], (dict, list)):
        parts.append("ejemplo: " + json.dumps(schema["example"], ensure_ascii=False))
    return "; ".join(parts)


def flatten_fields(schema, prefix="", parent_required=True, depth=0, seen=None):
    """List every exposed nested request/response field with its full JSON path."""
    if depth > 6:
        return []
    seen = set() if seen is None else seen
    if "$ref" in schema:
        name = schema["$ref"].split("/")[-1]
        if name in seen:
            return []
        seen = seen | {name}
    schema = resolve_schema(schema)
    if not schema.get("properties") and isinstance(schema.get("example"), dict):
        schema = schema_from_example(schema["example"])
    if schema.get("type") == "array":
        return flatten_fields(schema.get("items", {}), prefix + "[]", parent_required, depth + 1, seen)
    required = set(schema.get("required", []))
    rows = []
    for name, field in schema.get("properties", {}).items():
        path = f"{prefix}.{name}" if prefix else name
        is_required = name in required
        requirement = "Sí" if is_required and parent_required else "No" if not is_required else "Si existe el objeto padre"
        detail = clean(field.get("description"))
        rule = constraints(field)
        if rule:
            detail = detail.rstrip(".;") + ("; " if detail else "") + rule
        if name == "affectsSla":
            detail += "; nota: el ejemplo `false` para `category=client` contradice el controlador, que devuelve `true`"
        rows.append((path, type_name(field), requirement, detail))
        nested_prefix = path + "[]" if field.get("type") == "array" else path
        nested = field.get("items", {}) if field.get("type") == "array" else field
        rows.extend(flatten_fields(nested, nested_prefix, is_required and parent_required, depth + 1, seen))
    return rows


def detailed_fields_table(schema, field_label="Campo JSON"):
    rows = flatten_fields(schema)
    if not rows:
        return []
    result = [f"| {field_label} | Tipo | Obligatorio | Descripción y reglas |", "| --- | --- | --- | --- |"]
    result.extend(f"| `{path}` | `{clean(kind)}` | {required} | {description} |" for path, kind, required, description in rows)
    return result


def sample_from_schema(schema, depth=0, seen=None, only_required=False):
    """Build an illustrative payload from Swagger field examples, not from live data."""
    if depth > 6:
        return None
    if "example" in schema:
        return schema["example"]
    seen = set() if seen is None else seen
    ref_name = schema.get("$ref", "").split("/")[-1]
    if ref_name:
        name = ref_name
        if name in seen:
            return None
        seen = seen | {name}
    schema = resolve_schema(schema)
    if schema.get("type") == "array":
        return [sample_from_schema(schema.get("items", {}), depth + 1, seen, only_required)]
    if schema.get("properties"):
        properties = schema["properties"]
        if only_required:
            required = set(schema.get("required", []))
            selected = [key for key in properties if key in required]
            if not selected:
                selected = [next(iter(properties))]
        else:
            selected = list(properties)
        sample = {
            key: sample_from_schema(properties[key], depth + 1, seen, only_required)
            for key in selected
        }
        if ref_name == "RescheduleReasonDto":
            # The controller computes this field; Swagger's field example is
            # inconsistent with its own example category=client.
            sample["affectsSla"] = sample["category"] == "client"
        return sample
    if schema.get("enum"):
        return schema["enum"][0]
    if "default" in schema:
        return schema["default"]
    if schema.get("nullable"):
        return None
    if schema.get("type") in ("integer", "number"):
        return 0
    if schema.get("type") == "boolean":
        return False
    if schema.get("format") == "date-time":
        return "2026-01-01T00:00:00.000Z"
    if "QR code data URL" in schema.get("description", ""):
        return "data:image/png;base64,<PNG-en-base64>"
    if schema.get("type") == "string":
        return "texto"
    return {}


def error_rows(operation):
    rows = []
    for status, response in operation["responses"].items():
        if status.startswith("2"):
            continue
        media = response.get("content", {}).get("application/json", {})
        examples = media.get("examples", {})
        if examples:
            for _key, example in examples.items():
                value = example.get("value", {})
                code = value.get("error", "—")
                message = value.get("message", response.get("description", ""))
                if isinstance(message, list):
                    message = "; ".join(message)
                rows.append((status, code, clean(message)))
        else:
            value = media.get("schema", {}).get("example", {})
            rows.append((status, value.get("error", "—"), clean(value.get("message") or response.get("description"))))
    return rows


def access(operation):
    if not operation.get("security"):
        return "Público"
    forbidden = operation.get("responses", {}).get("403", {}).get("description", "")
    if forbidden.startswith("Requires one of: "):
        return "JWT Bearer; roles: " + forbidden.removeprefix("Requires one of: ").rstrip(".") + " (o root)"
    return "JWT Bearer"


def errors(operation):
    parts = []
    for status, response in operation["responses"].items():
        if status.startswith("2"):
            continue
        media = response.get("content", {}).get("application/json", {})
        labels = []
        for code in media.get("examples", {}):
            labels.append(
                "validación" if code == "VALIDATION_FAILED" else
                "ID inválido" if code == "INVALID_ID" else f"`{code}`"
            )
        if not labels:
            code = media.get("schema", {}).get("example", {}).get("error")
            labels = [f"`{code}`"] if code else [clean(response.get("description")) or "ver OpenAPI"]
        parts.append(f"`{status}` " + ", ".join(labels))
    return "; ".join(parts)


lines = [
    "# API de Delivery Dispatch", "",
    "Referencia para implementar clientes y reutilizar en otros chats del mismo proyecto. "
    f"Fuente: `../../backend/delivery-dispatch-svc/src`, commit `{COMMIT}`; "
    f"generada el {date.today().isoformat()}. La especificación completa está en "
    "[openapi.json](openapi.json).", "",
    f"**Cobertura:** {len(OPERATIONS)} operaciones HTTP, {len(SPEC['paths'])} rutas y "
    f"{len(SCHEMAS)} esquemas. Se contrastaron las rutas y modelos con el Swagger disponible "
    "y los decoradores del backend. Los ejemplos se generaron desde los DTO; "
    "no se ejecutaron operaciones contra la base de datos.", "",
    "Las descripciones de reglas y campos conservan el texto original de Swagger en inglés; "
    "el índice, la estructura y las notas de uso están en español.", "",
    "**Guías detalladas por catálogo:** [Motivos de incidencia / Incident Reasons](INCIDENT_REASONS.md), "
    "[Motivos de reprogramación / Reschedule Reasons](RESCHEDULE_REASONS.md) e "
    "[Incidentes vehiculares y mantenimiento](VEHICLE_INCIDENTS.md).", "",
    "## Uso rápido", "",
    "- URL base del enlace proporcionado: `http://localhost:3000/api`; Swagger: "
    "`http://localhost:3000/api/docs/`. El backend usa el puerto 3000 y el prefijo "
    "`api` por defecto, mientras que `.env.example` de esta web apunta a "
    "`http://localhost:3001/api`. Usa la dirección donde esté ejecutándose el backend.",
    "- Para operaciones protegidas, enviar `Authorization: Bearer <accessToken>`. "
    "Obtenerlo con `POST /api/auth/login` y renovarlo con `POST /api/auth/refresh`.",
    "- Los roles no se heredan entre sí. `root` puede acceder a rutas limitadas por rol; "
    "los demás roles solo a las que indiquen sus permisos.",
    "- En operaciones con `id`, usar un entero positivo. Las listas paginadas usan "
    "`page=1` y `limit=10` por defecto (máximo 100).",
    "- Los errores tienen `{ statusCode, error, message, path, timestamp }`; "
    "`message` es una lista para validación y texto para errores de negocio. "
    "Las tablas de errores enumeran cada ejemplo que publica Swagger.",
    "- Puede haber `429` por límite de peticiones; el límite es más estricto en "
    "cambio de contraseña y 2FA. Algunos `403` de negocio se detallan debajo de su "
    "endpoint aunque Swagger solo muestre el ejemplo genérico.",
    "- Cuando `mustChangePassword` sea `true`, cambiar la contraseña con "
    "`PATCH /api/auth/change-password`; también se permite `POST /api/auth/logout`. "
    "Otras rutas protegidas responden 403 `PASSWORD_CHANGE_REQUIRED`.", "",
    "```bash",
    "curl -X POST http://localhost:3000/api/auth/login \\",
    '  -H "Content-Type: application/json" \\',
    "  -d '{\"username\":\"usuario\",\"password\":\"ContraseñaSegura1!\"}'", "",
    "curl http://localhost:3000/api/users \\",
    '  -H "Authorization: Bearer <accessToken>"',
    "```", "",
    "## Roles y acceso", "",
    "Los IDs de roles se consultan con `GET /api/roles`; usa el `id` devuelto para "
    "`roleId`. Los roles comunes no heredan permisos entre sí. Todas las personas "
    "autenticadas pueden cerrar sesión, cambiar su propia contraseña y administrar su 2FA.", "",
    "| Rol | Acceso específico publicado en Swagger |",
    "| --- | --- |",
    "| `root` | Todas las rutas protegidas; solo root administra cuentas y rol root. |",
    "| `admin` | Usuarios (excepto root), lectura de roles, ajustes. |",
    "| `coordinator` | Lectura de usuarios y roles; zonas, vehículos, niveles de servicio, motivos de incidencia y reprogramación, tipos de incidente vehicular y registro de mantenimiento. |",
    "| `supervisor` | Vehículos, motivos de incidencia y reprogramación, tipos de incidente vehicular y registro de mantenimiento. |",
    "| `driver` | Sincronización de eventos/evidencias, reporte GPS y lectura de motivos de incidencia. |", "",
    "## Índice de operaciones", "",
    "| Método | Ruta | Propósito | Acceso |",
    "| --- | --- | --- | --- |",
]

if PROVENANCE.get("note"):
    lines[8:8] = [f"**Estado del Swagger local:** {PROVENANCE['note']}", ""]

for path, method, operation in OPERATIONS:
    title = f"{method.upper()} {path}"
    purpose = SPANISH_SUMMARIES.get(operation.get("summary"), operation.get("summary", ""))
    lines.append(
        f"| `{method.upper()}` | [`{path}`](#{anchor(title)}) | "
        f"{clean(purpose)} | {clean(access(operation)).removeprefix('JWT Bearer; roles: ')} |"
    )

lines += ["", "## Endpoints", ""]
current_tag = None
for path, method, operation in OPERATIONS:
    tag = operation.get("tags", ["Otros"])[0]
    if tag != current_tag:
        lines += [f"### {tag}", ""]
        if tag == "Incident Reasons":
            lines += ["Guía en español con validaciones y ejemplos completos: [Incident Reasons](INCIDENT_REASONS.md).", ""]
        if tag == "Reschedule Reasons":
            lines += [
                "Guía en español con validaciones y ejemplos completos: [Reschedule Reasons](RESCHEDULE_REASONS.md).", "",
                "**Nota de consistencia:** el Swagger muestra `affectsSla: false` junto con "
                "`category: client` en su ejemplo, pero el controlador devuelve `true` para "
                "esa categoría. Los ejemplos ilustrativos de esta guía siguen el controlador.", "",
            ]
        if tag in ("Vehicle Incident Types", "Vehicle Maintenances"):
            lines += ["Guía en español: [Incidentes vehiculares y mantenimiento](VEHICLE_INCIDENTS.md).", ""]
        current_tag = tag
    lines += [
        f"#### {method.upper()} {path}", "",
        "**Función.** " + clean(operation.get("description") or operation.get("summary")), "",
        f"**Acceso:** {access(operation)}.", "",
    ]
    parameters = operation.get("parameters", [])
    if parameters:
        lines += [
            "**Parámetros:**", "",
            "| Lugar | Nombre | Tipo | Obligatorio | Descripción | Restricciones / ejemplo |",
            "| --- | --- | --- | --- | --- | --- |",
        ]
        for parameter in parameters:
            lines.append(
                f"| {parameter.get('in')} | `{parameter['name']}` | "
                f"`{clean(type_name(parameter.get('schema', {})))}` | "
                f"{'Sí' if parameter.get('required') else 'No'} | "
                f"{clean(parameter.get('description'))} | "
                f"{clean(constraints(parameter.get('schema', {})))} |"
            )
        lines.append("")
    for media_type, content in operation.get("requestBody", {}).get("content", {}).items():
        schema = content["schema"]
        name = type_name(schema)
        body = f"**Cuerpo de solicitud:** `{media_type}`"
        if "$ref" in schema:
            body += f"; esquema [`{name}`](#{anchor(name)})"
        lines += [body + ".", ""]
        field_label = "Campo form-data" if media_type == "multipart/form-data" else "Campo JSON"
        lines += detailed_fields_table(schema, field_label) + [""]
        examples = content.get("examples", {})
        if media_type == "multipart/form-data" and path == "/api/sync/evidences":
            lines += [
                "Ejemplo para una foto (para `type=otp`, enviar `otpCode` en lugar de `file`):", "",
                "```bash",
                "curl -X POST http://localhost:3000/api/sync/evidences \\",
                '  -H "Authorization: Bearer <accessToken>" \\',
                '  -F "clientEventId=01933b6e-7f2a-7c3d-9a1b-2f8e6c4d5a10" \\',
                '  -F "dispatchId=42" -F "type=photo" -F "file=@foto.jpg"',
                "```", "",
            ]
        else:
            example = next(iter(examples.values()))["value"] if examples else sample_from_schema(schema, only_required=True)
            label = "Ejemplo del Swagger:" if examples else "Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:"
            if method == "put" and path in ("/api/incident-reasons/{id}", "/api/reschedule-reasons/{id}", "/api/vehicle-incident-types/{id}") and not examples:
                example = sample_from_schema(schema)
            lines += [label, "", "```json", json.dumps(example, ensure_ascii=False, indent=2), "```", ""]
    successes = []
    for status, response in operation["responses"].items():
        if not status.startswith("2"):
            continue
        media = response.get("content", {}).get("application/json", {})
        schema = media.get("schema")
        value = f"`{status}` → `{type_name(schema)}`" if schema else f"`{status}` → sin cuerpo"
        if response.get("description"):
            value += f" ({clean(response['description'])})"
        successes.append(value)
        lines += ["**Respuesta correcta:** " + value + ".", ""]
        if schema:
            lines += detailed_fields_table(schema) + [""]
            examples = media.get("examples", {})
            example = next(iter(examples.values()))["value"] if examples else sample_from_schema(schema)
            label = "Ejemplo del Swagger:" if examples or "example" in schema else "Ejemplo ilustrativo armado con los ejemplos de campos del Swagger:"
            lines += [label, "", "```json", json.dumps(example, ensure_ascii=False, indent=2), "```", ""]
    if len(operation["responses"]) > len(successes):
        lines += [
            "**Errores y códigos:**", "",
            "| HTTP | `error` | `message` de ejemplo |",
            "| --- | --- | --- |",
        ]
        for status, code, message in error_rows(operation):
            lines.append(f"| `{status}` | `{code}` | {message} |")
        lines.append("")
        if path == "/api/sync/evidences":
            lines += ["Un archivo de más de 10 MB responde `413`, según el controlador.", ""]
    if path == "/api/tracking/locations":
        lines += [
            "**Regla adicional del servicio:** un `recordedAt` más de 2 minutos en el futuro "
            "produce `outcome: \"failed\"` para ese punto; no cancela los demás. "
            "Los puntos se aplican en orden cronológico, pero `results` se devuelve en el "
            "mismo orden de la solicitud.", "",
        ]
    if path == "/api/users/{id}" and method == "put":
        lines += [
            "**Cambio de rol:** `roleId` no forma parte de este cuerpo. "
            "Usa `PATCH /api/users/{id}/role` para cambiarlo.", "",
        ]
    business_403 = {
        ("post", "/api/auth/register"): ["ROOT_ACCOUNT_PROTECTED: solo root puede crear una cuenta root"],
        ("put", "/api/users/{id}"): [
            "ROOT_ACCOUNT_PROTECTED: solo root puede modificar una cuenta root",
            "CANNOT_MODIFY_OWN_ACCOUNT: no puedes desactivar tu propia cuenta",
        ],
        ("delete", "/api/users/{id}"): [
            "ROOT_ACCOUNT_PROTECTED: solo root puede eliminar una cuenta root",
            "CANNOT_MODIFY_OWN_ACCOUNT: no puedes eliminar tu propia cuenta",
        ],
        ("patch", "/api/users/{id}/role"): [
            "ROOT_ACCOUNT_PROTECTED: solo root puede asignar o retirar el rol root",
            "CANNOT_MODIFY_OWN_ACCOUNT: no puedes cambiar tu propio rol",
        ],
    }
    if (method, path) in business_403:
        lines += [
            "**Otros `403` de negocio descritos por el controlador:** "
            + "; ".join(f"`{item.split(':', 1)[0]}`: {item.split(': ', 1)[1]}" for item in business_403[(method, path)])
            + ".", "",
        ]

lines += [
    "## Claves de configuración", "",
    "`GET /api/settings` devuelve las claves existentes en la base de datos; "
    "`PUT /api/settings/{key}` recibe `{\"value\": \"...\"}`. Los valores se envían "
    "siempre como texto. La tabla combina los valores iniciales de "
    "`../../backend/delivery-dispatch-db/schema/settings/data.sql` con las reglas actuales "
    "de `setting-value.validator.ts`. Una base de datos en ejecución puede tener valores "
    "distintos a los iniciales.", "",
    "| `key` | Valor inicial | Valor aceptado |",
    "| --- | --- | --- |",
    "| `delivery_window_start` | `08:00` | Hora `HH:mm`, `00:00` a `23:59` |",
    "| `delivery_window_end` | `20:00` | Hora `HH:mm`, `00:00` a `23:59` |",
    "| `max_wait_time_min` | `15` | Entero de 1 a 1440 minutos |",
    "| `sla_alert_threshold_pct` | `90` | Entero de 1 a 100 % |",
    "| `password_min_length` | `8` | Entero de 8 a 128 caracteres |",
    "| `password_expiration_days` | `90` | Entero de 1 a 3650 días |",
    "| `otp_code_length` | `6` | Entero de 4 a 10 dígitos |",
    "| `otp_expiry_minutes` | `60` | Entero de 1 a 1440 minutos |",
    "| `max_failed_login_attempts` | `5` | Entero de 1 a 100 intentos |",
    "| `account_lockout_minutes` | `15` | Entero de 1 a 10080 minutos |",
    "| `password_reset_expiry_minutes` | `30` | Entero de 1 a 1440 minutos |",
    "| `session_inactivity_minutes` | `30` | Entero de 1 a 10080 minutos; no aplica al repartidor en ruta |", "",
    "## WebSocket: seguimiento en vivo", "",
    "Socket.IO usa el namespace `app` por defecto (`WEBSOCKET_NAMESPACE` puede cambiarlo). "
    "Conectar a `http://localhost:3000/app` con `auth: { token: accessToken }` en el handshake "
    "o con el encabezado `Authorization: Bearer <accessToken>`. Un token inválido causa "
    "desconexión inmediata. En producción usar la URL y el protocolo TLS del servidor.", "",
    "| Evento recibido | Quién lo recibe | Cuerpo | Origen |",
    "| --- | --- | --- | --- |",
    "| `dispatch.location.updated` | `root`, `admin`, `coordinator`, `supervisor` "
    "(sala `dispatch-board`, asignada al conectar) | "
    "`{ dispatchId, latitude, longitude, recordedAt }` | Se emite cuando "
    "`POST /api/tracking/locations` guarda un punto nuevo. |", "",
    "El repartidor reporta sus ubicaciones por REST. No recibe este evento de tablero. "
    "WebSocket no aparece como operación en OpenAPI.", "",
    "## Esquemas de datos", "",
    "Los campos y restricciones siguientes provienen de Swagger. `openapi.json` contiene "
    "los ejemplos, las estructuras anidadas y los formatos exactos.", "",
]
for name, schema in SCHEMAS.items():
    lines += [f"### {name}", ""]
    if schema.get("description"):
        lines += [clean(schema["description"]), ""]
    table = fields_table(schema)
    lines += table + [""] if table else [f"Tipo: `{type_name(schema)}`.", ""]

(ROOT / "docs/API.md").write_text("\n".join(lines), encoding="utf-8")
print(f"Rendered {len(OPERATIONS)} operations and {len(SCHEMAS)} schemas")
