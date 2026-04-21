import { cn } from "@/lib/utils";

export type PriorityPickerProps = {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
};

const LEVELS = [
  { level: 0, label: "None" },
  { level: 1, label: "Low" },
  { level: 2, label: "Normal" },
  { level: 3, label: "High" },
] as const;

export function PriorityPicker({ value, onChange, disabled }: PriorityPickerProps) {
  return (
    <div
      className={cn("flex items-center gap-1", disabled && "opacity-50 pointer-events-none")}
      role="group"
      aria-label="Priority"
    >
      {LEVELS.map(({ level, label }) => {
        const isSelected = value === level;
        return (
          <button
            key={level}
            type="button"
            onClick={() => onChange(level)}
            disabled={disabled}
            aria-pressed={isSelected}
            className={cn(
              "px-3 py-1 rounded-full text-sm font-medium transition-colors",
              "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              isSelected
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
