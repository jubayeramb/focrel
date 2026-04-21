import { Apple, Laptop, Smartphone } from "lucide-react";

type Platform = {
  icon: typeof Apple;
  label: string;
  status: string;
  live?: boolean;
};

const platforms: Platform[] = [
  { icon: Apple, label: "macOS", status: "Available now", live: true },
  { icon: Laptop, label: "Windows", status: "Coming soon" },
  { icon: Laptop, label: "Linux", status: "Coming soon" },
  { icon: Smartphone, label: "iOS & Android", status: "With device sync" },
];

export function Platforms() {
  return (
    <section className="border-y border-border bg-muted/10 py-20">
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Platforms
          </p>
          <h2 className="mt-3 text-balance text-4xl font-semibold tracking-tight text-foreground">
            Start on Mac. Sync everywhere soon.
          </h2>
          <p className="mt-4 text-balance text-sm text-muted-foreground">
            macOS first. Other platforms are on the roadmap — when they land, the same contexts
            you defined on your Mac come with you.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {platforms.map((p, i) => (
            <div
              key={`${p.label}-${i}`}
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-4 py-6 text-center"
            >
              <p.icon
                className={p.live ? "size-6 text-foreground" : "size-6 text-muted-foreground"}
              />
              <div className="text-sm font-semibold text-foreground">{p.label}</div>
              <div
                className={
                  p.live
                    ? "text-xs font-medium text-emerald-600 dark:text-emerald-400"
                    : "text-xs text-muted-foreground"
                }
              >
                {p.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
