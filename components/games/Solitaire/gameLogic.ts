import {
  Card,
  GameState,
  Suit,
  Rank,
  PileLocation,
  SUITS,
  RANKS,
  SUIT_COLORS,
  RANK_VALUES,
} from "./types";

// Create a standard 52-card deck
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: `${suit}-${rank}`,
        suit,
        rank,
        faceUp: false,
      });
    }
  }
  return deck;
}

// Fisher-Yates shuffle
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Deal initial game state
export function dealInitialState(): GameState {
  const deck = shuffleDeck(createDeck());
  let cardIndex = 0;

  // Deal tableau: 1 card in first pile, 2 in second, etc.
  const tableau: [Card[], Card[], Card[], Card[], Card[], Card[], Card[]] = [
    [],
    [],
    [],
    [],
    [],
    [],
    [],
  ];

  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      const card = { ...deck[cardIndex++] };
      // Only the top card (last dealt to each pile) is face up
      card.faceUp = row === col;
      tableau[col].push(card);
    }
  }

  // Remaining cards go to stock (face down)
  const stock = deck.slice(cardIndex).map((card) => ({ ...card, faceUp: false }));

  return {
    stock,
    waste: [],
    foundations: [[], [], [], []],
    tableau,
    score: 0,
    moves: 0,
    stockPassCount: 0,
    gameWon: false,
  };
}

// Get card color
export function getCardColor(card: Card): "red" | "black" {
  return SUIT_COLORS[card.suit];
}

// Foundation suits in order (index 0 = spades, 1 = hearts, 2 = diamonds, 3 = clubs)
export const FOUNDATION_SUITS: Suit[] = ["spades", "hearts", "diamonds", "clubs"];

// Check if card can be placed on foundation
export function canMoveToFoundation(card: Card, foundation: Card[], foundationIndex: number): boolean {
  const requiredSuit = FOUNDATION_SUITS[foundationIndex];

  // Card must match the foundation's suit
  if (card.suit !== requiredSuit) {
    return false;
  }

  if (foundation.length === 0) {
    // Only Aces can start a foundation
    return card.rank === "A";
  }

  const topCard = foundation[foundation.length - 1];
  // Must be same suit and next rank
  return (
    card.suit === topCard.suit &&
    RANK_VALUES[card.rank] === RANK_VALUES[topCard.rank] + 1
  );
}

// Check if cards can be placed on tableau pile
export function canMoveToTableau(cards: Card[], tableau: Card[]): boolean {
  if (cards.length === 0) return false;

  const bottomCard = cards[0]; // The card that will be placed on the pile

  if (tableau.length === 0) {
    // Any card can be placed on empty tableau
    return true;
  }

  const topCard = tableau[tableau.length - 1];
  if (!topCard.faceUp) return false;

  // Must be opposite color and one rank lower
  const oppositeColor = getCardColor(bottomCard) !== getCardColor(topCard);
  const oneRankLower = RANK_VALUES[bottomCard.rank] === RANK_VALUES[topCard.rank] - 1;

  return oppositeColor && oneRankLower;
}

// Get cards from a pile starting from a specific card
export function getCardsFromPile(
  pile: Card[],
  cardId: string
): { cards: Card[]; remaining: Card[] } | null {
  const index = pile.findIndex((c) => c.id === cardId);
  if (index === -1) return null;

  // Can only pick up face-up cards
  if (!pile[index].faceUp) return null;

  return {
    cards: pile.slice(index),
    remaining: pile.slice(0, index),
  };
}

// Check if a move is valid
export function isValidMove(
  from: PileLocation,
  to: PileLocation,
  cardIds: string[],
  state: GameState
): boolean {
  if (cardIds.length === 0) return false;

  // Get the cards being moved
  let cards: Card[] = [];

  if (from.pile === "waste") {
    if (state.waste.length === 0) return false;
    const topCard = state.waste[state.waste.length - 1];
    if (topCard.id !== cardIds[0]) return false;
    cards = [topCard];
  } else if (from.pile === "tableau") {
    const pile = state.tableau[from.index];
    const result = getCardsFromPile(pile, cardIds[0]);
    if (!result) return false;
    cards = result.cards;
  } else if (from.pile === "foundation") {
    const pile = state.foundations[from.index];
    if (pile.length === 0) return false;
    const topCard = pile[pile.length - 1];
    if (topCard.id !== cardIds[0]) return false;
    cards = [topCard];
  } else {
    return false; // Can't move from stock directly
  }

  // Check destination
  if (to.pile === "foundation") {
    // Can only move one card to foundation
    if (cards.length !== 1) return false;
    return canMoveToFoundation(cards[0], state.foundations[to.index], to.index);
  } else if (to.pile === "tableau") {
    return canMoveToTableau(cards, state.tableau[to.index]);
  }

  return false;
}

// Calculate score for a move
export function calculateMoveScore(
  from: PileLocation,
  to: PileLocation,
  flippedCard: boolean
): number {
  let score = 0;

  if (to.pile === "foundation") {
    if (from.pile === "waste") {
      score += 10; // Waste to foundation
    } else if (from.pile === "tableau") {
      score += 10; // Tableau to foundation
    }
  } else if (to.pile === "tableau") {
    if (from.pile === "waste") {
      score += 5; // Waste to tableau
    } else if (from.pile === "foundation") {
      score -= 15; // Foundation to tableau (penalty)
    }
  }

  if (flippedCard) {
    score += 5; // Bonus for revealing a card
  }

  return score;
}

// Execute a move and return new state
export function executeMove(
  state: GameState,
  from: PileLocation,
  to: PileLocation,
  cardIds: string[]
): GameState | null {
  if (!isValidMove(from, to, cardIds, state)) return null;

  const newState: GameState = {
    ...state,
    stock: [...state.stock],
    waste: [...state.waste],
    foundations: state.foundations.map((f) => [...f]) as [
      Card[],
      Card[],
      Card[],
      Card[]
    ],
    tableau: state.tableau.map((t) => [...t]) as [
      Card[],
      Card[],
      Card[],
      Card[],
      Card[],
      Card[],
      Card[]
    ],
  };

  let cards: Card[] = [];
  let flippedCard = false;

  // Remove cards from source
  if (from.pile === "waste") {
    cards = [newState.waste.pop()!];
  } else if (from.pile === "tableau") {
    const pile = newState.tableau[from.index];
    const index = pile.findIndex((c) => c.id === cardIds[0]);
    cards = pile.splice(index);

    // Flip the new top card if there is one
    if (pile.length > 0 && !pile[pile.length - 1].faceUp) {
      pile[pile.length - 1] = { ...pile[pile.length - 1], faceUp: true };
      flippedCard = true;
    }
  } else if (from.pile === "foundation") {
    cards = [newState.foundations[from.index].pop()!];
  }

  // Add cards to destination
  if (to.pile === "foundation") {
    newState.foundations[to.index].push(...cards);
  } else if (to.pile === "tableau") {
    newState.tableau[to.index].push(...cards);
  }

  // Update score and moves
  newState.score += calculateMoveScore(from, to, flippedCard);
  newState.moves += 1;

  // Check win condition
  newState.gameWon = checkWinCondition(newState);

  return newState;
}

// Draw cards from stock
export function drawFromStock(state: GameState): GameState {
  if (state.stock.length === 0) return state;

  const newState: GameState = {
    ...state,
    stock: [...state.stock],
    waste: [...state.waste],
    foundations: state.foundations.map((f) => [...f]) as [
      Card[],
      Card[],
      Card[],
      Card[]
    ],
    tableau: state.tableau.map((t) => [...t]) as [
      Card[],
      Card[],
      Card[],
      Card[],
      Card[],
      Card[],
      Card[]
    ],
  };

  // Draw up to 3 cards
  const drawCount = Math.min(3, newState.stock.length);
  for (let i = 0; i < drawCount; i++) {
    const card = newState.stock.pop()!;
    newState.waste.push({ ...card, faceUp: true });
  }

  newState.moves += 1;
  return newState;
}

// Recycle waste back to stock
export function recycleStock(state: GameState): GameState {
  if (state.stock.length > 0 || state.waste.length === 0) return state;

  const newState: GameState = {
    ...state,
    stock: [],
    waste: [],
    foundations: state.foundations.map((f) => [...f]) as [
      Card[],
      Card[],
      Card[],
      Card[]
    ],
    tableau: state.tableau.map((t) => [...t]) as [
      Card[],
      Card[],
      Card[],
      Card[],
      Card[],
      Card[],
      Card[]
    ],
    stockPassCount: state.stockPassCount + 1,
  };

  // Flip waste back to stock (reverse order)
  newState.stock = state.waste
    .map((card) => ({ ...card, faceUp: false }))
    .reverse();

  // Penalty for recycling after first time
  if (newState.stockPassCount > 1) {
    newState.score = Math.max(0, newState.score - 20);
  }

  newState.moves += 1;
  return newState;
}

// Check if game is won
export function checkWinCondition(state: GameState): boolean {
  // All 4 foundations must have 13 cards (A through K)
  return state.foundations.every((foundation) => foundation.length === 13);
}

// Find valid foundation for auto-move
export function findValidFoundation(
  card: Card,
  state: GameState
): number | null {
  for (let i = 0; i < 4; i++) {
    if (canMoveToFoundation(card, state.foundations[i], i)) {
      return i;
    }
  }
  return null;
}

// Check if all cards are face up (for potential auto-complete)
export function canAutoComplete(state: GameState): boolean {
  // Stock and waste must be empty
  if (state.stock.length > 0 || state.waste.length > 0) return false;

  // All tableau cards must be face up
  for (const pile of state.tableau) {
    for (const card of pile) {
      if (!card.faceUp) return false;
    }
  }

  return true;
}

// Add win bonus to score
export function addWinBonus(state: GameState): GameState {
  return {
    ...state,
    score: state.score + 500,
  };
}
