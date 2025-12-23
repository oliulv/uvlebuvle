export type Difficulty = 'easy' | 'medium' | 'hard';

export interface MemoryCard {
  id: string;
  imageId: string;
  imagePath: string;
  faceUp: boolean;
  matched: boolean;
  matchedBy: 'human' | 'ai' | null; // Track who matched this pair
  position: number;
}

export interface GameState {
  cards: MemoryCard[];
  flippedCards: string[];
  currentPlayer: 'human' | 'ai';
  humanMatches: number;
  aiMatches: number;
  humanScore: number; // Points accumulated
  aiScore: number;
  difficulty: Difficulty;
  gamePhase: 'setup' | 'playing' | 'checking' | 'ai-thinking' | 'game-over';
  aiMemory: Record<string, number[]>;
}

export interface AIDecision {
  first: number;
  second: number;
  reasoning: string;
}

export const MEMORY_RETENTION: Record<Difficulty, number> = {
  easy: 0.4,
  medium: 0.6,
  hard: 0.8,
};

// Points per match based on difficulty
export const POINTS_PER_MATCH: Record<Difficulty, number> = {
  easy: 100,
  medium: 150,
  hard: 200,
};

// Win multiplier applied to total score
export const WIN_MULTIPLIER = 1.5;
export const TIE_MULTIPLIER = 1.2;

export const TOTAL_PAIRS = 12; // 24 cards total
export const GRID_COLS = 6;
export const GRID_ROWS = 4;
