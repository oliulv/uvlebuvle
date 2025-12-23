"use client";

import { useDraggable } from "@dnd-kit/core";
import { Card as CardType, SUIT_SYMBOLS, SUIT_COLORS } from "../types";

interface CardProps {
  card: CardType;
  isDragging?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
  onDoubleClick?: () => void;
  draggableId?: string;
}

export default function Card({
  card,
  isDragging = false,
  style,
  onClick,
  onDoubleClick,
  draggableId,
}: CardProps) {
  const canDrag = card.faceUp && !!draggableId;

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: draggableId || card.id,
    disabled: !canDrag,
    data: { card },
  });

  const dragStyle = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 1000,
      }
    : undefined;

  const color = SUIT_COLORS[card.suit];
  const symbol = SUIT_SYMBOLS[card.suit];

  if (!card.faceUp) {
    return (
      <div
        className="card-size rounded pixel-border-sm bg-[#1a4d8c] select-none flex-shrink-0"
        style={style}
        onClick={onClick}
      >
        <div className="w-full h-full flex items-center justify-center p-[6%]">
          <div className="w-full h-full border-2 border-white/40 rounded flex items-center justify-center bg-[#1a4d8c]">
            <div className="text-white/60 text-[1.2em]">✦</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={canDrag ? setNodeRef : undefined}
      className={`card-size rounded pixel-border-sm bg-white select-none flex-shrink-0
        ${isDragging ? "opacity-50" : ""}
        ${canDrag ? "cursor-grab hover:shadow-lg active:cursor-grabbing" : ""}
      `}
      style={{ ...style, ...dragStyle }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      {...(canDrag ? { ...listeners, ...attributes } : {})}
    >
      <div className="w-full h-full p-[6%] flex flex-col justify-between">
        <div
          className={`text-[0.7em] font-bold leading-none ${
            color === "red" ? "text-[#c41e3a]" : "text-[#1a1a1a]"
          }`}
        >
          <div>{card.rank}</div>
          <div className="text-[1.2em]">{symbol}</div>
        </div>

        <div
          className={`text-[1.8em] text-center leading-none ${
            color === "red" ? "text-[#c41e3a]" : "text-[#1a1a1a]"
          }`}
        >
          {symbol}
        </div>

        <div
          className={`text-[0.7em] font-bold leading-none self-end rotate-180 ${
            color === "red" ? "text-[#c41e3a]" : "text-[#1a1a1a]"
          }`}
        >
          <div>{card.rank}</div>
          <div className="text-[1.2em]">{symbol}</div>
        </div>
      </div>
    </div>
  );
}

// Card back component for stock pile display
export function CardBack({
  onClick,
  style,
}: {
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="card-size rounded pixel-border-sm bg-[#1a4d8c] select-none flex-shrink-0 cursor-pointer hover:brightness-110"
      style={style}
      onClick={onClick}
    >
      <div className="w-full h-full flex items-center justify-center p-[6%]">
        <div className="w-full h-full border-2 border-white/40 rounded flex items-center justify-center">
          <div className="text-white/60 text-[1.2em]">✦</div>
        </div>
      </div>
    </div>
  );
}

// Empty pile placeholder
export function EmptyPile({
  symbol,
  onClick,
  isDropTarget,
  showRecycleHint,
}: {
  symbol?: string;
  onClick?: () => void;
  isDropTarget?: boolean;
  showRecycleHint?: boolean;
}) {
  return (
    <div
      className={`card-size rounded-lg border-2 flex items-center justify-center select-none flex-shrink-0
        ${isDropTarget ? "border-white/80 bg-white/20" : "border-white/30 bg-white/5"}
        ${onClick ? "cursor-pointer hover:border-white/60 hover:bg-white/10" : ""}
      `}
      onClick={onClick}
    >
      {showRecycleHint ? (
        <span className="text-white/70 text-[1.5em]">↻</span>
      ) : symbol ? (
        <span className="text-[1.8em] text-white/30">{symbol}</span>
      ) : null}
    </div>
  );
}
