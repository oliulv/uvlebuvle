'use client';

import { useState } from 'react';
import { BettingAction, GameState } from '@/lib/poker/types';
import { getAvailableActions, getCallAmount, getMinRaise, getMaxRaise } from '@/lib/poker/gameEngine';
import PixelButton from '@/components/PixelButton';

interface BettingControlsProps {
  gameState: GameState;
  onAction: (action: BettingAction, amount?: number) => void;
  disabled: boolean;
}

export default function BettingControls({ gameState, onAction, disabled }: BettingControlsProps) {
  const availableActions = getAvailableActions(gameState);
  const callAmount = getCallAmount(gameState);
  const minRaise = getMinRaise(gameState);
  const maxRaise = getMaxRaise(gameState);

  const [raiseAmount, setRaiseAmount] = useState(minRaise);

  // Update raise amount when min changes
  if (raiseAmount < minRaise) {
    setRaiseAmount(minRaise);
  }

  const canCheck = availableActions.includes('check');
  const canCall = availableActions.includes('call');
  const canRaise = availableActions.includes('raise');
  const canFold = availableActions.includes('fold');
  const canAllIn = availableActions.includes('all-in');

  const handleRaiseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || minRaise;
    setRaiseAmount(Math.min(Math.max(value, minRaise), maxRaise));
  };

  return (
    <div className="bg-grey-light pixel-border-sm p-4">
      <div className="font-pixel text-xs text-center mb-3">YOUR ACTION</div>

      <div className="flex flex-wrap gap-2 justify-center items-center">
        {/* Fold */}
        {canFold && (
          <PixelButton
            variant="secondary"
            onClick={() => onAction('fold')}
            disabled={disabled}
          >
            FOLD
          </PixelButton>
        )}

        {/* Check */}
        {canCheck && (
          <PixelButton
            variant="primary"
            onClick={() => onAction('check')}
            disabled={disabled}
          >
            CHECK
          </PixelButton>
        )}

        {/* Call */}
        {canCall && (
          <PixelButton
            variant="primary"
            onClick={() => onAction('call')}
            disabled={disabled}
          >
            CALL ${callAmount}
          </PixelButton>
        )}

        {/* Raise */}
        {canRaise && (
          <div className="flex items-center gap-2">
            <PixelButton
              variant="primary"
              onClick={() => onAction('raise', raiseAmount)}
              disabled={disabled}
            >
              RAISE TO
            </PixelButton>
            <input
              type="number"
              min={minRaise}
              max={maxRaise}
              value={raiseAmount}
              onChange={handleRaiseChange}
              className="w-20 px-2 py-2 font-pixel text-xs pixel-border-sm bg-white"
              disabled={disabled}
            />
          </div>
        )}

        {/* All-In */}
        {canAllIn && maxRaise > 0 && (
          <PixelButton
            variant="primary"
            onClick={() => onAction('all-in')}
            disabled={disabled}
            className="bg-red-900 hover:bg-red-800"
          >
            ALL IN ${maxRaise - (gameState.players[gameState.currentPlayerIndex]?.currentBet || 0)}
          </PixelButton>
        )}
      </div>

      {/* Quick raise buttons */}
      {canRaise && (
        <div className="flex gap-2 justify-center mt-3">
          <button
            className="font-pixel text-[10px] px-2 py-1 bg-grey-medium hover:bg-gray-300 pixel-border-sm"
            onClick={() => setRaiseAmount(minRaise)}
            disabled={disabled}
          >
            MIN
          </button>
          <button
            className="font-pixel text-[10px] px-2 py-1 bg-grey-medium hover:bg-gray-300 pixel-border-sm"
            onClick={() => setRaiseAmount(Math.floor((minRaise + maxRaise) / 2))}
            disabled={disabled}
          >
            1/2
          </button>
          <button
            className="font-pixel text-[10px] px-2 py-1 bg-grey-medium hover:bg-gray-300 pixel-border-sm"
            onClick={() => setRaiseAmount(Math.floor(gameState.pot + minRaise))}
            disabled={disabled}
          >
            POT
          </button>
          <button
            className="font-pixel text-[10px] px-2 py-1 bg-grey-medium hover:bg-gray-300 pixel-border-sm"
            onClick={() => setRaiseAmount(maxRaise)}
            disabled={disabled}
          >
            MAX
          </button>
        </div>
      )}
    </div>
  );
}
