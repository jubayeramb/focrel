const DAY_ABBREVS = ["S", "M", "T", "W", "T", "F", "S"];

type DayData = {
  date: string;
  minutes: number;
};

type DailyBarsProps = {
  data: DayData[];
};

// Renders a short, locale-aware "Apr 23" style label from an ISO date.
// T12:00:00 anchors the parse at local noon so TZ shifts don't pull the day
// backward for early-morning UTC boundaries.
function formatDayLabel(iso: string): string {
  try {
    const d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

export function DailyBars({ data }: DailyBarsProps) {
  const maxMinutes = Math.max(...data.map((d) => d.minutes), 1);

  return (
    <div className="flex h-24 w-full items-end gap-1">
      {data.map((d) => {
        const heightPct = d.minutes > 0 ? (d.minutes / maxMinutes) * 100 : 0;
        const dayAbbrev = DAY_ABBREVS[new Date(d.date + "T12:00:00").getDay()];
        const label = `${formatDayLabel(d.date)} · ${d.minutes}m`;

        return (
          // `group` scopes the instant hover-tooltip below. We deliberately
          // avoid the native `title` attribute — macOS tooltips have a
          // ~500ms OS-level delay that made scanning the chart feel
          // sluggish. The CSS opacity swap here fires with no delay.
          <div
            key={d.date}
            className="group relative flex h-full min-w-0 flex-1 flex-col items-center gap-1"
          >
            <div className="flex w-full flex-1 items-end">
              {d.minutes > 0 ? (
                <div
                  className="w-full rounded-sm bg-primary/80 transition-colors group-hover:bg-primary"
                  style={{ height: `${heightPct}%` }}
                />
              ) : (
                <div className="w-full bg-muted" style={{ height: "2px" }} />
              )}
            </div>
            <span className="hidden text-[10px] leading-none text-muted-foreground sm:block">
              {dayAbbrev}
            </span>

            {/* Instant tooltip — pointer-events-none so it never steals the
                hover from the bar underneath, and `whitespace-nowrap` so it
                doesn't wrap in narrow columns. */}
            <div
              role="tooltip"
              className={[
                "pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2",
                "whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1",
                "text-xs font-medium text-foreground shadow-md",
                "opacity-0 transition-opacity duration-75 group-hover:opacity-100",
              ].join(" ")}
            >
              {label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
