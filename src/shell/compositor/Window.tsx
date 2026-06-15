import { createMemo, JSX, Show, createSignal, onCleanup } from "solid-js";
import { X, Minus, Square } from "lucide-solid";
import type { AppWindowState, WindowBounds } from "@include/types";
import { updateWindowBounds } from "./compositor-store";

interface WindowProps {
  pid: string;
  title: string;
  icon?: string;
  children: JSX.Element;
  bounds: WindowBounds;
  state: AppWindowState;
  onClose: () => void;
  onFocus: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  zIndex: number;
}

export const Window = (props: WindowProps) => {
  const windowStyle = createMemo(() => {
    if (props.state === "maximized") {
      return {
        width: "100%",
        height: "100%",
        left: "0px",
        top: "0px",
        "z-index": props.zIndex,
        display: "flex",
        "border-width": "0px",
      };
    }

    return {
      width: `${props.bounds.width}px`,
      height: `${props.bounds.height}px`,
      left: `${props.bounds.x}px`,
      top: `${props.bounds.y}px`,
      "z-index": props.zIndex,
      display: props.state === "minimized" ? "none" : "flex",
    };
  });

  let rootEl: HTMLDivElement | undefined;

  const [isDragging, setIsDragging] = createSignal(false);
  let dragStartX = 0;
  let dragStartY = 0;
  let originX = props.bounds.x;
  let originY = props.bounds.y;
  let capturedTarget: Element | null = null;
  let capturedPointerId = 0;

  // track apakah pointer sempat bergerak — untuk bedain drag vs click
  let hasMoved = false;

  function onPointerMove(e: PointerEvent) {
    if (!isDragging()) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;

    // tandai sudah bergerak kalau delta cukup besar
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved = true;

    if (rootEl) {
      rootEl.style.transform = `translate(${dx}px, ${dy}px)`;
    }
  }

  function endDrag() {
    setIsDragging(false);
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", endDrag);

    if (rootEl) {
      const style = rootEl.style.transform || "";
      const m = /translate\(([-0-9.]+)px,\s*([-0-9.]+)px\)/.exec(style);
      const dx = m ? Number(m[1]) : 0;
      const dy = m ? Number(m[2]) : 0;
      const finalX = Math.round(originX + dx);
      const finalY = Math.round(originY + dy);
      rootEl.style.transform = "";

      // hanya commit kalau memang ada gerakan
      if (hasMoved) {
        updateWindowBounds(props.pid, { x: finalX, y: finalY });
      }
    }

    try {
      if (capturedTarget && capturedPointerId)
        (capturedTarget as any).releasePointerCapture(capturedPointerId);
    } catch { }

    capturedTarget = null;
    capturedPointerId = 0;
  }

  function startDrag(e: PointerEvent) {
    if ((e as any).button !== undefined && (e as any).button !== 0) return;
    try {
      const t = e.target as Element;
      if (t && typeof t.closest === "function" && t.closest("[data-no-drag]"))
        return;
    } catch { }

    e.preventDefault();
    e.stopPropagation();
    hasMoved = false; // reset setiap drag baru

    setIsDragging(true);
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    originX = props.bounds.x;
    originY = props.bounds.y;

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", endDrag);

    if (rootEl) {
      rootEl.style.transition = "none";
      rootEl.style.transform = "";
    }

    try {
      const target = e.target as Element & {
        setPointerCapture?: (id: number) => void;
      };
      if (target && typeof target.setPointerCapture === "function") {
        target.setPointerCapture(e.pointerId);
        capturedTarget = target as Element;
        capturedPointerId = e.pointerId;
      }
    } catch { }
  }

  // focus hanya fire kalau bukan dari area controls
  function handleRootPointerDown(e: PointerEvent) {
    const t = e.target as Element;
    if (t?.closest("[data-no-drag]")) return;
    props.onFocus();
  }

  onCleanup(() => {
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", endDrag);
  });

  return (
    <div
      ref={(el) => (rootEl = el as HTMLDivElement)}
      class="absolute flex flex-col bg-black border border-white overflow-hidden shadow-2xl pointer-events-auto"
      style={windowStyle()}
      onPointerDown={handleRootPointerDown}
    >
      {/* Title Bar */}
      <div
        class="flex items-center justify-between h-8 bg-white text-black px-2 cursor-move select-none shrink-0"
        onPointerDown={(e) => startDrag(e as PointerEvent)}
      >
        <div class="flex items-center gap-2 overflow-hidden">
          <Show when={props.icon}>
            <img src={props.icon} class="w-4 h-4 invert" />
          </Show>
          <span class="text-xs font-bold truncate uppercase tracking-tight">
            {props.title}
          </span>
        </div>

        <div
          class="flex items-center gap-1"
          data-no-drag
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              props.onMinimize();
            }}
            class="p-1 hover:bg-black/10 transition-colors"
            data-no-drag
          >
            <Minus size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              props.onMaximize();
            }}
            class="p-1 hover:bg-black/10 transition-colors"
            data-no-drag
          >
            <Square size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              props.onClose();
            }}
            class="p-1 hover:bg-red-500 hover:text-white transition-colors"
            data-no-drag
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div class="flex-1 overflow-auto relative">{props.children}</div>

      {/* Resize Handle */}
      <div class="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize" />
    </div>
  );
};

export default Window;
