export type GameType =
  | "solitaire"
  | "sudoku"
  | "memory"
  | "pixel-hoops"
  | "poker"
  | "code-quest";

export interface NormalizedPoints {
  base: number;
  bonus: number;
  total: number;
}

/**
 * Calculate normalized points for a game score.
 * Each game awards 100 base points + up to 100 bonus points based on performance.
 */
export function calculateNormalizedPoints(
  game: GameType,
  rawScore: number
): NormalizedPoints {
  const base = 100;
  let bonus = 0;

  switch (game) {
    case "solitaire":
      // Score range: 0-500+, bonus = score/5
      bonus = Math.min(Math.floor(rawScore / 5), 100);
      break;
    case "sudoku":
      // Score range: 0-3500, bonus = score/35
      bonus = Math.min(Math.floor(rawScore / 35), 100);
      break;
    case "memory":
      // Score range: 100-3600, bonus = (score-100)/35
      bonus = Math.min(Math.floor((rawScore - 100) / 35), 100);
      break;
    case "pixel-hoops":
      // Score range: 0-unlimited, bonus = score/2
      bonus = Math.min(Math.floor(rawScore / 2), 100);
      break;
    case "poker":
      // rawScore = chips won (positive), bonus = chips/50
      bonus = Math.min(Math.floor(rawScore / 50), 100);
      break;
    case "code-quest":
      // Placeholder - not yet implemented
      bonus = 0;
      break;
  }

  // Ensure bonus is never negative
  bonus = Math.max(0, bonus);

  return {
    base,
    bonus,
    total: base + bonus,
  };
}
