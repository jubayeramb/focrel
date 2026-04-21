import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { taskStore } from "@/lib/stores/task-store";
import type { Task } from "@/lib/db";

type TaskRowProps = {
  task: Task;
  focused?: boolean;
  onFocus?: () => void;
  onDelete: () => void;
};

const PRIORITY_DOT: Record<number, string> = {
  0: "bg-transparent border border-border",
  1: "bg-muted-foreground/40",
  2: "bg-amber-400 dark:bg-amber-500",
  3: "bg-rose-500 dark:bg-rose-400",
};

export function TaskRow({ task, focused, onFocus, onDelete }: TaskRowProps) {
  const [editing, setEditing] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState(task.title);
  const editInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (editing) {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }
  }, [editing]);

  function enterEdit() {
    setEditTitle(task.title);
    setEditing(true);
  }

  async function commitEdit() {
    const trimmed = editTitle.trim();
    if (!trimmed) {
      if (window.confirm("Delete this task?")) {
        onDelete();
      } else {
        setEditTitle(task.title);
      }
      setEditing(false);
      return;
    }
    if (trimmed !== task.title) {
      await taskStore.update(task.id, { title: trimmed });
    }
    setEditing(false);
  }

  function cancelEdit() {
    setEditTitle(task.title);
    setEditing(false);
  }

  async function handleEditKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      await commitEdit();
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  }

  async function toggleStatus() {
    const next = task.status === "done" ? "pending" : "done";
    await taskStore.setStatus(task.id, next);
  }

  const isDone = task.status === "done";
  const dotClass = PRIORITY_DOT[task.priority] ?? PRIORITY_DOT[0];

  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
        "hover:bg-accent/50",
        focused && "ring-1 ring-ring",
      )}
      onMouseDown={onFocus}
    >
      {/* Checkbox */}
      <button
        type="button"
        aria-label={isDone ? "Mark pending" : "Mark done"}
        onClick={() => void toggleStatus()}
        className={cn(
          "shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors",
          isDone
            ? "bg-primary border-primary"
            : "border-muted-foreground/40 hover:border-primary",
        )}
      >
        {isDone && (
          <svg
            className="w-2.5 h-2.5 text-primary-foreground"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="1.5,5 4,7.5 8.5,2.5" />
          </svg>
        )}
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            ref={editInputRef}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => void handleEditKeyDown(e)}
            onBlur={() => void commitEdit()}
            className={cn(
              "w-full bg-transparent outline-none focus:ring-1 focus:ring-ring rounded px-0.5",
              "text-sm text-foreground",
            )}
          />
        ) : (
          <span
            onDoubleClick={enterEdit}
            className={cn(
              "block truncate cursor-default select-none",
              isDone && "line-through text-muted-foreground",
            )}
          >
            {task.title}
          </span>
        )}
      </div>

      {/* Due date badge */}
      {task.dueAt != null && (
        <span className="shrink-0 text-xs text-muted-foreground dark:text-muted-foreground/80 whitespace-nowrap">
          {formatDistanceToNow(new Date(task.dueAt), { addSuffix: true })}
        </span>
      )}

      {/* Priority dot */}
      <span
        className={cn("shrink-0 w-2 h-2 rounded-full", dotClass)}
        aria-hidden="true"
      />

      {/* Delete button */}
      <button
        type="button"
        aria-label="Delete task"
        onClick={onDelete}
        className={cn(
          "shrink-0 w-5 h-5 flex items-center justify-center rounded text-muted-foreground",
          "opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity",
        )}
      >
        ×
      </button>
    </div>
  );
}
