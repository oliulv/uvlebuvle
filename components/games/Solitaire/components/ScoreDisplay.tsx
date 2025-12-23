interface ScoreDisplayProps {
  score: number;
  moves: number;
}

export default function ScoreDisplay({ score, moves }: ScoreDisplayProps) {
  return (
    <div className="flex gap-6 font-pixel text-xs">
      <div className="flex gap-2">
        <span className="text-white/70">SCORE:</span>
        <span className="text-white font-bold">{score}</span>
      </div>
      <div className="flex gap-2">
        <span className="text-white/70">MOVES:</span>
        <span className="text-white font-bold">{moves}</span>
      </div>
    </div>
  );
}
