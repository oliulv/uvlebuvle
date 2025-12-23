// Card types
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
}

// Player types
export type PlayerType = 'human' | 'ai';
export type AIModel = 'anthropic/claude-sonnet-4.5' | 'google/gemini-3-flash-preview' | 'openai/gpt-5.2';

export interface Player {
  id: string;
  name: string;
  type: PlayerType;
  aiModel?: AIModel;
  chips: number;
  hand: Card[];
  currentBet: number;
  isFolded: boolean;
  isAllIn: boolean;
  isDealer: boolean;
  position: 'bottom' | 'left' | 'top' | 'right';
  hasActedThisRound: boolean;
}

// Betting action types
export type BettingAction = 'fold' | 'check' | 'call' | 'raise' | 'all-in';

export interface BetAction {
  playerId: string;
  playerName: string;
  action: BettingAction;
  amount: number;
  reasoning?: string;
}

// Game phase types
export type GamePhase =
  | 'waiting'      // Before game starts
  | 'pre-flop'     // Initial betting round
  | 'flop'         // After 3 community cards
  | 'turn'         // After 4th community card
  | 'river'        // After 5th community card
  | 'showdown'     // Revealing hands
  | 'hand-complete'; // Round finished, showing winner

// Game state
export interface GameState {
  phase: GamePhase;
  players: Player[];
  deck: Card[];
  communityCards: Card[];
  pot: number;
  currentBet: number;
  currentPlayerIndex: number;
  dealerIndex: number;
  smallBlindAmount: number;
  bigBlindAmount: number;
  minRaise: number;
  lastRaiseAmount: number;
  actionHistory: BetAction[];
  roundStartPlayerIndex: number;
  lastRaiserIndex: number | null;
  winner: Player | null;
  winningHand: string | null;
  handNumber: number;
}

// Hand ranking types
export type HandRank =
  | 'high-card'
  | 'pair'
  | 'two-pair'
  | 'three-of-a-kind'
  | 'straight'
  | 'flush'
  | 'full-house'
  | 'four-of-a-kind'
  | 'straight-flush'
  | 'royal-flush';

export interface HandEvaluation {
  rank: HandRank;
  rankValue: number; // 1-10 for comparison
  cards: Card[]; // Best 5 cards
  kickers: number[]; // For tie-breaking
  description: string;
}

// Game action types for reducer
export type GameAction =
  | { type: 'START_GAME' }
  | { type: 'START_NEW_HAND' }
  | { type: 'PLAYER_ACTION'; action: BetAction }
  | { type: 'ADVANCE_TO_NEXT_PLAYER' }
  | { type: 'DEAL_COMMUNITY_CARDS' }
  | { type: 'END_HAND'; winnerId: string; handDescription: string }
  | { type: 'RESET_GAME' };

// AI response from API
export interface AIDecision {
  action: BettingAction;
  amount?: number;
  reasoning: string;
}

// Hand summary for game history
export interface HandSummary {
  handNumber: number;
  winner: string;
  winningHand: string;
  potSize: number;
  actions: {
    playerName: string;
    action: BettingAction;
    amount?: number;
    phase: GamePhase;
  }[];
  showdownHands?: {
    playerName: string;
    hand: string;
  }[];
}

// Game history for AI context
export interface GameHistory {
  hands: HandSummary[];
  playerStats: {
    [playerId: string]: {
      handsPlayed: number;
      handsWon: number;
      totalBet: number;
      allInCount: number;
      foldCount: number;
      bluffCaught: number; // Times they went all-in with weak hand
    };
  };
}

// Constants
export const STARTING_CHIPS = 1000;
export const SMALL_BLIND = 10;
export const BIG_BLIND = 20;

export const AI_PLAYERS: Omit<Player, 'chips' | 'hand' | 'currentBet' | 'isFolded' | 'isAllIn' | 'isDealer' | 'hasActedThisRound'>[] = [
  {
    id: 'claude',
    name: 'CLAUDE',
    type: 'ai',
    aiModel: 'anthropic/claude-sonnet-4.5',
    position: 'left',
  },
  {
    id: 'gemini',
    name: 'GEMINI',
    type: 'ai',
    aiModel: 'google/gemini-3-flash-preview',
    position: 'top',
  },
  {
    id: 'gpt',
    name: 'GPT',
    type: 'ai',
    aiModel: 'openai/gpt-5.2',
    position: 'right',
  },
];

export const HUMAN_PLAYER: Omit<Player, 'chips' | 'hand' | 'currentBet' | 'isFolded' | 'isAllIn' | 'isDealer' | 'hasActedThisRound'> = {
  id: 'jonas',
  name: 'JONAS',
  type: 'human',
  position: 'bottom',
};
