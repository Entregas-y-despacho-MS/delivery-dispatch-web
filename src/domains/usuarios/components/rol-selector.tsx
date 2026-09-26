import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import type { Rol } from "../usuarios.types";

interface RolSelectorProps {
  id: string;
  /** id del rol como texto ("" si todavía no se eligió). */
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  roles: Rol[] | undefined;
  loading?: boolean;
  invalid?: boolean;
  describedBy?: string;
}

/** Selector de rol. La cuenta semilla "root" no se ofrece: solo existe una y la crea el sistema. */
export function RolSelector({ id, value, onChange, onBlur, roles, loading, invalid, describedBy }: RolSelectorProps) {
  const opciones = (roles ?? []).filter((r) => r.nombre !== "root");

  return (
    <Select value={value} onValueChange={onChange} disabled={loading}>
      <SelectTrigger id={id} onBlur={onBlur} aria-invalid={invalid} aria-describedby={describedBy}>
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
