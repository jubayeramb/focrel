import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskFilters } from "@/components/task-filters";
import { TaskList } from "@/components/task-list";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { AppPicker } from "@/components/pickers/app-picker";
import { ColorPicker } from "@/components/pickers/color-picker";
import { IconPicker } from "@/components/pickers/icon-picker";
import { MusicTrackList } from "@/components/pickers/music-track-list";
import { ShortcutPicker } from "@/components/pickers/shortcut-picker";
import { TimePicker } from "@/components/pickers/time-picker";
import { WallpaperPicker } from "@/components/pickers/wallpaper-picker";
import { useContextStore } from "@/lib/stores/context-store";
import { shortcuts } from "@/lib/os";

interface ContextEditorPageProps {
  contextId?: string;
  onSave: () => void;
  onCancel: () => void;
}

interface ContextDraft {
  name: string;
  description: string;
  color: string;
  icon: string;
  wallpaperPath: string | null;
  musicPath: string | null;
  shortcutName: string | null;
  revertShortcutName: string | null;
  appsToQuit: string[];
  blockedSites: string[];
  defaultDurationMinutes: number;
  scheduleEnabled: number;
  scheduleTime: string;
  scheduleDays: number[];
  scheduleAutoStart: number;
  musicLoop: number;
  musicPaths: string[];
  musicShuffle: number;
}

const defaultDraft: ContextDraft = {
  name: "",
  description: "",
  color: "#7c3aed",
  icon: "Brain",
  wallpaperPath: null,
  musicPath: null,
  shortcutName: null,
  revertShortcutName: null,
  appsToQuit: [],
  blockedSites: [],
  defaultDurationMinutes: 25,
  scheduleEnabled: 0,
  scheduleTime: "",
  scheduleDays: [],
  scheduleAutoStart: 1,
  musicLoop: 1,
  musicPaths: [],
  musicShuffle: 0,
};

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

export function ContextEditorPage({ contextId, onSave, onCancel }: ContextEditorPageProps) {
  const isEdit = Boolean(contextId);
  const contextStore = useContextStore();

  const [draft, setDraft] = useState<ContextDraft>(defaultDraft);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [colorError, setColorError] = useState<string | null>(null);
  const [durationError, setDurationError] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement>(null);
  const [taskFilter, setTaskFilter] = useState<"all" | "open" | "done">("all");

  useEffect(() => {
    if (!isEdit) return;

    async function initEdit() {
      if (contextStore.contexts.length === 0 && !contextStore.loading) {
        await contextStore.load();
      }
      const loaded = contextStore.getById(contextId!);
      if (!loaded) {
        setNotFound(true);
        return;
      }
      setDraft({
        name: loaded.name,
        description: loaded.description ?? "",
        color: loaded.color,
        icon: loaded.icon ?? "Brain",
        wallpaperPath: loaded.wallpaperPath,
        musicPath: loaded.musicPath,
        shortcutName: loaded.shortcutName,
        revertShortcutName: loaded.revertShortcutName,
        appsToQuit: JSON.parse(loaded.appsToQuit) as string[],
        blockedSites: JSON.parse(loaded.blockedSites) as string[],
        defaultDurationMinutes: loaded.defaultDurationMinutes,
        scheduleEnabled: loaded.scheduleEnabled,
        scheduleTime: loaded.scheduleTime ?? "",
        scheduleDays: loaded.scheduleDays
          ? loaded.scheduleDays.split(",").filter(Boolean).map(Number)
          : [],
        scheduleAutoStart: loaded.scheduleAutoStart,
        musicLoop: loaded.musicLoop,
        musicPaths: (() => {
          try {
            const parsed = JSON.parse(loaded.musicPaths) as unknown;
            if (Array.isArray(parsed)) return parsed.filter((p): p is string => typeof p === "string");
          } catch {
            /* noop */
          }
          return loaded.musicPath ? [loaded.musicPath] : [];
        })(),
        musicShuffle: loaded.musicShuffle,
      });
    }

    void initEdit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, contextId]);

  // Re-check notFound once store finishes loading (covers the case where store was empty on mount)
  useEffect(() => {
    if (!isEdit || contextStore.loading) return;
    const loaded = contextStore.getById(contextId!);
    if (!loaded) {
      setNotFound(true);
    } else if (notFound) {
      setNotFound(false);
    }
    // We only want to react to store load completion here, not continuously
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextStore.loading]);

  function patch<K extends keyof ContextDraft>(key: K, value: ContextDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): boolean {
    let ok = true;

    if (!draft.name.trim()) {
      setNameError("Name is required.");
      ok = false;
    } else {
      setNameError(null);
    }

    if (!HEX_RE.test(draft.color)) {
      setColorError("Must be a valid 6-digit hex color (e.g. #7c3aed).");
      ok = false;
    } else {
      setColorError(null);
    }

    const dur = draft.defaultDurationMinutes;
    if (!Number.isInteger(dur) || dur < 1 || dur > 480) {
      setDurationError("Duration must be a whole number between 1 and 480.");
      ok = false;
    } else {
      setDurationError(null);
    }

    return ok;
  }

  const isFormInvalid =
    !draft.name.trim() ||
    !HEX_RE.test(draft.color) ||
    !Number.isInteger(draft.defaultDurationMinutes) ||
    draft.defaultDurationMinutes < 1 ||
    draft.defaultDurationMinutes > 480;

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    setSaveError(null);
    try {
      const payload = {
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        color: draft.color,
        icon: draft.icon,
        wallpaperPath: draft.wallpaperPath,
        shortcutName: draft.shortcutName,
        revertShortcutName: draft.revertShortcutName,
        appsToQuit: JSON.stringify(draft.appsToQuit),
        blockedSites: JSON.stringify(draft.blockedSites),
        defaultDurationMinutes: draft.defaultDurationMinutes,
        scheduleEnabled: draft.scheduleEnabled,
        scheduleTime: draft.scheduleEnabled && draft.scheduleTime ? draft.scheduleTime : null,
        scheduleDays: draft.scheduleDays.join(","),
        scheduleAutoStart: draft.scheduleAutoStart,
        musicLoop: draft.musicLoop,
        musicPaths: JSON.stringify(draft.musicPaths),
        musicShuffle: draft.musicShuffle,
        // Keep the legacy single-column in sync with the first track for
        // pre-0004 consumers (tray-bridge etc. still read musicPath).
        musicPath: draft.musicPaths[0] ?? null,
      };
      if (isEdit) {
        await contextStore.update(contextId!, payload);
      } else {
        await contextStore.create(payload);
      }
      onSave();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive() {
    if (!contextId) return;
    setSaving(true);
    setSaveError(null);
    try {
      await contextStore.archive(contextId);
      onSave();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key === "Escape") {
      onCancel();
      return;
    }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (!isFormInvalid && !saving) {
        void handleSave();
      }
    }
  }

  if (notFound) {
    return (
      <div className="max-w-xl mx-auto space-y-4 pt-8">
        <p className="text-muted-foreground">Context not found.</p>
        <Button variant="outline" onClick={onCancel}>
          Back to contexts
        </Button>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      className="max-w-xl mx-auto space-y-6"
      onSubmit={(e) => e.preventDefault()}
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isEdit ? "Edit context" : "New context"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Define the environment for this focus realm.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 pt-1">
          {isEdit && (
            <Button
              type="button"
              variant="outline"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/40"
              disabled={saving}
              onClick={() => void handleArchive()}
            >
              Archive
            </Button>
          )}
          <Button type="button" variant="outline" disabled={saving} onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isFormInvalid || saving}
            onClick={() => void handleSave()}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {saveError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {saveError}
        </div>
      )}

      {/* Section 1: Identity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Identity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="e.g. Deep Work"
              value={draft.name}
              onChange={(e) => patch("name", e.target.value)}
              aria-invalid={Boolean(nameError)}
            />
            {nameError && <p className="text-xs text-destructive">{nameError}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What is this context for?"
              className="resize-none"
              rows={2}
              value={draft.description}
              onChange={(e) => patch("description", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Color</Label>
            <ColorPicker
              value={draft.color}
              onChange={(v) => patch("color", v ?? "#7c3aed")}
              disabled={saving}
            />
            {colorError && <p className="text-xs text-destructive">{colorError}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Icon</Label>
            <IconPicker
              value={draft.icon}
              onChange={(v) => patch("icon", v ?? "Brain")}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Environment */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Environment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Wallpaper</Label>
            <WallpaperPicker
              value={draft.wallpaperPath}
              onChange={(v) => patch("wallpaperPath", v)}
              disabled={saving}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Ambient music</Label>
            <MusicTrackList
              paths={draft.musicPaths}
              onChange={(next) => patch("musicPaths", next)}
              disabled={saving}
            />
            {draft.musicPaths.length > 0 && (
              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="music-loop" className="text-sm font-normal cursor-pointer">
                    Loop for the full session
                  </Label>
                  <Switch
                    id="music-loop"
                    checked={draft.musicLoop === 1}
                    onCheckedChange={(next) => patch("musicLoop", next ? 1 : 0)}
                  />
                </div>
                {draft.musicPaths.length > 1 && (
                  <div className="flex items-center justify-between">
                    <Label htmlFor="music-shuffle" className="text-sm font-normal cursor-pointer">
                      Shuffle tracks
                    </Label>
                    <Switch
                      id="music-shuffle"
                      checked={draft.musicShuffle === 1}
                      onCheckedChange={(next) => patch("musicShuffle", next ? 1 : 0)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Focus shortcut (on session start)</Label>
            <div className="flex items-center gap-2">
              <ShortcutPicker
                value={draft.shortcutName}
                onChange={(v) => patch("shortcutName", v)}
                disabled={saving}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!draft.shortcutName}
                onClick={() => draft.shortcutName && void shortcuts.runShortcut(draft.shortcutName)}
              >
                Test
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Revert shortcut (on session end)</Label>
            <div className="flex items-center gap-2">
              <ShortcutPicker
                value={draft.revertShortcutName}
                onChange={(v) => patch("revertShortcutName", v)}
                disabled={saving}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!draft.revertShortcutName}
                onClick={() =>
                  draft.revertShortcutName && void shortcuts.runShortcut(draft.revertShortcutName)
                }
              >
                Test
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Shortcuts are created in Apple&apos;s Shortcuts app. Name them anything — just match
              the name here.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Behavior */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Behavior</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="duration">Default session duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              min={1}
              max={480}
              className="w-32"
              value={draft.defaultDurationMinutes}
              onChange={(e) => {
                const parsed = parseInt(e.target.value, 10);
                patch("defaultDurationMinutes", Number.isNaN(parsed) ? 0 : parsed);
              }}
              aria-invalid={Boolean(durationError)}
            />
            {durationError && <p className="text-xs text-destructive">{durationError}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Apps to quit on session start</Label>
            <AppPicker
              value={draft.appsToQuit}
              onChange={(v) => patch("appsToQuit", v)}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Schedule */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="schedule-enabled">Schedule this session</Label>
            <Switch
              id="schedule-enabled"
              checked={draft.scheduleEnabled === 1}
              onCheckedChange={(next) => patch("scheduleEnabled", next ? 1 : 0)}
            />
          </div>

          {draft.scheduleEnabled === 1 && (
            <>
              <div className="space-y-1.5">
                <Label>Time</Label>
                <TimePicker
                  value={draft.scheduleTime || "09:00"}
                  onChange={(v) => patch("scheduleTime", v)}
                  disabled={saving}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Days</Label>
                <div className="flex gap-2">
                  {(["S", "M", "T", "W", "T", "F", "S"] as const).map((label, dow) => (
                    <button
                      key={dow}
                      type="button"
                      onClick={() => {
                        const days = draft.scheduleDays.includes(dow)
                          ? draft.scheduleDays.filter((d) => d !== dow)
                          : [...draft.scheduleDays, dow].sort((a, b) => a - b);
                        patch("scheduleDays", days);
                      }}
                      className={[
                        "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors",
                        draft.scheduleDays.includes(dow)
                          ? "bg-primary text-primary-foreground"
                          : "border border-input bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      ].join(" ")}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="schedule-auto-start">Start automatically</Label>
                  <p className="text-xs text-muted-foreground">
                    Off — send a notification instead
                  </p>
                </div>
                <Switch
                  id="schedule-auto-start"
                  checked={draft.scheduleAutoStart === 1}
                  onCheckedChange={(next) => patch("scheduleAutoStart", next ? 1 : 0)}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Section 5: Tasks — only available in edit mode (new contexts have no id yet) */}
      {contextId && (
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Tasks</CardTitle>
            <TaskFilters value={taskFilter} onChange={setTaskFilter} />
          </CardHeader>
          <CardContent>
            <TaskList contextId={contextId} statusFilter={taskFilter} />
          </CardContent>
        </Card>
      )}
    </form>
  );
}
