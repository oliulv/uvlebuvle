'use client';

import { Player, GamePhase } from '@/lib/poker/types';
import { CardHand } from './Card';

interface PlayerSeatProps {
  player: Player;
  isCurrentTurn: boolean;
  isThinking: boolean;
  showCards: boolean;
  phase: GamePhase;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export default function PlayerSeat({
  player,
  isCurrentTurn,
  isThinking,
  showCards,
  phase,
  position = 'bottom',
}: PlayerSeatProps) {
  const isHuman = player.type === 'human';
  const shouldShowCards = isHuman || showCards || phase === 'showdown' || phase === 'hand-complete';

  // Determine layout based on position
  const isVertical = position === 'left' || position === 'right';

  return (
    <div
      className={`
        relative flex ${isVertical ? 'flex-row' : 'flex-col'} items-center gap-1
        ${player.isFolded ? 'opacity-40' : ''}
      `}
    >
      {/* Player card with info */}
      <div
        className={`
          bg-slate-800/90 backdrop-blur-sm rounded-lg px-4 py-3 min-w-[120px]
          ${isCurrentTurn && !player.isFolded ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-transparent' : ''}
          ${isThinking ? 'animate-pulse' : ''}
        `}
      >
        {/* Name and dealer button row */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className={`font-pixel text-xs ${isHuman ? 'text-emerald-400' : 'text-white'}`}>
            {player.name}
          </span>
          {player.isDealer && (
            <span className="font-pixel text-[9px] bg-yellow-500 text-black px-1.5 py-0.5 rounded">D</span>
          )}
        </div>

        {/* Model name for AI */}
        {player.type === 'ai' && (
          <div className="text-[9px] text-slate-400 font-pixel mb-1">
            {player.aiModel?.split('/')[1]?.split('-').slice(0, 2).join(' ').toUpperCase()}
          </div>
        )}

        {/* Chips */}
        <div className="font-pixel text-sm text-emerald-300">
          ${player.chips.toLocaleString()}
        </div>

        {/* Status badge */}
        {(player.isFolded || player.isAllIn || player.currentBet > 0 || isThinking) && (
          <div className="mt-1">
            {player.isFolded && (
              <span className="font-pixel text-[9px] text-slate-500">FOLDED</span>
            )}
            {player.isAllIn && !player.isFolded && (
              <span className="font-pixel text-[9px] text-red-400">ALL IN</span>
            )}
            {player.currentBet > 0 && !player.isFolded && !player.isAllIn && (
              <span className="font-pixel text-[9px] text-yellow-400">BET ${player.currentBet}</span>
            )}
            {isThinking && (
              <span className="font-pixel text-[9px] text-cyan-400">THINKING...</span>
            )}
          </div>
        )}
      </div>

      {/* Cards - positioned based on seat location */}
      {player.hand.length > 0 && !player.isFolded && (
        <div className={`
          ${position === 'top' ? 'order-first' : ''}
          ${position === 'left' ? 'order-first' : ''}
        `}>
          <CardHand
            cards={player.hand}
            faceDown={!shouldShowCards}
            size="sm"
          />
        </div>
      )}
    </div>
  );
}
