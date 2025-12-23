"use client";

import { Card as CardType } from "../types";
import Card, { EmptyPile } from "./Card";

interface WastePileProps {
  cards: CardType[];
  onDoubleClick?: (card: CardType) => void;
}

export default function WastePile({ cards, onDoubleClick }: WastePileProps) {
  if (cards.length === 0) {
    return <EmptyPile />;
  }

  // Show up to 3 cards fanned horizontally, aligned to the right
  const visibleCards = cards.slice(-3);
  const fanOffset = 18; // pixels between fanned cards

  return (
    <div
      className="relative"
      style={{
        width: `calc(var(--card-width) + ${(visibleCards.length - 1) * fanOffset}px)`,
        height: "var(--card-height)",
      }}
    >
      {visibleCards.map((card, index) => {
        const isTop = index === visibleCards.length - 1;
        // Position from left so the rightmost (top) card is at the right edge
        const leftOffset = index * fanOffset;
        return (
          <div
            key={card.id}
            className="absolute top-0"
            style={{ left: leftOffset }}
          >
            <Card
              card={card}
              draggableId={isTop ? `waste-${card.id}` : undefined}
              onDoubleClick={isTop ? () => onDoubleClick?.(card) : undefined}
            />
          </div>
        );
      })}
    </div>
  );
}
