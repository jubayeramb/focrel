import { Brain, Coffee, Folder, Music, Save, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ContextEditorPageProps {
  contextId?: string;
  onSave: () => void;
  onCancel: () => void;
}

export function ContextEditorPage({ contextId, onSave, onCancel }: ContextEditorPageProps) {
  const isEditing = Boolean(contextId);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isEditing ? "Edit context" : "New context"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Define the environment for this focus realm.
        </p>
      </div>

      <div className="space-y-4">
        <IdentitySection />
        <EnvironmentSection />
        <BehaviorSection />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button className="flex-1" onClick={onSave}>
          <Save className="size-4" />
          {isEditing ? "Save changes" : "Create context"}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function IdentitySection() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Identity</CardTitle>
        <CardDescription className="text-xs">Name, icon, and color for this context.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" placeholder="e.g. Deep Work" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="What is this context for?"
            className="resize-none"
            rows={2}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Icon</Label>
            <div className="flex gap-2">
              {["🧠", "☕", "💼", "🎯", "📚", "🎨"].map((emoji) => (
                <button
                  key={emoji}
                  className="w-9 h-9 rounded-md border border-input hover:bg-accent transition-colors text-lg"
                  type="button"
                  aria-label={`Select ${emoji} icon`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex gap-2">
              {["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"].map((color) => (
                <button
                  key={color}
                  className="w-7 h-7 rounded-full border-2 border-transparent hover:border-ring transition-colors"
                  style={{ backgroundColor: color }}
                  type="button"
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EnvironmentSection() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Environment</CardTitle>
        <CardDescription className="text-xs">Wallpaper and ambient music for this context.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>Wallpaper</Label>
          <button
            type="button"
            className="w-full h-24 rounded-md border border-dashed border-input bg-muted/50 hover:bg-muted transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground"
          >
            <Folder className="size-5" />
            <span className="text-xs">Click to choose wallpaper image</span>
          </button>
        </div>
        <div className="space-y-1.5">
          <Label>Ambient music</Label>
          <button
            type="button"
            className="w-full h-16 rounded-md border border-dashed border-input bg-muted/50 hover:bg-muted transition-colors flex items-center justify-center gap-2 text-muted-foreground"
          >
            <Music className="size-4" />
            <span className="text-xs">Click to choose audio file</span>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function BehaviorSection() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Behavior</CardTitle>
        <CardDescription className="text-xs">
          Actions taken when this context starts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="duration">Default duration (minutes)</Label>
          <Input id="duration" type="number" placeholder="25" className="w-32" />
        </div>
        <div className="space-y-1.5">
          <Label>Focus shortcut</Label>
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-muted-foreground" />
            <Input placeholder="macOS Shortcut name (e.g. Enable Deep Work)" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Revert shortcut</Label>
          <div className="flex items-center gap-2">
            <Brain className="size-4 text-muted-foreground" />
            <Input placeholder="macOS Shortcut to run on session end" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Apps to quit</Label>
          <div className="flex items-center gap-2">
            <Coffee className="size-4 text-muted-foreground" />
            <Input placeholder="e.g. com.tinyspeck.slackmacgap, com.google.Chrome" />
          </div>
          <p className="text-xs text-muted-foreground">Comma-separated bundle IDs.</p>
        </div>
      </CardContent>
    </Card>
  );
}
