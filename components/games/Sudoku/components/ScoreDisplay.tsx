import { Difficulty } from "../types";
import { formatTime } from "../gameLogic";

interface ScoreDisplayProps {
  elapsedTime: number;
  mistakes: number;
  hintsRemaining: number;
  difficulty: Difficulty;
}

export default function ScoreDisplay({
  elapsedTime,
  mistakes,
  hintsRemaining,
  difficulty,
}: ScoreDisplayProps) {
  return (
    <div className="flex flex-wrap gap-3 sm:gap-6 font-pixel text-xs justify-center sm:justify-start">
      <div className="flex gap-1 sm:gap-2">
        <span className="text-gray-500">TIME:</span>
        <span className="text-foreground">{formatTime(elapsedTime)}</span>
      </div>
      <div className="flex gap-1 sm:gap-2">
        <span className="text-gray-500">ERRORS:</span>
        <span className={mistakes > 0 ? "text-christmas-red" : "text-foreground"}>
          {mistakes}
        </span>
      </div>
      <div className="flex gap-1 sm:gap-2">
        <span className="text-gray-500">HINTS:</span>
        <span className={hintsRemaining === 0 ? "text-gray-400" : "text-foreground"}>
          {hintsRemaining}
        </span>
      </div>
      <div className="flex gap-1 sm:gap-2">
        <span className="text-gray-500">LEVEL:</span>
        <span className="text-christmas-green">{difficulty.toUpperCase()}</span>
      </div>
    </div>
  );
}
