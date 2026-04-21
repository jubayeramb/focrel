import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { ContextEditorPage } from "@/routes/contexts/editor";
import { ContextsPage } from "@/routes/contexts/index";
import { HomePage } from "@/routes/home";
import { RootLayout } from "@/routes/root";
import { SessionPage } from "@/routes/session";
import { SettingsPage } from "@/routes/settings";

const rootRoute = createRootRoute({
  component: RootLayout,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: function Home() {
    const navigate = homeRoute.useNavigate();
    return (
      <HomePage
        onNavigateToNewContext={() => {
          void navigate({ to: "/contexts/new" });
        }}
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
        onEndSession={() => {
          void navigate({ to: "/" });
        }}
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
        onNavigateToNew={() => {
          void navigate({ to: "/contexts/new" });
        }}
        onNavigateToEdit={(id) => {
          void navigate({ to: "/contexts/$id/edit", params: { id } });
        }}
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
        onSave={() => {
          void navigate({ to: "/contexts" });
        }}
        onCancel={() => {
          void navigate({ to: "/contexts" });
        }}
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
        onSave={() => {
          void navigate({ to: "/contexts" });
        }}
        onCancel={() => {
          void navigate({ to: "/contexts" });
        }}
      />
    );
  },
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsPage,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  sessionRoute,
  contextsRoute,
  contextsNewRoute,
  contextsEditRoute,
  settingsRoute,
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
