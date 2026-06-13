/**
 * NA.os Settings
 * 
 * System configuration utility.
 */

import { createSignal } from 'solid-js';
import { Monitor, Shield, Database, Info, Cpu } from 'lucide-solid';

export const SettingsApp = () => {
  const [activeTab, setActiveTab] = createSignal('system');

  const tabs = [
    { id: 'system', label: 'System', icon: Cpu },
    { id: 'display', label: 'Display', icon: Monitor },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'storage', label: 'Storage', icon: Database },
    { id: 'about', label: 'About', icon: Info },
  ];

  return (
    <div class="flex h-full bg-[#0a0a0a] text-white overflow-hidden">
      {/* Sidebar */}
      <div class="w-48 border-r border-white/10 flex flex-col p-2 gap-1 bg-black">
        {tabs.map(tab => (
          <button 
            onClick={() => setActiveTab(tab.id)}
            class={`flex items-center gap-3 px-3 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${
              activeTab() === tab.id ? 'bg-white text-black' : 'hover:bg-white/5'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div class="flex-1 p-8 overflow-auto">
        {activeTab() === 'system' && (
          <div class="max-w-md">
            <h2 class="text-xl font-bold mb-4 uppercase italic">Kernel Configuration</h2>
            <div class="space-y-4">
              <div class="flex items-center justify-between p-3 border border-white/10 bg-white/5">
                <div>
                  <div class="text-[10px] font-bold text-white/50 uppercase">Debug Mode</div>
                  <div class="text-xs uppercase">Kernel tracing and verbose logs</div>
                </div>
                <div class="w-10 h-5 bg-green-500 relative cursor-pointer">
                  <div class="absolute right-1 top-1 w-3 h-3 bg-black" />
                </div>
              </div>
              <div class="flex items-center justify-between p-3 border border-white/10 bg-white/5">
                <div>
                  <div class="text-[10px] font-bold text-white/50 uppercase">Auto-Save</div>
                  <div class="text-xs uppercase">Periodically sync VFS to DB</div>
                </div>
                <div class="w-10 h-5 bg-white/20 relative cursor-pointer">
                  <div class="absolute left-1 top-1 w-3 h-3 bg-white" />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab() === 'about' && (
          <div class="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto">
            <div class="w-20 h-20 bg-white mb-6 flex items-center justify-center font-bold text-black text-4xl italic">OS</div>
            <h1 class="text-2xl font-bold uppercase tracking-tighter mb-1">NA.os</h1>
            <p class="text-[10px] font-bold text-white/40 uppercase mb-8">Version 0.1.0-ALPHA "Foundation"</p>
            <p class="text-xs leading-relaxed opacity-60">
              A full-featured, lightweight operating system that runs entirely in your browser. 
              Built with TypeScript, SolidJS, and a custom hybrid kernel architecture.
            </p>
            <div class="mt-8 pt-8 border-t border-white/10 w-full text-[10px] text-white/20 uppercase font-bold">
              &copy; 2026 NEO-HUMAN CORE SYSTEMS
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsApp;
