import { useEffect } from "react";
import { Play, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContextCard } from "@/components/context-card";
import { useContextStore } from "@/lib/stores/context-store";
import { useSessionStore } from "@/lib/stores/session-store";

type HomePageProps = {
  onNavigateToNewContext: () => void;
  onStartSession: (contextId: string) => void;
  onSessionStarted: (contextId: string) => void;
};

export function HomePage({ onNavigateToNewContext, onStartSession, onSessionStarted }: HomePageProps) {
  const { contexts, loading, load } = useContextStore();
  const sessionStore = useSessionStore();

  useEffect(() => {
    if (contexts.length === 0 && !loading) load();
  }, []);

  const active = contexts.filter((c) => c.archivedAt == null);

  async function quickStart(contextId: string, defaultDurationMinutes: number) {
    await sessionStore.start({ contextId, plannedDurationMinutes: defaultDurationMinutes, taskIds: [] });
    onSessionStarted(contextId);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Start a session</h1>
        <p className="text-sm text-muted-foreground mt-1">Pick a context to enter its realm.</p>
      </header>

      {active.length === 0 ? (
        <EmptyState onNew={onNavigateToNewContext} />
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
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-6 opacity-50">
        <Sparkles className="size-8 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-medium mb-2">No contexts yet</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        Create your first context to start focusing.
      </p>
      <Button onClick={onNew}>
        <Plus className="size-4" />
        Create first context
      </Button>
    </div>
  );
}
