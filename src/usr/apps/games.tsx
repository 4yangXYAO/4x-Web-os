/**
 * WEB.OS Game Center
 *
 * Hub for mini games. Includes "Cyber Runner" (Dino clone variant).
 */

import { createSignal, onCleanup, onMount, Show, For } from "solid-js";

const CyberRunner = () => {
  const [score, setScore] = createSignal(0);
  const [highScore, setHighScore] = createSignal<number>(() =>
    Number(localStorage.getItem("cyberrunner:highscore") || 0),
  );
  const [isGameOver, setIsGameOver] = createSignal(false);
  const [playerY, setPlayerY] = createSignal(0);
  const [isJumping, setIsJumping] = createSignal(false);
  const [obstacles, setObstacles] = createSignal<{ x: number; id: number }[]>(
    [],
  );

  // Game loop handles
  let gameLoop: number | undefined;
  let obstacleTimer: number | undefined;
  let obstacleIdCounter = 1;

  // Layout constants (Tailwind sizes -> pixels)
  const PLAYER_LEFT = 40; // left-10 = 2.5rem = 40px
  const PLAYER_WIDTH = 24; // w-6 = 1.5rem = 24px
  const PLAYER_HEIGHT = 24; // h-6
  const OBSTACLE_WIDTH = 16; // w-4 = 1rem = 16px
  const OBSTACLE_HEIGHT = 32; // h-8 = 2rem = 32px
  const GAME_TICK_MS = 20;

  const jump = () => {
    if (isJumping() || isGameOver()) return;
    setIsJumping(true);
    let up = true;
    let height = 0;

    const jumpInterval = setInterval(() => {
      if (up) {
        height += 5;
        if (height >= 80) up = false;
      } else {
        height -= 5;
        if (height <= 0) {
          height = 0;
          setIsJumping(false);
          clearInterval(jumpInterval);
        }
      }
      setPlayerY(height);
    }, 20);
  };

  const start = () => {
    // reset state
    setScore(0);
    setIsGameOver(false);
    setObstacles([]);
    setPlayerY(0);
    setIsJumping(false);

    // clear existing timers if any
    if (gameLoop) clearInterval(gameLoop);
    if (obstacleTimer) clearInterval(obstacleTimer);

    // Main tick
    gameLoop = window.setInterval(() => {
      setObstacles((prev) => {
        const next = prev
          .map((o) => ({ ...o, x: o.x - 5 }))
          .filter((o) => o.x > -OBSTACLE_WIDTH - 10);

        // Collision check (rectangle overlap)
        const collision = next.some((o) => {
          const ox = o.x;
          const ox2 = ox + OBSTACLE_WIDTH;
          const pLeft = PLAYER_LEFT;
          const pRight = PLAYER_LEFT + PLAYER_WIDTH;
          const horizontalOverlap = ox < pRight && ox2 > pLeft;
          const verticalOverlap = playerY() < OBSTACLE_HEIGHT - 6; // allow small margin
          return horizontalOverlap && verticalOverlap;
        });

        if (collision) {
          setIsGameOver(true);
          if (gameLoop) clearInterval(gameLoop);
          if (obstacleTimer) clearInterval(obstacleTimer);
          // update high score
          setTimeout(() => {
            const current = score();
            if (current > highScore()) {
              localStorage.setItem("cyberrunner:highscore", String(current));
              setHighScore(current);
            }
          }, 0);
        }

        return next;
      });

      setScore((s) => s + 1);
    }, GAME_TICK_MS);

    // Obstacles spawn
    obstacleTimer = window.setInterval(() => {
      setObstacles((prev) => [...prev, { x: 400, id: obstacleIdCounter++ }]);
    }, 1500);
  };

  onCleanup(() => {
    if (gameLoop) clearInterval(gameLoop);
    if (obstacleTimer) clearInterval(obstacleTimer);
  });

  // Keyboard controls (space / arrow up) and Enter to restart
  const handleKey = (e: KeyboardEvent) => {
    if (e.code === "Space" || e.key === "ArrowUp") {
      e.preventDefault();
      jump();
    }

    if (e.key === "Enter" && isGameOver()) {
      start();
    }
  };

  onMount(() => {
    window.addEventListener("keydown", handleKey);
    onCleanup(() => window.removeEventListener("keydown", handleKey));
  });

  return (
    <div
      class="w-full h-48 bg-black border border-white/20 relative overflow-hidden cursor-pointer"
      onClick={jump}
    >
      <Show
        when={!isGameOver()}
        fallback={
          <div class="absolute inset-0 flex flex-col items-center justify-center bg-red-900/50">
            <div class="text-xl font-bold mb-2">WASTED</div>
            <button
              class="px-4 py-1 border border-white text-xs"
              onClick={start}
            >
              RETRY
            </button>
          </div>
        }
      >
        <div class="absolute top-2 right-2 text-xs opacity-50">
          SCORE: {Math.floor(score() / 10)}
        </div>

        {/* Player */}
        <div
          class="absolute left-10 w-6 h-6 bg-white shadow-[0_0_10px_#fff]"
          style={{ bottom: `${playerY()}px` }}
        />

        {/* Obstacles */}
        <For each={obstacles()}>
          {(o: { x: number; id: number }) => (
            <div
              class="absolute h-8 w-4 bg-red-500 shadow-[0_0_10px_#f00]"
              style={{ left: `${o.x}px`, bottom: "0px" }}
            />
          )}
        </For>

        <div class="absolute bottom-0 w-full h-[1px] bg-white opacity-20" />
      </Show>
    </div>
  );
};

export const GamesApp = () => {
  return (
    <div class="flex flex-col h-full bg-[#050505] p-6 text-white overflow-auto">
      <h1 class="text-2xl font-bold mb-6 tracking-tighter uppercase italic border-b border-white/10 pb-2">
        <span class="text-red-500">NEO</span> ARCADE
      </h1>

      <div class="grid grid-cols-1 gap-8">
        <section>
          <div class="flex items-center justify-between mb-2">
            <h2 class="text-xs font-bold uppercase tracking-widest text-white/50">
              01. Cyber Runner
            </h2>
            <span class="text-[10px] bg-green-500 text-black px-1 font-bold">
              COMPATIBLE
            </span>
          </div>
          <CyberRunner />
          <p class="mt-2 text-[10px] text-white/40 italic">
            TAP TO JUMP. AVOID RED SECURITY DATA BLOCKS.
          </p>
        </section>

        <section class="opacity-30 pointer-events-none">
          <h2 class="text-xs font-bold uppercase tracking-widest text-white/20">
            02. Grid Invaders
          </h2>
          <div class="h-32 border border-white/5 bg-white/5 flex items-center justify-center italic text-xs">
            ENCRYPTED - COMING SOON
          </div>
        </section>

        <section class="opacity-30 pointer-events-none">
          <h2 class="text-xs font-bold uppercase tracking-widest text-white/20">
            03. Matrix Snake
          </h2>
          <div class="h-32 border border-white/5 bg-white/5 flex items-center justify-center italic text-xs">
            ENCRYPTED - COMING SOON
          </div>
        </section>
      </div>
    </div>
  );
};

export default GamesApp;
