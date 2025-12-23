"use client";

import { useCallback, useRef, useEffect } from "react";
import { getStoredPlayer } from "@/components/PlayerSelect";
import { useGameState } from "./useGameState";
import { CellValue } from "./types";
import GameBoard from "./components/GameBoard";
import NumberPad from "./components/NumberPad";
import ScoreDisplay from "./components/ScoreDisplay";
import GameControls from "./components/GameControls";
import WinModal from "./components/WinModal";

const GAME_NAME = "sudoku";

interface SudokuGameProps {
  onScoreSubmit?: (score: number) => void;
}

export default function SudokuGame({ onScoreSubmit }: SudokuGameProps) {
  const {
    gameState,
    newGame,
    selectCell,
    setValue,
    hint,
    undo,
    navigate,
    canUndo,
    getFinalScore,
  } = useGameState("easy");

  const hasSubmittedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
        hasSubmittedRef.current = false;
      }
    },
    [onScoreSubmit]
  );

  // Submit score when game is won
  useEffect(() => {
    if (gameState.gameWon && !hasSubmittedRef.current) {
      const score = getFinalScore();
      submitScore(score);
    }
  }, [gameState.gameWon, getFinalScore, submitScore]);

  // Reset submission flag on new game
  const handleNewGame = useCallback(
    (difficulty: typeof gameState.difficulty) => {
      hasSubmittedRef.current = false;
      newGame(difficulty);
    },
    [newGame]
  );

  // Keyboard input handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Number keys 1-9
      if (e.key >= "1" && e.key <= "9") {
        e.preventDefault();
        setValue(parseInt(e.key) as CellValue);
      }
      // Clear with backspace, delete, or 0
      else if (
        e.key === "Backspace" ||
        e.key === "Delete" ||
        e.key === "0"
      ) {
        e.preventDefault();
        setValue(null);
      }
      // Arrow key navigation
      else if (e.key === "ArrowUp") {
        e.preventDefault();
        navigate("up");
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        navigate("down");
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        navigate("left");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        navigate("right");
      }
      // Undo with Ctrl+Z or Cmd+Z
      else if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        undo();
      }
      // Hint with H
      else if (e.key === "h" || e.key === "H") {
        e.preventDefault();
        hint();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setValue, navigate, undo, hint]);

  const finalScore = getFinalScore();

  return (
    <div
      ref={containerRef}
      className="sudoku-game bg-white pixel-border p-4"
    >
      {/* Stats Display */}
      <div className="mb-4">
        <ScoreDisplay
          elapsedTime={gameState.elapsedTime}
          mistakes={gameState.mistakes}
          hintsRemaining={gameState.hintsRemaining}
          difficulty={gameState.difficulty}
        />
      </div>

      {/* Game Controls */}
      <div className="mb-4">
        <GameControls
          difficulty={gameState.difficulty}
          onNewGame={handleNewGame}
          onUndo={undo}
          onHint={hint}
          canUndo={canUndo}
          hintsRemaining={gameState.hintsRemaining}
        />
      </div>

      {/* Game Board */}
      <GameBoard
        grid={gameState.grid}
        selectedCell={gameState.selectedCell}
        onCellClick={selectCell}
      />

      {/* Number Pad */}
      <NumberPad
        onNumberClick={setValue}
        disabled={gameState.gameWon}
      />

      {/* Keyboard hints */}
      <div className="mt-4 text-center">
        <p className="font-pixel text-xs text-gray-400">
          USE KEYBOARD: 1-9 TO ENTER | ARROWS TO MOVE | H FOR HINT
        </p>
      </div>

      {/* Win Modal */}
      {gameState.gameWon && (
        <WinModal
          score={finalScore}
          time={gameState.elapsedTime}
          mistakes={gameState.mistakes}
          hintsUsed={gameState.hintsUsed}
          difficulty={gameState.difficulty}
          onNewGame={() => handleNewGame(gameState.difficulty)}
        />
      )}
    </div>
  );
}
