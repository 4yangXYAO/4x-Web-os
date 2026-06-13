/**
 * NA.os Drawing Tool
 * 
 * Fully functional canvas-based paint program with touch support and export.
 */

import { createSignal, onMount, For } from 'solid-js';
import { Trash2, Download, Square, Circle } from 'lucide-solid';

export const DrawApp = () => {
  let canvas: HTMLCanvasElement | undefined;
  let container: HTMLDivElement | undefined;
  
  const [color, setColor] = createSignal('#00ff00');
  const [brushSize, setBrushSize] = createSignal(4);
  const [isDrawing, setIsDrawing] = createSignal(false);
  const [eraser, setEraser] = createSignal(false);

  onMount(() => {
    if (!canvas || !container) return;
    
    // Fit canvas to container size
    const resizeCanvas = () => {
      if (!canvas || !container) return;
      // Save current content
      const temp = canvas.toDataURL();
      const img = new Image();
      img.src = temp;
      
      canvas.width = container.clientWidth - 40;
      canvas.height = container.clientHeight - 40;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        img.onload = () => ctx.drawImage(img, 0, 0);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Initial fill
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  });

  const getPointerPos = (e: MouseEvent | TouchEvent) => {
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: MouseEvent | TouchEvent) => {
    setIsDrawing(true);
    const pos = getPointerPos(e);
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  };

  const draw = (e: MouseEvent | TouchEvent) => {
    if (!isDrawing() || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getPointerPos(e);
    
    ctx.lineWidth = brushSize();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = eraser() ? '#000000' : color();

    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clear = () => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  const save = () => {
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `na-os-draw-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const colors = ['#ffffff', '#00ff00', '#0099ff', '#ff00ff', '#ffff00', '#ff0000', '#ff8800', '#888888'];

  return (
    <div class="flex flex-col h-full bg-[#0a0a0a] text-white font-mono overflow-hidden">
      {/* Control Bar */}
      <div class="h-12 border-b border-white/20 flex items-center px-4 gap-6 bg-black shrink-0 overflow-x-auto no-scrollbar">
        {/* Colors */}
        <div class="flex gap-2">
          <For each={colors}>
            {(c) => (
              <button 
                class={`w-6 h-6 border transition-all ${color() === c && !eraser() ? 'scale-110 border-white ring-2 ring-white/20' : 'border-transparent'}`}
                style={{ 'background-color': c }}
                onClick={() => { setColor(c); setEraser(false); }}
              />
            )}
          </For>
        </div>

        <div class="w-px h-6 bg-white/10" />

        {/* Tools */}
        <div class="flex gap-2 items-center">
            <button 
                disabled={eraser()}
                onClick={() => setEraser(true)}
                class={`p-2 border transition-colors ${eraser() ? 'bg-white text-black border-white' : 'border-white/20 hover:border-white'}`}
                title="Eraser"
            >
                <Square size={14} />
            </button>
            <button 
                onClick={() => setEraser(false)}
                class={`p-2 border transition-colors ${!eraser() ? 'bg-white text-black border-white' : 'border-white/20 hover:border-white'}`}
                title="Brush"
            >
                <Circle size={14} fill={color()} />
            </button>
        </div>

        {/* Brush Size */}
        <div class="flex items-center gap-3">
          <span class="text-[9px] uppercase tracking-tighter opacity-50 font-bold">Size</span>
          <input 
            type="range" min="1" max="50" value={brushSize()} 
            onInput={(e) => setBrushSize(parseInt(e.currentTarget.value))}
            class="accent-white w-24 h-1"
          />
          <span class="text-[10px] w-4 font-bold">{brushSize()}</span>
        </div>

        <div class="flex-1" />

        {/* Actions */}
        <div class="flex gap-2">
          <button onClick={save} class="p-2 border border-white/20 hover:bg-white hover:text-black transition-all flex items-center gap-2">
            <Download size={14} />
            <span class="text-[9px] font-black uppercase">Export</span>
          </button>
          <button onClick={clear} class="p-2 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white transition-all">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div ref={container} class="flex-1 relative bg-[#050505] overflow-hidden flex items-center justify-center p-4">
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
        />
      </div>
    </div>
  );
};

export default DrawApp;
