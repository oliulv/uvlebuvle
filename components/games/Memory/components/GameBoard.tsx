'use client';

import { MemoryCard, GRID_COLS } from '../types';
import Card from './Card';

interface GameBoardProps {
  cards: MemoryCard[];
  onCardClick: (cardId: string) => void;
  onCardZoom: (imagePath: string) => void;
  disabled: boolean;
}

export default function GameBoard({ cards, onCardClick, onCardZoom, disabled }: GameBoardProps) {
  return (
    <div className="flex-1 min-h-0 overflow-hidden">
      <div
        className="grid gap-2 w-full h-full"
        style={{
          gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
          gridTemplateRows: `repeat(4, 1fr)`,
        }}
      >
        {cards.map((card) => (
          <div key={card.id} className="min-h-0 min-w-0">
            <Card
              card={card}
              onClick={() => onCardClick(card.id)}
              onZoom={() => onCardZoom(card.imagePath)}
              disabled={disabled}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
