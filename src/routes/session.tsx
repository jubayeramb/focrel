import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ActiveSessionView } from "@/components/session/active-session-view";
import { BreakPrompt } from "@/components/session/break-prompt";
import {
  EndSessionDialog,
  type EndReason,
} from "@/components/session/end-session-dialog";
import { PreSessionPanel } from "@/components/session/pre-session-panel";
import { Button } from "@/components/ui/button";
import { useContextStore } from "@/lib/stores/context-store";
import { useSessionStore } from "@/lib/stores/session-store";

interface SessionPageProps {
  contextId?: string;
  onEndSession: () => void;
}

export function SessionPage({ contextId, onEndSession }: SessionPageProps) {
  const sessionStore = useSessionStore();
  const { state } = sessionStore;
  const getById = useContextStore((s) => s.getById);
  const contexts = useContextStore((s) => s.contexts);

  const [breakOpen, setBreakOpen] = useState(false);
  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const [endInitialReason, setEndInitialReason] = useState<EndReason>("interrupted");
  const [extensionMinutes, setExtensionMinutes] = useState(0);

  if (!contextId) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <p className="text-sm text-muted-foreground">No context selected.</p>
        <Button variant="outline" asChild>
          <Link to="/">Go home</Link>
        </Button>
      </div>
    );
  }

  function handleEndRequest(autoTriggered: boolean) {
    if (autoTriggered) {
      setBreakOpen(true);
    } else {
      setEndInitialReason("interrupted");
      setEndDialogOpen(true);
    }
  }

  async function handleEndDialogSave(reason: EndReason, notes?: string) {
    setEndDialogOpen(false);
    setBreakOpen(false);
    setExtensionMinutes(0);
    await sessionStore.end(reason, notes);
    onEndSession();
  }

  function handleBreakExtend() {
    setExtensionMinutes((m) => m + 10);
    setBreakOpen(false);
  }

  async function handleBreakTake() {
    setBreakOpen(false);
    await sessionStore.end("completed");
    const breakCtx = contexts.find((c) => c.name === "Break" && c.archivedAt == null);
    if (breakCtx) {
      await sessionStore.start({
        contextId: breakCtx.id,
        plannedDurationMinutes: 5,
        taskIds: [],
      });
    } else {
      onEndSession();
    }
  }

  function handleBreakEndInstead() {
    setBreakOpen(false);
    setEndInitialReason("completed");
    setEndDialogOpen(true);
  }

  if (state.phase === "active" && state.contextId !== contextId) {
    const otherContext = getById(state.contextId);
    const otherName = otherContext?.name ?? state.contextId;
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <p className="text-sm text-muted-foreground text-center">
          A session is already running for <span className="font-medium">{otherName}</span>.
          End it to start a new one.
        </p>
        <Button variant="outline" onClick={() => handleEndRequest(false)}>
          End running session
        </Button>
        <EndSessionDialog
          open={endDialogOpen}
          initialReason={endInitialReason}
          onSave={handleEndDialogSave}
          onCancel={() => setEndDialogOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {state.phase === "recovered" && (
        <div className="flex items-center justify-between rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Recovered a stale session. Original wallpaper restored.
          </p>
          <button
            type="button"
            onClick={sessionStore.dismissRecoveryToast}
            className="text-sm text-muted-foreground hover:text-foreground ml-4 shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {(state.phase === "idle" || state.phase === "recovered") && (
        <PreSessionPanel
          contextId={contextId}
          onStarted={() => {}}
          onCancel={onEndSession}
        />
      )}

      {state.phase === "starting" && (
        <div className="flex items-center justify-center gap-3 py-16">
          <span className="size-5 rounded-full border-2 border-muted border-t-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Starting session…</p>
        </div>
      )}

      {state.phase === "active" && state.contextId === contextId && (
        <ActiveSessionView
          sessionId={state.sessionId}
          contextId={state.contextId}
          startedAt={state.startedAt}
          plannedDurationMinutes={state.plannedDurationMinutes + extensionMinutes}
          taskIds={state.taskIds}
          onRequestEnd={handleEndRequest}
        />
      )}

      {state.phase === "ending" && (
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-muted-foreground">Ending session…</p>
        </div>
      )}

      <BreakPrompt
        open={breakOpen}
        onTakeBreak={() => void handleBreakTake()}
        onExtend={handleBreakExtend}
        onEndSession={handleBreakEndInstead}
      />
      <EndSessionDialog
        open={endDialogOpen}
        initialReason={endInitialReason}
        onSave={handleEndDialogSave}
        onCancel={() => setEndDialogOpen(false)}
      />
    </div>
  );
}
