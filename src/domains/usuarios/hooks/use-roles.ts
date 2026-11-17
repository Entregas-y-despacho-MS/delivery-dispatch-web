import { useQuery } from "@tanstack/react-query";
import { QUERY_POLICIES } from "@/shared/lib/query-policies";
import { rolesService } from "../services/roles.service";

export const ROLES_QUERY_KEY = ["roles"] as const;

/** Roles disponibles para el selector; siguen la política de catálogos. */
export function useRoles() {
  return useQuery({
    ...QUERY_POLICIES.catalog,
    queryKey: ROLES_QUERY_KEY,
    queryFn: ({ signal }) => rolesService.list(signal),
  });
}
