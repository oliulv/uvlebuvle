"use client";

interface InfoButtonProps {
  onClick: () => void;
}

export default function InfoButton({ onClick }: InfoButtonProps) {
  return (
    <button
      onClick={onClick}
      className="font-pixel text-xs w-8 h-8 pixel-border-sm bg-christmas-green text-white hover:bg-green-700 pixel-btn flex items-center justify-center"
      title="Info"
    >
      ?
    </button>
  );
}
