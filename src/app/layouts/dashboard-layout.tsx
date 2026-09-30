import { Suspense } from "react";
import { useLocation } from "react-router-dom";

import { DashboardSidebar } from "@/app/layouts/dashboard-sidebar";
import { DashboardTopbar } from "@/app/layouts/dashboard-topbar";
import { NAV_GROUPS } from "@/config/navigation";
import { hasRole } from "@/config/roles";
import { IdleWarningDialog } from "@/domains/auth";
import { useAuthStore } from "@/shared/store/use-auth-store";
import { PageErrorBoundary } from "@/shared/components/feedback/page-error-boundary";
import { PageSkeleton } from "@/shared/components/feedback/page-skeleton";
import { SidebarProvider } from "@/shared/components/ui/sidebar";

export function DashboardLayout() {
  const { pathname } = useLocation();
  const user = useAuthStore((s) => s.user);

  if (!user) return null;
  const roleId = user.rol.id;
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
      <DashboardSidebar user={user} />

      <div className="flex min-h-screen w-full flex-1 flex-col bg-background">
        <DashboardTopbar user={user} currentNavItem={currentNavItem} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Suspense fallback={<PageSkeleton />}>
              <PageErrorBoundary />
            </Suspense>
          </div>
        </main>
      </div>
      {/* RF-A24: aviso y cierre de sesión por inactividad. */}
      <IdleWarningDialog />
    </SidebarProvider>
  );
}
