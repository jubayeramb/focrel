import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Play, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContextCard } from "@/components/context-card";
import { useContextStore } from "@/lib/stores/context-store";
import { useSessionStore } from "@/lib/stores/session-store";

export function SessionsPage() {
  const { contexts, loading, load } = useContextStore();
  const sessionStore = useSessionStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (contexts.length === 0 && !loading) load();
  }, []);

  const active = contexts.filter((c) => c.archivedAt == null);

  async function quickStart(contextId: string, defaultDurationMinutes: number) {
    await sessionStore.start({
      contextId,
      plannedDurationMinutes: defaultDurationMinutes,
      taskIds: [],
    });
    void navigate({ to: "/session", search: { contextId } });
  }

  if (active.length === 0) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Sessions</h1>
          <p className="text-sm text-muted-foreground mt-1">Pick a context to enter its realm.</p>
        </header>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-6 opacity-50">
            <Sparkles className="size-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-medium mb-2">No contexts yet</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            Create your first context to start focusing.
          </p>
          <Button onClick={() => void navigate({ to: "/contexts/new" })}>
            <Plus className="size-4" />
            Create first context
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sessions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Click a card to review tasks first, or use Start to jump right in.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void navigate({ to: "/contexts/new" })}
        >
          <Plus className="size-4" />
          New context
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {active.map((c) => (
          <ContextCard
            key={c.id}
            context={c}
            onClick={() => void navigate({ to: "/session", search: { contextId: c.id } })}
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
    </div>
  );
}
