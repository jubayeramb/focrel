import { useEffect } from "react";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useContextStore } from "@/lib/stores/context-store";
import { useHistoryStore } from "@/lib/stores/history-store";
import { cn } from "@/lib/utils";
import type { Session } from "@/lib/db";

type ContextHistoryPageProps = {
  contextId: string;
  onBack: () => void;
};

export function ContextHistoryPage({ contextId, onBack }: ContextHistoryPageProps) {
  const { contexts, load } = useContextStore();
  const context = useContextStore((s) => s.getById(contextId));
  const { loadByContext, loadingContext, sessionsFor } = useHistoryStore();

  useEffect(() => {
    if (contexts.length === 0) void load();
  }, []);

  useEffect(() => {
    void loadByContext(contextId);
  }, [contextId]);

  const sessions = sessionsFor(contextId);
  const loading = loadingContext === contextId;

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">
          History — {context?.name ?? "…"}
        </h1>
      </header>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sessions yet for this context.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 pr-4 font-medium">Date</th>
              <th className="pb-2 pr-4 font-medium">Duration</th>
              <th className="pb-2 pr-4 font-medium">Result</th>
              <th className="pb-2 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sessions.map((session) => (
              <SessionRow key={session.id} session={session} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function SessionRow({ session }: { session: Session }) {
  const duration = session.actualDurationSeconds != null
    ? formatDuration(session.actualDurationSeconds)
    : "—";

  return (
    <tr className="align-top">
      <td className="py-2 pr-4 whitespace-nowrap text-muted-foreground">
        {format(session.startedAt, "MMM d, yyyy h:mm a")}
      </td>
      <td className="py-2 pr-4 tabular-nums">{duration}</td>
      <td className="py-2 pr-4">
        {session.endReason ? <ReasonBadge reason={session.endReason} /> : "—"}
      </td>
      <td className="py-2 max-w-xs">
        {session.notes ? (
          <span className="block truncate" title={session.notes}>
            {session.notes}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
    </tr>
  );
}

function ReasonBadge({ reason }: { reason: "completed" | "interrupted" | "abandoned" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        reason === "completed" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
        reason === "interrupted" && "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
        reason === "abandoned" && "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
      )}
    >
      {reason.charAt(0).toUpperCase() + reason.slice(1)}
    </span>
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}
