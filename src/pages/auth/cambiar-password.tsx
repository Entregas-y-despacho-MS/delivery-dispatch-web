import { ChangePasswordForm, LoginBrandPanel } from "@/domains/auth";
import { ThemeToggle } from "@/shared/components/theme-toggle";

export default function CambiarPasswordPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <LoginBrandPanel />
      <main className="relative flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
          <ThemeToggle />
        </div>
        <ChangePasswordForm />
      </main>
    </div>
  );
}
