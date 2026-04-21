const DAY_ABBREVS = ["S", "M", "T", "W", "T", "F", "S"];

type DayData = {
  date: string;
  minutes: number;
};

type DailyBarsProps = {
  data: DayData[];
};

export function DailyBars({ data }: DailyBarsProps) {
  const maxMinutes = Math.max(...data.map((d) => d.minutes), 1);

  return (
    <div className="flex items-end gap-1 h-24 w-full">
      {data.map((d) => {
        const heightPct = d.minutes > 0 ? (d.minutes / maxMinutes) * 100 : 0;
        const dayAbbrev = DAY_ABBREVS[new Date(d.date + "T12:00:00").getDay()];

        return (
          <div key={d.date} className="flex flex-col items-center gap-1 flex-1 min-w-0 h-full">
            <div className="flex items-end flex-1 w-full">
              {d.minutes > 0 ? (
                <div
                  className="w-full rounded-sm bg-primary/80 hover:bg-primary transition-colors"
                  style={{ height: `${heightPct}%` }}
                  title={`${d.date}: ${d.minutes}m`}
                />
              ) : (
                <div
                  className="w-full bg-muted"
                  style={{ height: "2px" }}
                  title={`${d.date}: 0m`}
                />
              )}
            </div>
            <span className="text-[10px] text-muted-foreground leading-none hidden sm:block">
              {dayAbbrev}
            </span>
          </div>
        );
      })}
    </div>
  );
}
