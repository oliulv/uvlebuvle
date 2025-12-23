import { Difficulty } from "../types";
import PixelButton from "@/components/PixelButton";

interface GameControlsProps {
  difficulty: Difficulty;
  onNewGame: (difficulty: Difficulty) => void;
  onUndo: () => void;
  onHint: () => void;
  canUndo: boolean;
  hintsRemaining: number;
}

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

export default function GameControls({
  difficulty,
  onNewGame,
  onUndo,
  onHint,
  canUndo,
  hintsRemaining,
}: GameControlsProps) {
  return (
    <div className="space-y-3">
      {/* Difficulty selector */}
      <div className="flex justify-center gap-2">
        {DIFFICULTIES.map((d) => (
          <button
            key={d}
            onClick={() => onNewGame(d)}
            className={`
              font-pixel text-xs px-3 py-2 pixel-border-sm
              transition-colors
              ${
                d === difficulty
                  ? "bg-christmas-green text-white"
                  : "bg-grey-light text-foreground hover:bg-grey-medium"
              }
            `}
          >
            {d.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex justify-center gap-2">
        <PixelButton
          variant="secondary"
          onClick={onUndo}
          disabled={!canUndo}
          className="text-xs px-3 py-2"
        >
          UNDO
        </PixelButton>
        <PixelButton
          variant="secondary"
          onClick={onHint}
          disabled={hintsRemaining === 0}
          className="text-xs px-3 py-2"
        >
          HINT ({hintsRemaining})
        </PixelButton>
        <PixelButton
          variant="secondary"
          onClick={() => onNewGame(difficulty)}
          className="text-xs px-3 py-2"
        >
          NEW
        </PixelButton>
      </div>
    </div>
  );
}
