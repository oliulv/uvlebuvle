import PixelButton from "@/components/PixelButton";
import { Difficulty } from "../types";
import { formatTime } from "../gameLogic";

interface WinModalProps {
  score: number;
  time: number;
  mistakes: number;
  hintsUsed: number;
  difficulty: Difficulty;
  onNewGame: () => void;
}

export default function WinModal({
  score,
  time,
  mistakes,
  hintsUsed,
  difficulty,
  onNewGame,
}: WinModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white pixel-border p-8 text-center max-w-sm mx-4">
        <h2 className="font-pixel text-xl text-christmas-green mb-4">
          PUZZLE SOLVED!
        </h2>

        <div className="space-y-2 mb-6">
          <p className="font-pixel text-sm text-gray-600">FINAL SCORE</p>
          <p className="font-pixel text-2xl text-christmas-red">{score}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6 font-pixel text-xs">
          <div className="bg-grey-light p-2 pixel-border-sm">
            <p className="text-gray-500">TIME</p>
            <p className="text-foreground">{formatTime(time)}</p>
          </div>
          <div className="bg-grey-light p-2 pixel-border-sm">
            <p className="text-gray-500">LEVEL</p>
            <p className="text-christmas-green">{difficulty.toUpperCase()}</p>
          </div>
          <div className="bg-grey-light p-2 pixel-border-sm">
            <p className="text-gray-500">ERRORS</p>
            <p className={mistakes > 0 ? "text-christmas-red" : "text-foreground"}>
              {mistakes}
            </p>
          </div>
          <div className="bg-grey-light p-2 pixel-border-sm">
            <p className="text-gray-500">HINTS</p>
            <p className="text-foreground">{hintsUsed}</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="font-pixel text-xs text-gray-500 mb-4">
            * * * CONGRATULATIONS * * *
          </p>
          <PixelButton onClick={onNewGame}>PLAY AGAIN</PixelButton>
        </div>
      </div>
    </div>
  );
}
