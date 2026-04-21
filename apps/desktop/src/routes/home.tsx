import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContextCard } from "@/components/context-card";
import { StatCard } from "@/components/analytics/stat-card";
import { DailyBars } from "@/components/analytics/daily-bars";
import { analyticsRepo } from "@/lib/db";
import { useContextStore } from "@/lib/stores/context-store";
import { useSessionStore } from "@/lib/stores/session-store";

type PeriodStats = {
  focusMinutes: number;
  sessionCount: number;
  completionRate: number;
};

type DayMinutes = {
  date: string;
  minutes: number;
};

type ContextMinutes = {
  contextId: string;
  name: string;
  color: string;
  minutes: number;
};

type AnalyticsState = {
  today: PeriodStats;
  week: PeriodStats;
  streakDays: number;
  dailyMinutes: DayMinutes[];
  byContext: ContextMinutes[];
  hasAnySessions: boolean;
  loaded: boolean;
};

const EMPTY_STATS: PeriodStats = { focusMinutes: 0, sessionCount: 0, completionRate: 0 };

type HomePageProps = {
  onNavigateToNewContext: () => void;
  onStartSession: (contextId: string) => void;
  onSessionStarted: (contextId: string) => void;
};

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Wind down";
}

export function HomePage({
  onNavigateToNewContext,
  onStartSession,
  onSessionStarted,
}: HomePageProps) {
  const { contexts, loading, load } = useContextStore();
  const sessionStore = useSessionStore();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState<AnalyticsState>({
    today: EMPTY_STATS,
    week: EMPTY_STATS,
    streakDays: 0,
    dailyMinutes: [],
    byContext: [],
    hasAnySessions: false,
    loaded: false,
  });

  useEffect(() => {
    if (contexts.length === 0 && !loading) load();
  }, []);

  useEffect(() => {
    async function fetchAnalytics() {
      const [today, week, streakDays, dailyMinutes, byContext] = await Promise.all([
        analyticsRepo.todayStats(),
        analyticsRepo.weekStats(),
        analyticsRepo.streakDays(),
        analyticsRepo.dailyMinutes(14),
        analyticsRepo.byContext(7),
      ]);

      const hasAnySessions = week.sessionCount > 0 || dailyMinutes.some((d) => d.minutes > 0);

      setAnalytics({ today, week, streakDays, dailyMinutes, byContext, hasAnySessions, loaded: true });
    }

    void fetchAnalytics();
  }, []);

  const active = contexts.filter((c) => c.archivedAt == null);

  async function quickStart(contextId: string, defaultDurationMinutes: number) {
    await sessionStore.start({
      contextId,
      plannedDurationMinutes: defaultDurationMinutes,
      taskIds: [],
    });
    onSessionStarted(contextId);
  }

  const showEmptyState = analytics.loaded && !analytics.hasAnySessions;
  const contextTotalMinutes = analytics.byContext.reduce((sum, c) => sum + c.minutes, 0) || 1;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{greeting()}</h1>
        <p className="text-sm text-muted-foreground">
          {showEmptyState
            ? "Pick a context below to start your first session."
            : "Here's where your time is going."}
        </p>
      </header>

      {!showEmptyState && (
        <>
          <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard
              accent
              label="Today"
              value={`${analytics.today.focusMinutes}m`}
              sublabel={`${analytics.today.sessionCount} session${analytics.today.sessionCount !== 1 ? "s" : ""}`}
            />
            <StatCard
              label="This week"
              value={`${analytics.week.focusMinutes}m`}
              sublabel={`${analytics.week.sessionCount} session${analytics.week.sessionCount !== 1 ? "s" : ""}`}
            />
            <StatCard label="Streak" value={`${analytics.streakDays}d`} sublabel="in a row" />
            <StatCard
              label="Completion"
              value={`${Math.round(analytics.week.completionRate * 100)}%`}
              sublabel="this week"
            />
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Last 14 days</h2>
              <span className="text-xs text-muted-foreground">minutes focused</span>
            </div>
            {analytics.dailyMinutes.length > 0 && <DailyBars data={analytics.dailyMinutes} />}
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">By context · last 7 days</h2>
            </div>
            {analytics.byContext.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sessions logged yet.</p>
            ) : (
              <ul className="space-y-3">
                {analytics.byContext.slice(0, 5).map((c) => {
                  const pct = (c.minutes / contextTotalMinutes) * 100;
                  return (
                    <li key={c.contextId} className="flex items-center gap-3">
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="w-24 shrink-0 truncate text-sm text-foreground">
                        {c.name}
                      </span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: c.color }}
                        />
                      </div>
                      <span className="w-12 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
                        {c.minutes}m
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}

      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="text-sm font-semibold text-foreground">Quick start</h2>
          {active.length > 4 && (
            <button
              type="button"
              onClick={() => void navigate({ to: "/sessions" })}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              View all →
            </button>
          )}
        </div>
        {active.length === 0 ? (
          <EmptyContextState onNew={onNavigateToNewContext} />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {active.slice(0, 4).map((c) => (
              <ContextCard
                key={c.id}
                context={c}
                onClick={() => onStartSession(c.id)}
                actions={
                  <Button
                    size="sm"
                    variant="default"
                    className="h-7 gap-1 rounded-full px-3 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      void quickStart(c.id, c.defaultDurationMinutes);
                    }}
                  >
                    <Play className="size-3 fill-current" />
                    Start
                  </Button>
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyContextState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 py-12 text-center">
      <p className="mb-4 text-sm text-muted-foreground">No contexts yet.</p>
      <Button onClick={onNew} size="sm">
        Create first context
      </Button>
    </div>
  );
}
