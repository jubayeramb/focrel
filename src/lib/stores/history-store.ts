import { create } from "zustand";
import { sessionsRepo } from "@/lib/db";
import type { Session } from "@/lib/db";
import { useSessionStore } from "./session-store";

type HistoryStore = {
  byContext: Record<string, Session[]>;
  loadingContext: string | null;
  loadByContext(contextId: string, limit?: number): Promise<void>;
  invalidate(contextId: string): void;
  sessionsFor(contextId: string): Session[];
};

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  byContext: {},
  loadingContext: null,

  async loadByContext(contextId, limit = 20) {
    set({ loadingContext: contextId });
    try {
      const sessions = await sessionsRepo.recentForContext(contextId, limit);
      set((s) => ({ byContext: { ...s.byContext, [contextId]: sessions } }));
    } finally {
      set({ loadingContext: null });
    }
  },

  invalidate(contextId) {
    set((s) => {
      const next = { ...s.byContext };
      delete next[contextId];
      return { byContext: next };
    });
  },

  sessionsFor(contextId) {
    return get().byContext[contextId] ?? [];
  },
}));

// Track the active contextId so we know which history entry to invalidate when
// the session transitions from active → idle (idle is the post-end phase).
let trackedContextId: string | null = null;

useSessionStore.subscribe((state) => {
  if (state.state.phase === "active") {
    trackedContextId = state.state.contextId;
  } else if (state.state.phase === "idle" && trackedContextId !== null) {
    useHistoryStore.getState().invalidate(trackedContextId);
    trackedContextId = null;
  }
});
