import { Suspense } from "react";
import { useLocation } from "react-router-dom";

import { DashboardSidebar } from "@/app/layouts/dashboard-sidebar";
import { DashboardTopbar } from "@/app/layouts/dashboard-topbar";
import { navigationForRole } from "@/config/navigation";
import { IdleWarningDialog } from "@/domains/auth";
import { useAuthStore } from "@/shared/store/use-auth-store";
import { PageErrorBoundary } from "@/shared/components/feedback/page-error-boundary";
import { PageSkeleton } from "@/shared/components/feedback/page-skeleton";
import { SidebarProvider } from "@/shared/components/ui/sidebar";

export function DashboardLayout() {
  const { pathname } = useLocation();
  const user = useAuthStore((s) => s.user);
  const isTablero = pathname === "/app/tablero";

  if (!user) return null;
  const roleId = user.rol.id;
  const currentNavItem = navigationForRole(roleId)
    .flatMap((group) => group.items.map((item) => ({ ...item, groupLabel: group.label })))
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];

  return (
    <SidebarProvider>
      <DashboardSidebar user={user} />

      <div className="flex min-h-screen w-full flex-1 flex-col bg-background">
        <DashboardTopbar user={user} currentNavItem={currentNavItem} />

        <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <div className={isTablero ? "mx-auto w-full min-w-0 max-w-none" : "mx-auto max-w-7xl"}>
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
