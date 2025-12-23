// Difficulty levels matching sudoku-gen
export type Difficulty = "easy" | "medium" | "hard";

// Cell value (1-9 or null for empty)
export type CellValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | null;

// Individual cell
export interface Cell {
  value: CellValue;
  solution: CellValue;
  isGiven: boolean;
  isError: boolean;
  notes: Set<number>;
}

// Grid is 9x9 array (row-major order)
export type Grid = Cell[][];

// Selected cell position
export interface CellPosition {
  row: number;
  col: number;
}

// Game state
export interface GameState {
  grid: Grid;
  difficulty: Difficulty;
  selectedCell: CellPosition | null;
  mistakes: number;
  hintsUsed: number;
  hintsRemaining: number;
  startTime: number;
  elapsedTime: number;
  isPlaying: boolean;
  gameWon: boolean;
}

// Scoring constants
export const DIFFICULTY_BASE_SCORES: Record<Difficulty, number> = {
  easy: 1000,
  medium: 2000,
  hard: 3000,
};

export const HINT_PENALTY = 50;
export const MISTAKE_PENALTY = 25;
export const MAX_HINTS = 3;

// Time bonus thresholds (in seconds)
export const TIME_BONUS_THRESHOLDS: Record<
  Difficulty,
  { perfect: number; good: number }
> = {
  easy: { perfect: 180, good: 360 }, // 3min / 6min
  medium: { perfect: 420, good: 720 }, // 7min / 12min
  hard: { perfect: 900, good: 1500 }, // 15min / 25min
};

export const PERFECT_TIME_BONUS = 500;
export const GOOD_TIME_BONUS = 250;
