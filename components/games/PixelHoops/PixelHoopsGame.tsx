"use client";

import { useCallback, useRef, useEffect } from "react";
import { PhaserGame, PhaserGameRef } from "./components/PhaserGame";
import GameOverModal from "./components/GameOverModal";
import { useGameState } from "./useGameState";
import { getStoredPlayer } from "@/components/PlayerSelect";
import { GAME_NAME, EVENTS } from "./types";
import { EventBus } from "./game/EventBus";

interface PixelHoopsGameProps {
  onScoreSubmit?: (score: number) => void;
}

export default function PixelHoopsGame({ onScoreSubmit }: PixelHoopsGameProps) {
  const gameRef = useRef<PhaserGameRef>(null);
  const hasSubmittedRef = useRef(false);
  const { gameState, isGameOver, resetGame } = useGameState();

  // Handle score submission
  const submitScore = useCallback(
    async (score: number) => {
      if (hasSubmittedRef.current) return;
      hasSubmittedRef.current = true;

      const player = getStoredPlayer();
      if (!player) {
        hasSubmittedRef.current = false;
        return;
      }

      try {
        await fetch("/api/scores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ game: GAME_NAME, player, score }),
        });
        onScoreSubmit?.(score);
      } catch (error) {
        console.error("Failed to submit score:", error);
      }
    },
    [onScoreSubmit]
  );

  // Submit score when game ends
  useEffect(() => {
    if (isGameOver && !hasSubmittedRef.current && gameState.score > 0) {
      submitScore(gameState.score);
    }
  }, [isGameOver, gameState.score, submitScore]);

  const handlePlayAgain = useCallback(() => {
    hasSubmittedRef.current = false;
    resetGame();

    // Restart the game scene
    if (gameRef.current?.game) {
      const scene = gameRef.current.game.scene.getScene("GameScene");
      if (scene) {
        scene.scene.restart();
      }
    }

    // Trigger game start after scene restarts
    setTimeout(() => {
      EventBus.emit(EVENTS.GAME_START);
    }, 600);
  }, [resetGame]);

  return (
    <div className="pixel-hoops-game relative">
      <PhaserGame ref={gameRef} className="mx-auto pixel-border" />

      {isGameOver && (
        <GameOverModal
          score={gameState.score}
          shotsMade={gameState.shotsMade}
          shotsMissed={gameState.shotsMissed}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  );
}
