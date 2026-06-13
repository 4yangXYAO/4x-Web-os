/**
 * NA.os Game Center
 *
 * Hub for mini games. Includes "Cyber Runner" and "Matrix Snake".
 * Built for performance and responsiveness.
 */

import { createSignal, onCleanup, onMount, Show, For } from "solid-js";

// ============================================================================
// GAME 01: CYBER RUNNER
// ============================================================================
const CyberRunner = () => {
  const [score, setScore] = createSignal(0);
  const [highScore, setHighScore] = createSignal<number>(
    Number(localStorage.getItem("cyberrunner:highscore") || 0)
  );
  const [isGameOver, setIsGameOver] = createSignal(false);
  const [isPlaying, setIsPlaying] = createSignal(false);
  const [playerY, setPlayerY] = createSignal(0);
  const [isJumping, setIsJumping] = createSignal(false);
  const [obstacles, setObstacles] = createSignal<{ x: number; id: number }[]>([]);

  let gameLoop: number | undefined;
  let obstacleTimer: number | undefined;
  let speedMultiplier = 1;
  let obstacleIdCounter = 1;

  const PLAYER_LEFT = 40;
  const PLAYER_WIDTH = 24;
  const OBSTACLE_WIDTH = 16;
  const OBSTACLE_HEIGHT = 32;

  const jump = () => {
    if (isJumping() || isGameOver() || !isPlaying()) return;
    setIsJumping(true);
    let height = 0;
    let velocity = 12;
    const gravity = 0.8;

    const jumpInterval = setInterval(() => {
      height += velocity;
      velocity -= gravity;
      
      if (height <= 0) {
        height = 0;
        setIsJumping(false);
        clearInterval(jumpInterval);
      }
      setPlayerY(height);
    }, 20);
  };

  const start = () => {
    setScore(0);
    setIsGameOver(false);
    setIsPlaying(true);
    setObstacles([]);
    setPlayerY(0);
    setIsJumping(false);
    speedMultiplier = 1;

    if (gameLoop) clearInterval(gameLoop);
    if (obstacleTimer) clearInterval(obstacleTimer);

    gameLoop = window.setInterval(() => {
      speedMultiplier += 0.0005;
      setObstacles((prev) => {
        const next = prev.map((o) => ({ ...o, x: o.x - (6 * speedMultiplier) }))
                         .filter((o) => o.x > -50);

        const collision = next.some((o) => {
          const horizontal = o.x < PLAYER_LEFT + PLAYER_WIDTH && o.x + OBSTACLE_WIDTH > PLAYER_LEFT;
          const vertical = playerY() < OBSTACLE_HEIGHT - 5;
          return horizontal && vertical;
        });

        if (collision) {
          endGame();
        }
        return next;
      });
      setScore((s) => s + 1);
    }, 20);

    const spawnObstacle = () => {
      if (!isPlaying()) return;
      setObstacles((prev) => [...prev, { x: 500, id: obstacleIdCounter++ }]);
      obstacleTimer = window.setTimeout(spawnObstacle, Math.max(800, 1500 / speedMultiplier));
    };
    spawnObstacle();
  };

  const endGame = () => {
    setIsGameOver(true);
    setIsPlaying(false);
    if (gameLoop) clearInterval(gameLoop);
    if (obstacleTimer) clearTimeout(obstacleTimer);
    
    const current = Math.floor(score() / 10);
    if (current > highScore()) {
      localStorage.setItem("cyberrunner:highscore", String(current));
      setHighScore(current);
    }
  };

  onCleanup(() => {
    if (gameLoop) clearInterval(gameLoop);
    if (obstacleTimer) clearTimeout(obstacleTimer);
  });

  return (
    <div 
      class="w-full h-48 bg-[#050505] border border-white/10 relative overflow-hidden cursor-pointer group"
      onClick={() => isPlaying() ? jump() : start()}
    >
      <Show when={isPlaying()}>
        <div class="absolute top-2 left-4 text-[10px] font-bold text-white/40">HI: {highScore()}</div>
        <div class="absolute top-2 right-4 text-xs font-black">SCORE: {Math.floor(score() / 10)}</div>
        <div class="absolute left-10 w-6 h-6 bg-white shadow-[0_0_15px_#fff]" style={{ bottom: `${playerY()}px` }} />
        <For each={obstacles()}>
          {(o) => <div class="absolute h-8 w-4 bg-red-600 shadow-[0_0_10px_#f00]" style={{ left: `${o.x}px`, bottom: "0px" }} />}
        </For>
        <div class="absolute bottom-0 w-full h-[1px] bg-white/20" />
      </Show>

      <Show when={!isPlaying()}>
        <div class="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
          <div class="text-xs font-black tracking-[0.2em] mb-4 text-white/50">{isGameOver() ? 'SYSTEM FAILURE' : 'READY TO RUN?'}</div>
          <Show when={isGameOver()}>
             <div class="text-3xl font-black mb-6 italic">SCORE: {Math.floor(score() / 10)}</div>
          </Show>
          <button class="px-8 py-2 border-2 border-white font-black text-xs hover:bg-white hover:text-black transition-all">
            {isGameOver() ? 'REBOOT' : 'INITIALIZE'}
          </button>
        </div>
      </Show>
    </div>
  );
};

// ============================================================================
// GAME 02: MATRIX SNAKE
// ============================================================================
const MatrixSnake = () => {
    const [isPlaying, setIsPlaying] = createSignal(false);
    const [score, setScore] = createSignal(0);
    const [snake, setSnake] = createSignal<{x: number, y: number}[]>([{x: 5, y: 5}]);
    const [food, setFood] = createSignal({x: 10, y: 10});
    const [dir, setDir] = createSignal({x: 1, y: 0});
    
    const GRID_SIZE = 20;
    let timer: number | undefined;

    const start = () => {
        setIsPlaying(true);
        setScore(0);
        setSnake([{x: 10, y: 10}, {x: 9, y: 10}]);
        setDir({x: 1, y: 0});
        spawnFood();
        if(timer) clearInterval(timer);
        timer = window.setInterval(move, 100);
    };

    const spawnFood = () => {
        setFood({
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
        });
    };

    const move = () => {
        setSnake(prev => {
            const head = { x: prev[0].x + dir().x, y: prev[0].y + dir().y };
            
            // Wall Collision
            if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
                endGame();
                return prev;
            }
            
            // Self Collision
            if (prev.some(s => s.x === head.x && s.y === head.y)) {
                endGame();
                return prev;
            }

            const next = [head, ...prev];
            
            if (head.x === food().x && head.y === food().y) {
                setScore(s => s + 10);
                spawnFood();
            } else {
                next.pop();
            }
            return next;
        });
    };

    const endGame = () => {
        setIsPlaying(false);
        if(timer) clearInterval(timer);
    };

    const handleKey = (e: KeyboardEvent) => {
        if (!isPlaying()) return;
        if (e.key === 'ArrowUp' && dir().y === 0) setDir({x: 0, y: -1});
        if (e.key === 'ArrowDown' && dir().y === 0) setDir({x: 0, y: 1});
        if (e.key === 'ArrowLeft' && dir().x === 0) setDir({x: -1, y: 0});
        if (e.key === 'ArrowRight' && dir().x === 0) setDir({x: 1, y: 0});
    };

    onMount(() => window.addEventListener('keydown', handleKey));
    onCleanup(() => window.removeEventListener('keydown', handleKey));

    return (
        <div class="relative w-full h-48 bg-[#050505] border border-white/10 flex items-center justify-center overflow-hidden">
             <Show when={isPlaying()} fallback={
                 <div class="flex flex-col items-center">
                    <div class="text-[10px] font-bold text-white/30 uppercase mb-4 tracking-[0.3em]">Neural Link Offline</div>
                    <button onClick={start} class="border border-white px-6 py-1 text-[10px] font-bold hover:bg-white hover:text-black">CONNECT</button>
                 </div>
             }>
                <div class="absolute top-2 right-4 text-[10px] font-bold">NODE_SCORE: {score()}</div>
                <div 
                    class="grid bg-black/50 border border-white/5" 
                    style={{ 
                        'grid-template-columns': `repeat(${GRID_SIZE}, 1fr)`,
                        'width': '180px',
                        'height': '180px'
                    }}
                >
                    <For each={Array.from({length: GRID_SIZE * GRID_SIZE})}>
                        {(_, i) => {
                            const x = i() % GRID_SIZE;
                            const y = Math.floor(i() / GRID_SIZE);
                            const isSnake = snake().some(s => s.x === x && s.y === y);
                            const isHead = snake()[0].x === x && snake()[0].y === y;
                            const isFood = food().x === x && food().y === y;
                            
                            return (
                                <div class={`w-full h-full border-[0.5px] border-white/5
                                    ${isHead ? 'bg-white scale-110 z-10' : ''}
                                    ${isSnake && !isHead ? 'bg-white/40' : ''}
                                    ${isFood ? 'bg-green-500 animate-pulse' : ''}
                                `} />
                            );
                        }}
                    </For>
                </div>
             </Show>
        </div>
    );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export const GamesApp = () => {
  return (
    <div class="flex flex-col h-full bg-black text-white font-mono overflow-auto p-4 md:p-8">
      <div class="flex flex-col mb-10">
        <h1 class="text-4xl font-black italic tracking-tighter uppercase leading-none">
          NEO <span class="text-[#00ff00]">ARCADE</span>
        </h1>
        <div class="flex items-center gap-2 mt-2">
            <span class="h-px bg-white/20 flex-1" />
            <span class="text-[9px] font-bold uppercase tracking-[0.4em] text-white/40">Powered By 4yangXYAO</span>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Game 1 */}
        <div class="flex flex-col gap-3">
          <div class="flex items-center justify-between">
             <div class="text-[10px] font-black uppercase text-white/40">Project: RUNNER_V1</div>
             <div class="text-[9px] px-1 bg-white text-black font-bold">ACTIVE</div>
          </div>
          <CyberRunner />
          <p class="text-[10px] leading-relaxed text-white/50 h-8">
            QUANTUM DATA STREAM. AVOID SECURITY OBSTACLES. PRESS SPACE OR TAP TO JUMP.
          </p>
        </div>

        {/* Game 2 */}
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <div class="text-[10px] font-black uppercase text-white/40">Project: MATRIX_SNAKE</div>
                <div class="text-[9px] px-1 bg-white text-black font-bold">ACTIVE</div>
            </div>
          <MatrixSnake />
          <p class="text-[10px] leading-relaxed text-white/50 h-8">
            COLLECT DATA BITS TO GROW. DO NOT HIT THE BOUNDARY WALLS. ARROW KEYS TO NAVIGATE.
          </p>
        </div>
      </div>

      {/* Footer Branding */}
      <div class="mt-auto border-t border-white/10 pt-4 flex justify-between items-center opacity-30">
          <span class="text-[9px] font-bold uppercase">Firmware version 4.0.0-XYAO</span>
          <span class="text-[9px] font-black italic tracking-widest text-[#00ff00]">NA.os</span>
      </div>
    </div>
  );
};

export default GamesApp;
