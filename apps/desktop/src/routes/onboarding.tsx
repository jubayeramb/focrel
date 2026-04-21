import * as React from "react";
import { Bell, CheckCircle2, Layers, Music, Sparkles, Wand2 } from "lucide-react";
import { isPermissionGranted, requestPermission } from "@tauri-apps/plugin-notification";
import logoUrl from "@focrel/brand/assets/logo.svg";
import { Button } from "@/components/ui/button";
import { openShortcutsApp } from "@/lib/os/shortcuts";
import { cn } from "@/lib/utils";

type OnboardingPageProps = {
  onComplete: () => void;
};

type NotifState = "idle" | "granted" | "denied";

function FeatureRow({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary [&_svg]:size-4">
        {icon}
      </span>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center gap-10">
      <div className="flex flex-col items-center gap-4">
        <img src={logoUrl} alt="" aria-hidden className="size-20 rounded-3xl shadow-lg" />
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-4xl font-semibold tracking-tight text-foreground">Focrel</span>
          <p className="text-center text-sm text-muted-foreground">
            Focus is a feeling. Focrel makes it a place.
          </p>
        </div>
      </div>

      <div className="flex w-full flex-col gap-5 rounded-2xl border border-border bg-card p-6">
        <FeatureRow
          icon={<Layers />}
          title="Wallpaper-per-realm"
          body="Each context sets its own desktop image across all screens."
        />
        <FeatureRow
          icon={<Music />}
          title="Context-aware music"
          body="Ambient loops start and stop with your session, even when the window is hidden."
        />
        <FeatureRow
          icon={<Wand2 />}
          title="OS Focus mode on autopilot"
          body="Focrel triggers your macOS Focus via Shortcuts — no private APIs, no surprises."
        />
      </div>

      <Button onClick={onNext} className="h-11 w-full">
        <Sparkles className="size-4" />
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
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Permissions & macOS Focus
        </h2>
        <p className="text-sm text-muted-foreground">
          A couple of things to set up before your first session.
        </p>
      </div>

      {/* macOS Shortcuts */}
      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Wand2 className="size-4" />
          </span>
          <div className="flex flex-1 flex-col gap-3">
            <p className="text-sm font-medium text-foreground">
              macOS Shortcuts for Focus mode
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Focrel has no private access to macOS Focus — we ask the built-in{" "}
              <strong className="text-foreground">Shortcuts</strong> app to flip it for you. You set
              the Shortcut up once; we run it by name on session start and end.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted/40 p-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            One-time setup
          </p>
          <ol className="list-inside list-decimal space-y-1.5 text-sm text-foreground">
            <li>
              Click <span className="font-medium">Open Shortcuts app</span> below.
            </li>
            <li>
              In Shortcuts: <span className="font-medium">File → New Shortcut</span>.
            </li>
            <li>
              Search for the action <span className="font-medium">&ldquo;Set Focus&rdquo;</span> and
              add it. Configure as{" "}
              <span className="font-medium">Turn Do Not Disturb On</span> (or any Focus mode).
            </li>
            <li>
              Rename the Shortcut to{" "}
              <code className="rounded bg-background px-1 py-0.5 text-xs">
                Focrel: Deep Work Focus On
              </code>
              .
            </li>
            <li>
              Create a <em>second</em> Shortcut with the Focus action set to{" "}
              <span className="font-medium">Turn Off</span> — name it{" "}
              <code className="rounded bg-background px-1 py-0.5 text-xs">
                Focrel: Deep Work Focus Off
              </code>
              .
            </li>
            <li>
              Back in Focrel&apos;s context editor, pick your two Shortcuts under{" "}
              <span className="font-medium">macOS Shortcut</span> and{" "}
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
        <p className="text-xs leading-relaxed text-muted-foreground">
          You can skip this now and set it up later — contexts without a Shortcut still run in
          &ldquo;minimal mode&rdquo; (wallpaper, music, apps-to-quit all still work).
        </p>
      </section>

      {/* Notifications */}
      <section className="flex items-start gap-3 rounded-2xl border border-border bg-card p-6">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Bell className="size-4" />
        </span>
        <div className="flex flex-1 flex-col gap-2">
          <p className="text-sm font-medium text-foreground">Notifications</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Focrel pings you when a session starts and ends.
          </p>
          {notifState === "granted" ? (
            <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4" />
              Notifications enabled
            </div>
          ) : notifState === "denied" ? (
            <div className="flex flex-col items-start gap-2">
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Permission denied — you can enable notifications in System Settings later.
              </p>
              <Button
                variant="outline"
                size="sm"
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
      </section>

      <Button onClick={onNext} className="h-11 w-full">
        Next
      </Button>
    </div>
  );
}

function StepDone({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="flex flex-col items-center gap-10">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <img src={logoUrl} alt="" aria-hidden className="size-20 rounded-3xl shadow-lg" />
          <span className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg ring-4 ring-background">
            <CheckCircle2 className="size-5" />
          </span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">
            You&apos;re set.
          </h2>
          <p className="text-center text-sm text-muted-foreground">
            Create a context to start your first session.
          </p>
        </div>
      </div>
      <Button onClick={onComplete} className="h-11 w-full">
        Go to dashboard
      </Button>
    </div>
  );
}

const STEPS = 3;

export function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const [step, setStep] = React.useState(0);

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      {/* Step progress dots */}
      <div className="mb-10 flex justify-center gap-2">
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
