import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { initAccentSubscription } from "./lib/accent";
import { runStartupHooks } from "./lib/init";
import { initSystemTheme } from "./lib/theme";
import "./styles/globals.css";

initSystemTheme();
initAccentSubscription();
void runStartupHooks();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
