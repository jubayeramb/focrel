"use client";

import { useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";

export function CopyableCommand({
  command,
  label = "Paste and press return",
}: {
  command: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* Clipboard blocked (insecure context, etc.) — the command is
         still visible inline and the user can select-copy manually. */
    }
  }

  return (
    <div className="mt-2 flex items-start gap-2 rounded-md border border-border bg-background/70 px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Terminal className="size-3" />
          {label}
        </div>
        <code className="mt-1 block overflow-x-auto whitespace-pre font-mono text-xs text-foreground">
          {command}
        </code>
      </div>
      <button
        type="button"
        onClick={() => void handleCopy()}
        aria-label={copied ? "Copied" : "Copy command"}
        className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
      >
        {copied ? (
          <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
        ) : (
          <Copy className="size-3.5" strokeWidth={2} />
        )}
      </button>
    </div>
  );
}
