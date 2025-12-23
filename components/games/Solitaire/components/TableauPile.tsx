"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Card as CardType, SUIT_SYMBOLS, SUIT_COLORS } from "../types";
import { EmptyPile } from "./Card";

interface TableauPileProps {
  cards: CardType[];
  index: number;
  onDoubleClick?: (card: CardType) => void;
}

// A single card display (non-draggable version for use in stacks)
function CardDisplay({ card }: { card: CardType }) {
  const color = SUIT_COLORS[card.suit];
  const symbol = SUIT_SYMBOLS[card.suit];

  if (!card.faceUp) {
    return (
      <div className="card-size rounded pixel-border-sm bg-[#1a4d8c] select-none flex-shrink-0">
        <div className="w-full h-full flex items-center justify-center p-[6%]">
          <div className="w-full h-full border-2 border-white/40 rounded flex items-center justify-center bg-[#1a4d8c]">
            <div className="text-white/60 text-[1.2em]">✦</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-size rounded pixel-border-sm bg-white select-none flex-shrink-0">
      <div className="w-full h-full p-[6%] flex flex-col justify-between">
        <div className={`text-[0.7em] font-bold leading-none ${color === "red" ? "text-[#c41e3a]" : "text-[#1a1a1a]"}`}>
          <div>{card.rank}</div>
          <div className="text-[1.2em]">{symbol}</div>
        </div>
        <div className={`text-[1.8em] text-center leading-none ${color === "red" ? "text-[#c41e3a]" : "text-[#1a1a1a]"}`}>
          {symbol}
        </div>
        <div className={`text-[0.7em] font-bold leading-none self-end rotate-180 ${color === "red" ? "text-[#c41e3a]" : "text-[#1a1a1a]"}`}>
          <div>{card.rank}</div>
          <div className="text-[1.2em]">{symbol}</div>
        </div>
      </div>
    </div>
  );
}

// A draggable stack of cards (one or more cards that move together)
function DraggableCardStack({
  cards,
  pileIndex,
  startCardIndex,
  onDoubleClick,
}: {
  cards: CardType[];
  pileIndex: number;
  startCardIndex: number;
  onDoubleClick?: (card: CardType) => void;
}) {
  const firstCard = cards[0];
  const draggableId = `tableau-${pileIndex}-${firstCard.id}`;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: draggableId,
    data: { card: firstCard, cards },
  });

  const dragStyle = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 1000,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      className={`relative cursor-grab active:cursor-grabbing ${isDragging ? "opacity-50" : ""}`}
      style={dragStyle}
      {...listeners}
      {...attributes}
      onDoubleClick={() => {
        // Double-click only on the top card of the stack
        if (cards.length === 1 || startCardIndex === cards.length - 1) {
          onDoubleClick?.(cards[cards.length - 1]);
        }
      }}
    >
      {cards.map((card, i) => (
        <div
          key={card.id}
          className="absolute left-0"
          style={{
            top: `calc(${i} * var(--face-up-offset))`,
            zIndex: i,
          }}
        >
          <CardDisplay card={card} />
        </div>
      ))}
      {/* Invisible element to set the height */}
      <div
        style={{
          width: "var(--card-width)",
          height: `calc(${cards.length - 1} * var(--face-up-offset) + var(--card-height))`,
        }}
      />
    </div>
  );
}

export default function TableauPile({
  cards,
  index,
  onDoubleClick,
}: TableauPileProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `tableau-${index}`,
    data: { pile: "tableau", index },
  });

  if (cards.length === 0) {
    return (
      <div ref={setNodeRef}>
        <EmptyPile isDropTarget={isOver} />
      </div>
    );
  }

  // Split cards into face-down cards and face-up sequences
  // Face-up cards from the first face-up card onward should be draggable as stacks
  const firstFaceUpIndex = cards.findIndex((c) => c.faceUp);
  const faceDownCards = firstFaceUpIndex === -1 ? cards : cards.slice(0, firstFaceUpIndex);
  const faceUpCards = firstFaceUpIndex === -1 ? [] : cards.slice(firstFaceUpIndex);

  // Calculate the top position for each face-down card
  const getFaceDownTop = (i: number) => `calc(${i} * var(--face-down-offset))`;

  // The face-up cards start after all face-down cards
  const faceUpStartTop = `calc(${faceDownCards.length} * var(--face-down-offset))`;

  // Total height calculation
  const totalHeight = `calc(${faceDownCards.length} * var(--face-down-offset) + ${Math.max(0, faceUpCards.length - 1)} * var(--face-up-offset) + var(--card-height))`;

  return (
    <div
      ref={setNodeRef}
      className="relative"
      style={{
        width: "var(--card-width)",
        height: totalHeight,
        minHeight: "var(--card-height)",
      }}
    >
      {/* Face-down cards (not draggable) */}
      {faceDownCards.map((card, i) => (
        <div
          key={card.id}
          className="absolute left-0"
          style={{ top: getFaceDownTop(i), zIndex: i }}
        >
          <CardDisplay card={card} />
        </div>
      ))}

      {/* Face-up cards - each card is draggable with all cards below it */}
      {faceUpCards.map((card, i) => {
        const cardsFromHere = faceUpCards.slice(i);
        const topPosition = `calc(${faceDownCards.length} * var(--face-down-offset) + ${i} * var(--face-up-offset))`;

        return (
          <div
            key={card.id}
            className="absolute left-0"
            style={{ top: topPosition, zIndex: faceDownCards.length + i }}
          >
            <DraggableCardStack
              cards={cardsFromHere}
              pileIndex={index}
              startCardIndex={i}
              onDoubleClick={i === faceUpCards.length - 1 ? onDoubleClick : undefined}
            />
          </div>
        );
      })}

      {/* Drop target indicator */}
      {isOver && (
        <div
          className="absolute left-0 card-size border-2 border-white/80 rounded bg-white/20"
          style={{ top: totalHeight, zIndex: 100 }}
        />
      )}
    </div>
  );
}
