import { convertFileSrc } from "@tauri-apps/api/core";
import { Check, RefreshCw, Search } from "lucide-react";
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
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs font-medium text-muted-foreground">
          {value.length > 0 ? `${value.length} selected` : "None selected"}
        </span>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={disabled || loading}
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-md",
            "transition-colors hover:bg-accent",
            "focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring",
            "disabled:pointer-events-none disabled:opacity-50",
          )}
          aria-label="Refresh app list"
        >
          <RefreshCw className={cn("size-3 text-muted-foreground", loading && "animate-spin")} />
        </button>
      </div>

      <div className="relative border-b border-border px-3 py-2">
        <Search className="pointer-events-none absolute left-5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={disabled}
          placeholder="Filter apps…"
          className={cn(
            "w-full bg-transparent py-0.5 pl-6 text-sm",
            "placeholder:text-muted-foreground",
            "focus:outline-hidden",
            "disabled:cursor-not-allowed",
          )}
        />
      </div>

      {fallback && (
        <p className="border-b border-border px-3 py-1.5 text-xs text-amber-600 dark:text-amber-400">
          Showing running apps — couldn&apos;t scan installed apps.
        </p>
      )}

      {/* Grid — icon tiles, selected state via primary ring + corner check.
          Layout and density are tuned to read like a macOS Launchpad grid. */}
      <div className="max-h-[320px] overflow-y-auto p-2">
        {error ? (
          <p className="py-4 text-center text-xs text-destructive">{error}</p>
        ) : sorted.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            {loading ? "Loading…" : "No apps found. Try refreshing."}
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
            {sorted.map((app) => {
              const checked = value.includes(app.bundleId);
              return (
                <button
                  key={app.bundleId}
                  type="button"
                  onClick={() => toggle(app.bundleId)}
                  disabled={disabled}
                  title={`${app.name}\n${app.bundleId}`}
                  aria-pressed={checked}
                  className={cn(
                    "group relative flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 transition-colors",
                    "focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring",
                    checked
                      ? "border-primary bg-primary/10"
                      : "border-transparent hover:bg-accent",
                    disabled && "cursor-not-allowed",
                  )}
                >
                  {checked && (
                    <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                      <Check className="size-2.5" strokeWidth={3} />
                    </span>
                  )}
                  <AppIcon bundleId={app.bundleId} bundlePath={app.bundlePath} name={app.name} />
                  <span className="line-clamp-2 w-full text-center text-[11px] leading-tight text-foreground">
                    {app.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}
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
        className="size-10 shrink-0 rounded-lg"
        onError={() => setFailed(true)}
      />
    );
  }
  const letter = (name[0] ?? "?").toUpperCase();
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-muted-foreground">
      {letter}
    </div>
  );
}
