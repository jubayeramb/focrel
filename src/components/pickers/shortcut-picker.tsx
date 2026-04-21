import { RefreshCw, TriangleAlert, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { shortcuts } from "@/lib/os";

export type ShortcutPickerProps = {
  value: string | null;
  onChange: (v: string | null) => void;
  disabled?: boolean;
};

export function ShortcutPicker({ value, onChange, disabled }: ShortcutPickerProps) {
  const [query, setQuery] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef<string[] | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useRef(`shortcut-listbox-${Math.random().toString(36).slice(2)}`).current;

  useEffect(() => {
    setQuery(value ?? "");
  }, [value]);

  async function fetchList() {
    setLoading(true);
    setError(null);
    try {
      const result = await shortcuts.listShortcuts();
      cacheRef.current = result;
      setList(result);
    } catch {
      setError("Could not load shortcuts");
    } finally {
      setLoading(false);
    }
  }

  function handleFocus() {
    if (cacheRef.current === null) {
      fetchList();
    } else {
      setList(cacheRef.current);
    }
    setOpen(true);
  }

  function handleRefresh(e: React.MouseEvent) {
    e.preventDefault();
    cacheRef.current = null;
    fetchList();
  }

  function handleSelect(name: string) {
    setQuery(name);
    onChange(name);
    setOpen(false);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setQuery(v);
    onChange(v || null);
    setOpen(true);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
    }
  }

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const filtered = list.filter((s) => s.toLowerCase().includes(query.toLowerCase()));

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-1.5">
        <div className="relative flex-1">
          <Zap className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Shortcut name…"
            className={cn(
              "flex h-9 w-full rounded-md border border-input bg-transparent pl-8 pr-3 py-1 text-sm shadow-sm",
              "placeholder:text-muted-foreground transition-colors",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-autocomplete="list"
          />
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={disabled || loading}
          className={cn(
            "h-9 w-9 flex items-center justify-center rounded-md border border-input",
            "hover:bg-accent transition-colors shrink-0",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            "disabled:pointer-events-none disabled:opacity-50",
          )}
          aria-label="Refresh shortcuts list"
        >
          <RefreshCw className={cn("size-3.5 text-muted-foreground", loading && "animate-spin")} />
        </button>
      </div>

      {error && (
        <p className="flex items-center gap-1.5 mt-1.5 text-xs text-destructive">
          <TriangleAlert className="size-3.5 shrink-0" />
          {error}
        </p>
      )}

      {open && filtered.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          className={cn(
            "absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md",
            "max-h-48 overflow-y-auto py-1",
          )}
        >
          {filtered.map((name) => (
            <li
              key={name}
              role="option"
              aria-selected={name === value}
              className={cn(
                "px-3 py-1.5 text-sm cursor-pointer",
                "hover:bg-accent hover:text-accent-foreground transition-colors",
                name === value && "bg-accent text-accent-foreground",
              )}
              onPointerDown={(e) => {
                e.preventDefault();
                handleSelect(name);
              }}
            >
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
