const faqs = [
  {
    q: "Is Focrel free?",
    a: "Yes — free during the macOS beta. A paid tier will land alongside cross-device sync. Anyone on the beta today gets grandfathered pricing when that ships.",
  },
  {
    q: "Does Focrel send my data anywhere?",
    a: "No. Everything — contexts, tasks, session history — is stored locally in a SQLite file on your machine. No account, no telemetry, no cloud. When sync ships later, it'll be explicitly opt-in.",
  },
  {
    q: "Does it work with Windows or Linux?",
    a: "Not yet. The macOS build ships first because Focus mode integration is where the biggest switching cost lives. Windows and Linux are on the near-term roadmap.",
  },
  {
    q: "Can I try it without committing to a workflow?",
    a: "Yes. Create a context with just a wallpaper, run a 25-minute session, see if it clicks. You can delete contexts at any time and session history stays.",
  },
  {
    q: "How is this different from a Pomodoro timer?",
    a: "A Pomodoro tracks the clock. Focrel tracks the environment — wallpaper, music, Focus mode, open apps, and tasks all switch together. The timer is one piece; the state change is the point.",
  },
  {
    q: "Can I sync across Macs?",
    a: "Not yet. Local-first today. Sync across your own devices is the next major feature after cross-platform builds.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="mx-auto w-full max-w-3xl px-6 py-24">
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          FAQ
        </p>
        <h2 className="mt-3 text-balance text-4xl font-semibold tracking-tight text-foreground">
          Questions, answered
        </h2>
      </div>

      <dl className="mt-12 space-y-4">
        {faqs.map((item) => (
          <details
            key={item.q}
            className="group rounded-xl border border-border bg-card p-5 open:bg-muted/30"
          >
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-sm font-semibold text-foreground">
              {item.q}
              <span className="mt-0.5 text-muted-foreground transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {item.a}
            </p>
          </details>
        ))}
      </dl>
    </section>
  );
}
