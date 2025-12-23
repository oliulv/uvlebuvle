import { useState, useCallback, useEffect, useRef } from "react";
import {
  GameState,
  Difficulty,
  CellValue,
  CellPosition,
  Grid,
  MAX_HINTS,
} from "./types";
import {
  generatePuzzle,
  setCellValue,
  applyHint,
  checkWin,
  calculateScore,
  cloneGrid,
  updateAllErrors,
} from "./gameLogic";

const MAX_HISTORY = 50;

interface GameStateWithHistory extends GameState {
  history: Grid[];
}

function createInitialState(difficulty: Difficulty): GameStateWithHistory {
  const grid = generatePuzzle(difficulty);
  return {
    grid,
    difficulty,
    selectedCell: null,
    mistakes: 0,
    hintsUsed: 0,
    hintsRemaining: MAX_HINTS,
    startTime: Date.now(),
    elapsedTime: 0,
    isPlaying: true,
    gameWon: false,
    history: [],
  };
}

export function useGameState(initialDifficulty: Difficulty = "easy") {
  const [gameState, setGameState] = useState<GameStateWithHistory>(() =>
    createInitialState(initialDifficulty)
  );
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer effect
  useEffect(() => {
    if (gameState.isPlaying && !gameState.gameWon) {
      timerRef.current = setInterval(() => {
        setGameState((state) => ({
          ...state,
          elapsedTime: Math.floor((Date.now() - state.startTime) / 1000),
        }));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState.isPlaying, gameState.gameWon, gameState.startTime]);

  const saveGridToHistory = useCallback(
    (state: GameStateWithHistory): Grid[] => {
      const newHistory = [...state.history, cloneGrid(state.grid)].slice(
        -MAX_HISTORY
      );
      return newHistory;
    },
    []
  );

  const newGame = useCallback((difficulty: Difficulty) => {
    setGameState(createInitialState(difficulty));
  }, []);

  const selectCell = useCallback((row: number, col: number) => {
    setGameState((state) => ({
      ...state,
      selectedCell: { row, col },
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setGameState((state) => ({
      ...state,
      selectedCell: null,
    }));
  }, []);

  const setValue = useCallback(
    (value: CellValue) => {
      setGameState((state) => {
        if (!state.selectedCell || state.gameWon) return state;

        const { row, col } = state.selectedCell;
        if (state.grid[row][col].isGiven) return state;

        // Save current grid to history before making changes
        const newHistory = saveGridToHistory(state);
        const { grid, causedConflict } = setCellValue(state.grid, row, col, value);

        // Track mistakes when a placement causes a Sudoku rule violation
        const newMistakes = causedConflict ? state.mistakes + 1 : state.mistakes;
        const won = checkWin(grid);
        const finalScore = won
          ? calculateScore(
              state.difficulty,
              state.elapsedTime,
              newMistakes,
              state.hintsUsed
            )
          : 0;

        return {
          ...state,
          grid,
          history: newHistory,
          mistakes: newMistakes,
          gameWon: won,
          isPlaying: !won,
          // Store final score in elapsedTime position for win modal (hacky but works)
          ...(won && { finalScore }),
        };
      });
    },
    [saveGridToHistory]
  );

  const hint = useCallback(() => {
    setGameState((state) => {
      if (state.hintsRemaining <= 0 || state.gameWon) return state;

      const newGrid = applyHint(state.grid, state.selectedCell);
      if (!newGrid) return state;

      const newHistory = saveGridToHistory(state);
      const newHintsUsed = state.hintsUsed + 1;
      const won = checkWin(newGrid);
      const finalScore = won
        ? calculateScore(
            state.difficulty,
            state.elapsedTime,
            state.mistakes,
            newHintsUsed
          )
        : 0;

      return {
        ...state,
        grid: newGrid,
        history: newHistory,
        hintsUsed: newHintsUsed,
        hintsRemaining: state.hintsRemaining - 1,
        gameWon: won,
        isPlaying: !won,
        ...(won && { finalScore }),
      };
    });
  }, [saveGridToHistory]);

  const undo = useCallback(() => {
    setGameState((state) => {
      if (state.history.length === 0 || state.gameWon) return state;

      const newHistory = [...state.history];
      const previousGrid = newHistory.pop()!;

      // Re-evaluate errors for the restored grid state
      const gridWithErrors = updateAllErrors(previousGrid);

      return {
        ...state,
        grid: gridWithErrors,
        history: newHistory,
      };
    });
  }, []);

  // Navigate with arrow keys
  const navigate = useCallback((direction: "up" | "down" | "left" | "right") => {
    setGameState((state) => {
      if (!state.selectedCell) {
        return { ...state, selectedCell: { row: 0, col: 0 } };
      }

      let { row, col } = state.selectedCell;

      switch (direction) {
        case "up":
          row = row > 0 ? row - 1 : 8;
          break;
        case "down":
          row = row < 8 ? row + 1 : 0;
          break;
        case "left":
          col = col > 0 ? col - 1 : 8;
          break;
        case "right":
          col = col < 8 ? col + 1 : 0;
          break;
      }

      return { ...state, selectedCell: { row, col } };
    });
  }, []);

  // Get the final score (calculated on win)
  const getFinalScore = useCallback(() => {
    if (!gameState.gameWon) return 0;
    return calculateScore(
      gameState.difficulty,
      gameState.elapsedTime,
      gameState.mistakes,
      gameState.hintsUsed
    );
  }, [
    gameState.gameWon,
    gameState.difficulty,
    gameState.elapsedTime,
    gameState.mistakes,
    gameState.hintsUsed,
  ]);

  return {
    gameState,
    newGame,
    selectCell,
    clearSelection,
    setValue,
    hint,
    undo,
    navigate,
    canUndo: gameState.history.length > 0 && !gameState.gameWon,
    getFinalScore,
  };
}
