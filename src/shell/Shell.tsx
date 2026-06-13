/**
 * NA.os Shell
 *
 * Main shell container that orchestrates the GUI components.
 * Connects Desktop, Taskbar, and Compositor.
 */

import { onMount } from "solid-js";
import { Taskbar } from "./taskbar/Taskbar";
import { Desktop } from "./desktop/Desktop";
import { Compositor } from "./compositor/Compositor";
import { info } from "@services/logger";
import { emit } from "@services/event-bus";

export const Shell = () => {
  onMount(() => {
    info("shell", "GUI Shell initialized");
    emit("shell:ready", { timestamp: new Date() });
  });

  return (
    <div
      id="os-shell"
      class="relative w-screen h-screen flex flex-col bg-black overflow-hidden select-none font-mono"
    >
      {/* Background Layer */}
      <div class="absolute inset-0 z-0 bg-[#000000] overflow-hidden">
        {/* Subtle grid pattern */}
        <div class="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:40px_40px]" />

        {/* Glow effect */}
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white opacity-[0.02] blur-[120px] rounded-full pointer-events-none" />
      </div>

      {/* OS Environment */}
      <div class="relative flex-1 flex flex-col overflow-hidden">
        {/* Desktop Layer */}
        <div class="relative flex-1 z-10">
          <Desktop />
        </div>

        {/* Compositor Layer (Windows) */}
        <div class="absolute inset-0 z-20 pointer-events-none">
          <Compositor />
        </div>

        {/* Status Overlay Layer */}
        <div class="absolute top-4 right-4 z-50 text-[10px] text-white/30 text-right pointer-events-none font-bold uppercase tracking-widest">
          NA.os SYSTEM v0.1.0-ALPHA
          <br />
          HYBRID KERNEL INSTALLED
          <br />
          ALL SYSTEMS NOMINAL
        </div>
      </div>

      {/* Taskbar Layer */}
      <div class="relative z-40">
        <Taskbar />
      </div>

      {/* Global CRT Scanline Effect */}
      <div class="absolute inset-0 pointer-events-none z-[10000] scanline" />
    </div>
  );
};

export default Shell;
