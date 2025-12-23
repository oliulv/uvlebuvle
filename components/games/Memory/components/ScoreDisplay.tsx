'use client';

interface ScoreDisplayProps {
  humanMatches: number;
  aiMatches: number;
  currentPlayer: 'human' | 'ai';
  totalPairs: number;
}

export default function ScoreDisplay({
  humanMatches,
  aiMatches,
  currentPlayer,
  totalPairs,
}: ScoreDisplayProps) {
  const totalFound = humanMatches + aiMatches;

  return (
    <div className="flex items-center gap-1.5 sm:gap-3">
      {/* Human matches */}
      <div
        className={`
          text-center px-1.5 sm:px-2 py-0.5 sm:py-1 pixel-border-sm
          ${currentPlayer === 'human' ? 'bg-christmas-green text-white' : 'bg-white'}
        `}
      >
        <div className="font-pixel text-[8px] sm:text-[10px]">YOU</div>
        <div className="font-pixel text-xs sm:text-base">{humanMatches}</div>
      </div>

      {/* Progress counter */}
      <div className="text-center">
        <div className="font-pixel text-[8px] sm:text-[10px] text-gray-500">PAIRS</div>
        <div className="font-pixel text-xs sm:text-sm">{totalFound}/{totalPairs}</div>
      </div>

      {/* AI matches */}
      <div
        className={`
          text-center px-1.5 sm:px-2 py-0.5 sm:py-1 pixel-border-sm
          ${currentPlayer === 'ai' ? 'bg-blue-500 text-white' : 'bg-white'}
        `}
      >
        <div className="font-pixel text-[8px] sm:text-[10px]">AI</div>
        <div className="font-pixel text-xs sm:text-base">{aiMatches}</div>
      </div>
    </div>
  );
}
