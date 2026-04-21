import type * as React from "react";
import { Card, CardContent } from "@/components/ui/card";

type StatCardProps = {
  label: string;
  value: string;
  sublabel?: string;
  icon?: React.ReactNode;
};

export function StatCard({ label, value, sublabel, icon }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </span>
          {icon && <span className="text-muted-foreground [&_svg]:size-4">{icon}</span>}
        </div>
        <p className="text-3xl font-semibold tabular-nums leading-none">{value}</p>
        {sublabel && (
          <p className="text-xs text-muted-foreground mt-1.5">{sublabel}</p>
        )}
      </CardContent>
    </Card>
  );
}
