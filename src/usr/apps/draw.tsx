/**
 * NA.os Drawing Tool - Canvas Background Putih
 */

import { createSignal, onMount, onCleanup, For } from "solid-js";
import { Trash2, Download, Square, Circle } from "lucide-solid";

export const DrawApp = () => {
  let canvas: HTMLCanvasElement | undefined;
  let container: HTMLDivElement | undefined;

  const [color, setColor] = createSignal("#00ff00");
  const [brushSize, setBrushSize] = createSignal(4);
  const [isDrawing, setIsDrawing] = createSignal(false);
  const [eraser, setEraser] = createSignal(false);
  const [hasMoved, setHasMoved] = createSignal(false);

  const getCtx = () => canvas?.getContext("2d") ?? null;

  const resizeCanvasPreserve = () => {
    if (!canvas || !container) return;
    const oldCanvas = document.createElement("canvas");
    oldCanvas.width = canvas.width;
    oldCanvas.height = canvas.height;
    const oldCtx = oldCanvas.getContext("2d");
    if (oldCtx && canvas.width > 0 && canvas.height > 0) {
      oldCtx.drawImage(canvas, 0, 0);
    }
    let newWidth = container.clientWidth - 40;
    let newHeight = container.clientHeight - 40;
    if (newWidth <= 0) newWidth = 100;
    if (newHeight <= 0) newHeight = 100;
    canvas.width = newWidth;
    canvas.height = newHeight;
    const ctx = getCtx();
    if (!ctx) return;
    if (oldCanvas.width > 0 && oldCanvas.height > 0) {
      ctx.drawImage(oldCanvas, 0, 0, newWidth, newHeight);
    } else {
      // Isi putih untuk canvas baru
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, newWidth, newHeight);
    }
  };

  const getPointerPos = (e: MouseEvent | TouchEvent) => {
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX =
      "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY =
      "touches" in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let x = (clientX - rect.left) * scaleX;
    let y = (clientY - rect.top) * scaleY;
    x = Math.min(Math.max(0, x), canvas.width);
    y = Math.min(Math.max(0, y), canvas.height);
    return { x, y };
  };

  const drawDot = (x: number, y: number) => {
    const ctx = getCtx();
    if (!ctx) return;
    ctx.save();
    ctx.lineWidth = brushSize();
    ctx.lineCap = "round";
    ctx.strokeStyle = eraser() ? "#ffffff" : color();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.5, y + 0.5);
    ctx.stroke();
    ctx.restore();
  };

  const startDrawing = (e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDrawing(true);
    setHasMoved(false);
    const pos = getPointerPos(e);
    const ctx = getCtx();
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  };

  const draw = (e: MouseEvent | TouchEvent) => {
    if (!isDrawing()) return;
    e.preventDefault();
    e.stopPropagation();
    setHasMoved(true);
    const ctx = getCtx();
    if (!ctx) return;
    const pos = getPointerPos(e);
    ctx.lineWidth = brushSize();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = eraser() ? "#ffffff" : color();
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const stopDrawing = (e: MouseEvent | TouchEvent) => {
    if (!isDrawing()) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDrawing(false);
    if (!hasMoved()) {
      const pos = getPointerPos(e);
      drawDot(pos.x, pos.y);
    }
  };

  const clearCanvas = () => {
    const ctx = getCtx();
    if (ctx && canvas) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  const save = () => {
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `na-os-draw-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const colors = [
    "#ffffff",
    "#00ff00",
    "#0099ff",
    "#ff00ff",
    "#ffff00",
    "#ff0000",
    "#ff8800",
    "#888888",
  ];

  onMount(() => {
    resizeCanvasPreserve();
    const resizeObserver = new ResizeObserver(() => resizeCanvasPreserve());
    if (container) resizeObserver.observe(container);
    window.addEventListener("resize", resizeCanvasPreserve);
    onCleanup(() => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", resizeCanvasPreserve);
    });
  });

  return (
    <div class="flex flex-col h-full bg-[#0a0a0a] text-white font-mono overflow-hidden">
      <div class="h-12 border-b border-white/20 flex items-center px-4 gap-6 bg-black shrink-0 overflow-x-auto no-scrollbar">
        <div class="flex gap-2">
          <For each={colors}>
            {(c) => (
              <button
                class={`w-6 h-6 border transition-all ${color() === c && !eraser() ? "scale-110 border-white ring-2 ring-white/20" : "border-transparent"}`}
                style={{ "background-color": c }}
                onClick={() => {
                  setColor(c);
                  setEraser(false);
                }}
              />
            )}
          </For>
        </div>
        <div class="w-px h-6 bg-white/10" />
        <div class="flex gap-2 items-center">
          <button
            disabled={eraser()}
            onClick={() => setEraser(true)}
            class={`p-2 border transition-colors ${eraser() ? "bg-white text-black border-white" : "border-white/20 hover:border-white"}`}
            title="Eraser"
          >
            <Square size={14} />
          </button>
          <button
            onClick={() => setEraser(false)}
            class={`p-2 border transition-colors ${!eraser() ? "bg-white text-black border-white" : "border-white/20 hover:border-white"}`}
            title="Brush"
          >
            <Circle size={14} fill={color()} />
          </button>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-[9px] uppercase tracking-tighter opacity-50 font-bold">
            Size
          </span>
          <input
            type="range"
            min="1"
            max="50"
            value={brushSize()}
            onInput={(e) => setBrushSize(parseInt(e.currentTarget.value))}
            class="accent-white w-24 h-1"
          />
          <span class="text-[10px] w-4 font-bold">{brushSize()}</span>
        </div>
        <div class="flex-1" />
        <div class="flex gap-2">
          <button
            onClick={save}
            class="p-2 border border-white/20 hover:bg-white hover:text-black transition-all flex items-center gap-2"
          >
            <Download size={14} />
            <span class="text-[9px] font-black uppercase">Export</span>
          </button>
          <button
            onClick={clearCanvas}
            class="p-2 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white transition-all"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div
        ref={container}
        class="flex-1 relative bg-[#050505] overflow-hidden flex items-center justify-center p-4"
      >
        <canvas
          ref={canvas}
          class="cursor-crosshair shadow-[0_0_40px_rgba(0,0,0,0.5)] touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          onTouchCancel={stopDrawing}
        />
      </div>
    </div>
  );
};

export default DrawApp;
