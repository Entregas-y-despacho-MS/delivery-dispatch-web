import { Link, Outlet, useLocation } from "react-router-dom";
import { LogOut, User } from "lucide-react";

import { NAV_GROUPS } from "@/app/navigation";
import { hasRole } from "@/config/roles";
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

  return (
    <SidebarProvider>
      <Sidebar variant="inset" className="border-r">
        <SidebarHeader className="h-14 border-b px-6">
          <span className="text-lg font-semibold tracking-tight">delivery-dispatch-web</span>
        </SidebarHeader>

        <SidebarContent className="space-y-4 px-3 py-4">
          {NAV_GROUPS.map((group) => {
            const items = group.items.filter((i) => hasRole(roleId, i.roles));
            if (!items.length) return null;

            return (
              <SidebarGroup key={group.label} className="p-0">
                <SidebarGroupLabel className="mb-1.5 px-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">
                  {group.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-0.5">
                    {items.map((item) => (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.title}>
                          <Link to={item.href} className="flex items-center gap-3 px-3">
                            <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="text-sm font-medium">{item.title}</span>
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
        <header className="sticky top-0 z-40 h-14 border-b bg-background/95 backdrop-blur">
          <div className="flex h-full items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="-ml-2" />
              <Separator orientation="vertical" className="h-5" />
              <div className="flex flex-col">
                <span className="text-sm font-medium leading-none">{user.nombres}</span>
                <span className="text-xs capitalize text-muted-foreground">
                  {user.rol.nombre?.toLowerCase()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger className="outline-none">
                  <Avatar className="h-8 w-8 cursor-pointer">
                    {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.nombres} />}
                    <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-sm font-medium">{user.nombres} {user.apellidos}</p>
                    <p className="text-xs capitalize text-muted-foreground">
                      {user.rol.nombre?.toLowerCase()}
                    </p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" /> Mi perfil
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">
          <div className="mx-auto max-w-7xl"><Outlet /></div>
        </main>
      </div>
    </SidebarProvider>
  );
}
