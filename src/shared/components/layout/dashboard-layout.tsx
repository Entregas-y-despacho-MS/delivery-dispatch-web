import { Link, Outlet, useLocation } from "react-router-dom";
import { ChevronDown, ChevronRight, LogOut, Package } from "lucide-react";

import { NAV_GROUPS } from "@/app/navigation";
import { hasRole, ROLE_LABELS } from "@/config/roles";
import { useLogout } from "@/domains/auth";
import { useAuthStore } from "@/shared/store/use-auth-store";
import { ThemeToggle } from "@/shared/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Separator } from "@/shared/components/ui/separator";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarTrigger, SidebarHeader, SidebarFooter,
} from "@/shared/components/ui/sidebar";

export function DashboardLayout() {
  const { pathname } = useLocation();
  const user = useAuthStore((s) => s.user);
  const handleLogout = useLogout();

  if (!user) return null;
  const roleId = user.rol.id;
  const initials = `${user.nombres?.[0] ?? ""}${user.apellidos?.[0] ?? ""}`;
  const roleLabel = ROLE_LABELS[roleId as keyof typeof ROLE_LABELS] ?? user.rol.nombre;
  const currentNavItem = NAV_GROUPS
    .flatMap((group) =>
      group.items
        .filter((item) => hasRole(roleId, item.roles))
        .map((item) => ({ ...item, groupLabel: group.label }))
    )
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];

  return (
    <SidebarProvider>
      <Sidebar variant="inset" className="border-r">
        <SidebarHeader className="border-b px-3 py-3">
          <Link
            to="/app/tablero"
            className="group/brand flex items-center gap-3 rounded-lg px-2 py-1.5 outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
              <Package className="size-4" aria-hidden="true" />
            </span>
            <span className="min-w-0 group-data-[collapsible=icon]:hidden">
              <span className="block truncate text-sm font-semibold tracking-tight">
                Delivery Dispatch
              </span>
              <span className="block truncate text-[11px] text-sidebar-foreground/60">
                Centro de operaciones
              </span>
            </span>
          </Link>
        </SidebarHeader>

        <SidebarContent className="space-y-5 px-2 py-4">
          {NAV_GROUPS.map((group) => {
            const items = group.items.filter((i) => hasRole(roleId, i.roles));
            if (!items.length) return null;

            return (
              <SidebarGroup key={group.label} className="p-0">
                <SidebarGroupLabel className="h-7 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/50">
                  {group.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {items.map((item) => (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                          tooltip={item.title}
                          size="lg"
                        >
                          <Link to={item.href} className="flex items-center gap-3 px-3">
                            <item.icon className="size-4 shrink-0" aria-hidden="true" />
                            <span className="text-sm">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          })}
        </SidebarContent>

        <SidebarFooter />
      </Sidebar>

      <div className="flex min-h-screen w-full flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
          <div className="flex min-h-16 items-center gap-3 px-4 lg:px-8">
            <SidebarTrigger
              className="size-9 rounded-lg border bg-background shadow-none"
              aria-label="Abrir navegación"
            />
            <Separator orientation="vertical" className="hidden h-6 sm:block" />

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="hidden font-medium sm:inline">
                  {currentNavItem?.groupLabel ?? "Panel operativo"}
                </span>
                {currentNavItem && <ChevronRight className="size-3.5" aria-hidden="true" />}
                <span className="truncate font-medium text-foreground">
                  {currentNavItem?.title ?? "Panel operativo"}
                </span>
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                Información de tu operación en un solo lugar
              </p>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <ThemeToggle />
              <Separator orientation="vertical" className="hidden h-6 sm:block" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex h-10 items-center gap-2 rounded-lg px-1.5 outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring sm:px-2"
                    aria-label={`Abrir menú de ${user.nombres}`}
                  >
                    <Avatar size="sm" className="ring-1 ring-border">
                      {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.nombres} />}
                      <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden max-w-36 flex-col items-start text-left lg:flex">
                      <span className="truncate text-sm font-medium">{user.nombres}</span>
                      <span className="truncate text-xs text-muted-foreground">{roleLabel}</span>
                    </span>
                    <ChevronDown className="hidden size-4 text-muted-foreground sm:block" aria-hidden="true" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={8} className="w-64">
                  <DropdownMenuLabel className="p-3 font-normal">
                    <div className="flex items-center gap-3">
                      <Avatar size="sm" className="ring-1 ring-border">
                        {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.nombres} />}
                        <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {user.nombres} {user.apellidos}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{roleLabel}</p>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 size-4" aria-hidden="true" /> Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl"><Outlet /></div>
        </main>
      </div>
    </SidebarProvider>
  );
}
