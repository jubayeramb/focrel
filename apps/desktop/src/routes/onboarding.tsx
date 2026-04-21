import * as React from "react";
import { Bell, CheckCircle2, Layers, Music, Sparkles, Wand2 } from "lucide-react";
import { isPermissionGranted, requestPermission } from "@tauri-apps/plugin-notification";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { openShortcutsApp } from "@/lib/os/shortcuts";
import { cn } from "@/lib/utils";

type OnboardingPageProps = {
  onComplete: () => void;
};

type NotifState = "idle" | "granted" | "denied";

function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-3">
        <span className="text-5xl font-semibold text-primary tracking-tight">Focrel</span>
        <p className="text-lg text-muted-foreground text-center">
          Focus is a feeling. Focrel makes it a place.
        </p>
      </div>

      <Card className="w-full">
        <CardContent className="pt-6 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <Layers className="size-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-sm">Wallpaper-per-realm</p>
              <p className="text-sm text-muted-foreground">Each context sets its own desktop image across all screens.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Music className="size-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-sm">Context-aware music</p>
              <p className="text-sm text-muted-foreground">Ambient loops start and stop with your session, even when the window is hidden.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Wand2 className="size-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-sm">OS Focus mode on autopilot</p>
              <p className="text-sm text-muted-foreground">Focrel triggers your macOS Focus via Shortcuts — no private APIs, no surprises.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={onNext} className="w-full">
        <Sparkles className="size-4 mr-2" />
        Get started
      </Button>
    </div>
  );
}

function StepPermissions({ onNext }: { onNext: () => void }) {
  const [notifState, setNotifState] = React.useState<NotifState>("idle");

  async function handleEnableNotifications() {
    const already = await isPermissionGranted();
    if (already) {
      setNotifState("granted");
      return;
    }
    const result = await requestPermission();
    setNotifState(result === "granted" ? "granted" : "denied");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight">Permissions & macOS Focus</h2>
        <p className="text-sm text-muted-foreground">
          A couple of things to set up before your first session.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <Wand2 className="size-5 text-primary mt-0.5 shrink-0" />
            <div className="flex flex-col gap-3 flex-1">
              <p className="font-medium text-sm">macOS Shortcuts for Focus mode</p>
              <p className="text-sm text-muted-foreground">
                Focrel has no private access to macOS Focus — we ask the built-in{" "}
                <strong>Shortcuts</strong> app to flip it for you. You set the Shortcut up once; we
                run it by name on session start and end.
              </p>
              <div className="rounded-lg bg-muted/60 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                  One-time setup
                </p>
                <ol className="list-decimal list-inside text-sm space-y-1.5 text-foreground">
                  <li>Click <span className="font-medium">Open Shortcuts app</span> below.</li>
                  <li>In Shortcuts: <span className="font-medium">File → New Shortcut</span>.</li>
                  <li>
                    Search for the action <span className="font-medium">"Set Focus"</span> and add
                    it. Configure it as{" "}
                    <span className="font-medium">Turn Do Not Disturb On</span> (or any Focus mode).
                  </li>
                  <li>
                    Rename the Shortcut to something like{" "}
                    <code className="bg-background px-1 rounded text-xs">
                      Focrel: Deep Work Focus On
                    </code>
                    .
                  </li>
                  <li>
                    Create a <em>second</em> Shortcut the same way but with the Focus action set to{" "}
                    <span className="font-medium">Turn Off</span> — name it{" "}
                    <code className="bg-background px-1 rounded text-xs">
                      Focrel: Deep Work Focus Off
                    </code>
                    . Focrel runs this on session end.
                  </li>
                  <li>
                    Come back to Focrel and open the context editor — pick your two Shortcuts under
                    <span className="font-medium"> macOS Shortcut</span> and{" "}
                    <span className="font-medium">Revert Shortcut</span>. Test with the Test button.
                  </li>
                </ol>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => void openShortcutsApp()}
              >
                Open Shortcuts app
              </Button>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You can skip this now and set it up later — contexts without a Shortcut still run
                in "minimal mode" (wallpaper, music, apps-to-quit all still work).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <Bell className="size-5 text-primary mt-0.5 shrink-0" />
            <div className="flex flex-col gap-2 flex-1">
              <p className="font-medium text-sm">Notifications</p>
              <p className="text-sm text-muted-foreground">
                Focrel pings you when a session starts and ends.
              </p>
              {notifState === "granted" ? (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle2 className="size-4" />
                  Notifications enabled
                </div>
              ) : notifState === "denied" ? (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Permission denied — you can enable notifications in System Settings later.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="self-start"
                    onClick={() => void handleEnableNotifications()}
                  >
                    Retry
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="self-start"
                  onClick={() => void handleEnableNotifications()}
                >
                  Enable notifications
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={onNext} className="w-full">
        Next
      </Button>
    </div>
  );
}

function StepDone({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-3">
        <CheckCircle2 className="size-16 text-primary" />
        <h2 className="text-3xl font-semibold tracking-tight">You're set.</h2>
        <p className="text-muted-foreground text-center">
          Create a context to start your first session.
        </p>
      </div>
      <Button onClick={onComplete} className="w-full">
        Go to dashboard
      </Button>
    </div>
  );
}

const STEPS = 3;

export function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const [step, setStep] = React.useState(0);

  return (
    <div className="max-w-xl mx-auto py-16">
      {/* Step progress dots */}
      <div className="flex justify-center gap-2 mb-10">
        {Array.from({ length: STEPS }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === step ? "w-6 bg-primary" : "w-1.5 bg-muted",
            )}
          />
        ))}
      </div>

      {step === 0 && <StepWelcome onNext={() => setStep(1)} />}
      {step === 1 && <StepPermissions onNext={() => setStep(2)} />}
      {step === 2 && <StepDone onComplete={onComplete} />}
    </div>
  );
}
