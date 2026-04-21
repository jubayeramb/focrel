import * as React from "react";
import { Input } from "@/components/ui/input";
import { taskStore } from "@/lib/stores/task-store";
import type { Task } from "@/lib/db";

type TaskAddInputProps = {
  contextId: string;
  onAdded?: (task: Task) => void;
};

export type TaskAddInputHandle = {
  focus(): void;
};

export const TaskAddInput = React.forwardRef<TaskAddInputHandle, TaskAddInputProps>(
  ({ contextId, onAdded }, ref) => {
    const [title, setTitle] = React.useState("");
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => ({
      focus() {
        inputRef.current?.focus();
      },
    }));

    async function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
      if (e.key === "Enter") {
        const trimmed = title.trim();
        if (!trimmed) return;
        const task = await taskStore.create({ contextId, title: trimmed });
        setTitle("");
        inputRef.current?.focus();
        onAdded?.(task);
      } else if (e.key === "Escape") {
        inputRef.current?.blur();
      }
    }

    return (
      <Input
        ref={inputRef}
        placeholder="Add a task…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => void handleKeyDown(e)}
        className="mb-2"
      />
    );
  },
);

TaskAddInput.displayName = "TaskAddInput";
