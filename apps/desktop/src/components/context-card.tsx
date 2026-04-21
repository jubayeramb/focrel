import type * as React from "react";
import { renderIcon } from "@/components/pickers/icon-picker";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
      <CardHeader className="p-4 pb-3 space-y-0">
        <div className="flex items-start justify-between mb-3">
          <span
            className="block w-2.5 h-2.5 rounded-full shrink-0 mt-0.5"
            style={{ backgroundColor: context.color }}
          />
          {actions && (
            <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
              {actions}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="text-muted-foreground [&_svg]:size-5">
            {renderIcon(context.icon, "size-5")}
          </div>
          <p className="text-lg font-semibold leading-tight">{context.name}</p>
          {context.description && (
            <p className="text-sm text-muted-foreground truncate">{context.description}</p>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{context.defaultDurationMinutes}m</span>
          {context.archivedAt != null && (
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              Archived
            </span>
          )}
        </div>
      </CardContent>
    </>
  );

  if (onClick) {
    return (
      <article
        role="button"
        tabIndex={0}
        className={cn(
          "rounded-xl border bg-card text-card-foreground shadow-xs hover:shadow-md transition-shadow cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring",
          className,
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

  return (
    <Card className={cn("shadow-xs", className)}>
      {inner}
    </Card>
  );
}
