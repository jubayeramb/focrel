import * as React from "react";
import { Bell, Check, CheckCircle2, Copy, Layers, Music, Sparkles, Wand2 } from "lucide-react";
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

// Small inline "click to copy" chip used for the suggested shortcut names.
// Reuses lucide's Check icon as the "copied" confirmation and reverts after
// 1.5s — no toast plumbing needed for a single-purpose affordance.
function CopyableCode({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — swallow silently, user can still type it */
    }
  }
  return (
    <span className="inline-flex items-center gap-1 rounded bg-background px-1.5 py-0.5 font-mono text-xs">
      <span className="text-foreground">{text}</span>
      <button
        type="button"
        onClick={() => void handleCopy()}
        aria-label={copied ? "Copied" : "Copy shortcut name"}
        className="flex size-4 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        {copied ? (
          <Check className="size-3 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
        ) : (
          <Copy className="size-3" strokeWidth={2} />
        )}
      </button>
    </span>
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
          <div className="flex flex-1 flex-col gap-1">
            <p className="text-sm font-medium text-foreground">macOS Focus shortcuts</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Focrel doesn&apos;t use private APIs for Focus mode — it runs two
              Shortcuts of yours by name, one to turn Focus on at session
              start and one to turn it off at session end.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted/40 p-4">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            One-time setup in Shortcuts.app
          </p>
          <ol className="list-inside list-decimal space-y-2 text-sm leading-relaxed text-foreground">
            <li>
              Click <span className="font-medium">Open Shortcuts app</span> below
              and hit <span className="font-medium">File → New Shortcut</span>.
            </li>
            <li>
              Search the right-hand actions for{" "}
              <span className="font-medium">Set Focus</span> and drag it in. Set
              it to <span className="font-medium">Turn On</span> (Do Not Disturb
              or any Focus of your choice), then rename the shortcut to{" "}
              <CopyableCode text="Focrel: Deep Work Focus On" />.
            </li>
            <li>
              Repeat with a second shortcut — same{" "}
              <span className="font-medium">Set Focus</span> action but set to{" "}
              <span className="font-medium">Turn Off</span>, renamed to{" "}
              <CopyableCode text="Focrel: Deep Work Focus Off" />.
            </li>
            <li>
              Later in Focrel&apos;s context editor, pick these two under{" "}
              <span className="font-medium">macOS Shortcut</span> and{" "}
              <span className="font-medium">Revert Shortcut</span>.
            </li>
          </ol>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void openShortcutsApp()}
          >
            Open Shortcuts app
          </Button>
          <p className="text-xs text-muted-foreground">
            Optional — contexts without a Shortcut still run wallpaper, music, and apps.
          </p>
        </div>
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
    // Full-viewport column: stepper pins to the top, content gets a centered
    // flex slot underneath. Short steps (Welcome, Done) sit in the middle of
    // the window; the long Permissions step fills from the top and scrolls
    // naturally if it overflows.
    <div className="mx-auto flex min-h-screen max-w-xl flex-col px-6 py-10">
      {/* Step progress dots */}
      <div className="flex justify-center gap-2">
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

      <div className="flex flex-1 flex-col justify-center py-10">
        {step === 0 && <StepWelcome onNext={() => setStep(1)} />}
        {step === 1 && <StepPermissions onNext={() => setStep(2)} />}
        {step === 2 && <StepDone onComplete={onComplete} />}
      </div>
    </div>
  );
}
