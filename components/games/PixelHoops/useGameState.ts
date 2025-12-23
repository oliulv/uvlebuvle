"use client";

import { useState, useEffect, useCallback } from "react";
import { EventBus } from "./game/EventBus";
import { EVENTS, GAME_DURATION, GameState } from "./types";

interface GameOverData {
  score: number;
  shotsMade: number;
  shotsMissed: number;
}

interface ScoreUpdateData {
  score: number;
  timeRemaining: number;
  shotsMade: number;
  shotsMissed: number;
}

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    timeRemaining: GAME_DURATION,
    isPlaying: false,
    shotsMade: 0,
    shotsMissed: 0,
    isCharging: false,
    chargeLevel: 0,
  });

  const [isGameOver, setIsGameOver] = useState(false);

  useEffect(() => {
    const handleScoreUpdate = (...args: unknown[]) => {
      const data = args[0] as ScoreUpdateData;
      setGameState((prev) => ({
        ...prev,
        score: data.score,
        timeRemaining: data.timeRemaining,
        shotsMade: data.shotsMade,
        shotsMissed: data.shotsMissed,
      }));
    };

    const handleGameStart = () => {
      setGameState((prev) => ({
        ...prev,
        isPlaying: true,
        score: 0,
        timeRemaining: GAME_DURATION,
        shotsMade: 0,
        shotsMissed: 0,
      }));
      setIsGameOver(false);
    };

    const handleGameOver = (...args: unknown[]) => {
      const data = args[0] as GameOverData;
      setGameState((prev) => ({
        ...prev,
        isPlaying: false,
        score: data.score,
        shotsMade: data.shotsMade,
        shotsMissed: data.shotsMissed,
      }));
      setIsGameOver(true);
    };

    const handleChargeUpdate = (...args: unknown[]) => {
      const chargeLevel = args[0] as number;
      setGameState((prev) => ({
        ...prev,
        isCharging: chargeLevel > 0,
        chargeLevel,
      }));
    };

    const handleTimeUpdate = (...args: unknown[]) => {
      const timeRemaining = args[0] as number;
      setGameState((prev) => ({
        ...prev,
        timeRemaining,
      }));
    };

    // Subscribe to events
    EventBus.on(EVENTS.SCORE_UPDATE, handleScoreUpdate);
    EventBus.on(EVENTS.GAME_START, handleGameStart);
    EventBus.on(EVENTS.GAME_OVER, handleGameOver);
    EventBus.on(EVENTS.CHARGE_UPDATE, handleChargeUpdate);
    EventBus.on(EVENTS.TIME_UPDATE, handleTimeUpdate);

    // Cleanup
    return () => {
      EventBus.off(EVENTS.SCORE_UPDATE, handleScoreUpdate);
      EventBus.off(EVENTS.GAME_START, handleGameStart);
      EventBus.off(EVENTS.GAME_OVER, handleGameOver);
      EventBus.off(EVENTS.CHARGE_UPDATE, handleChargeUpdate);
      EventBus.off(EVENTS.TIME_UPDATE, handleTimeUpdate);
    };
  }, []);

  const startGame = useCallback(() => {
    EventBus.emit(EVENTS.GAME_START);
  }, []);

  const resetGame = useCallback(() => {
    setIsGameOver(false);
    setGameState({
      score: 0,
      timeRemaining: GAME_DURATION,
      isPlaying: false,
      shotsMade: 0,
      shotsMissed: 0,
      isCharging: false,
      chargeLevel: 0,
    });
  }, []);

  return {
    gameState,
    isGameOver,
    startGame,
    resetGame,
  };
}
