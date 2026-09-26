import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Gauge, LoaderCircle, Timer } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/shared/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { nivelServicioSchema, type NivelServicioFormValues } from "../catalogos.schemas";
import type { NivelServicio } from "../catalogos.types";

const FIELD_ICON = "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground";

export function NivelServicioForm({
  nivel,
  onSubmit,
  onCancel,
  guardando = false,
}: {
  nivel?: NivelServicio;
  onSubmit: (values: NivelServicioFormValues) => Promise<void>;
  onCancel: () => void;
  guardando?: boolean;
}) {
  const form = useForm<NivelServicioFormValues>({
    resolver: zodResolver(nivelServicioSchema),
    defaultValues: {
      name: nivel?.name ?? "",
      description: nivel?.description ?? "",
      targetTimeMinutes: nivel?.targetTimeMinutes ?? 120,
      priority: nivel?.priority ?? "medium",
    },
    mode: "onTouched",
    reValidateMode: "onChange",
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <div className="relative">
                  <Gauge className={FIELD_ICON} aria-hidden />
                  <Input {...field} className="h-11 pl-10" placeholder="Express" maxLength={80} autoComplete="off" />
                </div>
              </FormControl>
              <FormDescription>Identifica el compromiso de entrega para el equipo.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="targetTimeMinutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tiempo objetivo</FormLabel>
              <FormControl>
                <div className="relative">
                  <Timer className={FIELD_ICON} aria-hidden />
                  <Input
                    {...field}
                    type="number"
                    inputMode="numeric"
                    min={15}
                    max={1440}
                    step={15}
                    className="h-11 pl-10 pr-14 tabular-nums"
                    placeholder="120"
                    onChange={(event) => field.onChange(event.target.valueAsNumber)}
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                    min
                  </span>
                </div>
              </FormControl>
              <FormDescription>Entre 15 minutos y 24 horas.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Descripción
            </FormLabel>
            <FormControl>
              <div className="relative">
                <FileText className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden />
                <Textarea {...field} className="min-h-24 pl-10" placeholder="Entrega prioritaria para pedidos urgentes" maxLength={180} />
              </div>
            </FormControl>
            <FormDescription>Ayuda al equipo a elegir el nivel correcto.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="priority"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Rango de prioridad</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue placeholder="Selecciona una prioridad" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="high">Alta · rango 1–10</SelectItem>
                <SelectItem value="medium">Media · rango 11–50</SelectItem>
                <SelectItem value="low">Baja · rango 51–100</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>Se utilizará para ordenar y priorizar los despachos.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={guardando}>
          Cancelar
        </Button>
        <Button type="submit" disabled={guardando}>
          {guardando && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
          {guardando ? "Guardando…" : nivel ? "Guardar cambios" : "Crear nivel"}
        </Button>
      </div>
    </form>
  );
}
