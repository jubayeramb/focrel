import { useNavigate } from "@tanstack/react-router";
import { Database, Keyboard, Monitor, Moon, Power, Sun, Zap } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { sessionsRepo } from "@/lib/db";
import { autostart } from "@/lib/os/autostart";
import { useSettingsStore } from "@/lib/stores/settings-store";

// ─── Helpers ────────────────────────────────────────────────────────────────

const DEFAULT_HOTKEY = "CmdOrControl+Alt+F";

/** Convert a Tauri hotkey string like "CmdOrControl+Shift+F" to a readable glyph. */
function formatHotkey(key: string): string {
  return key
    .split("+")
    .map((part) => {
      switch (part) {
        case "CmdOrControl":
          return "⌘";
        case "Shift":
          return "⇧";
        case "Alt":
          return "⌥";
        case "Ctrl":
          return "⌃";
        default:
          return part.length === 1 ? part.toUpperCase() : part;
      }
    })
    .join("");
}

/** Serialize a KeyboardEvent to a Tauri-compatible accelerator string. */
function serializeKeyEvent(e: KeyboardEvent): string | null {
  const parts: string[] = [];
  if (e.metaKey || e.ctrlKey) parts.push("CmdOrControl");
  if (e.shiftKey) parts.push("Shift");
  if (e.altKey) parts.push("Alt");

  const key = e.code;
  if (key.startsWith("Key")) {
    parts.push(key.slice(3));
  } else if (key.startsWith("Digit")) {
    parts.push(key.slice(5));
  } else if (key.startsWith("F") && /^F\d+$/.test(key)) {
    parts.push(key);
  } else if (key === "Space") {
    parts.push("Space");
  } else if (key === "Tab") {
    parts.push("Tab");
  } else {
    // skip bare modifier keys, arrows, etc.
    return null;
  }

  // Require at least one modifier for non-function keys.
  const hasMod = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
  if (!hasMod && !key.startsWith("F")) return null;

  return parts.join("+");
}

// ─── HotkeyInput ─────────────────────────────────────────────────────────────

interface HotkeyInputProps {
  value: string;
  onChange: (key: string) => void;
}

function HotkeyInput({ value, onChange }: HotkeyInputProps) {
  const [capturing, setCapturing] = useState(false);
  const boxRef = useRef<HTMLButtonElement>(null);

  const startCapture = () => {
    setCapturing(true);
    setTimeout(() => boxRef.current?.focus(), 0);
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!capturing) return;
      e.preventDefault();
      e.stopPropagation();

      if (e.key === "Escape") {
        setCapturing(false);
        return;
      }

      const serialized = serializeKeyEvent(e.nativeEvent);
      if (serialized !== null) {
        onChange(serialized);
        setCapturing(false);
      }
    },
    [capturing, onChange],
  );

  return (
    <div className="flex items-center gap-2">
      <button
        ref={boxRef}
        type="button"
        onClick={startCapture}
        onKeyDown={handleKeyDown}
        onBlur={() => setCapturing(false)}
        className={[
          "min-w-[120px] px-3 py-1.5 rounded-md border text-sm font-mono text-center",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          capturing
            ? "border-ring bg-accent text-accent-foreground animate-pulse"
            : "border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ].join(" ")}
      >
        {capturing ? "Press keys…" : formatHotkey(value)}
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const navigate = useNavigate();
  const {
    theme,
    autostart: autostartEnabled,
    globalHotkey,
    hotkeyError,
    setTheme,
    setAutostart,
    setGlobalHotkey,
    clearHotkeyError,
    resetOnboarding,
  } = useSettingsStore();

  const currentHotkey = globalHotkey ?? DEFAULT_HOTKEY;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure Focrel to your liking.</p>
      </div>

      <ThemeSection theme={theme} onThemeChange={setTheme} />
      <AutostartSection
        enabled={autostartEnabled}
        onToggle={async (next) => {
          try {
            await autostart.sync(next);
            setAutostart(next);
          } catch {
            // autostart.sync failed — state not changed, toggle naturally reverts
          }
        }}
      />
      <GlobalHotkeySection
        hotkey={currentHotkey}
        hotkeyError={hotkeyError}
        onHotkeyChange={(key) => setGlobalHotkey(key)}
        onReset={() => setGlobalHotkey(DEFAULT_HOTKEY)}
        onDismissError={clearHotkeyError}
      />

      <OnboardingSection
        onReplay={() => {
          resetOnboarding();
          void navigate({ to: "/onboarding" });
        }}
      />

      <DataSection />
    </div>
  );
}

// ─── Data section ─────────────────────────────────────────────────────────────

function DataSection() {
  const [clearing, setClearing] = useState(false);
  const [status, setStatus] = useState<null | { kind: "ok" | "err"; message: string }>(null);

  async function handleClear() {
    const ok = window.confirm(
      "Clear all session history? This wipes every recorded session and cannot be undone. Your contexts and tasks stay intact.",
    );
    if (!ok) return;
    setClearing(true);
    setStatus(null);
    try {
      await sessionsRepo.clearAll();
      setStatus({ kind: "ok", message: "History cleared." });
    } catch (err) {
      setStatus({ kind: "err", message: err instanceof Error ? err.message : String(err) });
    } finally {
      setClearing(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Database className="size-4" />
          Data
        </CardTitle>
        <CardDescription className="text-xs">
          Wipe your session history. Contexts and tasks are preserved.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => void handleClear()}
          disabled={clearing}
          className="border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground"
        >
          {clearing ? "Clearing…" : "Clear all history"}
        </Button>
        {status && (
          <p
            className={
              status.kind === "ok"
                ? "text-xs text-emerald-600 dark:text-emerald-400"
                : "text-xs text-destructive"
            }
          >
            {status.message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Theme section ────────────────────────────────────────────────────────────

type Theme = "system" | "light" | "dark";

interface ThemeSectionProps {
  theme: Theme;
  onThemeChange: (t: Theme) => void;
}

const THEME_OPTIONS: { label: string; value: Theme; icon: React.ElementType }[] = [
  { label: "System", value: "system", icon: Monitor },
  { label: "Light", value: "light", icon: Sun },
  { label: "Dark", value: "dark", icon: Moon },
];

function ThemeSection({ theme, onThemeChange }: ThemeSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sun className="size-4" />
          Theme
        </CardTitle>
        <CardDescription className="text-xs">
          Appearance follows your system preference by default.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          {THEME_OPTIONS.map(({ label, value, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => onThemeChange(value)}
              className={[
                "flex-1 flex flex-col items-center gap-2 py-3 rounded-lg border text-sm transition-colors",
                theme === value
                  ? "border-ring bg-accent text-accent-foreground font-medium"
                  : "border-input hover:bg-accent hover:text-accent-foreground",
              ].join(" ")}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Autostart section ────────────────────────────────────────────────────────

interface AutostartSectionProps {
  enabled: boolean;
  onToggle: (next: boolean) => Promise<void>;
}

function AutostartSection({ enabled, onToggle }: AutostartSectionProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setError(null);
    setPending(true);
    try {
      await onToggle(!enabled);
    } catch {
      setError("Failed to update login item. Check System Settings > General > Login Items.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="size-4" />
          Autostart
        </CardTitle>
        <CardDescription className="text-xs">
          Launch Focrel automatically when you log in.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="autostart-toggle" className="text-sm font-normal cursor-pointer">
            Open Focrel at login
          </Label>
          <button
            id="autostart-toggle"
            type="button"
            role="switch"
            aria-checked={enabled}
            disabled={pending}
            onClick={() => void handleClick()}
            className={[
              "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "focus-visible:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed",
              enabled ? "bg-primary" : "bg-input",
            ].join(" ")}
          >
            <span
              className={[
                "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
                enabled ? "translate-x-4" : "translate-x-0",
              ].join(" ")}
            />
          </button>
        </div>
        {error !== null && <p className="text-xs text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}

// ─── Global hotkey section ────────────────────────────────────────────────────

interface GlobalHotkeySectionProps {
  hotkey: string;
  hotkeyError: string | null;
  onHotkeyChange: (key: string) => void;
  onReset: () => void;
  onDismissError: () => void;
}

function GlobalHotkeySection({
  hotkey,
  hotkeyError,
  onHotkeyChange,
  onReset,
  onDismissError,
}: GlobalHotkeySectionProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Keyboard className="size-4" />
          Global Hotkey
        </CardTitle>
        <CardDescription className="text-xs">
          Bring Focrel to the front from anywhere on your Mac.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-normal">Hotkey combination</Label>
          <div className="flex items-center gap-2">
            <HotkeyInput value={hotkey} onChange={onHotkeyChange} />
            <Button variant="ghost" size="sm" onClick={onReset} className="text-xs text-muted-foreground">
              Reset
            </Button>
          </div>
        </div>
        {hotkeyError !== null && (
          <div className="flex items-start justify-between gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2">
            <p className="text-xs text-destructive">
              Couldn&apos;t register this shortcut: {hotkeyError}. Try another combo.
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismissError}
              className="h-auto p-0 text-xs text-destructive hover:text-destructive shrink-0"
            >
              Dismiss
            </Button>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Click the box then press your desired key combo. Escape cancels.
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Onboarding replay section ────────────────────────────────────────────────

interface OnboardingSectionProps {
  onReplay: () => void;
}

function OnboardingSection({ onReplay }: OnboardingSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Power className="size-4" />
          Onboarding
        </CardTitle>
        <CardDescription className="text-xs">Re-run the first-launch setup flow.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" size="sm" onClick={onReplay}>
          Replay onboarding
        </Button>
      </CardContent>
    </Card>
  );
}
