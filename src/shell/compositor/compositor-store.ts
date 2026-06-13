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
  } catch {}
  setApps((prev) => prev.filter((a) => a.pid !== pid));
  if (activePid() === pid) setActivePid(null);
  emit("shell:app-closed", { pid });
  try {
    console.debug(
      "[compositor-store] closeApp() completed, after:",
      apps().map((a) => a.pid),
    );
  } catch {}
};

export const focusApp = (pid: string): void => {
  setActivePid(pid);
  setApps((prev) =>
    prev.map((a) => (a.pid === pid ? { ...a, focusedAt: new Date() } : a)),
  );
  emit("shell:app-focused", { pid });
};

export const updateWindowState = (
  pid: string,
  windowState: AppWindowState,
): void => {
  setApps((prev) =>
    prev.map((a) => (a.pid === pid ? { ...a, windowState } : a)),
  );
};

export const updateWindowBounds = (
  pid: string,
  bounds: Partial<WindowBounds>,
): void => {
  setApps((prev) =>
    prev.map((a) =>
      a.pid === pid ? { ...a, bounds: { ...a.bounds, ...bounds } } : a,
    ),
  );
};

// ============================================================================
// EXPORTS — plain functions, no hooks
// ============================================================================

export { apps, activePid };
