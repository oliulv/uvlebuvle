'use client';

import { useEffect } from 'react';

interface CardZoomModalProps {
  imagePath: string | null;
  onClose: () => void;
}

export default function CardZoomModal({ imagePath, onClose }: CardZoomModalProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (imagePath) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [imagePath, onClose]);

  if (!imagePath) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-40 p-4 cursor-pointer animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl max-h-[80vh] w-full animate-zoom-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pixel-border bg-white p-2">
          <img
            src={imagePath}
            alt="Card"
            className="w-full h-auto max-h-[70vh] object-contain"
          />
        </div>
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-8 h-8 bg-christmas-red text-white font-pixel text-xs pixel-border-sm hover:bg-red-700 flex items-center justify-center"
        >
          X
        </button>
      </div>
    </div>
  );
}
