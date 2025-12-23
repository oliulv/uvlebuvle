"use client";

import { Card as CardType } from "../types";
import { CardBack, EmptyPile } from "./Card";

interface StockPileProps {
  cards: CardType[];
  wasteHasCards: boolean;
  onDraw: () => void;
  onRecycle: () => void;
}

export default function StockPile({ cards, wasteHasCards, onDraw, onRecycle }: StockPileProps) {
  if (cards.length === 0) {
    // Show recycle hint only if there are cards in waste to recycle
    return <EmptyPile onClick={wasteHasCards ? onRecycle : undefined} showRecycleHint={wasteHasCards} />;
  }

  return (
    <div className="relative">
      <CardBack onClick={onDraw} />
      {cards.length > 1 && (
        <div className="absolute -bottom-1 -right-1 bg-white text-[#1a6b1a] text-[0.6em] px-1 rounded font-bold">
          {cards.length}
        </div>
      )}
    </div>
  );
}
