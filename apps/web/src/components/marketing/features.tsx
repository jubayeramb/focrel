import {
  CheckSquare,
  Focus,
  Image as ImageIcon,
  Keyboard,
  Music,
  PowerOff,
  Timer,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: ImageIcon,
    title: "Wallpaper per context",
    body: "Every context gets its own desktop background, restored cleanly when you end the session.",
  },
  {
    icon: Music,
    title: "Ambient playlists",
    body: "Queue local tracks with loop + shuffle. Music survives app minimize and never bleeds between contexts.",
  },
  {
    icon: Focus,
    title: "macOS Focus integration",
    body: "Bind any Apple Shortcut to a context. Focrel runs it on start and runs the revert on end.",
  },
  {
    icon: CheckSquare,
    title: "To-do list per context",
    body: "Drag to reorder, filter by priority, check off as you go. State persists across sessions and restarts.",
  },
  {
    icon: Timer,
    title: "Session timer + history",
    body: "Plan a duration, see elapsed and remaining, review every session after the fact with notes and completion state.",
  },
  {
    icon: PowerOff,
    title: "Auto-quit distractions",
    body: "Pick apps to close when a session starts — Slack, email, anything. They can come back when you're done.",
  },
  {
    icon: Keyboard,
    title: "Global hotkey + tray",
    body: "Bring Focrel forward from anywhere. Start or stop a session without opening the window.",
  },
  {
    icon: Sparkles,
    title: "Crash-safe",
    body: "If the app or your machine crashes mid-session, Focrel restores your wallpaper and Focus mode on next launch.",
  },
];

export function Features() {
  return (
    <section id="features" className="mx-auto w-full max-w-6xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Features
        </p>
        <h2 className="mt-3 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Every switch, handled
        </h2>
        <p className="mt-4 text-balance text-muted-foreground">
          Focrel doesn&apos;t add another app to check. It orchestrates the ones you already use,
          so one decision moves everything into place.
        </p>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <div
            key={f.title}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5"
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-foreground/5 text-foreground">
              <f.icon className="size-4" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
