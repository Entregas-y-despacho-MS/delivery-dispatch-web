import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, LogOut, X } from "lucide-react";

import { NAV_GROUPS } from "@/config/navigation";
import { portalHomeHref } from "@/config/portal-routes";
import { hasRole } from "@/config/roles";
import { useLogout } from "@/domains/auth";
import { FlashPackLogo } from "@/shared/components/common/flash-pack-logo";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader,
  SidebarMenu, SidebarMenuItem,
} from "@/shared/components/ui/sidebar";
import { useSidebar } from "@/shared/components/ui/sidebar-context";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";
import type { AuthUser } from "@/shared/store/use-auth-store";

function isCurrentRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardSidebar({ user }: { user: AuthUser }) {
  const { pathname } = useLocation();
  const { isMobile, state, setOpen, setOpenMobile } = useSidebar();
  const handleLogout = useLogout();
  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => hasRole(user.rol.id, item.roles)),
  })).filter((group) => group.items.length > 0);
  const currentGroup = visibleGroups.find((group) =>
    group.items.some((item) => isCurrentRoute(pathname, item.href))
  )?.label;

  const [openGroupState, setOpenGroupState] = useState(() => ({
    pathname,
    labels: new Set(currentGroup ? [currentGroup] : []),
  }));
  const openGroups = new Set(openGroupState.labels);
  if (openGroupState.pathname !== pathname && currentGroup) openGroups.add(currentGroup);

  function toggleGroup(label: string) {
    const wasCollapsed = !isMobile && state === "collapsed";
    if (wasCollapsed) setOpen(true);
    setOpenGroupState((previous) => {
      const labels = new Set(previous.labels);
      if (previous.pathname !== pathname && currentGroup) labels.add(currentGroup);
      if (wasCollapsed || !labels.has(label)) labels.add(label);
      else labels.delete(label);
      return { pathname, labels };
    });
  }

  function closeMobileMenu() {
    if (isMobile) setOpenMobile(false);
  }

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border">
      <SidebarHeader className="px-3 pt-5 pb-4 group-data-[collapsible=icon]:px-2">
        <div className="flex items-center gap-2">
          <Link
            to={portalHomeHref(user.rol.id)}
            onClick={closeMobileMenu}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-1.5 outline-none transition-colors hover:bg-sidebar-foreground/10 focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
            aria-label="Flash Pack, ir al inicio"
          >
            <FlashPackLogo />
            <span className="min-w-0 group-data-[collapsible=icon]:hidden">
              <span className="block truncate text-lg leading-6 font-semibold tracking-tight">
                Flash <span className="text-brand-orange">Pack</span>
              </span>
              <span className="block truncate text-xs text-sidebar-foreground/80">Panel de operaciones</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setOpenMobile(false)}
            className="flex size-9 shrink-0 items-center justify-center rounded-md text-sidebar-foreground outline-none hover:bg-sidebar-foreground/10 focus-visible:ring-2 focus-visible:ring-sidebar-ring md:hidden"
            aria-label="Cerrar navegación"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-0 px-3 py-3 group-data-[collapsible=icon]:px-2">
        <nav aria-label="Navegación principal" className="border-t border-sidebar-border pt-3">
          <SidebarMenu className="gap-1">
            {visibleGroups.map((group) => {
              const expanded = openGroups.has(group.label);
              const panelOpen = expanded && (isMobile || state !== "collapsed");
              const panelId = `sidebar-group-${group.label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()}`;

              return (
                <SidebarMenuItem key={group.label}>
                  <SidebarGroup className="p-0">
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.label)}
                      aria-expanded={panelOpen}
                      aria-controls={panelId}
                      aria-label={group.label}
                      title={!isMobile && state === "collapsed" ? group.label : undefined}
                      className="sidebar-nav-section flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-sidebar-foreground outline-none hover:bg-sidebar-foreground/10 focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
                    >
                      <span className="sidebar-nav-section-content flex min-w-0 flex-1 items-center gap-3 group-data-[collapsible=icon]:flex-none">
                        <group.icon className="size-5 shrink-0 text-sidebar-primary" aria-hidden="true" />
                        <span className="min-w-0 truncate group-data-[collapsible=icon]:hidden">
                          {group.label}
                        </span>
                      </span>
                      <ChevronRight
                        className="sidebar-nav-chevron size-4 shrink-0 text-sidebar-primary group-data-[collapsible=icon]:hidden"
                        aria-hidden="true"
                      />
                    </button>
                    <div
                      id={panelId}
                      aria-hidden={!panelOpen}
                      inert={!panelOpen}
                      data-open={panelOpen}
                      className="sidebar-nav-panel group-data-[collapsible=icon]:hidden"
                    >
                      <div className="min-h-0 overflow-hidden">
                        <ul className="ml-6 space-y-1 border-l border-brand-turquoise/70 pl-2 pt-1 pb-2">
                          {group.items.map((item) => {
                            const active = isCurrentRoute(pathname, item.href);
                            return (
                              <li key={item.href}>
                                <Link
                                  to={item.href}
                                  onClick={closeMobileMenu}
                                  aria-current={active ? "page" : undefined}
                                  className={`sidebar-nav-link relative flex min-h-10 items-center overflow-hidden rounded-lg px-3 py-2 text-sm leading-5 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring ${
                                    active
                                      ? "font-semibold text-sidebar-foreground"
                                      : "text-sidebar-foreground/90 hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground"
                                  }`}
                                >
                                  <span className="sidebar-nav-link-content relative z-10 flex items-center gap-3">
                                    {!active && <span className="size-1.5 shrink-0 rounded-full bg-sidebar-primary" aria-hidden="true" />}
                                    <span>{item.title}</span>
                                  </span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  </SidebarGroup>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </nav>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-3 py-3 group-data-[collapsible=icon]:px-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleLogout}
              className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-sidebar-foreground outline-none hover:bg-sidebar-foreground/10 focus-visible:ring-2 focus-visible:ring-sidebar-ring motion-safe:transition-[transform,background-color] motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:scale-[1.015] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
              aria-label="Cerrar sesión"
            >
              <LogOut className="size-5 shrink-0 text-sidebar-primary" aria-hidden="true" />
              <span className="group-data-[collapsible=icon]:hidden">Cerrar sesión</span>
            </button>
          </TooltipTrigger>
          {!isMobile && state === "collapsed" && <TooltipContent side="right">Cerrar sesión</TooltipContent>}
        </Tooltip>
      </SidebarFooter>
    </Sidebar>
  );
}
