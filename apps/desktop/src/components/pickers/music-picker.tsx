import { open } from "@tauri-apps/plugin-dialog";
import { Music, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type MusicPickerProps = {
  value: string | null;
  onChange: (v: string | null) => void;
  disabled?: boolean;
};

export function MusicPicker({ value, onChange, disabled }: MusicPickerProps) {
  async function handleClick() {
    if (disabled) return;
    const picked = await open({
      multiple: false,
      directory: false,
      filters: [{ name: "Audio", extensions: ["mp3", "wav", "flac", "ogg", "m4a"] }],
    });
    if (typeof picked === "string") {
      onChange(picked);
    }
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange(null);
  }

  const basename = value ? value.split("/").pop() ?? value : null;

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors cursor-pointer",
        value
          ? "border-border bg-card"
          : "border-dashed border-input bg-muted/40 hover:bg-muted",
        disabled && "pointer-events-none opacity-50",
      )}
      onClick={handleClick}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={value ? "Change ambient track" : "Choose ambient track"}
    >
      <Music className="size-4 text-muted-foreground shrink-0" />
      <span className={cn("text-sm flex-1 truncate", !value && "text-muted-foreground")}>
        {basename ?? "Choose ambient track"}
      </span>
      {value && (
        <button
          type="button"
          className={cn(
            "rounded-full w-5 h-5 flex items-center justify-center shrink-0",
            "hover:bg-accent transition-colors",
            "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
          )}
          onClick={handleClear}
          aria-label="Clear track"
        >
          <X className="size-3.5 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}
