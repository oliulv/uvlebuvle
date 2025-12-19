"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useGameLoop } from "./useGameLoop";
import { useKeyboardControls, useEnterKey } from "./useKeyboardControls";
import { updatePhysics, checkLanding, calculateScore } from "./gamePhysics";
import { renderGame } from "./gameRenderer";
import {
  GameState,
  RocketState,
  INITIAL_ROCKET_STATE,
  LAUNCH_STATE,
} from "./types";
import { getStoredPlayer } from "@/components/PlayerSelect";

const GAME_NAME = "rocketLanding";

interface RocketLandingGameProps {
  onScoreSubmit?: (score: number) => void;
}

export default function RocketLandingGame({ onScoreSubmit }: RocketLandingGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>("idle");
  const [rocket, setRocket] = useState<RocketState>(INITIAL_ROCKET_STATE);
  const [countdown, setCountdown] = useState(3);
  const [score, setScore] = useState<number | null>(null);
  const [crashReason, setCrashReason] = useState<string | null>(null);

  const controls = useKeyboardControls();

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

  // Start game
  const startGame = useCallback(() => {
    if (gameState !== "idle" && gameState !== "success" && gameState !== "crash") {
      return;
    }

    setGameState("countdown");
    setCountdown(3);
    setScore(null);
    setCrashReason(null);

    // Countdown timer
    let count = 3;
    const interval = setInterval(() => {
      count--;
      setCountdown(count);

      if (count <= 0) {
        clearInterval(interval);
        // Start flying - rocket appears at top with random velocity
        setRocket({
          ...LAUNCH_STATE,
          x: 30 + Math.random() * 40, // Random x position between 30-70
          vx: (Math.random() - 0.5) * 2,
          angle: (Math.random() - 0.5) * 20,
        });
        setGameState("flying");
      }
    }, 800);
  }, [gameState]);

  // Handle Enter key
  useEnterKey(startGame, gameState === "idle" || gameState === "success" || gameState === "crash");

  // Game loop
  const gameLoop = useCallback(
    (deltaTime: number) => {
      if (gameState !== "flying") return;

      // Update physics
      const newRocket = updatePhysics(rocket, controls, deltaTime);

      // Check for landing
      const landingResult = checkLanding(newRocket);

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
        setRocket({
          ...newRocket,
          y: 85,
          vy: 0,
          vx: 0,
        });
      } else {
        setRocket(newRocket);
      }
    },
    [gameState, rocket, controls, submitScore]
  );

  useGameLoop(gameLoop, gameState === "flying");

  // Render loop
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
    const render = () => {
      renderGame(ctx, rocket, gameState, countdown, score, crashReason);
      requestAnimationFrame(render);
    };

    const frameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", updateSize);
      cancelAnimationFrame(frameId);
    };
  }, [rocket, gameState, countdown, score, crashReason]);

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
