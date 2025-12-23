'use client';

import { useState, useCallback, useRef } from 'react';
import {
  GameState,
  Difficulty,
  AIDecision,
  TOTAL_PAIRS,
} from './types';
import {
  createInitialState,
  selectRandomImages,
  flipCard,
  checkMatch,
  updateAIMemory,
  isGameOver,
  calculateFinalScore,
  getWinner,
  getUnmatchedPositions,
} from './gameLogic';

interface UseGameStateReturn {
  state: GameState;
  isAIThinking: boolean;
  handleCardClick: (cardId: string) => void;
  handleDifficultyChange: (difficulty: Difficulty) => void;
  startNewGame: () => void;
  processMatchCheck: () => void;
  getAIDecision: () => Promise<AIDecision | null>;
  executeAIMove: (decision: AIDecision) => void;
}

export function useGameState(allImagePaths: string[]): UseGameStateReturn {
  // Select random images from the pool for this game session
  const [state, setState] = useState<GameState>(() => {
    const selectedImages = selectRandomImages(allImagePaths, TOTAL_PAIRS);
    const initialState = createInitialState(selectedImages, 'medium');
    console.log('[Memory] Game initialized with difficulty:', initialState.difficulty);
    return initialState;
  });
  const [isAIThinking, setIsAIThinking] = useState(false);

  // Use ref to always have access to latest state (avoids stale closure issues)
  const stateRef = useRef(state);
  stateRef.current = state;

  const handleCardClick = useCallback((cardId: string) => {
    setState((prev) => {
      if (prev.currentPlayer !== 'human' || prev.gamePhase !== 'playing') {
        return prev;
      }

      const newState = flipCard(prev, cardId);

      // Check if card was actually flipped
      const flippedCard = newState.cards.find(c => c.id === cardId);
      if (flippedCard && flippedCard.faceUp && !prev.cards.find(c => c.id === cardId)?.faceUp) {
        // Update AI memory when human flips a card
        newState.aiMemory = updateAIMemory(
          newState.aiMemory,
          flippedCard,
          newState.difficulty
        );
      }

      // If two cards are flipped, set checking phase
      if (newState.flippedCards.length === 2) {
        return { ...newState, gamePhase: 'checking' as const };
      }

      return newState;
    });
  }, []);

  const processMatchCheck = useCallback(() => {
    setState((prev) => {
      if (prev.flippedCards.length !== 2 || prev.gamePhase !== 'checking') {
        return prev;
      }

      const { isMatch, newState } = checkMatch(prev);

      // Check if game is over
      if (isGameOver(newState)) {
        return { ...newState, gamePhase: 'game-over' as const };
      }

      // Set appropriate phase based on whose turn it is
      if (newState.currentPlayer === 'ai') {
        return { ...newState, gamePhase: 'ai-thinking' as const };
      }

      return { ...newState, gamePhase: 'playing' as const };
    });
  }, []);

  const handleDifficultyChange = useCallback((difficulty: Difficulty) => {
    setState((prev) => {
      // Reset game when changing difficulty - select new random images
      const selectedImages = selectRandomImages(allImagePaths, TOTAL_PAIRS);
      return createInitialState(selectedImages, difficulty);
    });
  }, [allImagePaths]);

  const startNewGame = useCallback(() => {
    setState((prev) => {
      // Select new random images for each new game
      const selectedImages = selectRandomImages(allImagePaths, TOTAL_PAIRS);
      return createInitialState(selectedImages, prev.difficulty);
    });
  }, [allImagePaths]);

  const getAIDecision = useCallback(async (): Promise<AIDecision | null> => {
    setIsAIThinking(true);

    try {
      // Get current state from ref (always fresh, avoids stale closure)
      const currentState = stateRef.current;
      console.log('[Memory] AI decision requested, difficulty:', currentState.difficulty);

      const response = await fetch('/api/memory/ai-move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cards: currentState.cards.map(c => ({
            position: c.position,
            imageId: c.imageId,
            matched: c.matched,
            faceUp: c.faceUp,
          })),
          aiMemory: currentState.aiMemory,
          difficulty: currentState.difficulty,
          humanMatches: currentState.humanMatches,
          aiMatches: currentState.aiMatches,
        }),
      });

      if (!response.ok) {
        throw new Error('AI decision failed');
      }

      const decision: AIDecision = await response.json();

      // Validate the decision - make sure positions are for unmatched cards
      const unmatched = getUnmatchedPositions(currentState);
      if (!unmatched.includes(decision.first) || !unmatched.includes(decision.second)) {
        console.warn('AI returned invalid positions, using fallback');
        throw new Error('Invalid AI decision');
      }

      return decision;
    } catch (error) {
      console.error('AI decision error:', error);
      // Fallback: pick two random unmatched cards
      const currentState = stateRef.current;
      const unmatched = getUnmatchedPositions(currentState);
      if (unmatched.length >= 2) {
        const shuffled = [...unmatched].sort(() => Math.random() - 0.5);
        return {
          first: shuffled[0],
          second: shuffled[1],
          reasoning: 'Random selection (fallback)',
        };
      }
      return null;
    } finally {
      setIsAIThinking(false);
    }
  }, []);

  const executeAIMove = useCallback((decision: AIDecision) => {
    // Flip first card
    setState((prev) => {
      const firstCard = prev.cards.find(c => c.position === decision.first);
      if (!firstCard) return prev;

      const afterFirstFlip = flipCard(prev, firstCard.id);

      // Update AI memory for first card (AI always remembers its own flips)
      const flippedCard = afterFirstFlip.cards.find(c => c.id === firstCard.id);
      if (flippedCard && flippedCard.faceUp) {
        afterFirstFlip.aiMemory = updateAIMemory(
          afterFirstFlip.aiMemory,
          flippedCard,
          afterFirstFlip.difficulty
        );
      }

      return afterFirstFlip;
    });

    // Flip second card after a delay
    setTimeout(() => {
      setState((prev) => {
        const secondCard = prev.cards.find(c => c.position === decision.second);
        if (!secondCard) return prev;

        const afterSecondFlip = flipCard(prev, secondCard.id);

        // Update AI memory for second card
        const flippedCard = afterSecondFlip.cards.find(c => c.id === secondCard.id);
        if (flippedCard && flippedCard.faceUp) {
          afterSecondFlip.aiMemory = updateAIMemory(
            afterSecondFlip.aiMemory,
            flippedCard,
            afterSecondFlip.difficulty
          );
        }

        return { ...afterSecondFlip, gamePhase: 'checking' as const };
      });
    }, 800);
  }, []);

  return {
    state,
    isAIThinking,
    handleCardClick,
    handleDifficultyChange,
    startNewGame,
    processMatchCheck,
    getAIDecision,
    executeAIMove,
  };
}

// Export helper functions for the main component
export { checkMatch, isGameOver, getWinner };

// Calculate score helper
export function calculateScore(
  humanMatches: number,
  aiMatches: number,
  difficulty: 'easy' | 'medium' | 'hard'
): number {
  // Create a minimal state to use calculateFinalScore
  const state = {
    humanMatches,
    aiMatches,
    humanScore: humanMatches * (difficulty === 'easy' ? 100 : difficulty === 'medium' ? 150 : 200),
    difficulty,
  };
  return calculateFinalScore(state as any);
}
