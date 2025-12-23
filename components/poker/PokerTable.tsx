'use client';

import { GameState } from '@/lib/poker/types';
import PlayerSeat from './PlayerSeat';
import { CardHand } from './Card';

interface PokerTableProps {
  gameState: GameState;
  thinkingPlayerId: string | null;
  isFullscreen?: boolean;
}

export default function PokerTable({ gameState, thinkingPlayerId, isFullscreen = false }: PokerTableProps) {
  const { players, communityCards, pot, phase, currentPlayerIndex, winner, winningHand } = gameState;

  // Find players by position
  const bottomPlayer = players.find(p => p.position === 'bottom');
  const leftPlayer = players.find(p => p.position === 'left');
  const topPlayer = players.find(p => p.position === 'top');
  const rightPlayer = players.find(p => p.position === 'right');

  const showdown = phase === 'showdown' || phase === 'hand-complete';

  return (
    <div className="w-full h-full flex items-center justify-center">
      {/* Table container with relative positioning for player placement */}
      <div className={`relative w-full ${isFullscreen ? 'max-w-5xl' : 'max-w-4xl'}`}>
        {/* The oval table */}
        <div
          className="w-full bg-gradient-to-b from-emerald-600 to-emerald-700 rounded-[50%] relative overflow-hidden"
          style={{
            aspectRatio: isFullscreen ? '2.8/1' : '2.5/1',
            boxShadow: 'inset 0 0 60px rgba(0,0,0,0.3), 0 8px 32px rgba(0,0,0,0.4)'
          }}
        >
          {/* Inner felt border */}
          <div
            className="absolute inset-4 rounded-[50%] border-4 border-emerald-800/40"
          />

          {/* Rail/edge effect */}
          <div
            className="absolute inset-0 rounded-[50%]"
            style={{
              boxShadow: 'inset 0 0 0 8px rgba(139,69,19,0.6), inset 0 0 0 12px rgba(101,67,33,0.4)'
            }}
          />

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            {/* Pot */}
            {pot > 0 && (
              <div className={`font-pixel text-white ${isFullscreen ? 'text-sm' : 'text-xs'} bg-black/40 px-3 py-1.5 rounded-full`}>
                POT: ${pot}
              </div>
            )}

            {/* Community cards */}
            {communityCards.length > 0 && (
              <div className="bg-black/20 p-2 rounded-lg">
                <CardHand cards={communityCards} size={isFullscreen ? 'md' : 'sm'} />
              </div>
            )}

            {/* Winner announcement */}
            {phase === 'hand-complete' && winner && (
              <div className="font-pixel text-white text-center bg-black/50 px-4 py-2 rounded-lg">
                <div className={`text-yellow-400 ${isFullscreen ? 'text-sm' : 'text-xs'}`}>{winner.name} WINS!</div>
                <div className="text-[10px] text-white/80 mt-1">{winningHand}</div>
              </div>
            )}

            {/* Phase indicator */}
            {phase !== 'waiting' && phase !== 'hand-complete' && (
              <div className="font-pixel text-white/60 text-[10px]">
                {phase.toUpperCase().replace('-', ' ')}
              </div>
            )}
          </div>
        </div>

        {/* Player positions - absolutely positioned around the table */}

        {/* Top player */}
        {topPlayer && (
          <div className="absolute left-1/2 -translate-x-1/2 -top-2 -translate-y-1/2">
            <PlayerSeat
              player={topPlayer}
              isCurrentTurn={players[currentPlayerIndex]?.id === topPlayer.id}
              isThinking={thinkingPlayerId === topPlayer.id}
              showCards={showdown}
              phase={phase}
              position="top"
            />
          </div>
        )}

        {/* Left player */}
        {leftPlayer && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/4">
            <PlayerSeat
              player={leftPlayer}
              isCurrentTurn={players[currentPlayerIndex]?.id === leftPlayer.id}
              isThinking={thinkingPlayerId === leftPlayer.id}
              showCards={showdown}
              phase={phase}
              position="left"
            />
          </div>
        )}

        {/* Right player */}
        {rightPlayer && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4">
            <PlayerSeat
              player={rightPlayer}
              isCurrentTurn={players[currentPlayerIndex]?.id === rightPlayer.id}
              isThinking={thinkingPlayerId === rightPlayer.id}
              showCards={showdown}
              phase={phase}
              position="right"
            />
          </div>
        )}

        {/* Bottom player (human) */}
        {bottomPlayer && (
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 translate-y-1/2">
            <PlayerSeat
              player={bottomPlayer}
              isCurrentTurn={players[currentPlayerIndex]?.id === bottomPlayer.id}
              isThinking={thinkingPlayerId === bottomPlayer.id}
              showCards={true}
              phase={phase}
              position="bottom"
            />
          </div>
        )}
      </div>
    </div>
  );
}
