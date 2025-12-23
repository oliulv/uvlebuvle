"use client";

import { useEffect } from "react";
import Leaderboard from "./Leaderboard";

interface ScoreboardModalProps {
  game: string;
  isOpen: boolean;
  onClose: () => void;
  refreshKey?: number;
}

export default function ScoreboardModal({
  game,
  isOpen,
  onClose,
  refreshKey,
}: ScoreboardModalProps) {
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white pixel-border p-6 max-w-sm w-full animate-zoom-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-pixel text-sm text-christmas-red">LEADERBOARD</h2>
          <button
            onClick={onClose}
            className="font-pixel text-xs text-gray-500 hover:text-gray-700"
          >
            [X]
          </button>
        </div>
        <Leaderboard game={game} refreshKey={refreshKey} />
      </div>
    </div>
  );
}
