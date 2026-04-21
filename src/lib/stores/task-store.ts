import { create } from "zustand";
import { tasksRepo } from "@/lib/db";
import type { NewTask, Task } from "@/lib/db";

// Stable empty-array reference so `tasksFor` returns the same [] every call
// when a context has no loaded tasks. Needed because React's useSyncExternalStore
// re-invokes on every store change — a fresh `[]` would fail the equality check
// and trigger an infinite render loop.
const EMPTY_TASKS: Task[] = [];

type CreateInput = Omit<NewTask, "id" | "position" | "createdAt" | "updatedAt"> & {
  contextId: string;
};

type TaskStore = {
  byContext: Record<string, Task[]>;
  loadingContext: string | null;
  loadByContext(contextId: string): Promise<void>;
  create(input: CreateInput): Promise<Task>;
  update(id: string, patch: Partial<Task>): Promise<void>;
  setStatus(id: string, status: Task["status"]): Promise<void>;
  remove(id: string): Promise<void>;
  reorder(contextId: string, orderedIds: string[]): Promise<void>;
  tasksFor(contextId: string): Task[];
};

export const useTaskStore = create<TaskStore>((set, get) => ({
  byContext: {},
  loadingContext: null,

  async loadByContext(contextId) {
    set({ loadingContext: contextId });
    try {
      const tasks = await tasksRepo.listByContext(contextId);
      set((s) => ({ byContext: { ...s.byContext, [contextId]: tasks } }));
    } finally {
      set({ loadingContext: null });
    }
  },

  async create(input) {
    const existing = get().byContext[input.contextId] ?? [];
    const maxPosition = existing.reduce((max, t) => Math.max(max, t.position), -1);
    const position = maxPosition + 1;

    const task = await tasksRepo.create({ ...input, position });
    await get().loadByContext(input.contextId);
    return task;
  },

  async update(id, patch) {
    const allContexts = get().byContext;
    const contextId = Object.keys(allContexts).find((cid) =>
      allContexts[cid].some((t) => t.id === id),
    );
    await tasksRepo.update(id, patch);
    if (contextId) await get().loadByContext(contextId);
  },

  async setStatus(id, status) {
    const patch: Partial<Task> =
      status === "done"
        ? { status, completedAt: Date.now() }
        : { status, completedAt: null };
    await get().update(id, patch);
  },

  async remove(id) {
    const allContexts = get().byContext;
    const contextId = Object.keys(allContexts).find((cid) =>
      allContexts[cid].some((t) => t.id === id),
    );
    await tasksRepo.delete(id);
    if (contextId) await get().loadByContext(contextId);
  },

  async reorder(contextId, orderedIds) {
    const existing = get().byContext[contextId] ?? [];
    const reordered = orderedIds
      .map((id) => existing.find((t) => t.id === id))
      .filter((t): t is Task => t !== undefined)
      .map((t, i) => ({ ...t, position: i }));

    set((s) => ({ byContext: { ...s.byContext, [contextId]: reordered } }));

    try {
      await tasksRepo.reorder(contextId, orderedIds);
    } catch {
      await get().loadByContext(contextId);
    }
  },

  tasksFor(contextId) {
    return get().byContext[contextId] ?? EMPTY_TASKS;
  },
}));

export const taskStore = {
  get state() {
    return useTaskStore.getState();
  },
  loadByContext: (contextId: string) => useTaskStore.getState().loadByContext(contextId),
  create: (input: CreateInput) => useTaskStore.getState().create(input),
  update: (id: string, patch: Partial<Task>) => useTaskStore.getState().update(id, patch),
  setStatus: (id: string, status: Task["status"]) =>
    useTaskStore.getState().setStatus(id, status),
  remove: (id: string) => useTaskStore.getState().remove(id),
  reorder: (contextId: string, orderedIds: string[]) =>
    useTaskStore.getState().reorder(contextId, orderedIds),
  tasksFor: (contextId: string) => useTaskStore.getState().tasksFor(contextId),
};
