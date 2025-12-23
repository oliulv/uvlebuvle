'use client';

import { useReducer, useState, useEffect, useCallback, useRef } from 'react';
import { GameState, BettingAction, BetAction, AIDecision, GameHistory, HandSummary, GamePhase } from '@/lib/poker/types';
import { gameReducer, createInitialState, isGameOver, getGameWinner, getAvailableActions } from '@/lib/poker/gameEngine';
import PokerTable from './PokerTable';
import BettingControls from './BettingControls';
import PixelButton from '@/components/PixelButton';

interface PokerGameProps {
  isFullscreen?: boolean;
}

// Action log entry with optional reasoning
interface ActionLogEntry {
  id: number;
  message: string;
  playerName?: string;
  reasoning?: string;
  isAI: boolean;
  phase?: GamePhase;
}

export default function PokerGame({ isFullscreen = false }: PokerGameProps) {
  const [gameState, dispatch] = useReducer(gameReducer, createInitialState());
  const [thinkingPlayerId, setThinkingPlayerId] = useState<string | null>(null);
  const [actionLog, setActionLog] = useState<ActionLogEntry[]>([]);
  const [gameHistory, setGameHistory] = useState<GameHistory>({
    hands: [],
    playerStats: {},
  });
  const [currentHandActions, setCurrentHandActions] = useState<HandSummary['actions']>([]);
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);
  const [logIdCounter, setLogIdCounter] = useState(0);
  const lastRecordedHand = useRef<number>(0);

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isHumanTurn = currentPlayer?.type === 'human' &&
    gameState.phase !== 'waiting' &&
    gameState.phase !== 'hand-complete' &&
    gameState.phase !== 'showdown';

  const gameOver = isGameOver(gameState);
  const gameWinner = getGameWinner(gameState);

  // Add action to log
  const logAction = useCallback((
    message: string,
    options?: { playerName?: string; reasoning?: string; isAI?: boolean; phase?: GamePhase }
  ) => {
    setLogIdCounter(prev => prev + 1);
    setActionLog(prev => [...prev, {
      id: logIdCounter + 1,
      message,
      playerName: options?.playerName,
      reasoning: options?.reasoning,
      isAI: options?.isAI ?? false,
      phase: options?.phase,
    }]);
  }, [logIdCounter]);

  // Update player stats
  const updatePlayerStats = useCallback((playerId: string, update: Partial<GameHistory['playerStats'][string]>) => {
    setGameHistory(prev => {
      const existing = prev.playerStats[playerId] || {
        handsPlayed: 0,
        handsWon: 0,
        totalBet: 0,
        allInCount: 0,
        foldCount: 0,
        bluffCaught: 0,
      };
      return {
        ...prev,
        playerStats: {
          ...prev.playerStats,
          [playerId]: {
            ...existing,
            ...update,
          },
        },
      };
    });
  }, []);

  // Record hand completion - using refs to avoid dependency issues
  const currentHandActionsRef = useRef(currentHandActions);
  currentHandActionsRef.current = currentHandActions;

  const recordHandCompletion = useCallback((
    handNumber: number,
    winner: { id: string; name: string },
    winningHand: string,
    potSize: number
  ) => {
    // Prevent duplicate recording
    if (lastRecordedHand.current >= handNumber) {
      return;
    }
    lastRecordedHand.current = handNumber;

    const handSummary: HandSummary = {
      handNumber,
      winner: winner.name,
      winningHand,
      potSize,
      actions: currentHandActionsRef.current,
    };

    setGameHistory(prev => {
      const newStats = { ...prev.playerStats };
      const existingStats = newStats[winner.id] || {
        handsPlayed: 0,
        handsWon: 0,
        totalBet: 0,
        allInCount: 0,
        foldCount: 0,
        bluffCaught: 0,
      };
      newStats[winner.id] = {
        ...existingStats,
        handsWon: existingStats.handsWon + 1,
      };

      return {
        ...prev,
        hands: [...prev.hands, handSummary],
        playerStats: newStats,
      };
    });

    // Reset current hand actions
    setCurrentHandActions([]);
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
        // Build game history summary for AI context
        const recentHands = gameHistory.hands.slice(-5);
        const playerStatsForAI = Object.entries(gameHistory.playerStats).map(([id, stats]) => {
          const player = gameState.players.find(p => p.id === id);
          return {
            name: player?.name || id,
            ...stats,
          };
        });

        // Call AI API with game history
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
              actionHistory: gameState.actionHistory.slice(-10),
              availableActions: getAvailableActions(gameState),
            },
            gameHistory: {
              recentHands,
              playerStats: playerStatsForAI,
              currentHandActions,
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

        // Log with reasoning
        logAction(
          `${aiPlayer.name}: ${decision.action.toUpperCase()}${decision.amount ? ` $${decision.amount}` : ''}`,
          {
            playerName: aiPlayer.name,
            reasoning: decision.reasoning,
            isAI: true,
            phase: gameState.phase,
          }
        );

        // Track action for hand history
        setCurrentHandActions(prev => [...prev, {
          playerName: aiPlayer.name,
          action: decision.action,
          amount: decision.amount,
          phase: gameState.phase,
        }]);

        // Update player stats
        if (decision.action === 'all-in') {
          updatePlayerStats(aiPlayer.id, {
            allInCount: (gameHistory.playerStats[aiPlayer.id]?.allInCount || 0) + 1,
            totalBet: (gameHistory.playerStats[aiPlayer.id]?.totalBet || 0) + (decision.amount || 0),
          });
        } else if (decision.action === 'fold') {
          updatePlayerStats(aiPlayer.id, {
            foldCount: (gameHistory.playerStats[aiPlayer.id]?.foldCount || 0) + 1,
          });
        } else if (decision.amount) {
          updatePlayerStats(aiPlayer.id, {
            totalBet: (gameHistory.playerStats[aiPlayer.id]?.totalBet || 0) + decision.amount,
          });
        }

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

        logAction(`${aiPlayer.name}: ${fallbackAction.toUpperCase()} (fallback)`, {
          playerName: aiPlayer.name,
          reasoning: 'API error - using safe fallback',
          isAI: true,
        });
        dispatch({ type: 'PLAYER_ACTION', action });
      } finally {
        setThinkingPlayerId(null);
      }
    }
  }, [gameState, currentPlayer, logAction, gameHistory, currentHandActions, updatePlayerStats]);

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

  // Record hand completion when phase changes to hand-complete
  useEffect(() => {
    if (gameState.phase === 'hand-complete' && gameState.winner) {
      recordHandCompletion(
        gameState.handNumber,
        { id: gameState.winner.id, name: gameState.winner.name },
        gameState.winningHand || 'Unknown',
        gameState.pot
      );
    }
  }, [gameState.phase, gameState.handNumber, gameState.winner, gameState.winningHand, gameState.pot, recordHandCompletion]);

  // Handle human action
  const handleHumanAction = (action: BettingAction, amount?: number) => {
    if (!isHumanTurn) return;

    const betAction: BetAction = {
      playerId: currentPlayer.id,
      playerName: currentPlayer.name,
      action,
      amount: amount || 0,
    };

    logAction(
      `${currentPlayer.name}: ${action.toUpperCase()}${amount ? ` $${amount}` : ''}`,
      { playerName: currentPlayer.name, isAI: false, phase: gameState.phase }
    );

    // Track action for hand history
    setCurrentHandActions(prev => [...prev, {
      playerName: currentPlayer.name,
      action,
      amount,
      phase: gameState.phase,
    }]);

    dispatch({ type: 'PLAYER_ACTION', action: betAction });
  };

  // Start game
  const handleStartGame = () => {
    setActionLog([]);
    setCurrentHandActions([]);
    dispatch({ type: 'START_GAME' });
    logAction('Game started! Good luck!', { isAI: false });

    // Initialize player stats
    gameState.players.forEach(player => {
      updatePlayerStats(player.id, { handsPlayed: 1 });
    });
  };

  // Start new hand
  const handleNewHand = () => {
    dispatch({ type: 'START_NEW_HAND' });
    logAction(`--- Hand #${gameState.handNumber + 1} ---`, { isAI: false });

    // Update hands played for all active players
    gameState.players.forEach(player => {
      if (player.chips > 0) {
        updatePlayerStats(player.id, {
          handsPlayed: (gameHistory.playerStats[player.id]?.handsPlayed || 0) + 1,
        });
      }
    });
  };

  // Reset game
  const handleResetGame = () => {
    setActionLog([]);
    setGameHistory({ hands: [], playerStats: {} });
    setCurrentHandActions([]);
    dispatch({ type: 'RESET_GAME' });
  };

  // Toggle log entry expansion
  const toggleLogExpansion = (id: number) => {
    setExpandedLogId(prev => prev === id ? null : id);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Game Over */}
      {gameOver && gameWinner && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-8 px-12 bg-slate-800 rounded-xl">
            <div className="font-pixel text-2xl text-red-400 mb-4">GAME OVER</div>
            <div className="font-pixel text-lg text-emerald-400 mb-4">
              {gameWinner.name} WINS THE GAME!
            </div>
            <PixelButton onClick={handleResetGame}>PLAY AGAIN</PixelButton>
          </div>
        </div>
      )}

      {/* Waiting state */}
      {gameState.phase === 'waiting' && !gameOver && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center bg-slate-800/50 rounded-xl px-12 py-8">
            <div className="font-pixel text-xl text-white mb-4">TEXAS HOLD&apos;EM</div>
            <div className="font-pixel text-xs text-slate-400 mb-6">
              Play against CLAUDE, GEMINI, and GPT
            </div>
            <PixelButton onClick={handleStartGame}>START GAME</PixelButton>
          </div>
        </div>
      )}

      {/* Game table */}
      {gameState.phase !== 'waiting' && !gameOver && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Main game area */}
          <div className="flex-1 flex gap-4 min-h-0 py-4">
            {/* Left sidebar - Action Log */}
            <div className="w-56 flex-shrink-0 flex flex-col">
              <div className="bg-slate-800/80 rounded-lg p-3 flex-1 overflow-hidden flex flex-col">
                <div className="font-pixel text-[10px] text-slate-400 mb-2">ACTION LOG</div>
                <div className="flex-1 overflow-y-auto space-y-1">
                  {actionLog.map((entry) => (
                    <div key={entry.id}>
                      <div
                        className={`font-pixel text-[9px] ${
                          entry.isAI && entry.reasoning
                            ? 'text-cyan-300 cursor-pointer hover:text-cyan-200'
                            : 'text-slate-300'
                        }`}
                        onClick={() => entry.isAI && entry.reasoning && toggleLogExpansion(entry.id)}
                      >
                        {entry.message}
                        {entry.isAI && entry.reasoning && (
                          <span className="text-slate-500 ml-1">
                            {expandedLogId === entry.id ? '▼' : '▶'}
                          </span>
                        )}
                      </div>
                      {expandedLogId === entry.id && entry.reasoning && (
                        <div className="mt-1 ml-2 p-2 bg-slate-900/80 rounded text-[8px] text-slate-400 border-l-2 border-cyan-600">
                          <div className="font-pixel text-cyan-500 mb-1">AI REASONING:</div>
                          <div className="font-sans text-[9px] leading-relaxed">{entry.reasoning}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Center - Poker Table */}
            <div className="flex-1 min-w-0">
              <PokerTable
                gameState={gameState}
                thinkingPlayerId={thinkingPlayerId}
                isFullscreen={isFullscreen}
              />
            </div>

            {/* Right sidebar - Game Info */}
            <div className="w-56 flex-shrink-0 flex flex-col gap-3">
              <div className="bg-slate-800/80 rounded-lg p-3">
                <div className="font-pixel text-[10px] text-slate-400 mb-2">HAND #{gameState.handNumber}</div>
                <div className="font-pixel text-xs text-emerald-400">
                  {gameState.phase.toUpperCase().replace('-', ' ')}
                </div>
              </div>

              {/* Player Stats */}
              {gameHistory.hands.length > 0 && (
                <div className="bg-slate-800/80 rounded-lg p-3">
                  <div className="font-pixel text-[10px] text-slate-400 mb-2">PLAYER STATS</div>
                  <div className="space-y-2">
                    {gameState.players.map(player => {
                      const stats = gameHistory.playerStats[player.id];
                      if (!stats) return null;
                      return (
                        <div key={player.id} className="text-[8px]">
                          <div className={`font-pixel ${player.type === 'human' ? 'text-emerald-400' : 'text-white'}`}>
                            {player.name}
                          </div>
                          <div className="text-slate-500 font-pixel">
                            W:{stats.handsWon} | AI:{stats.allInCount} | F:{stats.foldCount}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Waiting indicator when not human turn */}
              {!isHumanTurn && gameState.phase !== 'hand-complete' && (
                <div className="bg-slate-800/80 rounded-lg p-3">
                  <div className="font-pixel text-[10px] text-cyan-400 animate-pulse">
                    WAITING FOR {currentPlayer?.name?.toUpperCase()}...
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom controls */}
          <div className="flex-shrink-0 pb-2">
            {isHumanTurn && (
              <BettingControls
                gameState={gameState}
                onAction={handleHumanAction}
                disabled={!!thinkingPlayerId}
              />
            )}

            {gameState.phase === 'hand-complete' && (
              <div className="text-center py-4">
                <PixelButton onClick={handleNewHand}>NEXT HAND</PixelButton>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
