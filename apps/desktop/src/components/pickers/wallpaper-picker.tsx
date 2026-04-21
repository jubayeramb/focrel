import { convertFileSrc } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { Image, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type WallpaperPickerProps = {
  value: string | null;
  onChange: (v: string | null) => void;
  disabled?: boolean;
};

export function WallpaperPicker({ value, onChange, disabled }: WallpaperPickerProps) {
  async function handleClick() {
    if (disabled) return;
    const picked = await open({
      multiple: false,
      directory: false,
      filters: [{ name: "Images", extensions: ["jpg", "jpeg", "png", "heic", "webp", "tiff", "bmp"] }],
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
    <div className="space-y-1.5">
      <div
        className={cn(
          "relative w-full max-w-[320px] rounded-lg overflow-hidden border",
          "transition-colors cursor-pointer",
          value
            ? "border-border bg-card"
            : "border-dashed border-input bg-muted/40 hover:bg-muted",
          disabled && "pointer-events-none opacity-50",
        )}
        style={{ aspectRatio: "16/9" }}
        onClick={handleClick}
        onKeyDown={(e) => e.key === "Enter" && handleClick()}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={value ? "Change wallpaper" : "Choose wallpaper"}
      >
        {value ? (
          <>
            <img
              src={convertFileSrc(value)}
              alt="Wallpaper preview"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <button
              type="button"
              className={cn(
                "absolute top-1.5 right-1.5 rounded-full bg-background/80 backdrop-blur-xs",
                "w-6 h-6 flex items-center justify-center",
                "hover:bg-background transition-colors",
                "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
              )}
              onClick={handleClear}
              aria-label="Clear wallpaper"
            >
              <X className="size-3.5" />
            </button>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Image className="size-7" />
            <span className="text-xs font-medium">Choose wallpaper</span>
          </div>
        )}
      </div>
      {basename && (
        <p className="text-xs text-muted-foreground truncate max-w-[320px]">{basename}</p>
      )}
    </div>
  );
}
