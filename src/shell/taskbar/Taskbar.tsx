/**
 * NA.os Taskbar
 * 
 * System navigation and status indicator with running apps.
 * Includes Start menu trigger and branding.
 */

import { createSignal, createMemo, onMount, onCleanup, For, Show } from 'solid-js';
import { LayoutGrid, Clock } from 'lucide-solid';
import { apps, activePid, focusApp, updateWindowState } from '../compositor/compositor-store';
import { APP_REGISTRY } from '../compositor/app-registry';

export const Taskbar = () => {
  const [time, setTime] = createSignal(new Date());

  onMount(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    onCleanup(() => clearInterval(timer));
  });

  const formattedTime = createMemo(() => {
    return time().toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  });

  const formattedDate = createMemo(() => {
    return time().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  });

  const handleAppClick = (pid: string, currentStatus: string) => {
    if (activePid() === pid && currentStatus !== 'minimized') {
      updateWindowState(pid, 'minimized');
    } else {
      updateWindowState(pid, 'normal');
      focusApp(pid);
    }
  };

  return (
    <div class="h-10 w-full bg-black border-t border-white flex items-center justify-between px-2 select-none z-[1000]">
      {/* Start Button Area */}
      <div class="flex items-center gap-1 h-full shrink-0">
        <button class="h-8 px-3 flex items-center gap-2 hover:bg-white hover:text-black transition-colors group">
          <LayoutGrid size={16} class="group-hover:scale-110 transition-transform" />
          <span class="text-xs font-bold uppercase tracking-widest">START</span>
        </button>
        <div class="w-px h-4 bg-white/20 mx-1" />
      </div>

      {/* Running Apps Area */}
      <div class="flex-1 flex items-center px-4 gap-1 overflow-hidden h-full">
        <For each={apps()}>
          {(app) => (
            <button
              onClick={() => handleAppClick(app.pid, app.windowState)}
              class={`h-8 px-4 flex items-center gap-2 border transition-all max-w-[200px] truncate
                ${activePid() === app.pid && app.windowState !== 'minimized'
                  ? 'bg-white text-black border-white' 
                  : 'bg-black text-white border-white/20 hover:border-white/50'
                }
                ${app.windowState === 'minimized' ? 'opacity-50' : 'opacity-100'}
              `}
            >
              <span class="text-[10px] font-bold uppercase tracking-tight truncate">
                {app.title}
              </span>
            </button>
          )}
        </For>
      </div>

      {/* System Tray Area */}
      <div class="flex items-center gap-4 h-full shrink-0">
        <div class="hidden lg:flex flex-col items-end leading-none border-r border-white/20 pr-4">
          <span class="text-[8px] font-bold text-white/30 uppercase tracking-tighter">System Powered By</span>
          <span class="text-[10px] font-black text-white/80 uppercase tracking-widest">4yangXYAO</span>
        </div>

        <div class="flex flex-col items-end leading-none">
          <span class="text-[10px] font-bold text-white/50 uppercase">{formattedDate()}</span>
          <span class="text-xs font-bold font-mono tracking-tighter">{formattedTime()}</span>
        </div>
        
        <div class="hidden sm:flex w-8 h-8 items-center justify-center border border-white/20 hover:bg-white hover:text-black transition-all cursor-pointer">
          <Clock size={14} />
        </div>
      </div>
    </div>
  );
};

export default Taskbar;
