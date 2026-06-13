/**
 * NA.os Drawing Tool
 * 
 * Simple canvas-based paint program.
 */

import { createSignal, onMount } from 'solid-js';

export const DrawApp = () => {
  let canvas: HTMLCanvasElement | undefined;
  const [color, setColor] = createSignal('#00ff00');
  const [isDrawing, setIsDrawing] = createSignal(false);

  onMount(() => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  });

  const startDrawing = (e: MouseEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.beginPath();
    }
  };

  const draw = (e: MouseEvent) => {
    if (!isDrawing() || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = color();

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clear = () => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  return (
    <div class="flex flex-col h-full bg-[#111] text-white">
      {/* Toolbar */}
      <div class="h-10 border-b border-white/10 flex items-center px-2 gap-4 bg-black/50">
        <div class="flex gap-1">
          {['#ffffff', '#00ff00', '#ff00ff', '#00ffff', '#ffff00', '#ff0000'].map(c => (
            <button 
              class={`w-6 h-6 border-2 ${color() === c ? 'border-white' : 'border-transparent'}`}
              style={{ 'background-color': c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
        <button onClick={clear} class="px-3 py-1 bg-white/10 hover:bg-white/20 text-[10px] font-bold uppercase tracking-widest border border-white/20">
          Reset
        </button>
      </div>

      {/* Canvas */}
      <div class="flex-1 relative overflow-hidden bg-black p-4 flex items-center justify-center">
        <canvas
          ref={canvas}
          width={800}
          height={600}
          class="border border-white/20 cursor-crosshair shadow-[0_0_20px_rgba(0,255,0,0.1)]"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>
    </div>
  );
};

export default DrawApp;
