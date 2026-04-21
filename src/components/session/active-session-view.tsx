import * as React from "react";
import { Music, Pause, Play, Square } from "lucide-react";
import { TaskRow } from "@/components/task-row";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { audio } from "@/lib/os";
import { useTaskStore } from "@/lib/stores/task-store";
import { useContextStore } from "@/lib/stores/context-store";
import { useSessionTimer } from "@/lib/hooks/use-session-timer";

type ActiveSessionViewProps = {
  sessionId: string;
  contextId: string;
  startedAt: number;
  plannedDurationMinutes: number;
  taskIds: string[];
  onRequestEnd: (autoTriggered: boolean) => void;
};

function formatMmSs(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function ActiveSessionView({
  sessionId: _sessionId,
  contextId,
  startedAt,
  plannedDurationMinutes,
  taskIds,
  onRequestEnd,
}: ActiveSessionViewProps) {
  const { remainingSeconds, elapsedSeconds, isOvertime, progress01 } = useSessionTimer(
    startedAt,
    plannedDurationMinutes,
  );

  const autoEndFired = React.useRef(false);

  React.useEffect(() => {
    if (remainingSeconds === 0 && !autoEndFired.current) {
      autoEndFired.current = true;
      onRequestEnd(true);
    }
  }, [remainingSeconds, onRequestEnd]);

  const tasks = useTaskStore((s) => s.tasksFor(contextId));
  const sessionTasks = tasks.filter((t) => taskIds.includes(t.id));
  const completedCount = sessionTasks.filter((t) => t.status === "done").length;

  const context = useContextStore((s) => s.getById(contextId));
  const musicPath = context?.musicPath ?? null;
  const hasMusicPath = musicPath !== null;

  const [isPlaying, setIsPlaying] = React.useState(hasMusicPath);
  const [volume, setVolume] = React.useState(0.6);

  async function togglePlayPause() {
    if (isPlaying) {
      await audio.pause();
      setIsPlaying(false);
    } else if (musicPath !== null) {
      // Sink was dropped by Stop — fresh decode required.
      await audio.play(musicPath);
      setIsPlaying(true);
    }
  }

  async function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parseFloat(e.target.value);
    setVolume(v);
    await audio.setVolume(v);
  }

  async function handleStopAudio() {
    await audio.stop();
    setIsPlaying(false);
  }

  const timerDisplay = isOvertime
    ? `+${formatMmSs(elapsedSeconds - plannedDurationMinutes * 60)}`
    : formatMmSs(remainingSeconds);

  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto py-4 pb-20">
      {/* Timer card */}
      <Card>
        <CardContent className="pt-8 pb-6 flex flex-col items-center gap-4">
          <span
            className={cn(
              "text-8xl font-thin tabular-nums tracking-tighter select-none",
              isOvertime ? "text-amber-500" : "text-foreground",
            )}
          >
            {timerDisplay}
          </span>
          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-1000",
                isOvertime ? "bg-amber-500" : "bg-primary",
              )}
              style={{
                width: `${progress01 * 100}%`,
                ...(!isOvertime && { backgroundColor: "var(--accent-ctx, hsl(var(--primary)))" }),
              }}
            />
          </div>
          {isOvertime && (
            <p className="text-xs text-amber-500 font-medium">Session overtime — wrap it up!</p>
          )}
        </CardContent>
      </Card>

      {/* Tasks card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
              Tasks
            </CardTitle>
            {sessionTasks.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {completedCount} / {sessionTasks.length} done
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {sessionTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No tasks selected for this session.</p>
          ) : (
            <ul className="space-y-0.5">
              {sessionTasks.map((task) => (
                <li key={task.id}>
                  <TaskRow
                    task={task}
                    onDelete={() => {}}
                  />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Music controls card */}
      {hasMusicPath && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
              Music
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => void togglePlayPause()}
                aria-label={isPlaying ? "Pause music" : "Play music"}
              >
                {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
              </Button>
              <div className="flex-1 flex items-center gap-2">
                <Music className="size-4 text-muted-foreground shrink-0" />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(e) => void handleVolumeChange(e)}
                  className="flex-1 accent-primary h-1.5 rounded-full cursor-pointer"
                  aria-label="Volume"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => void handleStopAudio()}
                aria-label="Stop music"
              >
                <Square className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* End session — fixed bottom-right */}
      <div className="fixed bottom-6 right-6">
        <Button
          type="button"
          variant="outline"
          className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
          onClick={() => onRequestEnd(false)}
        >
          End session
        </Button>
      </div>
    </div>
  );
}
