import { Layers, Shield, Zap } from "lucide-react";
import { valueProps } from "@focrel/brand";

// Map brand.valueProps (title+body only) onto an icon per card. Brand stays
// presentation-agnostic; the icon decision lives at the web surface.
const icons = [Layers, Shield, Zap] as const;

export function ValueProps() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-24">
      <div className="grid gap-6 md:grid-cols-3">
        {valueProps.map((prop, i) => {
          const Icon = icons[i] ?? Layers;
          return (
            <div
              key={prop.title}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-foreground/5 text-foreground">
                <Icon className="size-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                {prop.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {prop.body}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
