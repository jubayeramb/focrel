import { cn } from "@/lib/utils";

export type TaskFiltersProps = {
  value: "all" | "open" | "done";
  onChange: (v: "all" | "open" | "done") => void;
  counts?: { all: number; open: number; done: number };
};

const TABS = [
  { key: "all" as const, label: "All" },
  { key: "open" as const, label: "Open" },
  { key: "done" as const, label: "Done" },
];

export function TaskFilters({ value, onChange, counts }: TaskFiltersProps) {
  return (
    <div className="flex items-center gap-1" role="tablist" aria-label="Task filter">
      {TABS.map(({ key, label }) => {
        const isSelected = value === key;
        const count = counts?.[key];
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onChange(key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              isSelected
                ? "bg-background text-foreground border border-border shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-accent",
            )}
          >
            {label}
            {count != null && (
              <span
                className={cn(
                  "inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-xs leading-none",
                  isSelected ? "bg-muted text-muted-foreground" : "bg-background/60 text-muted-foreground",
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
