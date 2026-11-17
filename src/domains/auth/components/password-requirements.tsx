import { Check, X } from "lucide-react";

const REQUIREMENTS = [
  { label: "Mínimo 8 caracteres", test: (password: string) => password.length >= 8 },
  { label: "Al menos una mayúscula", test: (password: string) => /[A-Z]/.test(password) },
  { label: "Al menos una minúscula", test: (password: string) => /[a-z]/.test(password) },
  { label: "Al menos un número", test: (password: string) => /\d/.test(password) },
  { label: "Al menos un símbolo", test: (password: string) => /[^A-Za-z0-9]/.test(password) },
];

export function PasswordRequirements({ password }: { password: string }) {
  return (
    <div className="space-y-2 rounded-md border bg-muted/40 p-3">
      <p className="text-sm font-medium">La nueva contraseña debe tener:</p>
      <ul className="space-y-1.5 text-sm">
        {REQUIREMENTS.map(({ label, test }) => {
          const passes = test(password);
          return (
            <li key={label} className={passes ? "flex items-center gap-2 text-success" : "flex items-center gap-2 text-muted-foreground"}>
              {passes ? <Check className="size-4 shrink-0" aria-hidden /> : <X className="size-4 shrink-0" aria-hidden />}
              <span>{label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
