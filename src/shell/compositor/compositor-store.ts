/**
 * NA.os Compositor Store
 *
 * Central state for window management using SolidJS signals.
 * Provides reactive access to all running application windows.
 */

import { createSignal } from "solid-js";
import type { AppInstance, AppWindowState, WindowBounds } from "@include/types";
import { emit } from "@services/event-bus";

// ============================================================================
// STATE (SolidJS Signals — NOT Zustand/React)
// ============================================================================

const [apps, setApps] = createSignal<AppInstance[]>([]);
const [activePid, setActivePid] = createSignal<string | null>(null);

// ============================================================================
// ACTIONS
// ============================================================================

export const openApp = (appId: string, title: string): string => {
  const pid = crypto.randomUUID();
  const newApp: AppInstance = {
    appId,
    pid,
    title,
    windowState: "normal",
    bounds: {
      x: 80 + apps().length * 30,
      y: 60 + apps().length * 30,
      width: 640,
      height: 420,
    },
    focusedAt: new Date(),
  };

  setApps((prev) => [...prev, newApp]);
  setActivePid(pid);
  emit("shell:app-opened", { pid, appId });
  return pid;
};

export const closeApp = (pid: string): void => {
  // Debug: log when closeApp is invoked
  try {
    console.debug(
      "[compositor-store] closeApp()",
      pid,
      "before:",
      apps().map((a) => a.pid),
    );
  } catch { }
  setApps((prev) => prev.filter((a) => a.pid !== pid));
  if (activePid() === pid) setActivePid(null);
  emit("shell:app-closed", { pid });
  try {
    console.debug(
      "[compositor-store] closeApp() completed, after:",
      apps().map((a) => a.pid),
    );
  } catch { }
};

export const focusApp = (pid: string): void => {
  if (activePid() === pid) return;
  setActivePid(pid);
  setApps((prev) => {
    const idx = prev.findIndex((a) => a.pid === pid);
    if (idx === -1 || idx === prev.length - 1) return prev;
    const newApps = [...prev];
    const [app] = newApps.splice(idx, 1);
    newApps.push(app);
    return newApps;
  });
  emit("shell:app-focused", { pid });
};

export const updateWindowState = (
  pid: string,
  windowState: AppWindowState,
): void => {
  setApps((prev) => {
    const app = prev.find((a) => a.pid === pid);
    if (app) app.windowState = windowState;
    return [...prev];
  });
};

export const updateWindowBounds = (
  pid: string,
  bounds: Partial<WindowBounds>,
): void => {
  setApps((prev) => {
    const app = prev.find((a) => a.pid === pid);
    if (app) app.bounds = { ...app.bounds, ...bounds };
    return [...prev];
  });
};

// ============================================================================
// EXPORTS — plain functions, no hooks
// ============================================================================

export { apps, activePid };
