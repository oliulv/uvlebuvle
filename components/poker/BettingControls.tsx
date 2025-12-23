'use client';

import { useState } from 'react';
import { BettingAction, GameState } from '@/lib/poker/types';
import { getAvailableActions, getCallAmount, getMinRaise, getMaxRaise } from '@/lib/poker/gameEngine';

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

  const STEP = 10;

  const handleRaiseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || minRaise;
    setRaiseAmount(Math.min(Math.max(value, minRaise), maxRaise));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setRaiseAmount(prev => Math.min(prev + STEP, maxRaise));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setRaiseAmount(prev => Math.max(prev - STEP, minRaise));
    }
  };

  const incrementRaise = () => {
    setRaiseAmount(prev => Math.min(prev + STEP, maxRaise));
  };

  const decrementRaise = () => {
    setRaiseAmount(prev => Math.max(prev - STEP, minRaise));
  };

  const buttonBase = "font-pixel text-xs px-4 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-4">
      <div className="flex flex-wrap gap-3 justify-center items-center">
        {/* Fold */}
        {canFold && (
          <button
            onClick={() => onAction('fold')}
            disabled={disabled}
            className={`${buttonBase} bg-red-600 hover:bg-red-500 text-white`}
          >
            FOLD
          </button>
        )}

        {/* Check */}
        {canCheck && (
          <button
            onClick={() => onAction('check')}
            disabled={disabled}
            className={`${buttonBase} bg-slate-600 hover:bg-slate-500 text-white`}
          >
            CHECK
          </button>
        )}

        {/* Call */}
        {canCall && (
          <button
            onClick={() => onAction('call')}
            disabled={disabled}
            className={`${buttonBase} bg-emerald-600 hover:bg-emerald-500 text-white`}
          >
            CALL ${callAmount}
          </button>
        )}

        {/* Raise */}
        {canRaise && (
          <div className="flex items-center gap-2">
            {/* Quick raise buttons */}
            <div className="flex gap-1">
              {[
                { label: 'MIN', value: minRaise },
                { label: '50%', value: Math.floor((minRaise + maxRaise) / 2) },
                { label: 'POT', value: Math.floor(gameState.pot + minRaise) },
                { label: 'MAX', value: maxRaise },
              ].map(({ label, value }) => (
                <button
                  key={label}
                  onClick={() => setRaiseAmount(Math.min(value, maxRaise))}
                  disabled={disabled}
                  className="font-pixel text-[9px] px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded disabled:opacity-50"
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Amount input */}
            <div className="flex items-center bg-slate-900 rounded-lg overflow-hidden">
              <button
                onClick={decrementRaise}
                disabled={disabled || raiseAmount <= minRaise}
                className="px-3 py-2 font-pixel text-sm text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30"
              >
                -
              </button>
              <input
                type="number"
                min={minRaise}
                max={maxRaise}
                step={STEP}
                value={raiseAmount}
                onChange={handleRaiseChange}
                onKeyDown={handleKeyDown}
                className="w-20 px-2 py-2 font-pixel text-xs bg-transparent text-white text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:outline-none"
                disabled={disabled}
              />
              <button
                onClick={incrementRaise}
                disabled={disabled || raiseAmount >= maxRaise}
                className="px-3 py-2 font-pixel text-sm text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30"
              >
                +
              </button>
            </div>

            {/* Raise button */}
            <button
              onClick={() => onAction('raise', raiseAmount)}
              disabled={disabled}
              className={`${buttonBase} bg-amber-600 hover:bg-amber-500 text-white`}
            >
              RAISE ${raiseAmount}
            </button>
          </div>
        )}

        {/* All-In */}
        {canAllIn && maxRaise > 0 && (
          <button
            onClick={() => onAction('all-in')}
            disabled={disabled}
            className={`${buttonBase} bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white`}
          >
            ALL IN ${maxRaise - (gameState.players[gameState.currentPlayerIndex]?.currentBet || 0)}
          </button>
        )}
      </div>
    </div>
  );
}
