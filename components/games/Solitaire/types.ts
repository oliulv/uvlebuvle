export type Suit = "hearts" | "diamonds" | "clubs" | "spades";
export type Rank =
  | "A"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K";
export type Color = "red" | "black";

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
}

export interface GameState {
  stock: Card[];
  waste: Card[];
  foundations: [Card[], Card[], Card[], Card[]];
  tableau: [Card[], Card[], Card[], Card[], Card[], Card[], Card[]];
  score: number;
  moves: number;
  stockPassCount: number;
  gameWon: boolean;
}

export interface GameStateWithHistory extends GameState {
  history: GameState[];
}

export type PileType = "stock" | "waste" | "foundation" | "tableau";

export interface PileLocation {
  pile: PileType;
  index: number;
}

export type GameAction =
  | { type: "DRAW_FROM_STOCK" }
  | { type: "RECYCLE_STOCK" }
  | {
      type: "MOVE_CARDS";
      from: PileLocation;
      to: PileLocation;
      cardIds: string[];
    }
  | { type: "UNDO" }
  | { type: "NEW_GAME" };

export const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
export const RANKS: Rank[] = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

export const SUIT_COLORS: Record<Suit, Color> = {
  hearts: "red",
  diamonds: "red",
  clubs: "black",
  spades: "black",
};

export const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

export const RANK_VALUES: Record<Rank, number> = {
  A: 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 10,
  J: 11,
  Q: 12,
  K: 13,
};
