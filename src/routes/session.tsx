import { Music, Pause, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface SessionPageProps {
  contextId?: string;
  onEndSession: () => void;
}

export function SessionPage({ contextId: _contextId, onEndSession }: SessionPageProps) {
  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-3">
          Deep Work
        </p>
        <div className="text-8xl font-thin tabular-nums tracking-tighter text-foreground select-none">
          25:00
        </div>
        <p className="text-sm text-muted-foreground mt-3">Session in progress</p>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" aria-label="Pause session">
          <Pause className="size-5" />
        </Button>
        <Button
          variant="destructive"
          size="lg"
          className="px-8"
          onClick={onEndSession}
        >
          <Square className="size-4" />
          End session
        </Button>
      </div>

      <div className="w-full max-w-md space-y-4">
        <TaskListPlaceholder />
        <MusicControlsPlaceholder />
      </div>
    </div>
  );
}

function TaskListPlaceholder() {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
          Tasks for this session
        </p>
        {["Write architecture doc", "Review PR #42", "Update tests"].map((task) => (
          <div key={task} className="flex items-center gap-3">
            <div className="w-4 h-4 rounded border border-muted-foreground/30 shrink-0" />
            <span className="text-sm text-foreground">{task}</span>
          </div>
        ))}
        <div className="flex items-center gap-3 opacity-40">
          <div className="w-4 h-4 rounded border border-muted-foreground/30 shrink-0" />
          <span className="text-sm line-through text-muted-foreground">Completed task</span>
        </div>
      </CardContent>
    </Card>
  );
}

function MusicControlsPlaceholder() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center shrink-0">
            <Music className="size-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Lo-fi Hip Hop Radio</p>
            <p className="text-xs text-muted-foreground truncate">Ambient loop</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Play music">
            <Play className="size-4" />
          </Button>
        </div>
        <div className="mt-3 h-1 bg-muted rounded-full">
          <div className="h-full w-2/5 bg-primary rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}
