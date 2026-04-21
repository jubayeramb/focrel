import { useRouterState } from "@tanstack/react-router";
import { LayoutGrid, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function useBreadcrumb(): string {
  const { location } = useRouterState();
  const { pathname } = location;

  if (pathname === "/") return "Home";
  if (pathname === "/session") return "Session";
  if (pathname === "/contexts") return "Contexts";
  if (pathname === "/contexts/new") return "Contexts › New";
  if (pathname.startsWith("/contexts/") && pathname.endsWith("/edit")) return "Contexts › Edit";
  if (pathname === "/settings") return "Settings";
  return "Focrel";
}

interface TitlebarProps {
  onNavigateHome: () => void;
  onNavigateContexts: () => void;
  onNavigateSettings: () => void;
}

export function Titlebar({
  onNavigateHome,
  onNavigateContexts,
  onNavigateSettings,
}: TitlebarProps) {
  const breadcrumb = useBreadcrumb();

  return (
    <div
      data-tauri-drag-region
      className={cn(
        "fixed top-0 left-0 right-0 z-50 h-11 flex items-center",
        "border-b border-border bg-background/95 backdrop-blur-sm",
      )}
    >
      <div data-tauri-drag-region className="w-20 shrink-0" />

      <div data-tauri-drag-region className="flex-1 flex items-center justify-center">
        <span className="text-sm font-medium text-foreground select-none">{breadcrumb}</span>
      </div>

      <div className="flex items-center gap-1 pr-3">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs px-2"
          onClick={onNavigateContexts}
          aria-label="Contexts"
        >
          <LayoutGrid className="size-4" />
          Contexts
        </Button>
        <Button
          variant="default"
          size="sm"
          className="h-7 text-xs px-3"
          onClick={onNavigateHome}
        >
          New session
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onNavigateSettings}
          aria-label="Settings"
        >
          <Settings className="size-4" />
        </Button>
      </div>
    </div>
  );
}
