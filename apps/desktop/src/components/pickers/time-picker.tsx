import { cn } from "@/lib/utils";

export interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

function splitTime(value: string): { hour: number; minute: number } {
  const [h = "0", m = "0"] = value.split(":");
  const hour = Math.max(0, Math.min(23, parseInt(h, 10) || 0));
  const minute = Math.max(0, Math.min(59, parseInt(m, 10) || 0));
  return { hour, minute };
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function formatMeridiem(hour: number): string {
  const suffix = hour < 12 ? "AM" : "PM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12} ${suffix}`;
}

export function TimePicker({ value, onChange, disabled, className }: TimePickerProps) {
  const { hour, minute } = splitTime(value);
  // Nearest 5-minute bucket keeps the select options tight without
  // discarding the user's original minute value; we snap only when the
  // user explicitly picks from the dropdown.
  const nearestMinute = MINUTES.reduce((best, m) =>
    Math.abs(m - minute) < Math.abs(best - minute) ? m : best,
  );

  const selectClasses = cn(
    "h-9 rounded-md border border-input bg-background px-2 text-sm",
    "focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  );

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <select
        value={hour}
        onChange={(e) => onChange(`${pad2(parseInt(e.target.value, 10))}:${pad2(nearestMinute)}`)}
        disabled={disabled}
        className={selectClasses}
        aria-label="Hour"
      >
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {pad2(h)}
          </option>
        ))}
      </select>
      <span className="text-sm text-muted-foreground">:</span>
      <select
        value={nearestMinute}
        onChange={(e) => onChange(`${pad2(hour)}:${pad2(parseInt(e.target.value, 10))}`)}
        disabled={disabled}
        className={selectClasses}
        aria-label="Minute"
      >
        {MINUTES.map((m) => (
          <option key={m} value={m}>
            {pad2(m)}
          </option>
        ))}
      </select>
      <span className="text-xs text-muted-foreground tabular-nums ml-1.5">
        {formatMeridiem(hour)}
      </span>
    </div>
  );
}
