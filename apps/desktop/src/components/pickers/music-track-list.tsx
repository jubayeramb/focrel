import { open } from "@tauri-apps/plugin-dialog";
import { Music, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MusicTrackListProps {
  paths: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}

function filenameOf(path: string): string {
  const slash = path.lastIndexOf("/");
  return slash === -1 ? path : path.slice(slash + 1);
}

export function MusicTrackList({ paths, onChange, disabled }: MusicTrackListProps) {
  async function handleAdd() {
    const picked = await open({
      multiple: true,
      directory: false,
      filters: [{ name: "Audio", extensions: ["mp3", "wav", "flac", "ogg", "m4a"] }],
    });
    if (!picked) return;
    const added = Array.isArray(picked) ? picked : [picked];
    // Dedupe — paths already in the list aren't re-added.
    const existing = new Set(paths);
    const next = [...paths];
    for (const p of added) {
      if (!existing.has(p)) next.push(p);
    }
    onChange(next);
  }

  function handleRemove(path: string) {
    onChange(paths.filter((p) => p !== path));
  }

  return (
    <div className="space-y-2">
      {paths.length > 0 && (
        <ul className="space-y-1 rounded-md border border-input bg-background/50 divide-y divide-border">
          {paths.map((p, i) => (
            <li key={p} className="flex items-center gap-2 px-3 py-2">
              <Music className="size-4 text-muted-foreground shrink-0" />
              <span className="flex-1 min-w-0 truncate text-sm">
                <span className="text-muted-foreground tabular-nums mr-2">{i + 1}.</span>
                {filenameOf(p)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(p)}
                disabled={disabled}
                className="size-6 text-muted-foreground hover:text-destructive"
                aria-label={`Remove ${filenameOf(p)}`}
              >
                <X className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => void handleAdd()}
        disabled={disabled}
        className={cn("w-full justify-start", paths.length === 0 && "h-16 border-dashed")}
      >
        <Plus className="size-4" />
        {paths.length === 0 ? "Add ambient tracks" : "Add more tracks"}
      </Button>
    </div>
  );
}
