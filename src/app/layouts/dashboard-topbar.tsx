import { ChevronDown, ChevronRight, LogOut } from "lucide-react";

import { useLogout } from "@/domains/auth";
import { ThemeToggle } from "@/shared/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Separator } from "@/shared/components/ui/separator";
import { SidebarTrigger } from "@/shared/components/ui/sidebar";
import type { AuthUser } from "@/shared/store/use-auth-store";
import { ROLE_LABELS } from "@/config/roles";

type CurrentNavItem = { title: string; groupLabel: string } | undefined;

export function DashboardTopbar({
  user,
  currentNavItem,
}: {
  user: AuthUser;
  currentNavItem: CurrentNavItem;
}) {
  const handleLogout = useLogout();
  const roleLabel = ROLE_LABELS[user.rol.id as keyof typeof ROLE_LABELS] ?? user.rol.nombre;
  const initials = `${user.nombres?.[0] ?? ""}${user.apellidos?.[0] ?? ""}`.toUpperCase();

  return (
    <header className="sticky top-0 z-40 bg-sidebar">
      <div className="topbar-surface flex min-h-16 items-center gap-3 bg-sidebar px-3 text-sidebar-foreground sm:gap-4 sm:px-4">
        <SidebarTrigger
          className="size-10 shrink-0 rounded-lg text-sidebar-foreground hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          aria-label="Abrir navegación"
        />
        <Separator orientation="vertical" className="hidden h-8 bg-brand-turquoise sm:block" />

        <nav aria-label="Ubicación actual" className="flex min-w-0 flex-1 items-center gap-2 text-sm">
          <span className="hidden shrink-0 text-sidebar-foreground/75 sm:inline">
            {currentNavItem?.groupLabel ?? "Panel operativo"}
          </span>
          {currentNavItem && (
            <ChevronRight className="hidden size-4 shrink-0 text-brand-turquoise sm:block" aria-hidden="true" />
          )}
          <span className="truncate text-base font-semibold tracking-tight sm:text-sm">
            {currentNavItem?.title ?? "Panel operativo"}
          </span>
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <span className="topbar-theme-control flex size-10 items-center justify-center rounded-lg text-sidebar-foreground hover:bg-sidebar-foreground/10 [&_button]:size-10 [&_button]:rounded-lg [&_button]:text-sidebar-foreground [&_button]:hover:bg-transparent [&_button]:hover:text-sidebar-foreground">
            <ThemeToggle />
          </span>
          <Separator orientation="vertical" className="hidden h-8 bg-sidebar-border sm:block" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`Abrir menú de ${user.nombres} ${user.apellidos}`}
                className="topbar-profile flex size-10 items-center justify-center gap-2 rounded-lg bg-brand-orange px-1.5 text-sidebar-foreground outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring sm:h-12 sm:w-auto sm:justify-start sm:px-2.5"
              >
                <Avatar className="size-8 ring-1 ring-primary-foreground/30">
                  {user.avatar_url && <AvatarImage src={user.avatar_url} alt={`${user.nombres} ${user.apellidos}`} />}
                  <AvatarFallback className="bg-brand-blue text-xs font-semibold text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden max-w-40 flex-col items-start text-left leading-tight sm:flex">
                  <span className="max-w-full truncate text-sm font-semibold">{user.nombres} {user.apellidos}</span>
                  <span className="max-w-full truncate text-xs text-sidebar-foreground/85">{roleLabel}</span>
                </span>
                <ChevronDown className="hidden size-4 shrink-0 sm:block" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={10} className="w-64">
              <DropdownMenuLabel className="px-3 py-2 font-normal">
                <span className="block truncate text-sm font-medium">{user.nombres} {user.apellidos}</span>
                <span className="block truncate text-xs text-muted-foreground">{roleLabel}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                <LogOut aria-hidden="true" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
