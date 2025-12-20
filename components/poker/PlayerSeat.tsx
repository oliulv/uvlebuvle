'use client';

import { Player, GamePhase } from '@/lib/poker/types';
import { CardHand } from './Card';

interface PlayerSeatProps {
  player: Player;
  isCurrentTurn: boolean;
  isThinking: boolean;
  showCards: boolean;
  phase: GamePhase;
}

export default function PlayerSeat({
  player,
  isCurrentTurn,
  isThinking,
  showCards,
  phase,
}: PlayerSeatProps) {
  const isHuman = player.type === 'human';
  const shouldShowCards = isHuman || showCards || phase === 'showdown' || phase === 'hand-complete';

  return (
    <div
      className={`
        p-3 pixel-border-sm bg-grey-light
        ${isCurrentTurn ? 'ring-2 ring-christmas-red' : ''}
        ${player.isFolded ? 'opacity-50' : ''}
      `}
    >
      {/* Player info */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="font-pixel text-xs text-christmas-green">{player.name}</div>
          {player.type === 'ai' && (
            <div className="text-[8px] text-gray-500 font-pixel">
              {player.aiModel?.split('/')[1]?.split('-').slice(0, 2).join(' ').toUpperCase()}
            </div>
          )}
        </div>
        {player.isDealer && (
          <div className="font-pixel text-[10px] bg-christmas-red text-white px-1">D</div>
        )}
      </div>

      {/* Chips */}
      <div className="font-pixel text-xs mb-2">
        ${player.chips}
      </div>

      {/* Cards */}
      {player.hand.length > 0 && !player.isFolded && (
        <div className="mb-2">
          <CardHand
            cards={player.hand}
            faceDown={!shouldShowCards}
            size="sm"
          />
        </div>
      )}

      {/* Status */}
      <div className="font-pixel text-[10px]">
        {player.isFolded && <span className="text-gray-500">FOLDED</span>}
        {player.isAllIn && !player.isFolded && (
          <span className="text-christmas-red">ALL IN</span>
        )}
        {player.currentBet > 0 && !player.isFolded && !player.isAllIn && (
          <span className="text-christmas-green">BET: ${player.currentBet}</span>
        )}
        {isThinking && (
          <span className="text-christmas-red animate-pulse">THINKING...</span>
        )}
      </div>
    </div>
  );
}
