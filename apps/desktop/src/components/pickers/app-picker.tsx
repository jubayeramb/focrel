import { convertFileSrc } from "@tauri-apps/api/core";
import { RefreshCw, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { RunningApp } from "@/lib/os/apps";
import { apps } from "@/lib/os";
import { cn } from "@/lib/utils";

export type AppPickerProps = {
  value: string[];
  onChange: (v: string[]) => void;
  disabled?: boolean;
};

export function AppPicker({ value, onChange, disabled }: AppPickerProps) {
  const [list, setList] = useState<RunningApp[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallback, setFallback] = useState(false);
  const hasFetched = useRef(false);

  async function fetchApps() {
    setLoading(true);
    setError(null);
    setFallback(false);
    try {
      const result = await apps.listInstalledApps();
      setList(result);
    } catch {
      try {
        const result = await apps.listRunningApps();
        setList(result);
        setFallback(true);
      } catch {
        setError("Could not load installed apps");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchApps();
    }
  }, []);

  function handleRefresh() {
    fetchApps();
  }

  function toggle(bundleId: string) {
    if (value.includes(bundleId)) {
      onChange(value.filter((id) => id !== bundleId));
    } else {
      onChange([...value, bundleId]);
    }
  }

  const lowerQuery = query.toLowerCase();
  const filtered = list.filter(
    (app) =>
      app.name.toLowerCase().includes(lowerQuery) ||
      app.bundleId.toLowerCase().includes(lowerQuery),
  );

  const sorted = [...filtered].sort((a, b) => {
    const aSelected = value.includes(a.bundleId);
    const bSelected = value.includes(b.bundleId);
    if (aSelected && !bSelected) return -1;
    if (!aSelected && bSelected) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className={cn("rounded-lg border border-border bg-card", disabled && "opacity-50")}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-medium text-muted-foreground">
          {value.length > 0 ? `${value.length} selected` : "None selected"}
        </span>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={disabled || loading}
          className={cn(
            "h-6 w-6 flex items-center justify-center rounded-md",
            "hover:bg-accent transition-colors",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            "disabled:pointer-events-none disabled:opacity-50",
          )}
          aria-label="Refresh app list"
        >
          <RefreshCw className={cn("size-3 text-muted-foreground", loading && "animate-spin")} />
        </button>
      </div>

      <div className="relative px-3 py-2 border-b border-border">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={disabled}
          placeholder="Filter apps…"
          className={cn(
            "w-full pl-6 py-0.5 text-sm bg-transparent",
            "placeholder:text-muted-foreground",
            "focus:outline-none",
            "disabled:cursor-not-allowed",
          )}
        />
      </div>

      {fallback && (
        <p className="px-3 py-1.5 text-xs text-amber-600 dark:text-amber-400 border-b border-border">
          Showing running apps — couldn't scan installed apps.
        </p>
      )}
      <div className="overflow-y-auto" style={{ maxHeight: "240px" }}>
        {error && (
          <p className="px-3 py-4 text-xs text-destructive text-center">{error}</p>
        )}
        {!error && sorted.length === 0 && (
          <p className="px-3 py-4 text-xs text-muted-foreground text-center">
            {loading ? "Loading…" : "No apps found. Try refreshing."}
          </p>
        )}
        {sorted.map((app) => {
          const checked = value.includes(app.bundleId);
          return (
            <label
              key={app.bundleId}
              className={cn(
                "flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                disabled && "cursor-not-allowed",
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => toggle(app.bundleId)}
                className="rounded border-input accent-primary"
              />
              <AppIcon bundleId={app.bundleId} bundlePath={app.bundlePath} name={app.name} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{app.name}</p>
                <p className="text-xs text-muted-foreground truncate">{app.bundleId}</p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}

// Module-level cache so re-mounts (filter changes, etc.) don't re-invoke the
// Rust-side sips conversion.
const iconCache = new Map<string, string | null>();

function AppIcon({
  bundleId,
  bundlePath,
  name,
}: {
  bundleId: string;
  bundlePath?: string;
  name: string;
}) {
  const [src, setSrc] = useState<string | null>(iconCache.get(bundleId) ?? null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (src || failed || !bundlePath) return;
    if (iconCache.has(bundleId)) {
      const cached = iconCache.get(bundleId);
      if (cached) setSrc(cached);
      else setFailed(true);
      return;
    }
    let cancelled = false;
    void apps.getAppIcon(bundleId, bundlePath).then((path) => {
      if (cancelled) return;
      if (path) {
        const url = convertFileSrc(path);
        iconCache.set(bundleId, url);
        setSrc(url);
      } else {
        iconCache.set(bundleId, null);
        setFailed(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [bundleId, bundlePath, src, failed]);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt=""
        className="size-6 rounded-md shrink-0"
        onError={() => setFailed(true)}
      />
    );
  }
  const letter = (name[0] ?? "?").toUpperCase();
  return (
    <div className="size-6 rounded-md bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
      {letter}
    </div>
  );
}
