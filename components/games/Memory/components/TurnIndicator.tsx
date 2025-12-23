'use client';

interface TurnIndicatorProps {
  currentPlayer: 'human' | 'ai';
  isThinking: boolean;
}

export default function TurnIndicator({ currentPlayer, isThinking }: TurnIndicatorProps) {
  if (currentPlayer === 'human') {
    return (
      <span className="font-pixel text-[10px] text-christmas-green">
        YOUR TURN
      </span>
    );
  }

  return (
    <span className="font-pixel text-[10px] text-blue-500">
      {isThinking ? (
        <span className="inline-flex items-center">
          AI THINKING<span className="animate-pulse">...</span>
        </span>
      ) : (
        "AI TURN"
      )}
    </span>
  );
}
