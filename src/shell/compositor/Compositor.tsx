/**
 * NA.os Compositor
 *
 * Manages window stack, focus, and rendering.
 * Coordinates between apps and the screen.
 */

import { For, Suspense } from "solid-js";
import Window from "./Window";
import {
  apps,
  closeApp,
  focusApp,
  updateWindowState,
} from "./compositor-store";
import { APP_REGISTRY } from "./app-registry";

export const Compositor = () => {
  return (
    <div class="relative w-full h-full overflow-hidden pointer-events-none">
      <div class="absolute inset-0">
        <For each={apps()}>
          {(app, index) => {
            const registryEntry = APP_REGISTRY[app.appId];
            const AppComponent = registryEntry?.component;

            return (
              <Window
                id={app.appId}
                pid={app.pid}
                title={app.title}
                bounds={app.bounds}
                state={app.windowState}
                zIndex={100 + index()}
                onClose={() => closeApp(app.pid)}
                onFocus={() => focusApp(app.pid)}
                onMinimize={() => updateWindowState(app.pid, "minimized")}
                onMaximize={() =>
                  updateWindowState(
                    app.pid,
                    app.windowState === "maximized" ? "normal" : "maximized",
                  )
                }
              >
                <div class="h-full w-full bg-black">
                  <Suspense
                    fallback={
                      <div class="flex items-center justify-center h-full text-xs text-white/40 uppercase animate-pulse">
                        Initializing {app.title}...
                      </div>
                    }
                  >
                    {AppComponent ? (
                      <AppComponent />
                    ) : (
                      <div class="p-4 text-red-500 font-mono text-sm">
                        Error: Application "{app.appId}" not found in registry.
                      </div>
                    )}
                  </Suspense>
                </div>
              </Window>
            );
          }}
        </For>
      </div>
    </div>
  );
};

export default Compositor;
