import { format } from "date-fns";
import { cn } from "@/lib/utils";

export type DueDatePickerProps = {
  value: number | null;
  onChange: (v: number | null) => void;
  disabled?: boolean;
};

function millisToInputValue(ms: number): string {
  return format(new Date(ms), "yyyy-MM-dd'T'HH:mm");
}

export function DueDatePicker({ value, onChange, disabled }: DueDatePickerProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.value) {
      onChange(null);
      return;
    }
    const ms = new Date(e.target.value).getTime();
    onChange(Number.isNaN(ms) ? null : ms);
  }

  return (
    <div className={cn("flex items-center gap-2", disabled && "opacity-50 pointer-events-none")}>
      <input
        type="datetime-local"
        value={value != null ? millisToInputValue(value) : ""}
        onChange={handleChange}
        disabled={disabled}
        className={cn(
          "flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs",
          "placeholder:text-muted-foreground transition-colors",
          "focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
        aria-label="Due date and time"
      />
      {value != null && (
        <button
          type="button"
          onClick={() => onChange(null)}
          disabled={disabled}
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground",
            "hover:bg-accent hover:text-accent-foreground transition-colors",
            "focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring",
          )}
          aria-label="Clear due date"
        >
          ×
        </button>
      )}
    </div>
  );
}
