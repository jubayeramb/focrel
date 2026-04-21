import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopbarProps {
  sidebarVisible: boolean;
  onToggleSidebar: () => void;
  showSidebarToggle?: boolean;
}

export function Topbar({ sidebarVisible, onToggleSidebar, showSidebarToggle = true }: TopbarProps) {
  return (
    <header
      data-tauri-drag-region
      className={cn(
        "h-10 shrink-0 flex items-center border-b border-border",
        "bg-background/95 backdrop-blur-sm",
      )}
      style={{ backgroundColor: "hsl(var(--sidebar))" }}
    >
      {/* 80px reserved for macOS traffic lights (overlay titlebar) */}
      <div data-tauri-drag-region className="w-20 shrink-0" />

      {showSidebarToggle && (
        <button
          type="button"
          onClick={onToggleSidebar}
          className={cn(
            "flex size-7 items-center justify-center rounded-md text-muted-foreground",
            "hover:bg-accent hover:text-foreground transition-colors",
          )}
          aria-label={sidebarVisible ? "Hide sidebar" : "Show sidebar"}
          title={sidebarVisible ? "Hide sidebar" : "Show sidebar"}
        >
          {sidebarVisible ? (
            <PanelLeftClose className="size-4" />
          ) : (
            <PanelLeftOpen className="size-4" />
          )}
        </button>
      )}

      {/* Fill the remaining width with drag region so the user can grab
          anywhere above the content to move the window. */}
      <div data-tauri-drag-region className="flex-1 h-full" />
    </header>
  );
}
