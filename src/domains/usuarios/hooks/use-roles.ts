import { useQuery } from "@tanstack/react-query";
import { rolesService } from "../services/roles.service";

export const ROLES_QUERY_KEY = ["roles"] as const;

/** Roles disponibles para el selector. Cambian muy poco: se guardan en caché 10 minutos. */
export function useRoles() {
  return useQuery({
    queryKey: ROLES_QUERY_KEY,
    queryFn: rolesService.list,
    staleTime: 10 * 60 * 1000,
  });
}
