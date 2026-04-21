import * as React from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useTaskStore, taskStore } from "@/lib/stores/task-store";
import { TaskAddInput, type TaskAddInputHandle } from "@/components/task-add-input";
import { TaskRow } from "@/components/task-row";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/db";

type StatusFilter = "all" | "open" | "done";

type TaskListProps = {
  contextId: string;
  statusFilter?: StatusFilter;
};

type SortableItemProps = {
  task: Task;
  index: number;
  focusedIndex: number | null;
  onFocus: () => void;
  onDelete: () => void;
};

function SortableItem({ task, index, focusedIndex, onFocus, onDelete }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <li ref={setNodeRef} style={style} data-task-id={task.id} className="flex items-center gap-1">
      <button
        type="button"
        aria-label="Drag to reorder"
        className={cn(
          "shrink-0 flex items-center justify-center w-5 h-5 cursor-grab active:cursor-grabbing",
          "text-muted-foreground/40 hover:text-muted-foreground transition-colors touch-none",
        )}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>
      <div className="flex-1 min-w-0">
        <TaskRow
          task={task}
          focused={focusedIndex === index}
          onFocus={onFocus}
          onDelete={onDelete}
        />
      </div>
    </li>
  );
}

export function TaskList({ contextId, statusFilter = "all" }: TaskListProps) {
  const tasks = useTaskStore((s) => s.tasksFor(contextId));
  const addInputRef = React.useRef<TaskAddInputHandle>(null);
  const [focusedIndex, setFocusedIndex] = React.useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Avoids accidental drags when clicking to edit title
      activationConstraint: { distance: 6 },
    }),
  );

  React.useEffect(() => {
    void taskStore.loadByContext(contextId);
    setFocusedIndex(null);
  }, [contextId]);

  const visibleTasks = React.useMemo<Task[]>(() => {
    if (statusFilter === "all") return tasks;
    if (statusFilter === "open") return tasks.filter((t) => t.status !== "done");
    return tasks.filter((t) => t.status === "done");
  }, [tasks, statusFilter]);

  function focusAddInput() {
    addInputRef.current?.focus();
    setFocusedIndex(null);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement;
    const tag = target.tagName.toLowerCase();
    if (tag === "input" || tag === "textarea") return;

    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      focusAddInput();
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      focusAddInput();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) =>
        prev === null ? 0 : Math.min(prev + 1, visibleTasks.length - 1),
      );
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) =>
        prev === null ? visibleTasks.length - 1 : Math.max(prev - 1, 0),
      );
      return;
    }

    if (e.key === " " && focusedIndex !== null) {
      e.preventDefault();
      const task = visibleTasks[focusedIndex];
      if (task) {
        const next = task.status === "done" ? "pending" : "done";
        void taskStore.setStatus(task.id, next);
      }
      return;
    }

    if (e.key === "Backspace" && focusedIndex !== null) {
      e.preventDefault();
      const task = visibleTasks[focusedIndex];
      if (task && window.confirm(`Delete "${task.title}"?`)) {
        void taskStore.remove(task.id);
        setFocusedIndex((prev) =>
          prev !== null && prev > 0 ? prev - 1 : null,
        );
      }
    }
  }

  async function deleteTask(task: Task) {
    if (window.confirm(`Delete "${task.title}"?`)) {
      await taskStore.remove(task.id);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const allTasks = taskStore.tasksFor(contextId);
    const oldIndex = allTasks.findIndex((t) => t.id === active.id);
    const newIndex = allTasks.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(allTasks, oldIndex, newIndex).map((t) => t.id);
    void taskStore.reorder(contextId, newOrder);
  }

  return (
    <div
      className="outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <TaskAddInput ref={addInputRef} contextId={contextId} />

      {visibleTasks.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No tasks yet.</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={visibleTasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-0.5">
              {visibleTasks.map((task, idx) => (
                <SortableItem
                  key={task.id}
                  task={task}
                  index={idx}
                  focusedIndex={focusedIndex}
                  onFocus={() => setFocusedIndex(idx)}
                  onDelete={() => void deleteTask(task)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
