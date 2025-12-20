'use client';

import { useReducer, useState, useEffect, useCallback } from 'react';
import { GameState, BettingAction, BetAction, AIDecision } from '@/lib/poker/types';
import { gameReducer, createInitialState, isGameOver, getGameWinner, getAvailableActions } from '@/lib/poker/gameEngine';
import PokerTable from './PokerTable';
import BettingControls from './BettingControls';
import PixelButton from '@/components/PixelButton';

export default function PokerGame() {
  const [gameState, dispatch] = useReducer(gameReducer, createInitialState());
  const [thinkingPlayerId, setThinkingPlayerId] = useState<string | null>(null);
  const [actionLog, setActionLog] = useState<string[]>([]);

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isHumanTurn = currentPlayer?.type === 'human' &&
    gameState.phase !== 'waiting' &&
    gameState.phase !== 'hand-complete' &&
    gameState.phase !== 'showdown';

  const gameOver = isGameOver(gameState);
  const gameWinner = getGameWinner(gameState);

  // Add action to log
  const logAction = useCallback((message: string) => {
    setActionLog(prev => [...prev.slice(-9), message]);
  }, []);

  // Handle AI turn
  const handleAITurn = useCallback(async () => {
    if (!currentPlayer || currentPlayer.type !== 'human') {
      const aiPlayer = gameState.players[gameState.currentPlayerIndex];
      if (!aiPlayer || aiPlayer.type !== 'ai' || aiPlayer.isFolded || aiPlayer.isAllIn) {
        return;
      }

      setThinkingPlayerId(aiPlayer.id);

      try {
        // Call AI API
        const response = await fetch('/api/poker/ai-decision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameState: {
              phase: gameState.phase,
              communityCards: gameState.communityCards,
              pot: gameState.pot,
              currentBet: gameState.currentBet,
              playerHand: aiPlayer.hand,
              playerChips: aiPlayer.chips,
              playerCurrentBet: aiPlayer.currentBet,
              actionHistory: gameState.actionHistory.slice(-5),
              availableActions: getAvailableActions(gameState),
            },
            playerId: aiPlayer.id,
            playerName: aiPlayer.name,
            model: aiPlayer.aiModel,
          }),
        });

        const decision: AIDecision = await response.json();

        // Process AI action
        const action: BetAction = {
          playerId: aiPlayer.id,
          playerName: aiPlayer.name,
          action: decision.action,
          amount: decision.amount || 0,
          reasoning: decision.reasoning,
        };

        logAction(`${aiPlayer.name}: ${decision.action.toUpperCase()}${decision.amount ? ` $${decision.amount}` : ''}`);

        // Small delay for UX
        await new Promise(resolve => setTimeout(resolve, 500));

        dispatch({ type: 'PLAYER_ACTION', action });
      } catch (error) {
        console.error('AI decision error:', error);
        // Fallback: random valid action
        const actions = getAvailableActions(gameState);
        const fallbackAction = actions.includes('check') ? 'check' :
                              actions.includes('call') ? 'call' : 'fold';

        const action: BetAction = {
          playerId: aiPlayer.id,
          playerName: aiPlayer.name,
          action: fallbackAction,
          amount: 0,
        };

        logAction(`${aiPlayer.name}: ${fallbackAction.toUpperCase()} (fallback)`);
        dispatch({ type: 'PLAYER_ACTION', action });
      } finally {
        setThinkingPlayerId(null);
      }
    }
  }, [gameState, currentPlayer, logAction]);

  // Trigger AI turns
  useEffect(() => {
    if (
      gameState.phase !== 'waiting' &&
      gameState.phase !== 'hand-complete' &&
      gameState.phase !== 'showdown' &&
      currentPlayer?.type === 'ai' &&
      !currentPlayer.isFolded &&
      !currentPlayer.isAllIn &&
      !thinkingPlayerId
    ) {
      const timeout = setTimeout(handleAITurn, 1000);
      return () => clearTimeout(timeout);
    }
  }, [gameState.currentPlayerIndex, gameState.phase, currentPlayer, thinkingPlayerId, handleAITurn]);

  // Handle human action
  const handleHumanAction = (action: BettingAction, amount?: number) => {
    if (!isHumanTurn) return;

    const betAction: BetAction = {
      playerId: currentPlayer.id,
      playerName: currentPlayer.name,
      action,
      amount: amount || 0,
    };

    logAction(`${currentPlayer.name}: ${action.toUpperCase()}${amount ? ` $${amount}` : ''}`);
    dispatch({ type: 'PLAYER_ACTION', action: betAction });
  };

  // Start game
  const handleStartGame = () => {
    setActionLog([]);
    dispatch({ type: 'START_GAME' });
    logAction('Game started! Good luck!');
  };

  // Start new hand
  const handleNewHand = () => {
    dispatch({ type: 'START_NEW_HAND' });
    logAction(`--- Hand #${gameState.handNumber + 1} ---`);
  };

  // Reset game
  const handleResetGame = () => {
    setActionLog([]);
    dispatch({ type: 'RESET_GAME' });
  };

  return (
    <div className="space-y-6">
      {/* Game Over */}
      {gameOver && gameWinner && (
        <div className="text-center py-8 pixel-border bg-grey-light">
          <div className="font-pixel text-2xl text-christmas-red mb-4">GAME OVER</div>
          <div className="font-pixel text-lg text-christmas-green mb-4">
            {gameWinner.name} WINS THE GAME!
          </div>
          <PixelButton onClick={handleResetGame}>PLAY AGAIN</PixelButton>
        </div>
      )}

      {/* Waiting state */}
      {gameState.phase === 'waiting' && !gameOver && (
        <div className="text-center py-12">
          <div className="font-pixel text-lg mb-4">TEXAS HOLD&apos;EM</div>
          <div className="font-pixel text-xs text-gray-500 mb-6">
            Play against CLAUDE, GEMINI, and GPT
          </div>
          <PixelButton onClick={handleStartGame}>START GAME</PixelButton>
        </div>
      )}

      {/* Game table */}
      {gameState.phase !== 'waiting' && !gameOver && (
        <>
          <PokerTable
            gameState={gameState}
            thinkingPlayerId={thinkingPlayerId}
          />

          {/* Betting controls for human */}
          {isHumanTurn && (
            <BettingControls
              gameState={gameState}
              onAction={handleHumanAction}
              disabled={!!thinkingPlayerId}
            />
          )}

          {/* Next hand button */}
          {gameState.phase === 'hand-complete' && (
            <div className="text-center">
              <PixelButton onClick={handleNewHand}>NEXT HAND</PixelButton>
            </div>
          )}
        </>
      )}

      {/* Action log */}
      {actionLog.length > 0 && (
        <div className="bg-grey-light pixel-border-sm p-3 max-h-32 overflow-y-auto">
          <div className="font-pixel text-xs text-gray-500 mb-2">ACTION LOG</div>
          {actionLog.map((log, i) => (
            <div key={i} className="font-pixel text-[10px] text-gray-700">
              {log}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
