#!/usr/bin/env bash
# Crea un dominio completo y lo engancha al router y al sidebar.
#   bash scripts/nuevo-dominio.sh clientes
set -euo pipefail

D="${1:-}"
[ -z "$D" ] && { echo "Uso: $0 <nombre-dominio>   (ej: clientes)"; exit 1; }
[ -d "src/domains/$D" ] && { echo "❌ El dominio '$D' ya existe"; exit 1; }

PASCAL="$(echo "$D" | awk -F- '{for(i=1;i<=NF;i++) printf toupper(substr($i,1,1)) substr($i,2); print ""}')"
SINGULAR="${PASCAL%s}"
CAMEL="$(echo "$PASCAL" | awk '{print tolower(substr($0,1,1)) substr($0,2)}')"

mkdir -p "src/domains/$D/services" "src/domains/$D/hooks" "src/domains/$D/components"

cat > "src/domains/$D/$D.types.ts" <<TYPES
// Tipos del dominio "$D" — refleja lo que devuelve el backend.
export interface $SINGULAR {
  id: number;
  nombre: string;
  activo: boolean;
  created_at?: string;
}
TYPES

cat > "src/domains/$D/$D.schemas.ts" <<SCHEMAS
import { z } from "zod";

export const ${CAMEL}Schema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres"),
  activo: z.boolean().default(true),
});

export type ${SINGULAR}Input = z.infer<typeof ${CAMEL}Schema>;
SCHEMAS

cat > "src/domains/$D/services/$D.service.ts" <<SVC
import { createCrudService } from "@/shared/lib/base.service";
import type { $SINGULAR } from "../$D.types";

export const ${CAMEL}Service = {
  ...createCrudService<$SINGULAR>("/$D"),
  // Endpoints que no son CRUD puro van aquí:
  // activar: (id: number) => api.post(\`/$D/\${id}/activar\`),
};
SVC

cat > "src/domains/$D/hooks/use-$D.ts" <<HOOK
import { useCrud } from "@/shared/hooks/use-crud";
import { ${CAMEL}Service } from "../services/$D.service";
import type { $SINGULAR } from "../$D.types";

/** Punto único de acceso a los datos de $D. */
export function use$PASCAL() {
  return useCrud<$SINGULAR>(${CAMEL}Service, "$D");
}
HOOK

cat > "src/domains/$D/index.ts" <<BARREL
// API pública del dominio "$D".
export { ${CAMEL}Service } from "./services/$D.service";
export { use$PASCAL } from "./hooks/use-$D";
export { ${CAMEL}Schema, type ${SINGULAR}Input } from "./$D.schemas";
export type { $SINGULAR } from "./$D.types";
BARREL

cat > "src/pages/dashboard/$D-page.tsx" <<PAGE
import { use$PASCAL, type $SINGULAR } from "@/domains/$D";
import { PageHeader } from "@/shared/components/common/page-header";
import { DataTable, type Column } from "@/shared/components/common/data-table";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";

const columns: Column<$SINGULAR>[] = [
  { header: "Nombre", cell: "nombre", className: "font-medium" },
  {
    header: "Estado",
    cell: (row) => (
      <Badge variant={row.activo ? "default" : "secondary"}>
        {row.activo ? "Activo" : "Inactivo"}
      </Badge>
    ),
  },
];

export default function ${PASCAL}Page() {
  const { data, loading } = use$PASCAL();

  return (
    <div className="space-y-6">
      <PageHeader
        title="$PASCAL"
        description={\`\${data.length} registros\`}
        action={<Button>Nuevo</Button>}
      />
      <DataTable columns={columns} data={data} loading={loading} />
    </div>
  );
}
PAGE

# ── Enganchar automáticamente en router.tsx y navigation.ts ──
R="src/app/router.tsx"
N="src/app/navigation.ts"

python3 - "$D" "$PASCAL" "$R" "$N" <<'PY'
import sys
d, pascal, router, nav = sys.argv[1:5]

s = open(router).read()
s = s.replace(
    "// LAZY_ANCHOR",
    f'const {pascal}Page = lazy(() => import("@/pages/dashboard/{d}-page"));\n// LAZY_ANCHOR',
)
s = s.replace(
    "{/* ROUTE_ANCHOR",
    f'<Route path="{d}" element={{<{pascal}Page />}} />\n              {{/* ROUTE_ANCHOR',
)
open(router, "w").write(s)

s = open(nav).read()
s = s.replace(
    "// NAV_ANCHOR",
    f'{{ title: "{pascal}", href: "/app/{d}", icon: LayoutDashboard, roles: [ROLES.ADMIN] }},\n      // NAV_ANCHOR',
)
open(nav, "w").write(s)
PY

echo "✅ Dominio '$D' creado y enganchado:"
echo "   src/domains/$D/              (index.ts, types, schemas, service, hook)"
echo "   src/pages/dashboard/$D-page.tsx"
echo "   ruta /app/$D  +  ítem en el sidebar"
echo ""
echo "Ajusta el icono y los roles en src/app/navigation.ts"
