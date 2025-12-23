'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useGameState, calculateScore, getWinner } from './useGameState';
import { TOTAL_PAIRS } from './types';
import GameBoard from './components/GameBoard';
import DifficultySelector from './components/DifficultySelector';
import ScoreDisplay from './components/ScoreDisplay';
import TurnIndicator from './components/TurnIndicator';
import WinModal from './components/WinModal';
import CardZoomModal from './components/CardZoomModal';

interface MemoryGameProps {
  onScoreSubmit?: (score: number) => void;
}

// Fetch available images from the API
async function fetchAvailableImages(): Promise<string[]> {
  try {
    const response = await fetch('/api/memory/images');
    if (response.ok) {
      const data = await response.json();
      return data.images || [];
    }
  } catch (error) {
    console.error('Failed to fetch images:', error);
  }
  return [];
}

// Wrapper component that loads images first
export default function MemoryGame({ onScoreSubmit }: MemoryGameProps) {
  const [gameData, setGameData] = useState<{ images: string[]; key: number } | null>(null);

  // Fetch images on mount - always creates fresh game state
  useEffect(() => {
    fetchAvailableImages().then((images) => {
      const loadedImages = images.length >= TOTAL_PAIRS
        ? images
        : Array.from({ length: 24 }, (_, i) => `/memory/${i + 1}.svg`);

      // Use timestamp as key to ensure completely fresh state
      setGameData({ images: loadedImages, key: Date.now() });
    });
  }, []);

  // Show loading while images are being fetched
  if (!gameData) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="font-pixel text-sm text-gray-500 animate-pulse">LOADING...</span>
      </div>
    );
  }

  // Render game with loaded images - key ensures fresh state on remount
  return <MemoryGameInner key={gameData.key} images={gameData.images} onScoreSubmit={onScoreSubmit} />;
}

interface MemoryGameInnerProps {
  images: string[];
  onScoreSubmit?: (score: number) => void;
}

function MemoryGameInner({ images, onScoreSubmit }: MemoryGameInnerProps) {
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const aiTurnInProgress = useRef(false);

  const {
    state,
    isAIThinking,
    handleCardClick,
    handleDifficultyChange,
    startNewGame,
    processMatchCheck,
    getAIDecision,
    executeAIMove,
  } = useGameState(images);

  // Process match checking after delay
  useEffect(() => {
    if (state.gamePhase === 'checking' && state.flippedCards.length === 2) {
      const timer = setTimeout(() => {
        processMatchCheck();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [state.gamePhase, state.flippedCards.length, processMatchCheck]);

  // Reset AI turn flag when entering checking phase (before we know the result)
  useEffect(() => {
    if (state.gamePhase === 'checking') {
      // Reset flag during checking - this allows a new AI turn after match check completes
      aiTurnInProgress.current = false;
    }
  }, [state.gamePhase]);

  // Handle AI turn
  useEffect(() => {
    // Only start AI turn when in ai-thinking phase and not already processing
    if (state.gamePhase === 'ai-thinking' && state.currentPlayer === 'ai' && !aiTurnInProgress.current) {
      aiTurnInProgress.current = true;

      const runAITurn = async () => {
        // Add a small delay to make it feel more natural
        await new Promise(resolve => setTimeout(resolve, 500));

        const decision = await getAIDecision();
        if (decision) {
          executeAIMove(decision);
        } else {
          // No valid decision (game might be over or error)
          aiTurnInProgress.current = false;
        }
      };

      runAITurn();
    }
  }, [state.gamePhase, state.currentPlayer, getAIDecision, executeAIMove]);

  // Reset AI turn flag on game reset or human turn
  useEffect(() => {
    if (state.gamePhase === 'playing' && state.currentPlayer === 'human') {
      aiTurnInProgress.current = false;
    }
    if (state.gamePhase === 'game-over') {
      aiTurnInProgress.current = false;
    }
  }, [state.gamePhase, state.currentPlayer]);

  const handleNewGame = useCallback(() => {
    setScoreSubmitted(false);
    aiTurnInProgress.current = false;
    startNewGame();
  }, [startNewGame]);

  const handleSubmitScore = useCallback(async () => {
    if (state.gamePhase !== 'game-over' || scoreSubmitted) return;

    setIsSubmitting(true);

    const finalScore = calculateScore(
      state.humanMatches,
      state.aiMatches,
      state.difficulty
    );

    try {
      const response = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game: 'memory',
          score: finalScore,
          player: localStorage.getItem('currentPlayer') || 'Unknown',
        }),
      });

      if (response.ok) {
        setScoreSubmitted(true);
        onScoreSubmit?.(finalScore);
      }
    } catch (error) {
      console.error('Failed to submit score:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [state, scoreSubmitted, onScoreSubmit]);

  const handleCardZoom = useCallback((imagePath: string) => {
    setZoomedImage(imagePath);
  }, []);

  const handleCloseZoom = useCallback(() => {
    setZoomedImage(null);
  }, []);

  const isDisabled =
    state.currentPlayer === 'ai' ||
    state.gamePhase === 'checking' ||
    state.gamePhase === 'ai-thinking' ||
    state.gamePhase === 'game-over';

  const winner = state.gamePhase === 'game-over' ? getWinner(state) : null;
  const finalScore = winner
    ? calculateScore(state.humanMatches, state.aiMatches, state.difficulty)
    : 0;

  return (
    <div className="memory-game flex flex-col h-full overflow-hidden">
      {/* Everything inside one pixel border */}
      <div className="pixel-border bg-grey-light p-3 sm:p-4 flex flex-col gap-3 h-full overflow-hidden">
        {/* Header row: difficulty, score, turn, new game */}
        <div className="flex flex-wrap justify-between items-center gap-1 sm:gap-2 shrink-0">
          <DifficultySelector
            difficulty={state.difficulty}
            onChange={handleDifficultyChange}
            disabled={state.gamePhase === 'checking' || state.gamePhase === 'ai-thinking'}
          />

          {/* Score display */}
          <ScoreDisplay
            humanMatches={state.humanMatches}
            aiMatches={state.aiMatches}
            currentPlayer={state.currentPlayer}
            totalPairs={TOTAL_PAIRS}
          />

          {/* Turn indicator */}
          <TurnIndicator
            currentPlayer={state.currentPlayer}
            isThinking={isAIThinking || state.gamePhase === 'ai-thinking'}
          />

          <button
            onClick={handleNewGame}
            className="font-pixel text-[10px] px-2 py-1 pixel-border-sm pixel-btn bg-christmas-red text-white hover:bg-red-700"
          >
            NEW
          </button>
        </div>

        {/* Game board */}
        <GameBoard
          cards={state.cards}
          onCardClick={handleCardClick}
          onCardZoom={handleCardZoom}
          disabled={isDisabled}
        />
      </div>

      {/* Card zoom modal */}
      <CardZoomModal
        imagePath={zoomedImage}
        onClose={handleCloseZoom}
      />

      {/* Win modal */}
      {winner && (
        <WinModal
          winner={winner}
          humanMatches={state.humanMatches}
          aiMatches={state.aiMatches}
          difficulty={state.difficulty}
          finalScore={finalScore}
          onPlayAgain={handleNewGame}
          onSubmitScore={handleSubmitScore}
          isSubmitting={isSubmitting}
          scoreSubmitted={scoreSubmitted}
        />
      )}
    </div>
  );
}
