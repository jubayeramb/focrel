import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useCallback, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { useHotkeyNavigation } from "@/lib/hooks/use-hotkey-navigation";

export function RootLayout() {
  const navigate = useNavigate();
  const { location } = useRouterState();

  const handleHotkeyActivate = useCallback(() => {
    void navigate({ to: "/" });
  }, [navigate]);

  useHotkeyNavigation(handleHotkeyActivate);

  // session-store dispatches this event when a snapshot is resumed on
  // launch; navigate into the running session view.
  useEffect(() => {
    function handleSessionResumed(e: Event) {
      const { contextId } = (e as CustomEvent<{ contextId: string }>).detail;
      void navigate({ to: "/session", search: { contextId } });
    }

    window.addEventListener("focrel:session-resumed", handleSessionResumed);
    return () => window.removeEventListener("focrel:session-resumed", handleSessionResumed);
  }, [navigate]);

  // Onboarding is a full-bleed experience — no sidebar until the user
  // finishes. The full app unlocks on completion.
  const isOnboarding = location.pathname === "/onboarding";

  if (isOnboarding) {
    return (
      <div className="h-screen w-screen bg-background text-foreground overflow-hidden">
        <div data-tauri-drag-region className="h-10 shrink-0" />
        <main className="app-scroll h-[calc(100vh-2.5rem)] overflow-y-auto">
          <Outlet />
        </main>
      </div>
    );
  }

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
