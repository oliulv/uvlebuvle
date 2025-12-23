"use client";

import { useDroppable } from "@dnd-kit/core";
import { Card as CardType, SUIT_SYMBOLS } from "../types";
import { FOUNDATION_SUITS } from "../gameLogic";
import Card, { EmptyPile } from "./Card";

interface FoundationPileProps {
  cards: CardType[];
  index: number;
  onDoubleClick?: (card: CardType) => void;
}

export default function FoundationPile({
  cards,
  index,
  onDoubleClick,
}: FoundationPileProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `foundation-${index}`,
    data: { pile: "foundation", index },
  });

  const suit = FOUNDATION_SUITS[index];
  const symbol = SUIT_SYMBOLS[suit];

  if (cards.length === 0) {
    return (
      <div ref={setNodeRef}>
        <EmptyPile symbol={symbol} isDropTarget={isOver} />
      </div>
    );
  }

  const topCard = cards[cards.length - 1];

  return (
    <div ref={setNodeRef} className="relative">
      <Card
        card={topCard}
        draggableId={`foundation-${index}-${topCard.id}`}
        onDoubleClick={() => onDoubleClick?.(topCard)}
      />
      {cards.length > 1 && (
        <div className="absolute -bottom-1 -right-1 bg-white text-[#1a6b1a] text-[0.6em] px-1 rounded font-bold">
          {cards.length}
        </div>
      )}
    </div>
  );
}
