import type * as React from "react";
import { renderIcon } from "@/components/pickers/icon-picker";
import { cn } from "@/lib/utils";
import type { Context } from "@/lib/db";

type ContextCardProps = {
  context: Context;
  onClick?: () => void;
  actions?: React.ReactNode;
  className?: string;
};

export function ContextCard({ context, onClick, actions, className }: ContextCardProps) {
  const inner = (
    <>
      {/* Color accent bar at the top — uses the context's own color so the
          card reads as "this is the Deep Work card" at a glance. */}
      <div
        className="absolute inset-x-0 top-0 h-1 rounded-t-xl"
        style={{ backgroundColor: context.color }}
        aria-hidden
      />

      <div className="flex flex-col gap-3 p-5 pt-6">
        <div className="flex items-start justify-between gap-3">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-white"
            style={{ backgroundColor: context.color }}
            aria-hidden
          >
            {renderIcon(context.icon, "size-4")}
          </span>
          {actions && (
            <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
              {actions}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-base font-semibold leading-tight text-foreground">
            {context.name}
          </p>
          {context.description && (
            <p className="truncate text-sm text-muted-foreground">{context.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <span className="text-xs tabular-nums text-muted-foreground">
            {context.defaultDurationMinutes}m
          </span>
          {context.archivedAt != null && (
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Archived
            </span>
          )}
        </div>
      </div>
    </>
  );

  const baseClass = cn(
    "relative overflow-hidden rounded-xl border border-border bg-card text-card-foreground",
    "shadow-sm transition-shadow",
    className,
  );

  if (onClick) {
    return (
      <article
        role="button"
        tabIndex={0}
        className={cn(
          baseClass,
          "cursor-pointer hover:shadow-md focus-visible:outline-hidden",
          "focus-visible:ring-1 focus-visible:ring-ring",
        )}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onClick();
        }}
      >
        {inner}
      </article>
    );
  }

  return <div className={baseClass}>{inner}</div>;
}
