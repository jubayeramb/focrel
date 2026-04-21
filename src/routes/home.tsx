import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export function HomePage({ onNavigateToNewContext, onStartSession, onSessionStarted }: HomePageProps) {
  const { contexts, loading, load } = useContextStore();
  const sessionStore = useSessionStore();

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
    await sessionStore.start({ contextId, plannedDurationMinutes: defaultDurationMinutes, taskIds: [] });
    onSessionStarted(contextId);
  }

  const showEmptyState = analytics.loaded && !analytics.hasAnySessions;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Focrel</h1>
        <p className="text-sm text-muted-foreground mt-1">Today's focus at a glance.</p>
      </header>

      {showEmptyState ? (
        <div className="rounded-xl border bg-muted/30 px-6 py-10 text-center text-sm text-muted-foreground">
          No sessions yet. Pick a context below to start your first.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              label="Today"
              value={`${analytics.today.focusMinutes}m`}
              sublabel={`${analytics.today.sessionCount} session${analytics.today.sessionCount !== 1 ? "s" : ""}`}
            />
            <StatCard
              label="This week"
              value={`${analytics.week.focusMinutes}m`}
              sublabel={`${analytics.week.sessionCount} session${analytics.week.sessionCount !== 1 ? "s" : ""}`}
            />
            <StatCard
              label="Streak"
              value={`${analytics.streakDays}d`}
            />
            <StatCard
              label="Completion"
              value={`${Math.round(analytics.week.completionRate * 100)}%`}
            />
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Last 14 days</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.dailyMinutes.length > 0 && (
                <DailyBars data={analytics.dailyMinutes} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">By context · last 7 days</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.byContext.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sessions logged yet.</p>
              ) : (
                <ul className="space-y-2">
                  {analytics.byContext.slice(0, 5).map((c) => (
                    <li key={c.contextId} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="block w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: c.color }}
                        />
                        <span className="text-sm">{c.name}</span>
                      </div>
                      <span className="text-sm tabular-nums text-muted-foreground">{c.minutes}m</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <div className="space-y-3">
        <h2 className="text-base font-semibold">Quick start</h2>
        {active.length === 0 ? (
          <EmptyContextState onNew={onNavigateToNewContext} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {active.map((c) => (
              <ContextCard
                key={c.id}
                context={c}
                onClick={() => onStartSession(c.id)}
                actions={
                  <Button
                    size="sm"
                    variant="default"
                    onClick={(e) => {
                      e.stopPropagation();
                      void quickStart(c.id, c.defaultDurationMinutes);
                    }}
                  >
                    <Play className="size-3.5" />
                    Start
                  </Button>
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyContextState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-sm text-muted-foreground mb-4">No contexts yet.</p>
      <Button onClick={onNew} size="sm">
        Create first context
      </Button>
    </div>
  );
}
