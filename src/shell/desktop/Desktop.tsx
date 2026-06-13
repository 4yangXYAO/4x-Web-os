/**
 * NA.os Desktop
 *
 * Main user interaction area.
 * Contains app icons, widgets, and background effects.
 */

import { For } from "solid-js";
import {
  Terminal,
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
    class="w-20 flex flex-col items-center gap-1 p-2 group cursor-pointer hover:bg-white/10 transition-colors"
    onClick={() => props.onOpen()}
    onDblClick={() => props.onOpen()}
  >
    <div class="w-12 h-12 flex items-center justify-center border border-transparent group-hover:border-white transition-colors">
      <props.icon
        size={24}
        class="text-white group-hover:scale-110 transition-transform"
      />
    </div>
    <span class="text-[10px] font-bold text-center uppercase tracking-tighter bg-black px-1">
      {props.label}
    </span>
  </div>
);

export const Desktop = () => {
  const icons = [
    { id: "terminal", label: "Terminal", icon: Terminal },
    { id: "files", label: "Files", icon: FolderOpen },
    { id: "editor", label: "Editor", icon: FileText },
    { id: "draw", label: "Draw", icon: Palette },
    { id: "games", label: "Games", icon: Gamepad2 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div class="absolute inset-0 p-4 flex flex-col flex-wrap gap-2 content-start select-none">
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

      {/* Retro CRT Effect Overlay */}
      <div class="absolute inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(circle,rgba(255,255,255,1)_1px,transparent_1px)] bg-[length:4px_4px]" />
    </div>
  );
};

export default Desktop;
