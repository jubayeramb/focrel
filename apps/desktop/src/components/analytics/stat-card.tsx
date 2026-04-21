import type * as React from "react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string;
  sublabel?: string;
  icon?: React.ReactNode;
  accent?: boolean;
};

/**
 * Analytics stat block. Borderless+gapless feel — single bordered div with
 * tight internal rhythm. Use `accent` on the primary "Today" card to pull
 * the eye first.
 */
export function StatCard({ label, value, sublabel, icon, accent }: StatCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border border-border bg-card p-4",
        accent && "bg-gradient-to-br from-primary/5 via-card to-card",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {icon && <span className="text-muted-foreground [&_svg]:size-3.5">{icon}</span>}
      </div>
      <p className="text-3xl font-semibold leading-none tabular-nums tracking-tight">{value}</p>
      {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
    </div>
  );
}
