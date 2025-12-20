import {
  GameState,
  GameAction,
  Player,
  BetAction,
  BettingAction,
  GamePhase,
  AI_PLAYERS,
  HUMAN_PLAYER,
  STARTING_CHIPS,
  SMALL_BLIND,
  BIG_BLIND,
} from './types';
import { createDeck, shuffleDeck, dealCards } from './deck';
import { findWinners } from './handEvaluator';

/**
 * Create initial game state
 */
export function createInitialState(): GameState {
  return {
    phase: 'waiting',
    players: [],
    deck: [],
    communityCards: [],
    pot: 0,
    currentBet: 0,
    currentPlayerIndex: 0,
    dealerIndex: 0,
    smallBlindAmount: SMALL_BLIND,
    bigBlindAmount: BIG_BLIND,
    minRaise: BIG_BLIND,
    lastRaiseAmount: BIG_BLIND,
    actionHistory: [],
    roundStartPlayerIndex: 0,
    lastRaiserIndex: null,
    winner: null,
    winningHand: null,
    handNumber: 0,
  };
}

/**
 * Initialize players for a new game
 */
function initializePlayers(): Player[] {
  const human: Player = {
    ...HUMAN_PLAYER,
    chips: STARTING_CHIPS,
    hand: [],
    currentBet: 0,
    isFolded: false,
    isAllIn: false,
    isDealer: false,
    hasActedThisRound: false,
  };

  const ais: Player[] = AI_PLAYERS.map(ai => ({
    ...ai,
    chips: STARTING_CHIPS,
    hand: [],
    currentBet: 0,
    isFolded: false,
    isAllIn: false,
    isDealer: false,
    hasActedThisRound: false,
  }));

  // Order: Jonas (bottom), Claude (left), Gemini (top), GPT (right)
  return [human, ...ais];
}

/**
 * Start a new hand
 */
function startNewHand(state: GameState): GameState {
  const newState = { ...state };

  // Rotate dealer
  const activePlayers = state.players.filter(p => p.chips > 0);
  if (activePlayers.length < 2) {
    return state; // Game over
  }

  // Reset players for new hand
  newState.players = state.players.map((p, i) => ({
    ...p,
    hand: [],
    currentBet: 0,
    isFolded: p.chips === 0, // Folded if no chips
    isAllIn: false,
    isDealer: i === (state.dealerIndex + 1) % state.players.length,
    hasActedThisRound: false,
  }));

  // Move dealer button
  newState.dealerIndex = (state.dealerIndex + 1) % state.players.length;

  // Create and shuffle deck
  newState.deck = shuffleDeck(createDeck());
  newState.communityCards = [];
  newState.pot = 0;
  newState.currentBet = 0;
  newState.actionHistory = [];
  newState.winner = null;
  newState.winningHand = null;
  newState.handNumber = state.handNumber + 1;
  newState.lastRaiserIndex = null;

  // Deal 2 cards to each active player
  let deck = newState.deck;
  newState.players = newState.players.map(player => {
    if (player.chips > 0) {
      const { cards, remainingDeck } = dealCards(deck, 2);
      deck = remainingDeck;
      return { ...player, hand: cards };
    }
    return player;
  });
  newState.deck = deck;

  // Post blinds
  const smallBlindIndex = getNextActivePlayer(newState.players, newState.dealerIndex);
  const bigBlindIndex = getNextActivePlayer(newState.players, smallBlindIndex);

  // Small blind
  const sbAmount = Math.min(newState.smallBlindAmount, newState.players[smallBlindIndex].chips);
  newState.players[smallBlindIndex] = {
    ...newState.players[smallBlindIndex],
    chips: newState.players[smallBlindIndex].chips - sbAmount,
    currentBet: sbAmount,
    isAllIn: newState.players[smallBlindIndex].chips === sbAmount,
  };
  newState.pot += sbAmount;

  // Big blind
  const bbAmount = Math.min(newState.bigBlindAmount, newState.players[bigBlindIndex].chips);
  newState.players[bigBlindIndex] = {
    ...newState.players[bigBlindIndex],
    chips: newState.players[bigBlindIndex].chips - bbAmount,
    currentBet: bbAmount,
    isAllIn: newState.players[bigBlindIndex].chips === bbAmount,
  };
  newState.pot += bbAmount;

  newState.currentBet = newState.bigBlindAmount;
  newState.minRaise = newState.bigBlindAmount;
  newState.lastRaiseAmount = newState.bigBlindAmount;

  // First to act is left of big blind
  newState.currentPlayerIndex = getNextActivePlayer(newState.players, bigBlindIndex);
  newState.roundStartPlayerIndex = newState.currentPlayerIndex;
  newState.lastRaiserIndex = bigBlindIndex; // BB counts as raiser for first round

  newState.phase = 'pre-flop';

  return newState;
}

/**
 * Get next active (non-folded, has chips or is all-in) player index
 */
function getNextActivePlayer(players: Player[], fromIndex: number): number {
  let index = (fromIndex + 1) % players.length;
  let count = 0;
  while (count < players.length) {
    if (!players[index].isFolded && players[index].hand.length > 0) {
      return index;
    }
    index = (index + 1) % players.length;
    count++;
  }
  return fromIndex; // Fallback
}

/**
 * Process a player action
 */
function processPlayerAction(state: GameState, action: BetAction): GameState {
  const newState = { ...state };
  const playerIndex = state.players.findIndex(p => p.id === action.playerId);

  if (playerIndex === -1 || playerIndex !== state.currentPlayerIndex) {
    return state; // Invalid action
  }

  const player = state.players[playerIndex];
  let updatedPlayer = { ...player };

  switch (action.action) {
    case 'fold':
      updatedPlayer.isFolded = true;
      break;

    case 'check':
      // Can only check if current bet matches or is 0
      if (player.currentBet < state.currentBet) {
        return state; // Invalid
      }
      break;

    case 'call': {
      const callAmount = Math.min(
        state.currentBet - player.currentBet,
        player.chips
      );
      updatedPlayer.chips -= callAmount;
      updatedPlayer.currentBet += callAmount;
      newState.pot += callAmount;
      if (updatedPlayer.chips === 0) {
        updatedPlayer.isAllIn = true;
      }
      break;
    }

    case 'raise': {
      const raiseAmount = action.amount || state.currentBet * 2;
      const totalBet = raiseAmount;
      const toAdd = totalBet - player.currentBet;

      if (toAdd > player.chips) {
        // All-in instead
        updatedPlayer.currentBet += player.chips;
        newState.pot += player.chips;
        updatedPlayer.chips = 0;
        updatedPlayer.isAllIn = true;
      } else {
        updatedPlayer.chips -= toAdd;
        updatedPlayer.currentBet = totalBet;
        newState.pot += toAdd;
      }

      newState.currentBet = updatedPlayer.currentBet;
      newState.lastRaiseAmount = updatedPlayer.currentBet - state.currentBet;
      newState.minRaise = Math.max(state.bigBlindAmount, newState.lastRaiseAmount);
      newState.lastRaiserIndex = playerIndex;
      // Reset hasActedThisRound for all other players since they need to respond to raise
      newState.players = state.players.map((p, i) =>
        i === playerIndex ? p : { ...p, hasActedThisRound: false }
      );
      break;
    }

    case 'all-in': {
      const allInAmount = player.chips;
      updatedPlayer.currentBet += allInAmount;
      newState.pot += allInAmount;
      updatedPlayer.chips = 0;
      updatedPlayer.isAllIn = true;

      if (updatedPlayer.currentBet > state.currentBet) {
        newState.lastRaiseAmount = updatedPlayer.currentBet - state.currentBet;
        newState.currentBet = updatedPlayer.currentBet;
        newState.lastRaiserIndex = playerIndex;
        // Reset hasActedThisRound for all other players since they need to respond
        newState.players = state.players.map((p, i) =>
          i === playerIndex ? p : { ...p, hasActedThisRound: false }
        );
      }
      break;
    }
  }

  // Mark player as having acted
  updatedPlayer.hasActedThisRound = true;

  // Update player in array
  if (!newState.players || newState.players === state.players) {
    newState.players = [...state.players];
  }
  newState.players[playerIndex] = updatedPlayer;

  // Add to action history
  newState.actionHistory = [...state.actionHistory, action];

  // Move to next player or next phase
  return advanceGame(newState);
}

/**
 * Advance game after an action
 */
function advanceGame(state: GameState): GameState {
  const newState = { ...state };

  // Check for only one player remaining
  const activePlayers = state.players.filter(p => !p.isFolded);
  if (activePlayers.length === 1) {
    // Winner by default
    return endHand(newState, activePlayers[0].id, 'Everyone else folded');
  }

  // Find next player who can act
  const nextPlayer = findNextPlayerToAct(newState);

  if (nextPlayer === null) {
    // Betting round complete, advance phase
    return advancePhase(newState);
  }

  newState.currentPlayerIndex = nextPlayer;
  return newState;
}

/**
 * Find next player who needs to act, or null if round is complete
 */
function findNextPlayerToAct(state: GameState): number | null {
  const { players, currentPlayerIndex, currentBet } = state;

  let index = (currentPlayerIndex + 1) % players.length;
  let checked = 0;

  while (checked < players.length) {
    const player = players[index];

    // Skip folded or all-in players
    if (!player.isFolded && !player.isAllIn && player.hand.length > 0) {
      // Player needs to act if:
      // 1. They haven't matched the current bet, OR
      // 2. They haven't acted this round yet
      if (player.currentBet < currentBet || !player.hasActedThisRound) {
        return index;
      }
    }

    index = (index + 1) % players.length;
    checked++;
  }

  // Everyone has acted and matched the bet
  return null;
}

/**
 * Advance to next phase
 */
function advancePhase(state: GameState): GameState {
  const newState = { ...state };

  // Reset bets and hasActedThisRound for new round
  newState.players = state.players.map(p => ({
    ...p,
    currentBet: 0,
    hasActedThisRound: false,
  }));
  newState.currentBet = 0;
  newState.lastRaiserIndex = null;

  // Deal community cards based on phase
  let deck = newState.deck;

  switch (state.phase) {
    case 'pre-flop': {
      // Deal flop (3 cards)
      const { cards, remainingDeck } = dealCards(deck, 3);
      newState.communityCards = cards;
      newState.deck = remainingDeck;
      newState.phase = 'flop';
      break;
    }
    case 'flop': {
      // Deal turn (1 card)
      const { cards, remainingDeck } = dealCards(deck, 1);
      newState.communityCards = [...state.communityCards, ...cards];
      newState.deck = remainingDeck;
      newState.phase = 'turn';
      break;
    }
    case 'turn': {
      // Deal river (1 card)
      const { cards, remainingDeck } = dealCards(deck, 1);
      newState.communityCards = [...state.communityCards, ...cards];
      newState.deck = remainingDeck;
      newState.phase = 'river';
      break;
    }
    case 'river': {
      // Go to showdown
      newState.phase = 'showdown';
      return resolveShowdown(newState);
    }
  }

  // Set first player after dealer for new betting round
  const firstToAct = getNextActivePlayer(
    newState.players.map((p, i) => ({ ...p, isFolded: p.isFolded || p.isAllIn })),
    newState.dealerIndex
  );

  // Check if all remaining players are all-in
  const canAct = newState.players.filter(p => !p.isFolded && !p.isAllIn);
  if (canAct.length <= 1) {
    // Run out remaining cards and go to showdown
    return runOutCards(newState);
  }

  newState.currentPlayerIndex = firstToAct;
  newState.roundStartPlayerIndex = firstToAct;

  return newState;
}

/**
 * Run out remaining community cards when all players are all-in
 */
function runOutCards(state: GameState): GameState {
  let newState = { ...state };
  let deck = newState.deck;

  // Deal remaining community cards
  while (newState.communityCards.length < 5) {
    const { cards, remainingDeck } = dealCards(deck, 1);
    newState.communityCards = [...newState.communityCards, ...cards];
    deck = remainingDeck;
  }
  newState.deck = deck;
  newState.phase = 'showdown';

  return resolveShowdown(newState);
}

/**
 * Resolve showdown and determine winner
 */
function resolveShowdown(state: GameState): GameState {
  const { winners, handDescription } = findWinners(state.players, state.communityCards);

  // Split pot among winners
  const winAmount = Math.floor(state.pot / winners.length);

  const newState = { ...state };
  newState.players = state.players.map(p => {
    if (winners.some(w => w.id === p.id)) {
      return { ...p, chips: p.chips + winAmount };
    }
    return p;
  });

  newState.winner = winners[0];
  newState.winningHand = handDescription;
  newState.phase = 'hand-complete';
  newState.pot = 0;

  return newState;
}

/**
 * End hand with a winner
 */
function endHand(state: GameState, winnerId: string, reason: string): GameState {
  const newState = { ...state };
  const winner = state.players.find(p => p.id === winnerId);

  if (winner) {
    newState.players = state.players.map(p =>
      p.id === winnerId
        ? { ...p, chips: p.chips + state.pot }
        : p
    );
    newState.winner = { ...winner, chips: winner.chips + state.pot };
  }

  newState.winningHand = reason;
  newState.phase = 'hand-complete';
  newState.pot = 0;

  return newState;
}

/**
 * Get available actions for current player
 */
export function getAvailableActions(state: GameState): BettingAction[] {
  const player = state.players[state.currentPlayerIndex];
  if (!player || player.isFolded || player.isAllIn) {
    return [];
  }

  const actions: BettingAction[] = ['fold'];
  const toCall = state.currentBet - player.currentBet;

  if (toCall === 0) {
    actions.push('check');
  } else if (toCall > 0 && player.chips >= toCall) {
    actions.push('call');
  }

  // Can raise if have enough chips
  const minRaiseTotal = state.currentBet + state.minRaise;
  if (player.chips > toCall && player.chips + player.currentBet >= minRaiseTotal) {
    actions.push('raise');
  }

  // Can always go all-in
  if (player.chips > 0) {
    actions.push('all-in');
  }

  return actions;
}

/**
 * Get the amount needed to call
 */
export function getCallAmount(state: GameState): number {
  const player = state.players[state.currentPlayerIndex];
  if (!player) return 0;
  return Math.min(state.currentBet - player.currentBet, player.chips);
}

/**
 * Get minimum raise amount
 */
export function getMinRaise(state: GameState): number {
  return state.currentBet + state.minRaise;
}

/**
 * Get maximum raise amount (all-in)
 */
export function getMaxRaise(state: GameState): number {
  const player = state.players[state.currentPlayerIndex];
  if (!player) return 0;
  return player.chips + player.currentBet;
}

/**
 * Check if game is over (only one player with chips)
 */
export function isGameOver(state: GameState): boolean {
  if (state.players.length === 0) return false; // Game hasn't started
  const playersWithChips = state.players.filter(p => p.chips > 0);
  return playersWithChips.length <= 1;
}

/**
 * Get game winner (player with all chips)
 */
export function getGameWinner(state: GameState): Player | null {
  const playersWithChips = state.players.filter(p => p.chips > 0);
  if (playersWithChips.length === 1) {
    return playersWithChips[0];
  }
  return null;
}

/**
 * Game state reducer
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME': {
      const newState = createInitialState();
      newState.players = initializePlayers();
      // Randomly assign initial dealer
      newState.dealerIndex = Math.floor(Math.random() * newState.players.length);
      return startNewHand(newState);
    }

    case 'START_NEW_HAND':
      return startNewHand(state);

    case 'PLAYER_ACTION':
      return processPlayerAction(state, action.action);

    case 'RESET_GAME':
      return createInitialState();

    default:
      return state;
  }
}
