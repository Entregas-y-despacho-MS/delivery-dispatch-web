import type { Theme } from "@/shared/hooks/use-theme";

export function readStoredTheme(value: string | null, fallback: Theme): Theme {
  return value === "dark" || value === "light" || value === "system" ? value : fallback;
}

export function resolveTheme(theme: Theme, prefersDark: boolean): "dark" | "light" {
  return theme === "system" ? (prefersDark ? "dark" : "light") : theme;
}
