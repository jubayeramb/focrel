import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type BreakPromptProps = {
  open: boolean;
  onTakeBreak: () => void;
  onEndSession: () => void;
  onExtend: () => void;
};

export function BreakPrompt({ open, onTakeBreak, onEndSession, onExtend }: BreakPromptProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onEndSession();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onEndSession]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" />
      <Card className="relative z-10 w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Time's up.</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full" onClick={onTakeBreak}>
            Take a 5-min break
          </Button>
          <Button variant="outline" className="w-full" onClick={onExtend}>
            Extend by 10 minutes
          </Button>
          <Button
            variant="outline"
            className="w-full border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={onEndSession}
          >
            End session
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
