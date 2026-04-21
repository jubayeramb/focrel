import { useSessionStore } from "@/lib/stores/session-store";
import { useContextStore } from "@/lib/stores/context-store";

export function initAccentSubscription(): () => void {
  function sync() {
    const sessionState = useSessionStore.getState().state;
    if (sessionState.phase === "active") {
      const context = useContextStore.getState().getById(sessionState.contextId);
      if (context?.color) {
        document.documentElement.style.setProperty("--accent-ctx", context.color);
        return;
      }
    }
    document.documentElement.style.removeProperty("--accent-ctx");
  }

  const unsubSession = useSessionStore.subscribe(sync);
  const unsubContext = useContextStore.subscribe(sync);

  sync();

  return () => {
    unsubSession();
    unsubContext();
  };
}
