import { useEffect, useState } from "react";
import { ThemeContext, type Theme } from "@/shared/hooks/use-theme";
import { readStoredTheme, resolveTheme } from "@/shared/lib/theme";

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "app-theme",
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}) {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      return readStoredTheme(localStorage.getItem(storageKey), defaultTheme);
    } catch {
      return defaultTheme;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    const preference = typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-color-scheme: dark)")
      : null;
    const applyTheme = () => {
      const resolved = resolveTheme(theme, preference?.matches ?? false);
      root.classList.toggle("dark", resolved === "dark");
      root.classList.toggle("light", resolved === "light");
    };

    applyTheme();
    if (theme !== "system" || !preference) return;
    if (typeof preference.addEventListener === "function") {
      preference.addEventListener("change", applyTheme);
      return () => preference.removeEventListener("change", applyTheme);
    }
    preference.addListener(applyTheme);
    return () => preference.removeListener(applyTheme);
  }, [theme]);

  const setTheme = (t: Theme) => {
    try {
      localStorage.setItem(storageKey, t);
    } catch {
      // El tema sigue funcionando aunque el navegador bloquee el almacenamiento.
    }
    setThemeState(t);
  };

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}
