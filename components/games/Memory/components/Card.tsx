'use client';

import { MemoryCard } from '../types';

interface CardProps {
  card: MemoryCard;
  onClick: () => void;
  onZoom: () => void;
  disabled: boolean;
}

export default function Card({ card, onClick, onZoom, disabled }: CardProps) {
  const isClickable = !disabled && !card.matched && !card.faceUp;
  const canZoom = card.faceUp || card.matched;
  const isFlipped = card.faceUp || card.matched;

  const handleClick = () => {
    if (isClickable) {
      onClick();
    } else if (canZoom) {
      onZoom();
    }
  };

  // Determine match overlay styles based on who matched
  const getMatchOverlay = () => {
    if (!card.matched) return null;

    if (card.matchedBy === 'human') {
      return (
        <div className="absolute inset-0 bg-christmas-green/40 flex items-center justify-center">
          <span className="font-pixel text-white text-[10px] sm:text-xs drop-shadow-lg">OK</span>
        </div>
      );
    } else {
      return (
        <div className="absolute inset-0 bg-blue-500/40 flex items-center justify-center">
          <span className="font-pixel text-white text-[10px] sm:text-xs drop-shadow-lg">AI</span>
        </div>
      );
    }
  };

  // Ring color based on who matched
  const getRingClass = () => {
    if (!card.matched) return '';
    return card.matchedBy === 'human'
      ? 'ring-2 ring-christmas-green'
      : 'ring-2 ring-blue-500';
  };

  return (
    <div
      className={`
        relative w-full h-full
        ${isClickable ? 'cursor-pointer' : ''}
        ${canZoom ? 'cursor-zoom-in' : ''}
      `}
      style={{ perspective: '1000px' }}
      onClick={handleClick}
    >
      <div
        className="relative w-full h-full transition-transform duration-500 ease-in-out"
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Back of card */}
        <div
          className={`
            absolute inset-0
            pixel-border-sm bg-christmas-red
            flex items-center justify-center
            ${isClickable ? 'hover:bg-red-600 hover:scale-105 transition-all' : ''}
          `}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <span className="text-white font-pixel text-sm sm:text-base">?</span>
        </div>

        {/* Front of card */}
        <div
          className={`
            absolute inset-0
            pixel-border-sm overflow-hidden
            ${getRingClass()}
          `}
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <img
            src={card.imagePath}
            alt="Memory card"
            className="w-full h-full object-cover"
            draggable={false}
          />
          {getMatchOverlay()}
          {canZoom && !card.matched && (
            <div className="absolute bottom-0 right-0 bg-black/60 px-1 text-white font-pixel text-[8px]">
              +
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
