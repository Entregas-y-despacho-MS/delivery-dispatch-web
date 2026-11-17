# Contexto de la API

Antes de implementar o modificar integraciones con el backend, consulta `docs/API.md` y `docs/openapi.json`. Contienen una instantánea de los endpoints de `../backend/delivery-dispatch-svc`. Si el backend cambia, verifica el código fuente actual antes de confiar en la instantánea.

Para integrar motivos de incidencia, consulta también `docs/INCIDENT_REASONS.md`: documenta los filtros, las validaciones y todos los campos de lectura, creación y actualización.

Para integrar motivos de reprogramación, consulta también `docs/RESCHEDULE_REASONS.md`: incluye `code`, el campo calculado `affectsSla`, los filtros, las validaciones y los cuatro endpoints.

Para integrar tipos de incidente vehicular y registro de mantenimiento, consulta `docs/VEHICLE_INCIDENTS.md`. Sus cinco endpoints ya figuran en el Swagger local y en `docs/openapi.json`.

Después de renovar `docs/openapi.json`, ejecuta `python3 scripts/render-api-docs.py` para actualizar la guía Markdown.
