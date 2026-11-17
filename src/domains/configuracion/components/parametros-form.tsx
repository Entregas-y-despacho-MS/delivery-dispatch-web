import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleDashed, LoaderCircle, Save, TriangleAlert, Undo2, WandSparkles } from "lucide-react";
import { useForm } from "react-hook-form";

import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { StatusBadge } from "@/shared/components/common/status-badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { cn } from "@/shared/lib/utils";
import { GRUPOS_PARAMETROS, type CampoParametro } from "../configuracion.grupos";
import { CLAVES_PARAMETROS_OPERATIVOS, crearParametrosSchema, type ParametrosFormValues } from "../schemas/configuracion.schemas";
import type { ClaveParametroOperativo, EstadoValorParametro } from "../types/configuracion.types";
import type { ErrorGuardado } from "../hooks/use-configuracion";

function EstadoBadge({ estado }: { estado: EstadoValorParametro }) {
  if (estado === "propuesto") {
    return (
      <StatusBadge tone="warning" icon={<WandSparkles aria-hidden />}>Propuesto</StatusBadge>
    );
  }
  if (estado === "sin-definir") {
    return (
      <StatusBadge tone="muted" icon={<CircleDashed aria-hidden />}>Sin definir</StatusBadge>
    );
  }
  return null;
}

interface ParametrosFormProps {
  valores: ParametrosFormValues;
  estados: Record<ClaveParametroOperativo, EstadoValorParametro>;
  clavesSinDefinir: ReadonlySet<ClaveParametroOperativo>;
  ventanaGeneral?: { inicio: string; fin: string };
  onGuardar: (valores: ParametrosFormValues) => Promise<ErrorGuardado | null>;
  guardando?: boolean;
}

/**
 * Formulario de parámetros operativos (ST-57.1). Valida al escribir: cada error sale bajo su campo
 * y el botón de guardar queda bloqueado mientras exista alguno.
 */
export function ParametrosForm({
  valores,
  estados,
  clavesSinDefinir,
  ventanaGeneral,
  onGuardar,
  guardando = false,
}: ParametrosFormProps) {
  const esquema = useMemo(
    () => crearParametrosSchema({ ventanaGeneral, clavesSinDefinir }),
    [ventanaGeneral, clavesSinDefinir],
  );
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty, isValid },
  } = useForm<ParametrosFormValues>({
    resolver: zodResolver(esquema),
    // Al guardar se vuelven a cargar los valores del back y el formulario se actualiza solo.
    values: valores,
    mode: "onChange",
  });

  const enviar = handleSubmit(async (nuevos) => {
    const error = await onGuardar(nuevos);
    if (!error) return;
    if (error.clave) setError(error.clave, { message: error.mensaje }, { shouldFocus: true });
    else setError("root", { message: error.mensaje });
  });

  const renderCampo = (campo: CampoParametro) => {
    const id = `parametro-${campo.clave}`;
    const error = errors[campo.clave]?.message;
    // Las reglas entre campos (ventanas, plazos, cadenas de horas) marcan el error en OTRO campo: al
    // cambiar el corte de rutas, el error sale bajo el fin de la revisión. Por eso `deps` revalida todos.
    return (
      <div key={campo.clave} className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label htmlFor={id}>{campo.etiqueta}</Label>
          <EstadoBadge estado={estados[campo.clave]} />
        </div>
        <div className="relative">
          <Input
            id={id}
            type={campo.tipo === "hora" ? "time" : "text"}
            inputMode={campo.tipo === "numero" ? "numeric" : undefined}
            placeholder={campo.ejemplo ?? (clavesSinDefinir.has(campo.clave) ? "Sin definir" : undefined)}
            autoComplete="off"
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : `${id}-ayuda`}
            className={cn("h-11", campo.unidad && "pr-20")}
            {...register(campo.clave, { deps: CLAVES_PARAMETROS_OPERATIVOS })}
          />
          {campo.unidad && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {campo.unidad}
            </span>
          )}
        </div>
        {error ? (
          <p id={`${id}-error`} role="alert" className="flex items-start gap-1.5 text-sm text-destructive">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden /> {error}
          </p>
        ) : (
          <p id={`${id}-ayuda`} className="text-sm text-muted-foreground">{campo.ayuda}</p>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={enviar} className="space-y-6" noValidate>
      {errors.root?.message && (
        <Alert variant="destructive">
          <TriangleAlert aria-hidden />
          <AlertDescription>{errors.root.message}</AlertDescription>
        </Alert>
      )}

      {GRUPOS_PARAMETROS.map((grupo) => (
        <section
          key={grupo.id}
          aria-labelledby={`grupo-${grupo.id}`}
          className="rounded-xl border bg-card p-4 shadow-sm sm:p-5"
        >
          <div className="mb-4 space-y-1 border-b pb-3">
            <h2 id={`grupo-${grupo.id}`} className="font-semibold">{grupo.titulo}</h2>
            <p className="text-sm text-muted-foreground">{grupo.descripcion}</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{grupo.campos.map(renderCampo)}</div>
        </section>
      ))}

      <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t bg-background/95 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-end">
        {isDirty && !isValid && (
          <p className="text-sm text-destructive sm:mr-auto" role="status">Corrige los campos marcados para poder guardar.</p>
        )}
        <Button type="button" variant="outline" disabled={!isDirty || guardando} onClick={() => reset(valores)}>
          <Undo2 aria-hidden /> Descartar cambios
        </Button>
        <Button type="submit" disabled={!isDirty || !isValid || guardando}>
          {guardando ? <LoaderCircle className="animate-spin" aria-hidden /> : <Save aria-hidden />}
          {guardando ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
