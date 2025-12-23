'use client';

import { Difficulty, POINTS_PER_MATCH, WIN_MULTIPLIER, TIE_MULTIPLIER } from '../types';

interface WinModalProps {
  winner: 'human' | 'ai' | 'tie';
  humanMatches: number;
  aiMatches: number;
  difficulty: Difficulty;
  finalScore: number;
  onPlayAgain: () => void;
  onSubmitScore: () => void;
  isSubmitting: boolean;
  scoreSubmitted: boolean;
}

export default function WinModal({
  winner,
  humanMatches,
  aiMatches,
  difficulty,
  finalScore,
  onPlayAgain,
  onSubmitScore,
  isSubmitting,
  scoreSubmitted,
}: WinModalProps) {
  const getResultText = () => {
    switch (winner) {
      case 'human':
        return 'YOU WIN!';
      case 'ai':
        return 'GEMINI WINS!';
      case 'tie':
        return "IT'S A TIE!";
    }
  };

  const getResultColor = () => {
    switch (winner) {
      case 'human':
        return 'text-christmas-green';
      case 'ai':
        return 'text-blue-500';
      case 'tie':
        return 'text-foreground';
    }
  };

  const getMultiplierText = () => {
    if (winner === 'human') return `WIN x${WIN_MULTIPLIER}`;
    if (winner === 'tie') return `TIE x${TIE_MULTIPLIER}`;
    return 'LOSS x1';
  };

  const baseScore = humanMatches * POINTS_PER_MATCH[difficulty];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white pixel-border p-6 max-w-sm w-full text-center">
        {/* Result */}
        <h2 className={`font-pixel text-2xl mb-4 ${getResultColor()}`}>
          {getResultText()}
        </h2>

        {/* Score breakdown */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between font-pixel text-xs">
            <span>Your pairs:</span>
            <span className="text-christmas-green">{humanMatches}</span>
          </div>
          <div className="flex justify-between font-pixel text-xs">
            <span>AI pairs:</span>
            <span className="text-blue-500">{aiMatches}</span>
          </div>
          <div className="flex justify-between font-pixel text-xs">
            <span>Difficulty:</span>
            <span>{difficulty.toUpperCase()} ({POINTS_PER_MATCH[difficulty]}pts/pair)</span>
          </div>
          <div className="flex justify-between font-pixel text-xs">
            <span>Base score:</span>
            <span>{baseScore}</span>
          </div>
          <div className="flex justify-between font-pixel text-xs">
            <span>Multiplier:</span>
            <span>{getMultiplierText()}</span>
          </div>
          <div className="border-t-2 border-black pt-2 mt-2">
            <div className="flex justify-between font-pixel text-sm">
              <span>FINAL SCORE:</span>
              <span className="text-christmas-green">{finalScore}</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          {!scoreSubmitted && (
            <button
              onClick={onSubmitScore}
              disabled={isSubmitting}
              className="font-pixel text-xs px-4 py-3 pixel-border-sm pixel-btn bg-christmas-green text-white hover:bg-green-700 disabled:opacity-50"
            >
              {isSubmitting ? 'SUBMITTING...' : 'SUBMIT SCORE'}
            </button>
          )}
          {scoreSubmitted && (
            <div className="font-pixel text-xs text-christmas-green py-2">
              SCORE SUBMITTED!
            </div>
          )}
          <button
            onClick={onPlayAgain}
            className="font-pixel text-xs px-4 py-3 pixel-border-sm pixel-btn bg-white hover:bg-grey-light"
          >
            PLAY AGAIN
          </button>
        </div>
      </div>
    </div>
  );
}
