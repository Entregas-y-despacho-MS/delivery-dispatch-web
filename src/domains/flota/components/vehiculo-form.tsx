import { zodResolver } from "@hookform/resolvers/zod";
import { Gauge, Hash, LoaderCircle, Package, Truck } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { vehiculoSchema, type VehiculoFormValues } from "../flota.schemas";
import type { Vehiculo } from "../flota.types";

const FIELD_ICON = "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground";

export function VehiculoForm({
  vehiculo,
  onSubmit,
  onCancel,
  guardando = false,
}: {
  vehiculo?: Vehiculo;
  onSubmit: (values: VehiculoFormValues) => Promise<void>;
  onCancel: () => void;
  guardando?: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VehiculoFormValues>({
    resolver: zodResolver(vehiculoSchema),
    defaultValues: {
      type: vehiculo?.type ?? "",
      model: vehiculo?.model ?? "",
      plate: vehiculo?.plate ?? "",
      capacityKg: vehiculo?.capacityKg ?? undefined,
      capacityM3: vehiculo?.capacityM3 ?? undefined,
    },
    mode: "onTouched",
    reValidateMode: "onChange",
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="vehiculo-type">Tipo</Label>
          <div className="relative">
            <Truck className={FIELD_ICON} aria-hidden />
            <Input
              id="vehiculo-type"
              className="h-11 pl-10"
              placeholder="Camioneta"
              maxLength={50}
              autoComplete="off"
              aria-invalid={!!errors.type}
              aria-describedby={errors.type ? "vehiculo-type-error" : undefined}
              {...register("type")}
            />
          </div>
          {errors.type && <p id="vehiculo-type-error" className="text-sm text-destructive">{errors.type.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="vehiculo-plate">Placa</Label>
          <div className="relative">
            <Hash className={FIELD_ICON} aria-hidden />
            <Input
              id="vehiculo-plate"
              className="h-11 pl-10 font-mono uppercase"
              placeholder="1234-ABC"
              maxLength={15}
              autoComplete="off"
              autoCapitalize="characters"
              aria-invalid={!!errors.plate}
              aria-describedby={errors.plate ? "vehiculo-plate-error" : "vehiculo-plate-help"}
              {...register("plate")}
            />
          </div>
          <p id="vehiculo-plate-help" className="text-sm text-muted-foreground">Debe ser única, hasta 15 caracteres.</p>
          {errors.plate && <p id="vehiculo-plate-error" className="text-sm text-destructive">{errors.plate.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="vehiculo-model">Modelo</Label>
        <Input
          id="vehiculo-model"
          className="h-11"
          placeholder="Toyota Hilux 2022"
          maxLength={100}
          autoComplete="off"
          aria-invalid={!!errors.model}
          aria-describedby={errors.model ? "vehiculo-model-error" : undefined}
          {...register("model")}
        />
        {errors.model && <p id="vehiculo-model-error" className="text-sm text-destructive">{errors.model.message}</p>}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="vehiculo-capacity-kg">Capacidad de carga</Label>
          <div className="relative">
            <Package className={FIELD_ICON} aria-hidden />
            <Input
              id="vehiculo-capacity-kg"
              type="number"
              inputMode="decimal"
              step="0.01"
              min={0}
              className="h-11 pl-10 pr-12 tabular-nums"
              placeholder="1200.5"
              aria-invalid={!!errors.capacityKg}
              aria-describedby={errors.capacityKg ? "vehiculo-capacity-kg-error" : undefined}
              {...register("capacityKg")}
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
              kg
            </span>
          </div>
          {errors.capacityKg && (
            <p id="vehiculo-capacity-kg-error" className="text-sm text-destructive">{errors.capacityKg.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="vehiculo-capacity-m3">Capacidad de volumen</Label>
          <div className="relative">
            <Gauge className={FIELD_ICON} aria-hidden />
            <Input
              id="vehiculo-capacity-m3"
              type="number"
              inputMode="decimal"
              step="0.01"
              min={0}
              className="h-11 pl-10 pr-12 tabular-nums"
              placeholder="8.5"
              aria-invalid={!!errors.capacityM3}
              aria-describedby={errors.capacityM3 ? "vehiculo-capacity-m3-error" : undefined}
              {...register("capacityM3")}
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
              m³
            </span>
          </div>
          {errors.capacityM3 && (
            <p id="vehiculo-capacity-m3-error" className="text-sm text-destructive">{errors.capacityM3.message}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={guardando}>
          Cancelar
        </Button>
        <Button type="submit" disabled={guardando}>
          {guardando && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
          {guardando ? "Guardando…" : vehiculo ? "Guardar cambios" : "Registrar vehículo"}
        </Button>
      </div>
    </form>
  );
}
