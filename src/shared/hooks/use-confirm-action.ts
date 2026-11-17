import { useState } from "react";

/** Elemento pendiente y error de una confirmación; la acción queda en cada dominio. */
export function useConfirmAction<T>() {
  const [item, setItem] = useState<T>();
  const [error, setError] = useState("");

  const request = (nextItem: T) => {
    setError("");
    setItem(nextItem);
  };

  const close = () => {
    setItem(undefined);
    setError("");
  };

  const onOpenChange = (open: boolean) => {
    if (!open) close();
  };

  return { item, error, setError, request, close, onOpenChange };
}
