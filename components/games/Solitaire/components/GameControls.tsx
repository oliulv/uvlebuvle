import PixelButton from "@/components/PixelButton";

interface GameControlsProps {
  onNewGame: () => void;
  onUndo: () => void;
  onToggleFullscreen: () => void;
  canUndo: boolean;
  isFullscreen: boolean;
}

export default function GameControls({
  onNewGame,
  onUndo,
  onToggleFullscreen,
  canUndo,
  isFullscreen,
}: GameControlsProps) {
  return (
    <div className="flex gap-2">
      <PixelButton variant="secondary" onClick={onUndo} disabled={!canUndo}>
        UNDO
      </PixelButton>
      <PixelButton variant="secondary" onClick={onNewGame}>
        RESTART
      </PixelButton>
      <PixelButton variant="secondary" onClick={onToggleFullscreen}>
        {isFullscreen ? "EXIT" : "FULL"}
      </PixelButton>
    </div>
  );
}
