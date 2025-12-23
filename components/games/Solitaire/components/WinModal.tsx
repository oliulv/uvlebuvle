import PixelButton from "@/components/PixelButton";

interface WinModalProps {
  score: number;
  moves: number;
  onNewGame: () => void;
}

export default function WinModal({ score, moves, onNewGame }: WinModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white pixel-border p-8 text-center max-w-sm mx-4">
        <h2 className="font-pixel text-xl text-christmas-green mb-4">
          YOU WIN!
        </h2>

        <div className="space-y-2 mb-6">
          <p className="font-pixel text-sm text-gray-600">
            FINAL SCORE
          </p>
          <p className="font-pixel text-2xl text-christmas-red">
            {score}
          </p>
          <p className="font-pixel text-xs text-gray-500">
            COMPLETED IN {moves} MOVES
          </p>
        </div>

        <div className="space-y-2">
          <p className="font-pixel text-xs text-gray-500 mb-4">
            * * * CONGRATULATIONS * * *
          </p>
          <PixelButton onClick={onNewGame}>
            PLAY AGAIN
          </PixelButton>
        </div>
      </div>
    </div>
  );
}
