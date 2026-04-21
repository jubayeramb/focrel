const steps = [
  {
    num: "01",
    title: "Define a context",
    body: "Name it — Deep Work, Writing, Review. Pick a wallpaper, a music playlist, a macOS Focus mode, and any apps to quit.",
  },
  {
    num: "02",
    title: "Drop in a task list",
    body: "Each context owns its own to-do list. Drag to reorder. Mark done as you go. It survives across sessions.",
  },
  {
    num: "03",
    title: "Start a session",
    body: "One click locks it in. Wallpaper switches, music starts, Focus mode engages, distracting apps quit. You're in.",
  },
  {
    num: "04",
    title: "End cleanly",
    body: "When you stop, everything rolls back: your desktop, your Focus mode, your windows. No stale state.",
  },
] as const;

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative border-y border-border bg-muted/20 py-24">
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            How it works
          </p>
          <h2 className="mt-3 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Four beats from &ldquo;ugh, context switch&rdquo; to locked in
          </h2>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div key={step.num} className="relative">
              <div className="font-mono text-sm font-medium text-muted-foreground">
                {step.num}
              </div>
              <h3 className="mt-2 text-lg font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
