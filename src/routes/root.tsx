import { Outlet, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { useHotkeyNavigation } from "@/lib/hooks/use-hotkey-navigation";

export function RootLayout() {
  const navigate = useNavigate();

  const handleHotkeyActivate = useCallback(() => {
    void navigate({ to: "/" });
  }, [navigate]);

  useHotkeyNavigation(handleHotkeyActivate);

  // Parallel agent (item #9) dispatches this event when a session snapshot is
  // resumed on launch. We navigate to the active session view in response.
  useEffect(() => {
    function handleSessionResumed(e: Event) {
      const { contextId } = (e as CustomEvent<{ contextId: string }>).detail;
      void navigate({ to: "/session", search: { contextId } });
    }

    window.addEventListener("focrel:session-resumed", handleSessionResumed);
    return () => window.removeEventListener("focrel:session-resumed", handleSessionResumed);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="pl-60 min-h-screen">
        <div className="px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
