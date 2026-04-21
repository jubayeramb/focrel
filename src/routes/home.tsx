import { Brain, Coffee, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const STOCK_CONTEXT_ICONS = [Brain, Coffee];

export function HomePage({ onNavigateToNewContext }: { onNavigateToNewContext: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contexts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pick a context to start a focused session.
          </p>
        </div>
        <Button onClick={onNavigateToNewContext} size="sm">
          <Plus className="size-4" />
          New context
        </Button>
      </div>

      <EmptyContextsState onNavigateToNewContext={onNavigateToNewContext} />
    </div>
  );
}

function EmptyContextsState({ onNavigateToNewContext }: { onNavigateToNewContext: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex gap-3 mb-6">
        {STOCK_CONTEXT_ICONS.map((Icon, i) => (
          <div
            key={i}
            className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center opacity-40"
          >
            <Icon className="size-7 text-muted-foreground" />
          </div>
        ))}
      </div>
      <h2 className="text-lg font-medium mb-2">No contexts yet</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        Create your first context to define an environment — wallpaper, music, tasks, and Focus
        mode — all in one switch.
      </p>
      <Button onClick={onNavigateToNewContext}>
        <Plus className="size-4" />
        Create first context
      </Button>
    </div>
  );
}

export function ContextCard({
  name,
  description,
  color,
  icon,
  onStart,
}: {
  name: string;
  description?: string;
  color: string;
  icon?: string;
  onStart: () => void;
}) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-2"
            style={{ backgroundColor: color + "33" }}
          >
            {icon ?? "🧠"}
          </div>
        </div>
        <CardTitle className="text-base">{name}</CardTitle>
        {description && <CardDescription className="text-xs line-clamp-2">{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <Button
          size="sm"
          className="w-full opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onStart();
          }}
        >
          Start session
        </Button>
      </CardContent>
    </Card>
  );
}
