import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type IconPickerProps = {
  value: string | null;
  onChange: (v: string | null) => void;
  disabled?: boolean;
};

const CURATED_ICONS = [
  "Brain",
  "Coffee",
  "Target",
  "Zap",
  "Book",
  "Code",
  "Music",
  "Headphones",
  "Feather",
  "Palette",
  "Moon",
  "Sun",
  "Waves",
  "Flame",
  "Cloud",
  "Mountain",
  "Sparkles",
  "Clock",
  "Timer",
  "Flag",
  "Leaf",
  "Heart",
  "Star",
  "Focus",
] as const;

export function renderIcon(name: string | null, className?: string): React.ReactNode {
  if (!name) return null;
  const Icon = Icons[name as keyof typeof Icons] as LucideIcon | undefined;
  if (!Icon) return null;
  return <Icon className={className} />;
}

export function IconPicker({ value, onChange, disabled }: IconPickerProps) {
  return (
    <div
      className={cn(
        "grid gap-1.5 p-1",
        disabled && "opacity-50 pointer-events-none",
      )}
      style={{ gridTemplateColumns: "repeat(6, minmax(0, 1fr))" }}
    >
      {CURATED_ICONS.map((name) => {
        const Icon = Icons[name as keyof typeof Icons] as LucideIcon | undefined;
        if (!Icon) return null;
        const isSelected = value === name;
        return (
          <button
            key={name}
            type="button"
            className={cn(
              "flex items-center justify-center w-full aspect-square rounded-md transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isSelected
                ? "bg-primary text-primary-foreground ring-2 ring-ring ring-offset-1"
                : "hover:bg-accent hover:text-accent-foreground text-muted-foreground",
            )}
            onClick={() => onChange(name)}
            aria-label={`Select ${name} icon`}
            aria-pressed={isSelected}
          >
            <Icon className="size-4" />
          </button>
        );
      })}
    </div>
  );
}
