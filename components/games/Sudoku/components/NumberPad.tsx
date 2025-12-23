import { CellValue } from "../types";

interface NumberPadProps {
  onNumberClick: (value: CellValue) => void;
  disabled?: boolean;
}

export default function NumberPad({ onNumberClick, disabled }: NumberPadProps) {
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

  return (
    <div className="mt-4 w-full max-w-[400px] mx-auto">
      <div className="grid grid-cols-10 gap-1">
        {numbers.map((num) => (
          <button
            key={num}
            onClick={() => onNumberClick(num)}
            disabled={disabled}
            className="
              font-pixel text-base
              aspect-square
              flex items-center justify-center
              bg-white pixel-border-sm
              hover:bg-grey-light
              active:translate-x-[2px] active:translate-y-[2px]
              transition-all duration-100
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {num}
          </button>
        ))}
        <button
          onClick={() => onNumberClick(null)}
          disabled={disabled}
          className="
            font-pixel text-[10px]
            aspect-square
            flex items-center justify-center
            bg-grey-light pixel-border-sm
            hover:bg-grey-medium
            active:translate-x-[2px] active:translate-y-[2px]
            transition-all duration-100
            disabled:opacity-50 disabled:cursor-not-allowed
          "
          aria-label="Clear cell"
        >
          X
        </button>
      </div>
    </div>
  );
}
