import { Search } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/utils";

interface SearchFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  maxLength?: number;
}

export function SearchField({ id, label, value, onChange, placeholder, className, maxLength }: SearchFieldProps) {
  return (
    <div className={cn("relative w-full", className)}>
      <label htmlFor={id} className="sr-only">{label}</label>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input id={id} type="search" value={value} onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder} maxLength={maxLength} className="h-10 pl-10" />
    </div>
  );
}
