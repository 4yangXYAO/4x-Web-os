/**
 * WEB.OS Taskbar
 * 
 * System navigation and status indicator.
 * Includes Start menu trigger and running apps.
 */

import { createSignal, createMemo, onMount, onCleanup } from 'solid-js';
import { Terminal, LayoutGrid, Clock, Monitor } from 'lucide-solid';

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

  return (
    <div class="h-10 w-full bg-black border-t border-white flex items-center justify-between px-2 select-none z-[1000]">
      {/* Start Button Area */}
      <div class="flex items-center gap-1 h-full">
        <button class="h-8 px-3 flex items-center gap-2 hover:bg-white hover:text-black transition-colors group">
          <LayoutGrid size={16} class="group-hover:scale-110 transition-transform" />
          <span class="text-xs font-bold uppercase tracking-widest">START</span>
        </button>
        
        <div class="w-px h-4 bg-white/20 mx-1" />
        
        {/* Quick Launch */}
        <button class="w-8 h-8 flex items-center justify-center hover:bg-white/10 transition-colors" title="Terminal">
          <Terminal size={14} />
        </button>
        <button class="w-8 h-8 flex items-center justify-center hover:bg-white/10 transition-colors" title="Desktop">
          <Monitor size={14} />
        </button>
      </div>

      {/* Running Apps Area (Placeholder) */}
      <div class="flex-1 flex items-center px-4 gap-2 overflow-hidden">
        {/* Running app indicators will go here */}
      </div>

      {/* System Tray Area */}
      <div class="flex items-center gap-4 h-full">
        <div class="flex flex-col items-end leading-none">
          <span class="text-[10px] font-bold text-white/50 uppercase">{formattedDate()}</span>
          <span class="text-xs font-bold font-mono tracking-tighter">{formattedTime()}</span>
        </div>
        
        <div class="w-8 h-8 flex items-center justify-center border border-white/20 hover:bg-white hover:text-black transition-all cursor-pointer">
          <Clock size={14} />
        </div>
      </div>
    </div>
  );
};

export default Taskbar;
