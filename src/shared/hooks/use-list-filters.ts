import { useState } from "react";
import { useDebounce } from "@/shared/hooks/use-debounce";

/** Búsqueda, filtros y página de una lista con paginación del servidor. */
export function useListFilters<TFilters extends Record<string, string>>(
  initialFilters: TFilters,
  debounceMs = 300,
) {
  const [search, setSearchValue] = useState("");
  const [filters, setFilters] = useState<TFilters>(initialFilters);
  const [page, setPage] = useState(1);
  const delayedSearch = useDebounce(search.trim(), debounceMs);
  const debouncedSearch = search.trim() ? delayedSearch : "";

  const setSearch = (value: string) => {
    setSearchValue(value);
    setPage(1);
  };

  const setFilter = <K extends keyof TFilters>(name: K, value: TFilters[K]) => {
    setFilters((current) => ({ ...current, [name]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setSearchValue("");
    setFilters(initialFilters);
    setPage(1);
  };

  const hasFilters = Boolean(search.trim()) || Object.keys(initialFilters)
    .some((name) => filters[name] !== initialFilters[name]);

  return { search, debouncedSearch, filters, page, setPage, setSearch, setFilter, clearFilters, hasFilters };
}
