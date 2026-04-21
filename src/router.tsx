import * as React from "react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { ContextEditorPage } from "@/routes/contexts/editor";
import { ContextHistoryPage } from "@/routes/contexts/history";
import { ContextsPage } from "@/routes/contexts/index";
import { GlobalHistoryPage } from "@/routes/history";
import { HomePage } from "@/routes/home";
import { OnboardingPage } from "@/routes/onboarding";
import { RootLayout } from "@/routes/root";
import { SessionPage } from "@/routes/session";
import { SessionsPage } from "@/routes/sessions";
import { SettingsPage } from "@/routes/settings";
import { useSettingsStore } from "@/lib/stores/settings-store";

function OnboardingGate() {
  const hydrated = useSettingsStore((s) => s.hydrated);
  const onboardingCompleted = useSettingsStore((s) => s.onboardingCompleted);
  const routerState = useRouterState();
  const navigate = useNavigate();

  React.useEffect(() => {
    // Wait until settings have been read from plugin-store. Otherwise the
    // default `onboardingCompleted: false` fires a redirect before hydrate()
    // resolves, re-prompting users who've already completed onboarding.
    if (!hydrated) return;
    if (onboardingCompleted) return;
    if (routerState.location.pathname === "/onboarding") return;
    // Keep users on /onboarding until they finish. The sidebar isn't
    // rendered there, so this redirect is the safety net for any
    // programmatic navigation (e.g. hotkey, deep link) that could
    // bypass the full-bleed onboarding flow.
    void navigate({ to: "/onboarding" });
  }, [hydrated, onboardingCompleted, routerState.location.pathname, navigate]);

  return null;
}

const rootRoute = createRootRoute({
  component: function Root() {
    return (
      <>
        <OnboardingGate />
        <RootLayout />
      </>
    );
  },
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: function Home() {
    const navigate = homeRoute.useNavigate();
    const goToSession = (contextId: string) =>
      void navigate({ to: "/session", search: { contextId } });
    return (
      <HomePage
        onNavigateToNewContext={() => void navigate({ to: "/contexts/new" })}
        onStartSession={goToSession}
        onSessionStarted={goToSession}
      />
    );
  },
});

const sessionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/session",
  validateSearch: (search: Record<string, unknown>) => ({
    contextId: typeof search.contextId === "string" ? search.contextId : undefined,
  }),
  component: function Session() {
    const { contextId } = sessionRoute.useSearch();
    const navigate = sessionRoute.useNavigate();
    return (
      <SessionPage
        contextId={contextId}
        onEndSession={() => void navigate({ to: "/" })}
      />
    );
  },
});

const contextsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/contexts",
  component: function Contexts() {
    const navigate = contextsRoute.useNavigate();
    return (
      <ContextsPage
        onNavigateToNew={() => void navigate({ to: "/contexts/new" })}
        onNavigateToEdit={(id) => void navigate({ to: "/contexts/$id/edit", params: { id } })}
        onNavigateToHistory={(id) =>
          void navigate({ to: "/contexts/$id/history", params: { id } })
        }
      />
    );
  },
});

const contextsNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/contexts/new",
  component: function ContextNew() {
    const navigate = contextsNewRoute.useNavigate();
    return (
      <ContextEditorPage
        onSave={() => void navigate({ to: "/contexts" })}
        onCancel={() => void navigate({ to: "/contexts" })}
      />
    );
  },
});

const contextsEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/contexts/$id/edit",
  component: function ContextEdit() {
    const { id } = contextsEditRoute.useParams();
    const navigate = contextsEditRoute.useNavigate();
    return (
      <ContextEditorPage
        contextId={id}
        onSave={() => void navigate({ to: "/contexts" })}
        onCancel={() => void navigate({ to: "/contexts" })}
      />
    );
  },
});

const contextsHistoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/contexts/$id/history",
  component: function ContextHistory() {
    const { id } = contextsHistoryRoute.useParams();
    const navigate = contextsHistoryRoute.useNavigate();
    return (
      <ContextHistoryPage contextId={id} onBack={() => void navigate({ to: "/contexts" })} />
    );
  },
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsPage,
});

const globalHistoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/history",
  component: GlobalHistoryPage,
});

const sessionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sessions",
  component: SessionsPage,
});

const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/onboarding",
  component: function Onboarding() {
    const navigate = onboardingRoute.useNavigate();
    const markOnboardingComplete = useSettingsStore((s) => s.markOnboardingComplete);
    return (
      <OnboardingPage
        onComplete={() => {
          markOnboardingComplete();
          void navigate({ to: "/" });
        }}
      />
    );
  },
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  sessionRoute,
  sessionsRoute,
  contextsRoute,
  contextsNewRoute,
  contextsEditRoute,
  contextsHistoryRoute,
  settingsRoute,
  globalHistoryRoute,
  onboardingRoute,
]);

export const router = createRouter({
  routeTree,
  history: createMemoryHistory({ initialEntries: ["/"] }),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
