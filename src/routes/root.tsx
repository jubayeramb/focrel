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
    <div className="h-screen w-screen bg-background text-foreground overflow-hidden">
      <Sidebar />
      <main className="pl-60 h-screen overflow-hidden">
        <div className="app-scroll h-full overflow-y-auto pt-10">
          <div className="px-10 pb-10 max-w-5xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
