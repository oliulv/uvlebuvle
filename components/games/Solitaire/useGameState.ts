import { useState, useCallback } from "react";
import {
  GameState,
  GameStateWithHistory,
  Card,
  PileLocation,
} from "./types";
import {
  dealInitialState,
  drawFromStock,
  recycleStock,
  executeMove,
  findValidFoundation,
  canMoveToTableau,
  addWinBonus,
} from "./gameLogic";

const MAX_HISTORY = 50;

function createInitialState(): GameStateWithHistory {
  return {
    ...dealInitialState(),
    history: [],
  };
}

export function useGameState() {
  const [gameState, setGameState] = useState<GameStateWithHistory>(createInitialState);

  const saveToHistory = useCallback((state: GameStateWithHistory): GameStateWithHistory => {
    const { history, ...currentState } = state;
    const newHistory = [...history, currentState].slice(-MAX_HISTORY);
    return { ...state, history: newHistory };
  }, []);

  const newGame = useCallback(() => {
    setGameState(createInitialState());
  }, []);

  const undo = useCallback(() => {
    setGameState((state) => {
      if (state.history.length === 0) return state;
      const previousState = state.history[state.history.length - 1];
      const newHistory = state.history.slice(0, -1);
      return { ...previousState, history: newHistory };
    });
  }, []);

  const draw = useCallback(() => {
    setGameState((state) => {
      if (state.gameWon) return state;
      const savedState = saveToHistory(state);
      const newState = drawFromStock(savedState);
      return { ...newState, history: savedState.history };
    });
  }, [saveToHistory]);

  const recycle = useCallback(() => {
    setGameState((state) => {
      if (state.gameWon) return state;
      const savedState = saveToHistory(state);
      const newState = recycleStock(savedState);
      return { ...newState, history: savedState.history };
    });
  }, [saveToHistory]);

  const moveCards = useCallback(
    (from: PileLocation, to: PileLocation, cardIds: string[]) => {
      setGameState((state) => {
        if (state.gameWon) return state;
        const savedState = saveToHistory(state);
        const newState = executeMove(savedState, from, to, cardIds);
        if (!newState) return state; // Invalid move

        // Apply win bonus if game is won
        const finalState = newState.gameWon ? addWinBonus(newState) : newState;
        return { ...finalState, history: savedState.history };
      });
    },
    [saveToHistory]
  );

  const autoMove = useCallback(
    (card: Card, source: "waste" | "tableau" | "foundation", sourceIndex?: number) => {
      setGameState((state) => {
        if (state.gameWon) return state;

        let from: PileLocation;
        if (source === "waste") {
          from = { pile: "waste", index: 0 };
        } else if (source === "foundation") {
          from = { pile: "foundation", index: sourceIndex! };
        } else {
          from = { pile: "tableau", index: sourceIndex! };
        }

        // Try to move to foundation first
        const foundationIndex = findValidFoundation(card, state);
        if (foundationIndex !== null) {
          const to: PileLocation = { pile: "foundation", index: foundationIndex };
          const savedState = saveToHistory(state);
          const newState = executeMove(savedState, from, to, [card.id]);
          if (newState) {
            const finalState = newState.gameWon ? addWinBonus(newState) : newState;
            return { ...finalState, history: savedState.history };
          }
        }

        // Try to move to tableau (only for cards from waste or foundation)
        if (source !== "tableau") {
          for (let i = 0; i < 7; i++) {
            if (canMoveToTableau([card], state.tableau[i])) {
              const to: PileLocation = { pile: "tableau", index: i };
              const savedState = saveToHistory(state);
              const newState = executeMove(savedState, from, to, [card.id]);
              if (newState) {
                return { ...newState, history: savedState.history };
              }
            }
          }
        }

        return state; // No valid move found
      });
    },
    [saveToHistory]
  );

  return {
    gameState,
    newGame,
    undo,
    draw,
    recycle,
    moveCards,
    autoMove,
    canUndo: gameState.history.length > 0,
  };
}
