'use client';

import { Difficulty } from '../types';

interface DifficultySelectorProps {
  difficulty: Difficulty;
  onChange: (difficulty: Difficulty) => void;
  disabled: boolean;
}

const difficulties: { value: Difficulty; label: string; description: string }[] = [
  { value: 'easy', label: 'EASY', description: '40% AI memory' },
  { value: 'medium', label: 'MED', description: '60% AI memory' },
  { value: 'hard', label: 'HARD', description: '80% AI memory' },
];

export default function DifficultySelector({
  difficulty,
  onChange,
  disabled,
}: DifficultySelectorProps) {
  return (
    <div className="flex items-center gap-1">
      {difficulties.map((d) => (
        <button
          key={d.value}
          onClick={() => onChange(d.value)}
          disabled={disabled}
          className={`
            font-pixel text-[10px] px-2 py-1 pixel-border-sm pixel-btn
            transition-colors
            ${difficulty === d.value
              ? 'bg-christmas-green text-white'
              : 'bg-white text-foreground hover:bg-grey-light'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          title={d.description}
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}
