import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type EndReason = "completed" | "interrupted" | "abandoned";

export type EndSessionDialogProps = {
  open: boolean;
  initialReason?: EndReason;
  onSave: (reason: EndReason, notes?: string) => void | Promise<void>;
  onCancel: () => void;
};

const REASONS: { value: EndReason; label: string }[] = [
  { value: "completed", label: "Completed" },
  { value: "interrupted", label: "Interrupted" },
  { value: "abandoned", label: "Abandoned" },
];

export function EndSessionDialog({ open, initialReason = "completed", onSave, onCancel }: EndSessionDialogProps) {
  const [reason, setReason] = useState<EndReason>(initialReason);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const firstRadioRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setReason(initialReason);
  }, [initialReason, open]);

  useEffect(() => {
    if (!open) return;
    firstRadioRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(reason, notes.trim() || undefined);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onCancel} />
      <Card className="relative z-10 w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>End session</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>How did it go?</Label>
            <div className="flex rounded-md border overflow-hidden">
              {REASONS.map(({ value, label }, i) => (
                <button
                  key={value}
                  ref={i === 0 ? firstRadioRef : undefined}
                  type="button"
                  onClick={() => setReason(value)}
                  className={cn(
                    "flex-1 px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring",
                    i > 0 && "border-l",
                    reason === value
                      ? "bg-primary text-primary-foreground"
                      : "bg-background hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-session-notes">Notes</Label>
            <Textarea
              id="end-session-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you get done?"
              className="resize-none"
              rows={3}
            />
          </div>
        </CardContent>
        <CardFooter className="gap-2 justify-end">
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
