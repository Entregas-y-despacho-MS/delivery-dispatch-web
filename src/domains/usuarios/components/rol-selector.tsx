import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { cn } from "@/shared/lib/utils";
import type { Rol } from "../usuarios.types";

interface RolSelectorProps {
  id: string;
  className?: string;
  /** id del rol como texto ("" si todavía no se eligió). */
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  roles: Rol[] | undefined;
  loading?: boolean;
  /** Bloquea el selector (por ejemplo, al editar la propia cuenta). */
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
}

/** Ofrece los tres roles operativos; conserva el rol actual si la cuenta es administrativa. */
export function RolSelector({ id, className, value, onChange, onBlur, roles, loading, disabled, invalid, describedBy }: RolSelectorProps) {
  const opciones = (roles ?? []).filter((r) =>
    ["coordinator", "supervisor", "driver"].includes(r.nombre) || String(r.id) === value
  );

  return (
    <Select value={value} onValueChange={onChange} disabled={loading || disabled}>
      <SelectTrigger id={id} className={cn("h-11 w-full", className)} onBlur={onBlur} aria-invalid={invalid} aria-describedby={describedBy}>
        <SelectValue placeholder={loading ? "Cargando roles…" : "Selecciona un rol"} />
      </SelectTrigger>
      <SelectContent>
        {opciones.map((r) => (
          <SelectItem key={r.id} value={String(r.id)}>
            {r.etiqueta}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
