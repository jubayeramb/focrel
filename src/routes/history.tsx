import { useEffect, useState } from "react";
import { format } from "date-fns";
import { sessionsRepo } from "@/lib/db/repos/sessions";
import { useContextStore } from "@/lib/stores/context-store";
import { cn } from "@/lib/utils";
import type { Session } from "@/lib/db";

export function GlobalHistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const { contexts, load } = useContextStore();

  useEffect(() => {
    if (contexts.length === 0) void load();
  }, []);

  useEffect(() => {
    setLoading(true);
    sessionsRepo
      .allRecent(100)
      .then(setSessions)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">History</h1>
        <p className="text-sm text-muted-foreground mt-1">All sessions across every context.</p>
      </header>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sessions yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 pr-4 font-medium">Date</th>
              <th className="pb-2 pr-4 font-medium">Context</th>
              <th className="pb-2 pr-4 font-medium">Duration</th>
              <th className="pb-2 pr-4 font-medium">End reason</th>
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
  const getById = useContextStore((s) => s.getById);
  const context = getById(session.contextId);

  const duration =
    session.actualDurationSeconds != null ? formatDuration(session.actualDurationSeconds) : "—";

  return (
    <tr className="align-top">
      <td className="py-2 pr-4 whitespace-nowrap text-muted-foreground">
        {format(session.startedAt, "MMM d, yyyy h:mm a")}
      </td>
      <td className="py-2 pr-4">
        <span className="flex items-center gap-2">
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: context?.color ?? "#7c3aed" }}
          />
          <span className="truncate">{context?.name ?? session.contextId}</span>
        </span>
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
        reason === "completed" &&
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
        reason === "interrupted" &&
          "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
        reason === "abandoned" &&
          "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
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
