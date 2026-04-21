import { Globe, Keyboard, Moon, Sun, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SettingsPage() {
  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure Focrel to your liking.</p>
      </div>

      <ThemeSection />
      <AutostartSection />
      <GlobalHotkeySection />
    </div>
  );
}

function ThemeSection() {
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
        <div className="flex gap-3">
          {(
            [
              { label: "System", icon: Globe },
              { label: "Light", icon: Sun },
              { label: "Dark", icon: Moon },
            ] as const
          ).map(({ label, icon: Icon }) => (
            <button
              key={label}
              type="button"
              className="flex-1 flex flex-col items-center gap-2 py-3 rounded-lg border border-input hover:bg-accent hover:text-accent-foreground transition-colors text-sm"
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

function AutostartSection() {
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
      <CardContent>
        <div className="flex items-center justify-between">
          <Label htmlFor="autostart" className="text-sm font-normal">
            Start at login
          </Label>
          <button
            id="autostart"
            type="button"
            role="switch"
            aria-checked="false"
            className="relative inline-flex h-5 w-9 items-center rounded-full border-2 border-transparent bg-input transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span className="pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform translate-x-0" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function GlobalHotkeySection() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Keyboard className="size-4" />
          Global Hotkey
        </CardTitle>
        <CardDescription className="text-xs">
          Trigger the quick-start popover from anywhere on your Mac.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="hotkey">Hotkey combination</Label>
          <Input
            id="hotkey"
            placeholder="e.g. CmdOrCtrl+Shift+F"
            className="font-mono text-sm"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Use Electron-style modifier names: CmdOrCtrl, Alt, Shift, plus a letter or function key.
        </p>
      </CardContent>
    </Card>
  );
}
