import { render } from "solid-js/web";
import { bootstrap } from "./boot/bootstrap";
import { createSignal, onMount, Show, For } from "solid-js";
import { Shell } from "./shell/Shell";

// Import CSS
import "./index.css";

/**
 * Root Application Component with Boot Sequence
 */
const App = () => {
  const [isBooted, setIsBooted] = createSignal(false);
  const [bootError, setBootError] = createSignal<string | null>(null);
  const [bootLogs, setBootLogs] = createSignal<string[]>([]);

  const addLog = (msg: string) => {
    setBootLogs((prev) => [...prev.slice(-6), msg]);
  };

  onMount(async () => {
    try {
      addLog("Detecting hardware...");
      await new Promise((r) => setTimeout(r, 400));

      addLog("Initializing hyper-kernel v1.0...");
      await new Promise((r) => setTimeout(r, 300));

      addLog("Loading persistent storage...");
      await new Promise((r) => setTimeout(r, 500));

      addLog("Orchestrating GUI services...");
      await bootstrap({ debugMode: import.meta.env.DEV });

      addLog("System ready.");
      await new Promise((r) => setTimeout(r, 200));

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
          <div class="flex h-full w-full flex-col items-center justify-center font-mono p-10 bg-[#050505]">
            <div class="mb-2 text-4xl font-black italic tracking-tighter text-white">
              NA.os
            </div>
            <div class="mb-12 text-[10px] font-bold tracking-[0.6em] text-white/30 uppercase">
              By 4yangXYAO
            </div>

            <div class="w-64 h-[1px] bg-white/5 mb-8 relative overflow-hidden">
               <div class="absolute inset-y-0 left-0 bg-[#00ff00] shadow-[0_0_10px_#00ff00] animate-[loading_1.5s_infinite]" style="width: 30%" />
            </div>

            <div class="w-full max-w-sm flex flex-col items-center">
              <For each={bootLogs()}>
                {(log) => (
                  <div class="text-[9px] text-white/40 uppercase mb-1 flex items-center gap-3 w-full">
                    <span class="text-[#00ff00] font-black">✓</span>
                    <span class="tracking-widest">{log}</span>
                  </div>
                )}
              </For>
            </div>

            <Show when={bootError()}>
              <div class="text-red-500 mt-12 max-w-md w-full border border-red-500/50 p-6 bg-red-500/5">
                <div class="font-black mb-2 uppercase tracking-[0.2em] text-xs">
                  KERNEL_PANIC::BOOT_FAILED
                </div>
                <div class="text-[9px] opacity-70 font-mono leading-relaxed">{bootError()}</div>
                <button onClick={() => window.location.reload()} class="mt-4 px-4 py-1 border border-red-500 text-[9px] font-bold hover:bg-red-500 hover:text-white transition-all">TRY_REBOOT</button>
              </div>
            </Show>

            <div class="absolute bottom-8 text-[9px] font-bold text-white/10 uppercase tracking-[0.3em]">
                System Architecture v1.0.0 Stable
            </div>
          </div>
        }
      >
        <Shell />
      </Show>
    </div>
  );
};

const root = document.getElementById("root");
if (root) {
  render(() => <App />, root);
}
