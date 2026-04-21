import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { Titlebar } from "@/components/titlebar";

export function RootLayout() {
  const navigate = useNavigate();
  const routerState = useRouterState();

  void routerState;

  const handleNavigateHome = () => {
    void navigate({ to: "/" });
  };

  const handleNavigateSettings = () => {
    void navigate({ to: "/settings" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Titlebar
        onNavigateHome={handleNavigateHome}
        onNavigateSettings={handleNavigateSettings}
      />
      <main className="pt-14 px-8 pb-8">
        <Outlet />
      </main>
    </div>
  );
}
