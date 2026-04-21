import { useState } from "react";
import { cn } from "@/lib/utils";

export type ColorPickerProps = {
  value: string | null;
  onChange: (v: string | null) => void;
  disabled?: boolean;
};

const PRESETS = [
  "#7c3aed",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#f43f5e",
  "#3b82f6",
  "#d946ef",
  "#64748b",
] as const;

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function normalizeHex(raw: string): string {
  const trimmed = raw.trim();
  if (HEX_RE.test(trimmed)) return trimmed.toLowerCase();
  return trimmed;
}

function isValidHex(s: string): boolean {
  return HEX_RE.test(s.trim());
}

export function ColorPicker({ value, onChange, disabled }: ColorPickerProps) {
  const [textInput, setTextInput] = useState(value ?? "");
  const [textInvalid, setTextInvalid] = useState(false);

  function handlePreset(hex: string) {
    setTextInput(hex);
    setTextInvalid(false);
    onChange(hex);
  }

  function handleNativeColor(e: React.ChangeEvent<HTMLInputElement>) {
    const hex = e.target.value;
    setTextInput(hex);
    setTextInvalid(false);
    onChange(hex);
  }

  function handleTextChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    setTextInput(raw);
    if (isValidHex(raw)) {
      setTextInvalid(false);
      const normalized = normalizeHex(raw);
      onChange(normalized);
    } else if (raw === "" || raw === "#") {
      setTextInvalid(false);
      onChange(null);
    } else {
      setTextInvalid(true);
    }
  }

  const effectiveValue = value && isValidHex(value) ? value : "#7c3aed";

  return (
    <div className={cn("space-y-3", disabled && "opacity-50 pointer-events-none")}>
      <div className="flex gap-2">
        {PRESETS.map((hex) => {
          const isSelected = value?.toLowerCase() === hex.toLowerCase();
          return (
            <button
              key={hex}
              type="button"
              className={cn(
                "w-7 h-7 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isSelected ? "ring-2 ring-offset-2 ring-ring scale-110" : "hover:scale-105",
              )}
              style={{ backgroundColor: hex }}
              onClick={() => handlePreset(hex)}
              aria-label={`Select color ${hex}`}
              aria-pressed={isSelected}
            />
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="color"
            value={effectiveValue}
            onChange={handleNativeColor}
            disabled={disabled}
            className="sr-only"
            id="color-native"
            tabIndex={-1}
          />
          <label
            htmlFor="color-native"
            className={cn(
              "block w-9 h-9 rounded-md border border-input cursor-pointer transition-colors",
              "hover:border-ring focus-within:ring-1 focus-within:ring-ring",
            )}
            style={{ backgroundColor: effectiveValue }}
            aria-label="Open color picker"
          />
        </div>
        <input
          type="text"
          value={textInput}
          onChange={handleTextChange}
          disabled={disabled}
          placeholder="#7c3aed"
          maxLength={7}
          className={cn(
            "flex h-9 w-32 rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm",
            "placeholder:text-muted-foreground transition-colors",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            textInvalid ? "border-destructive" : "border-input",
          )}
          aria-label="Hex color value"
          aria-invalid={textInvalid}
        />
      </div>
    </div>
  );
}
