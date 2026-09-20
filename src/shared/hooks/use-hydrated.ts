import { useSyncExternalStore } from "react";
import { useAuthStore } from "@/shared/store/use-auth-store";

/**
 * Zustand persist lee localStorage de forma asincrona.
 * Sin esto, el guard redirige a /login por un instante aunque SI haya sesion
 * (el "flash" que en Next evitaba el middleware).
 */
export function useAuthHydrated() {
  return useSyncExternalStore(
    (onChange) => useAuthStore.persist.onFinishHydration(onChange),
    () => useAuthStore.persist.hasHydrated(),
    () => false
  );
}
