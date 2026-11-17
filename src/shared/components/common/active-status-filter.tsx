import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";

export type ActiveStatusFilterValue = "all" | "active" | "inactive";

interface ActiveStatusFilterProps {
  value: ActiveStatusFilterValue;
  onChange: (value: ActiveStatusFilterValue) => void;
}

export function ActiveStatusFilter({ value, onChange }: ActiveStatusFilterProps) {
  return (
    <Select value={value} onValueChange={(next: ActiveStatusFilterValue) => onChange(next)}>
      <SelectTrigger className="h-10 w-full sm:w-40" aria-label="Filtrar por estado"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos los estados</SelectItem>
        <SelectItem value="active">Activos</SelectItem>
        <SelectItem value="inactive">Inactivos</SelectItem>
      </SelectContent>
    </Select>
  );
}
