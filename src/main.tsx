import { render } from "solid-js/web";
import { bootstrap } from "./boot/bootstrap";
import { createSignal, onMount, Show, For } from "solid-js";
import { Shell } from "./shell/Shell";
import TerminalApp from "./usr/bin/terminal";

// Import CSS
import "./index.css";

/**
 * Root Application Component
 */
const App = () => {
  const [isBooted, setIsBooted] = createSignal(false);
  const [bootError, setBootError] = createSignal<string | null>(null);
  const [bootLogs, setBootLogs] = createSignal<string[]>([]);

  const addLog = (msg: string) => {
    setBootLogs((prev) => [...prev.slice(-4), msg]);
  };

  onMount(async () => {
    try {
      addLog("Detecting hardware...");
      await new Promise((r) => setTimeout(r, 200));

      addLog("Initializing services...");
      await new Promise((r) => setTimeout(r, 150));

      addLog("Loading kernel...");
      await new Promise((r) => setTimeout(r, 250));

      addLog("Mounting VFS...");
      await bootstrap({ debugMode: import.meta.env.DEV });

      addLog("System ready.");
      await new Promise((r) => setTimeout(r, 100));

      setIsBooted(true);
    } catch (err) {
      setBootError(
        err instanceof Error ? err.message : "System failed to boot.",
      );
    }
  });

  return (
    <div class="h-screen w-screen overflow-hidden bg-black text-white select-none">
      <Show
        when={isBooted()}
        fallback={
          <div class="flex h-full w-full flex-col items-center justify-center font-mono p-10">
            <div class="mb-8 text-2xl animate-pulse tracking-[0.2em] font-bold">
              BOOTING NA.os
            </div>

            <div class="w-64 h-1 bg-white/10 mb-8 relative overflow-hidden">
              <div
                class="absolute inset-y-0 left-0 bg-white animate-[loading_2s_infinite]"
                style="width: 40%"
              />
            </div>

            <div class="w-full max-w-sm">
              <For each={bootLogs()}>
                {(log) => (
                  <div class="text-[10px] text-white/40 uppercase mb-1 flex gap-2">
                    <span class="text-green-500">[OK]</span>
                    <span>{log}</span>
                  </div>
                )}
              </For>
            </div>

            <Show when={bootError()}>
              <div class="text-red-500 mt-8 max-w-md text-center border border-red-500 p-4">
                <div class="font-bold mb-2 uppercase tracking-widest text-xs">
                  Kernel Panic
                </div>
                <div class="text-[10px] opacity-70">{bootError()}</div>
              </div>
            </Show>
          </div>
        }
      >
        {/* If launched with ?app=terminal, show the Terminal directly for development/testing */}
        {new URLSearchParams(location.search).get("app") === "terminal" ? (
          <TerminalApp />
        ) : (
          <Shell />
        )}
      </Show>
    </div>
  );
};

const root = document.getElementById("root");
if (root) {
  render(() => <App />, root);
}
