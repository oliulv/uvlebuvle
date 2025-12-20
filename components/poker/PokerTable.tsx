'use client';

import { GameState } from '@/lib/poker/types';
import PlayerSeat from './PlayerSeat';
import { CardHand } from './Card';

interface PokerTableProps {
  gameState: GameState;
  thinkingPlayerId: string | null;
}

export default function PokerTable({ gameState, thinkingPlayerId }: PokerTableProps) {
  const { players, communityCards, pot, phase, currentPlayerIndex, winner, winningHand } = gameState;

  // Find players by position
  const bottomPlayer = players.find(p => p.position === 'bottom');
  const leftPlayer = players.find(p => p.position === 'left');
  const topPlayer = players.find(p => p.position === 'top');
  const rightPlayer = players.find(p => p.position === 'right');

  const showdown = phase === 'showdown' || phase === 'hand-complete';

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Top player */}
      <div className="flex justify-center mb-2">
        {topPlayer && (
          <PlayerSeat
            player={topPlayer}
            isCurrentTurn={players[currentPlayerIndex]?.id === topPlayer.id}
            isThinking={thinkingPlayerId === topPlayer.id}
            showCards={showdown}
            phase={phase}
          />
        )}
      </div>

      {/* Middle row: Left player - Table - Right player */}
      <div className="flex items-center gap-2">
        {/* Left player */}
        <div className="flex-shrink-0">
          {leftPlayer && (
            <PlayerSeat
              player={leftPlayer}
              isCurrentTurn={players[currentPlayerIndex]?.id === leftPlayer.id}
              isThinking={thinkingPlayerId === leftPlayer.id}
              showCards={showdown}
              phase={phase}
            />
          )}
        </div>

        {/* Table felt */}
        <div className="flex-1 bg-christmas-green pixel-border rounded-3xl aspect-[3/1] relative overflow-hidden">
          {/* Inner border */}
          <div className="absolute inset-3 rounded-2xl border-2 border-green-900 opacity-30" />

          {/* Center area - community cards and pot */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            {/* Pot */}
            {pot > 0 && (
              <div className="font-pixel text-white text-xs bg-black/30 px-2 py-1 pixel-border-sm">
                POT: ${pot}
              </div>
            )}

            {/* Community cards */}
            {communityCards.length > 0 && (
              <div className="bg-black/20 p-1 rounded">
                <CardHand cards={communityCards} size="sm" />
              </div>
            )}

            {/* Winner announcement */}
            {phase === 'hand-complete' && winner && (
              <div className="font-pixel text-white text-center bg-black/50 px-3 py-1 pixel-border-sm">
                <div className="text-christmas-red text-xs">{winner.name} WINS!</div>
                <div className="text-[10px] mt-1">{winningHand}</div>
              </div>
            )}

            {/* Phase indicator */}
            {phase !== 'waiting' && phase !== 'hand-complete' && (
              <div className="font-pixel text-white/70 text-[10px]">
                {phase.toUpperCase().replace('-', ' ')}
              </div>
            )}
          </div>
        </div>

        {/* Right player */}
        <div className="flex-shrink-0">
          {rightPlayer && (
            <PlayerSeat
              player={rightPlayer}
              isCurrentTurn={players[currentPlayerIndex]?.id === rightPlayer.id}
              isThinking={thinkingPlayerId === rightPlayer.id}
              showCards={showdown}
              phase={phase}
            />
          )}
        </div>
      </div>

      {/* Bottom player (human) */}
      <div className="flex justify-center mt-2">
        {bottomPlayer && (
          <PlayerSeat
            player={bottomPlayer}
            isCurrentTurn={players[currentPlayerIndex]?.id === bottomPlayer.id}
            isThinking={thinkingPlayerId === bottomPlayer.id}
            showCards={true}
            phase={phase}
          />
        )}
      </div>
    </div>
  );
}
