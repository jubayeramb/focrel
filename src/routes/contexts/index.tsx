import { useEffect, useRef, useState } from "react";
import { MoreVertical, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContextCard } from "@/components/context-card";
import { useContextStore } from "@/lib/stores/context-store";
import type { Context } from "@/lib/db";

type ContextsPageProps = {
  onNavigateToNew: () => void;
  onNavigateToEdit: (id: string) => void;
};

export function ContextsPage({ onNavigateToNew, onNavigateToEdit }: ContextsPageProps) {
  const { contexts, loading, load, archive, unarchive, remove } = useContextStore();
  const [showArchived, setShowArchived] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (contexts.length === 0 && !loading) load();
  }, []);

  const filtered = (showArchived ? contexts : contexts.filter((c) => c.archivedAt == null)).slice()
    .sort((a, b) => {
      if ((a.archivedAt == null) !== (b.archivedAt == null)) {
        return a.archivedAt == null ? -1 : 1;
      }
      return a.createdAt - b.createdAt;
    });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Contexts</h1>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground select-none cursor-pointer">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded"
            />
            Show archived
          </label>
          <Button size="sm" onClick={onNavigateToNew}>
            <Plus className="size-4" />
            New context
          </Button>
        </div>
      </header>

      {filtered.length === 0 ? (
        <EmptyState onNew={onNavigateToNew} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <ContextCard
              key={c.id}
              context={c}
              onClick={() => onNavigateToEdit(c.id)}
              actions={
                <ContextMenu
                  context={c}
                  open={openMenuId === c.id}
                  onToggle={() => setOpenMenuId(openMenuId === c.id ? null : c.id)}
                  onClose={() => setOpenMenuId(null)}
                  onEdit={() => {
                    setOpenMenuId(null);
                    onNavigateToEdit(c.id);
                  }}
                  onArchive={() => {
                    setOpenMenuId(null);
                    void archive(c.id);
                  }}
                  onUnarchive={() => {
                    setOpenMenuId(null);
                    void unarchive(c.id);
                  }}
                  onDelete={() => {
                    setOpenMenuId(null);
                    if (window.confirm(`Delete "${c.name}"? This cannot be undone.`)) {
                      void remove(c.id);
                    }
                  }}
                />
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-6 opacity-50">
        <Sparkles className="size-8 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-medium mb-2">No contexts yet</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        Create your first context to start focusing.
      </p>
      <Button onClick={onNew}>
        <Plus className="size-4" />
        Create first context
      </Button>
    </div>
  );
}

type ContextMenuProps = {
  context: Context;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
  onDelete: () => void;
};

function ContextMenu({
  context,
  open,
  onToggle,
  onClose,
  onEdit,
  onArchive,
  onUnarchive,
  onDelete,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open, onClose]);

  return (
    <div ref={menuRef} className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        aria-label="More options"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
      >
        <MoreVertical className="size-4" />
      </Button>
      {open && (
        <div className="absolute right-0 top-8 z-50 min-w-[140px] rounded-lg border bg-popover shadow-md py-1 text-sm text-popover-foreground">
          <button
            className="w-full text-left px-3 py-1.5 hover:bg-accent transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            Edit
          </button>
          {context.archivedAt == null ? (
            <button
              className="w-full text-left px-3 py-1.5 hover:bg-accent transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onArchive();
              }}
            >
              Archive
            </button>
          ) : (
            <button
              className="w-full text-left px-3 py-1.5 hover:bg-accent transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onUnarchive();
              }}
            >
              Unarchive
            </button>
          )}
          <button
            className="w-full text-left px-3 py-1.5 hover:bg-accent text-destructive transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
