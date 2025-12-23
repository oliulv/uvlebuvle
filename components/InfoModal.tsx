"use client";

import { useEffect } from "react";

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InfoModal({ isOpen, onClose }: InfoModalProps) {
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
        className="bg-white pixel-border p-6 max-w-md w-full animate-zoom-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-pixel text-sm text-christmas-red text-center mb-6">
          MERRY CHRISTMAS!
        </h2>
        <div className="space-y-4 text-gray-600 text-sm leading-relaxed">
          <p>
            Dear Family,
          </p>
          <p>
            I love you all so much! Even though we&apos;re spread around the
            country and the world now, I hope these games bring us a little
            closer together.
          </p>
          <p>
            This website is probably a bit buggy - please let me know if
            something breaks and I&apos;ll try to fix it!
          </p>
          <p className="text-christmas-green font-medium">
            Happy gaming and Merry Christmas!
          </p>
        </div>
        <div className="text-center mt-6">
          <button
            onClick={onClose}
            className="font-pixel text-xs px-6 py-3 pixel-border-sm bg-christmas-red text-white hover:bg-red-700 pixel-btn"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
