"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useGameLoop } from "./useGameLoop";
import { useKeyboardControls, useEnterKey } from "./useKeyboardControls";
import {
  updatePhysics,
  checkLanding,
  checkSatelliteCollision,
  updateSatellites,
  spawnSatellite,
  calculateScore,
} from "./gamePhysics";
import { renderGame, calculateCameraY } from "./gameRenderer";
import {
  GameState,
  RocketState,
  Satellite,
  INITIAL_ROCKET_STATE,
  PHYSICS,
} from "./types";
import { getStoredPlayer } from "@/components/PlayerSelect";

const GAME_NAME = "rocketLanding";
const SEPARATION_DURATION = 60;
const MIN_SEPARATION_ALTITUDE = -200; // Minimum altitude to allow separation

interface RocketLandingGameProps {
  onScoreSubmit?: (score: number) => void;
}

export default function RocketLandingGame({ onScoreSubmit }: RocketLandingGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>("idle");
  const [countdown, setCountdown] = useState(3);
  const [score, setScore] = useState<number | null>(null);
  const [crashReason, setCrashReason] = useState<string | null>(null);

  // Use refs for frequently updated values to reduce re-renders
  const rocketRef = useRef<RocketState>(INITIAL_ROCKET_STATE);
  const cameraYRef = useRef(0);
  const satellitesRef = useRef<Satellite[]>([]);
  const separationTimerRef = useRef(0);
  const canSeparateRef = useRef(false);

  const controls = useKeyboardControls();
  const controlsRef = useRef(controls);
  controlsRef.current = controls;

  // Submit score to API
  const submitScore = useCallback(async (finalScore: number) => {
    const player = getStoredPlayer();
    if (!player) return;

    try {
      await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game: GAME_NAME,
          player,
          score: finalScore,
        }),
      });
      onScoreSubmit?.(finalScore);
    } catch (error) {
      console.error("Failed to submit score:", error);
    }
  }, [onScoreSubmit]);

  // Reset game state
  const resetGame = useCallback(() => {
    rocketRef.current = { ...INITIAL_ROCKET_STATE };
    // Set camera to match rocket's starting position
    cameraYRef.current = INITIAL_ROCKET_STATE.y;
    satellitesRef.current = [];
    separationTimerRef.current = 0;
    canSeparateRef.current = false;
    hasLaunchedRef.current = false;
    setScore(null);
    setCrashReason(null);
  }, []);

  // Track if player has started thrusting (to prevent falling before launch)
  const hasLaunchedRef = useRef(false);

  // Start game
  const startGame = useCallback(() => {
    if (gameState !== "idle" && gameState !== "success" && gameState !== "crash") {
      return;
    }

    resetGame();
    setGameState("countdown");
    setCountdown(3);

    // Countdown timer
    let count = 3;
    const interval = setInterval(() => {
      count--;
      setCountdown(count);

      if (count <= 0) {
        clearInterval(interval);
        // After countdown, go to launching state - player controls thrust
        setGameState("launching");
      }
    }, 800);
  }, [gameState, resetGame]);

  // Handle Enter key
  useEnterKey(startGame, gameState === "idle" || gameState === "success" || gameState === "crash");

  // Game loop - using refs to avoid re-render on every frame
  const gameLoop = useCallback(
    (deltaTime: number) => {
      const currentGameState = gameState;

      // Only run physics during active game states
      if (!["launching", "ascending", "separation", "descending", "landing"].includes(currentGameState)) {
        return;
      }

      const rocket = rocketRef.current;
      const controls = controlsRef.current;
      const canvas = canvasRef.current;

      // Track if player has started thrusting
      if (controls.thrust && !hasLaunchedRef.current) {
        hasLaunchedRef.current = true;
      }

      // In launching state, don't apply physics until player thrusts
      // This keeps the rocket on the pad until they press thrust
      if (currentGameState === "launching" && !hasLaunchedRef.current) {
        // Just update camera, don't apply physics
        const height = canvas?.height || 400;
        cameraYRef.current = calculateCameraY(rocket.y, cameraYRef.current, height);
        return;
      }

      // Update physics - player controls thrust manually
      const newRocket = updatePhysics(rocket, controls, deltaTime, false);

      // Update camera to follow rocket
      const height = canvas?.height || 400;
      cameraYRef.current = calculateCameraY(newRocket.y, cameraYRef.current, height);

      // Transition from launching to ascending once rocket starts moving up
      if (currentGameState === "launching" && newRocket.y < INITIAL_ROCKET_STATE.y - 10) {
        setGameState("ascending");
      }

      // Check if separation is possible (above minimum altitude)
      canSeparateRef.current = !newRocket.hasSeparated && newRocket.y <= MIN_SEPARATION_ALTITUDE;

      // Manual separation when player presses S
      if (
        canSeparateRef.current &&
        controls.separate &&
        currentGameState !== "separation"
      ) {
        setGameState("separation");
        separationTimerRef.current = 0;
      }

      // Handle separation animation
      if (currentGameState === "separation") {
        separationTimerRef.current += deltaTime;
        if (separationTimerRef.current >= SEPARATION_DURATION) {
          // Separation complete
          newRocket.hasSeparated = true;
          setGameState("descending");
        }
      }

      // Spawn satellites (only when high enough and not too many)
      if (
        (currentGameState === "descending" || currentGameState === "ascending") &&
        satellitesRef.current.length < 8
      ) {
        const newSatellite = spawnSatellite(newRocket.y);
        if (newSatellite) {
          satellitesRef.current = [...satellitesRef.current, newSatellite];
        }
      }

      // Update satellites
      satellitesRef.current = updateSatellites(satellitesRef.current, deltaTime);

      // Check satellite collision (only after separation)
      if (newRocket.hasSeparated && checkSatelliteCollision(newRocket, satellitesRef.current)) {
        setCrashReason("HIT SATELLITE");
        setGameState("crash");
        rocketRef.current = newRocket;
        return;
      }

      // Transition to landing phase when getting close to ground
      if (newRocket.hasSeparated && newRocket.y > -50 && currentGameState === "descending") {
        setGameState("landing");
      }

      // Check for landing
      const isDescending = currentGameState === "descending" || currentGameState === "landing";
      const landingResult = checkLanding(newRocket, isDescending);

      if (landingResult !== null) {
        if (landingResult.success) {
          const finalScore = calculateScore(newRocket);
          setScore(finalScore);
          setGameState("success");
          submitScore(finalScore);
        } else {
          setCrashReason(landingResult.reason || "CRASHED");
          setGameState("crash");
        }
        // Stop rocket at ground
        newRocket.y = PHYSICS.GROUND_Y - 5;
        newRocket.vy = 0;
        newRocket.vx = 0;
      }

      rocketRef.current = newRocket;
    },
    [gameState, submitScore]
  );

  const isGameActive = ["launching", "ascending", "separation", "descending", "landing"].includes(gameState);
  useGameLoop(gameLoop, isGameActive);

  // Render loop - separate from game loop for smoother rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const updateSize = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);

    // Render
    let frameId: number;
    const render = () => {
      renderGame(
        ctx,
        rocketRef.current,
        gameState,
        countdown,
        score,
        crashReason,
        cameraYRef.current,
        satellitesRef.current,
        separationTimerRef.current,
        canSeparateRef.current
      );
      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", updateSize);
      cancelAnimationFrame(frameId);
    };
  }, [gameState, countdown, score, crashReason]);

  return (
    <div className="w-full aspect-video bg-white pixel-border relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        tabIndex={0}
      />
    </div>
  );
}
