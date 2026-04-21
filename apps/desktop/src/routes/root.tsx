import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { useHotkeyNavigation } from "@/lib/hooks/use-hotkey-navigation";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { cn } from "@/lib/utils";

// Below this viewport width the sidebar would eat most of the window
// (e.g. mini-mode at 420px with a 240px sidebar leaves ~180px for content),
// so force-collapse regardless of the user's preference.
const NARROW_WINDOW_PX = 600;

export function RootLayout() {
  const navigate = useNavigate();
  const { location } = useRouterState();
  const sidebarCollapsed = useSettingsStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useSettingsStore((s) => s.toggleSidebar);

  const [narrow, setNarrow] = useState(() => window.innerWidth < NARROW_WINDOW_PX);

  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < NARROW_WINDOW_PX);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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

  const isOnboarding = location.pathname === "/onboarding";

  // Onboarding is full-bleed until completion. No sidebar, no toggle,
  // but keep the topbar drag region so users can still move the window.
  if (isOnboarding) {
    return (
      <div className="h-screen w-screen bg-background text-foreground overflow-hidden flex flex-col">
        <Topbar sidebarVisible={false} onToggleSidebar={() => {}} showSidebarToggle={false} />
        <main className="app-scroll flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    );
  }

  const sidebarVisible = !sidebarCollapsed && !narrow;

  return (
    <div className="h-screen w-screen bg-background text-foreground overflow-hidden flex flex-col">
      <Topbar sidebarVisible={sidebarVisible} onToggleSidebar={toggleSidebar} />
      <div className="flex-1 flex overflow-hidden">
        {sidebarVisible && <Sidebar />}
        <main
          className={cn(
            "flex-1 overflow-hidden transition-[padding] duration-150",
            sidebarVisible ? "pl-60" : "pl-0",
          )}
        >
          <div className="app-scroll h-full overflow-y-auto">
            <div className="px-8 py-6 max-w-5xl mx-auto">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
