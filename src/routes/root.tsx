import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useCallback } from "react";
import { Titlebar } from "@/components/titlebar";
import { useHotkeyNavigation } from "@/lib/hooks/use-hotkey-navigation";

export function RootLayout() {
  const navigate = useNavigate();
  const routerState = useRouterState();

  void routerState;

  const handleNavigateHome = () => {
    void navigate({ to: "/" });
  };

  const handleNavigateContexts = () => {
    void navigate({ to: "/contexts" });
  };

  const handleNavigateSettings = () => {
    void navigate({ to: "/settings" });
  };

  const handleHotkeyActivate = useCallback(() => {
    void navigate({ to: "/" });
  }, [navigate]);

  useHotkeyNavigation(handleHotkeyActivate);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Titlebar
        onNavigateHome={handleNavigateHome}
        onNavigateContexts={handleNavigateContexts}
        onNavigateSettings={handleNavigateSettings}
      />
      <main className="pt-14 px-8 pb-8">
        <Outlet />
      </main>
    </div>
  );
}
