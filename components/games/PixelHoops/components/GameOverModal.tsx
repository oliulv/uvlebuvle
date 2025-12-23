"use client";

import PixelButton from "@/components/PixelButton";

interface GameOverModalProps {
  score: number;
  shotsMade: number;
  shotsMissed: number;
  onPlayAgain: () => void;
}

export default function GameOverModal({
  score,
  shotsMade,
  shotsMissed,
  onPlayAgain,
}: GameOverModalProps) {
  const totalShots = shotsMade + shotsMissed;
  const accuracy = totalShots > 0 ? Math.round((shotsMade / totalShots) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-grey-light pixel-border p-6 text-center max-w-sm mx-4">
        <h2 className="font-pixel text-xl text-christmas-red mb-4">GAME OVER!</h2>

        <div className="space-y-3 mb-6">
          <div className="bg-white pixel-border-sm p-3">
            <p className="font-pixel text-xs text-gray-500">FINAL SCORE</p>
            <p className="font-pixel text-3xl text-christmas-green">{score}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white pixel-border-sm p-2">
              <p className="font-pixel text-xs text-gray-500">SHOTS MADE</p>
              <p className="font-pixel text-lg text-foreground">{shotsMade}</p>
            </div>
            <div className="bg-white pixel-border-sm p-2">
              <p className="font-pixel text-xs text-gray-500">ACCURACY</p>
              <p className="font-pixel text-lg text-foreground">{accuracy}%</p>
            </div>
          </div>
        </div>

        <PixelButton onClick={onPlayAgain}>PLAY AGAIN</PixelButton>
      </div>
    </div>
  );
}
