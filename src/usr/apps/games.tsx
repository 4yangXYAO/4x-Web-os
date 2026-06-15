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
  const PLAYER_LEFT = 40;
  const PLAYER_WIDTH = 24;
  const PLAYER_HEIGHT = 24;
  const OBSTACLE_WIDTH = 16;
  const OBSTACLE_HEIGHT = 32;
  const GROUND_Y = 0;

  const [score, setScore] = createSignal(0);
  const [highScore, setHighScore] = createSignal<number>(
    Number(localStorage.getItem("cyberrunner:highscore") || 0),
  );
  const [isGameOver, setIsGameOver] = createSignal(false);
  const [isPlaying, setIsPlaying] = createSignal(false);
  const [isPaused, setIsPaused] = createSignal(false);
  const [playerY, setPlayerY] = createSignal(GROUND_Y);
  const [isJumping, setIsJumping] = createSignal(false);
  const [obstacles, setObstacles] = createSignal<{ x: number; id: number }[]>(
    [],
  );

  let gameLoop: number | undefined;
  let obstacleTimer: number | undefined;
  let jumpInterval: number | undefined;
  let speedMultiplier = 1;
  let obstacleIdCounter = 1;

  // touch swipe tracking
  let touchStartY = 0;

  // ── jump ──────────────────────────────────────────────────────────────────
  const jump = () => {
    if (isJumping() || isGameOver() || !isPlaying() || isPaused()) return;
    setIsJumping(true);

    let height = 0;
    let velocity = 12;
    const gravity = 0.8;

    if (jumpInterval) clearInterval(jumpInterval);

    jumpInterval = window.setInterval(() => {
      height += velocity;
      velocity -= gravity;

      if (height <= GROUND_Y) {
        height = GROUND_Y;
        setIsJumping(false);
        clearInterval(jumpInterval);
      }
      setPlayerY(height);
    }, 20);
  };

  // ── pause ─────────────────────────────────────────────────────────────────
  const togglePause = () => {
    if (!isPlaying() || isGameOver()) return;
    setIsPaused((p) => !p);
  };

  // ── spawn obstacle ────────────────────────────────────────────────────────
  const scheduleObstacle = (playing: () => boolean) => {
    if (!playing()) return;
    setObstacles((prev) => [...prev, { x: 520, id: obstacleIdCounter++ }]);
    obstacleTimer = window.setTimeout(
      () => scheduleObstacle(playing),
      Math.max(800, 1500 / speedMultiplier),
    );
  };

  // ── start ─────────────────────────────────────────────────────────────────
  const start = () => {
    if (gameLoop) clearInterval(gameLoop);
    if (obstacleTimer) clearTimeout(obstacleTimer);
    if (jumpInterval) clearInterval(jumpInterval);

    setScore(0);
    setIsGameOver(false);
    setIsPaused(false);
    setObstacles([]);
    setPlayerY(GROUND_Y);
    setIsJumping(false);
    speedMultiplier = 1;
    obstacleIdCounter = 1;

    setIsPlaying(true);

    gameLoop = window.setInterval(() => {
      if (isPaused()) return;

      speedMultiplier += 0.0005;

      setObstacles((prev) => {
        const moved = prev
          .map((o) => ({ ...o, x: o.x - 6 * speedMultiplier }))
          .filter((o) => o.x > -50);

        const hit = moved.some((o) => {
          const overlapX =
            o.x < PLAYER_LEFT + PLAYER_WIDTH &&
            o.x + OBSTACLE_WIDTH > PLAYER_LEFT;
          const overlapY =
            playerY() + PLAYER_HEIGHT > 0 && playerY() < OBSTACLE_HEIGHT;
          return overlapX && overlapY;
        });

        if (hit) endGame();
        return moved;
      });

      setScore((s) => s + 1);
    }, 20);

    scheduleObstacle(isPlaying);
  };

  // ── end game ──────────────────────────────────────────────────────────────
  const endGame = () => {
    setIsGameOver(true);
    setIsPlaying(false);

    if (gameLoop) clearInterval(gameLoop);
    if (obstacleTimer) clearTimeout(obstacleTimer);
    if (jumpInterval) clearInterval(jumpInterval);

    const finalScore = Math.floor(score() / 10);
    if (finalScore > highScore()) {
      localStorage.setItem("cyberrunner:highscore", String(finalScore));
      setHighScore(finalScore);
    }
  };

  // ── keyboard (desktop) ────────────────────────────────────────────────────
  const handleKey = (e: KeyboardEvent) => {
    if (e.code === "Space") {
      e.preventDefault();
      if (!isPlaying()) start();
      else jump();
    }
    if (e.code === "KeyP" || e.code === "Escape") togglePause();
  };

  // ── touch handlers (mobile) ───────────────────────────────────────────────
  const handleTouchStart = (e: TouchEvent) => {
    touchStartY = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: TouchEvent) => {
    const deltaY = touchStartY - e.changedTouches[0].clientY;
    const isSwipeUp = deltaY > 30; // threshold 30px ke atas = swipe up

    if (!isPlaying()) {
      start();
      return;
    }

    // swipe up = jump, tap biasa juga jump
    if (isSwipeUp || Math.abs(deltaY) < 10) jump();
  };

  onMount(() => window.addEventListener("keydown", handleKey));
  onCleanup(() => {
    window.removeEventListener("keydown", handleKey);
    if (gameLoop) clearInterval(gameLoop);
    if (obstacleTimer) clearTimeout(obstacleTimer);
    if (jumpInterval) clearInterval(jumpInterval);
  });

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div
      class="w-full h-48 bg-[#050505] border border-white/10 relative overflow-hidden cursor-pointer select-none"
      onClick={() => {
        if (!isPlaying()) start();
        else jump();
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={(e) => {
        e.preventDefault(); // prevent onClick double-fire di mobile
        handleTouchEnd(e);
      }}
    >
      <Show when={isPlaying()}>
        {/* HUD */}
        <div class="absolute top-2 left-4 text-[10px] font-bold text-white/40">
          HI: {highScore()}
        </div>
        <div class="absolute top-2 right-14 text-xs font-black">
          SCORE: {Math.floor(score() / 10)}
        </div>

        {/* Tombol pause — visible di mobile maupun desktop */}
        <button
          class="absolute top-1 right-2 w-8 h-8 flex items-center justify-center text-white/40 hover:text-white text-xs font-black z-30 transition-colors"
          onClick={(e) => {
            e.stopPropagation(); // jangan trigger jump
            togglePause();
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            e.preventDefault();
            togglePause();
          }}
        >
          {isPaused() ? "▶" : "⏸"}
        </button>

        {/* Pause overlay */}
        <Show when={isPaused()}>
          <div class="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-20 gap-3">
            <span class="text-xs font-black tracking-[0.3em] text-white/60">
              PAUSED
            </span>
            <button
              class="px-6 py-1 border border-white text-[10px] font-black hover:bg-white hover:text-black transition-all"
              onClick={(e) => {
                e.stopPropagation();
                togglePause();
              }}
            >
              RESUME
            </button>
          </div>
        </Show>

        {/* Player */}
        <div
          class="absolute left-10 w-6 h-6 bg-white shadow-[0_0_15px_#fff]"
          style={{ bottom: `${playerY()}px` }}
        />

        {/* Obstacles */}
        <For each={obstacles()}>
          {(o) => (
            <div
              class="absolute h-8 w-4 bg-red-600 shadow-[0_0_10px_#f00]"
              style={{ left: `${o.x}px`, bottom: "0px" }}
            />
          )}
        </For>

        {/* Ground */}
        <div class="absolute bottom-0 w-full h-[1px] bg-white/20" />

        {/* Hint mobile — muncul 3 detik pertama */}
        <div class="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
          <span class="text-[8px] text-white/20 tracking-widest">
            TAP / SWIPE UP TO JUMP
          </span>
        </div>
      </Show>

      {/* Start / Game Over screen */}
      <Show when={!isPlaying()}>
        <div class="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
          <div class="text-xs font-black tracking-[0.2em] mb-4 text-white/50">
            {isGameOver() ? "SYSTEM FAILURE" : "READY TO RUN?"}
          </div>
          <Show when={isGameOver()}>
            <div class="text-3xl font-black mb-1 italic">
              SCORE: {Math.floor(score() / 10)}
            </div>
            <div class="text-[10px] text-white/40 mb-6">
              BEST: {highScore()}
            </div>
          </Show>

          {/* tambah onClick + onTouchEnd eksplisit di button */}
          <button
            class="px-8 py-2 border-2 border-white font-black text-xs hover:bg-white hover:text-black transition-all"
            onClick={(e) => {
              e.stopPropagation();
              start();
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              e.preventDefault();
              start();
            }}
          >
            {isGameOver() ? "REBOOT" : "INITIALIZE"}
          </button>

          <div class="text-[9px] text-white/30 mt-3 tracking-widest">
            SPACE / TAP / SWIPE UP
          </div>
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
          <span class="text-[9px] font-bold uppercase tracking-[0.4em] text-white/40">
            Powered By 4yangXYAO
          </span>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Game 1 */}
        <div class="flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <div class="text-[10px] font-black uppercase text-white/40">
              Project: RUNNER_V1
            </div>
            <div class="text-[9px] px-1 bg-white text-black font-bold">
              ACTIVE
            </div>
          </div>
          <CyberRunner />
          <p class="text-[10px] leading-relaxed text-white/50 h-8">
            QUANTUM DATA STREAM. AVOID SECURITY OBSTACLES. PRESS SPACE OR TAP TO
            JUMP.
          </p>
        </div>

        
      </div>

      {/* Footer Branding */}
      <div class="mt-auto border-t border-white/10 pt-4 flex justify-between items-center opacity-30">
        <span class="text-[9px] font-bold uppercase">
          Firmware version 4.0.0-XYAO
        </span>
        <span class="text-[9px] font-black italic tracking-widest text-[#00ff00]">
          NA.os
        </span>
      </div>
    </div>
  );
};

export default GamesApp;
