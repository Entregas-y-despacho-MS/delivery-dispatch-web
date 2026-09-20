# domains/

Un subdirectorio por módulo de negocio. Cada dominio es autocontenido:

```
domains/<dominio>/
├── index.ts               API PÚBLICA — lo único que otros pueden importar
├── <dominio>.types.ts     tipos tal como los devuelve el backend
├── <dominio>.schemas.ts   esquemas Zod de este dominio
├── services/*.service.ts  llamadas HTTP
├── hooks/use-*.ts         lógica de negocio reutilizable
└── components/*.tsx       componentes que solo usa este dominio
```

## Reglas

1. **Dependencias en un solo sentido:** `pages/ → domains/ → shared/`.
   Nunca al revés. Lo hace cumplir oxlint.
2. **Siempre por el barrel:** `import { clientesService } from "@/domains/clientes"`.
   Nunca `@/domains/clientes/services/clientes.service`.
3. **Un dominio no importa de otro dominio.** Si lo necesitas, o el código
   es realmente compartido (sube a `shared/`), o los dos dominios eran uno solo.
4. **Archivos en kebab-case**, componentes exportados en PascalCase.

Para crear uno:

    bash scripts/nuevo-dominio.sh clientes
