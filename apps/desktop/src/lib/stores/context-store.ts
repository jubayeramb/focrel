import { create } from "zustand";
import { contextsRepo } from "@/lib/db";
import type { Context, NewContext } from "@/lib/db";

type NewContextInput = Omit<NewContext, "id" | "createdAt" | "updatedAt">;

type ContextStore = {
  contexts: Context[];
  loading: boolean;
  load(): Promise<void>;
  create(input: NewContextInput): Promise<Context>;
  update(id: string, patch: Partial<Context>): Promise<void>;
  archive(id: string): Promise<void>;
  unarchive(id: string): Promise<void>;
  remove(id: string): Promise<void>;
  getById(id: string): Context | undefined;
};

export const useContextStore = create<ContextStore>((set, get) => ({
  contexts: [],
  loading: false,

  async load() {
    set({ loading: true });
    try {
      const contexts = await contextsRepo.list({ includeArchived: true });
      set({ contexts });
    } finally {
      set({ loading: false });
    }
  },

  async create(input) {
    const context = await contextsRepo.create(input);
    await get().load();
    return context;
  },

  async update(id, patch) {
    await contextsRepo.update(id, patch);
    await get().load();
  },

  async archive(id) {
    await contextsRepo.archive(id);
    await get().load();
  },

  async unarchive(id) {
    await contextsRepo.unarchive(id);
    await get().load();
  },

  async remove(id) {
    await contextsRepo.delete(id);
    await get().load();
  },

  getById(id) {
    return get().contexts.find((c) => c.id === id);
  },
}));
