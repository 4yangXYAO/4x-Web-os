/**
 * NA.os Desktop
 *
 * Main user interaction area with branding and grid layout.
 */

import { For } from "solid-js";
import {
  FolderOpen,
  Settings,
  FileText,
  Palette,
  Gamepad2,
} from "lucide-solid";
import { openApp, apps, focusApp } from "../compositor/compositor-store";

interface DesktopIconProps {
  label: string;
  icon: any;
  onOpen: () => void;
}

const DesktopIcon = (props: DesktopIconProps) => (
  <div
    class="w-20 sm:w-24 flex flex-col items-center gap-1 p-2 group cursor-pointer hover:bg-white/10 transition-all rounded-sm active:scale-95"
    onClick={() => props.onOpen()}
  >
    <div class="w-12 h-12 flex items-center justify-center border border-white/5 bg-black group-hover:border-white transition-all shadow-lg">
      <props.icon
        size={22}
        class="text-white group-hover:scale-110 group-hover:text-[#00ff00] transition-all"
      />
    </div>
    <span class="text-[9px] font-black text-center uppercase tracking-normal bg-black px-1 border border-transparent group-hover:border-white/20">
      {props.label}
    </span>
  </div>
);

export const Desktop = () => {
  const icons = [
    { id: "files", label: "Files", icon: FolderOpen },
    { id: "editor", label: "Editor", icon: FileText },
    { id: "draw", label: "Draw", icon: Palette },
    { id: "games", label: "Games", icon: Gamepad2 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div class="absolute inset-0 p-6 flex flex-col flex-wrap gap-4 content-start select-none">
      <For each={icons}>
        {(icon) => {
          const handleOpen = () => {
            const existing = apps().find((a) => a.appId === icon.id);
            if (existing) {
              focusApp(existing.pid);
            } else {
              openApp(icon.id, icon.label);
            }
          };

          return (
            <DesktopIcon
              label={icon.label}
              icon={icon.icon}
              onOpen={handleOpen}
            />
          );
        }}
      </For>

      {/* Decorative Branding */}
      <div class="absolute bottom-12 right-8 flex flex-col items-end pointer-events-none opacity-20 group">
         <span class="text-[60px] font-black italic leading-none tracking-tighter text-white/10 select-none">NA.OS</span>
         <span class="text-[10px] font-bold uppercase tracking-[0.5em] text-white/50 -mt-2">By 4yangXYAO</span>
      </div>

      {/* Grid Pattern Background */}
      <div class="absolute inset-0 pointer-events-none opacity-[0.05] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
    </div>
  );
};

export default Desktop;
