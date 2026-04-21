import { Archive, Edit, MoreVertical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ContextsPageProps {
  onNavigateToNew: () => void;
  onNavigateToEdit: (id: string) => void;
}

export function ContextsPage({ onNavigateToNew, onNavigateToEdit }: ContextsPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">All Contexts</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your focus environments.</p>
        </div>
        <Button onClick={onNavigateToNew} size="sm">
          <Plus className="size-4" />
          New context
        </Button>
      </div>

      <div className="space-y-3">
        <ContextListItemPlaceholder
          name="Deep Work"
          description="Distraction-free coding and writing"
          color="#4f46e5"
          icon="🧠"
          onEdit={() => onNavigateToEdit("placeholder-id")}
        />
        <ContextListItemPlaceholder
          name="Break"
          description="Short recharge between sessions"
          color="#10b981"
          icon="☕"
          onEdit={() => onNavigateToEdit("placeholder-id-2")}
        />
      </div>
    </div>
  );
}

function ContextListItemPlaceholder({
  name,
  description,
  color,
  icon,
  onEdit,
}: {
  name: string;
  description?: string;
  color: string;
  icon?: string;
  onEdit: () => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-2 flex-row items-center gap-4 space-y-0">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
          style={{ backgroundColor: color + "33" }}
        >
          {icon ?? "🧠"}
        </div>
        <div className="flex-1 min-w-0">
          <CardTitle className="text-base">{name}</CardTitle>
          {description && (
            <CardDescription className="text-xs mt-0.5 truncate">{description}</CardDescription>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onEdit}
            aria-label="Edit context"
          >
            <Edit className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="More options"
          >
            <MoreVertical className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>25 min default</span>
          <span>·</span>
          <span>0 tasks</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Archive className="size-3" />
            Archive
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
