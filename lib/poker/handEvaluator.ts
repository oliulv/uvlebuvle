import { Card, HandEvaluation, HandRank, Player, Rank, Suit } from './types';
import { getRankValue } from './deck';

/**
 * Evaluate the best 5-card poker hand from 7 cards (2 hole + 5 community)
 */
export function evaluateHand(holeCards: Card[], communityCards: Card[]): HandEvaluation {
  const allCards = [...holeCards, ...communityCards];

  // Generate all 21 possible 5-card combinations
  const combinations = getCombinations(allCards, 5);

  // Evaluate each combination and find the best
  let bestHand: HandEvaluation | null = null;

  for (const combo of combinations) {
    const evaluation = evaluateFiveCards(combo);
    if (!bestHand || compareHands(evaluation, bestHand) > 0) {
      bestHand = evaluation;
    }
  }

  return bestHand!;
}

/**
 * Get all k-combinations from an array
 */
function getCombinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];

  const [first, ...rest] = arr;
  const withFirst = getCombinations(rest, k - 1).map(combo => [first, ...combo]);
  const withoutFirst = getCombinations(rest, k);

  return [...withFirst, ...withoutFirst];
}

/**
 * Evaluate exactly 5 cards
 */
function evaluateFiveCards(cards: Card[]): HandEvaluation {
  const sortedCards = [...cards].sort((a, b) => getRankValue(b.rank) - getRankValue(a.rank));
  const ranks = sortedCards.map(c => c.rank);
  const suits = sortedCards.map(c => c.suit);
  const values = sortedCards.map(c => getRankValue(c.rank));

  const isFlush = suits.every(s => s === suits[0]);
  const isStraight = checkStraight(values);
  const isLowStraight = checkLowStraight(values);

  // Count occurrences of each rank
  const rankCounts = new Map<Rank, number>();
  for (const rank of ranks) {
    rankCounts.set(rank, (rankCounts.get(rank) || 0) + 1);
  }
  const counts = Array.from(rankCounts.values()).sort((a, b) => b - a);

  // Royal Flush
  if (isFlush && isStraight && values[0] === 14) {
    return {
      rank: 'royal-flush',
      rankValue: 10,
      cards: sortedCards,
      kickers: values,
      description: 'Royal Flush',
    };
  }

  // Straight Flush
  if (isFlush && (isStraight || isLowStraight)) {
    const highCard = isLowStraight ? 5 : values[0];
    return {
      rank: 'straight-flush',
      rankValue: 9,
      cards: sortedCards,
      kickers: [highCard],
      description: `Straight Flush, ${rankName(highCard)} high`,
    };
  }

  // Four of a Kind
  if (counts[0] === 4) {
    const quadRank = getRankWithCount(rankCounts, 4);
    const kicker = getRankWithCount(rankCounts, 1);
    return {
      rank: 'four-of-a-kind',
      rankValue: 8,
      cards: sortedCards,
      kickers: [getRankValue(quadRank), getRankValue(kicker)],
      description: `Four of a Kind, ${rankName(getRankValue(quadRank))}s`,
    };
  }

  // Full House
  if (counts[0] === 3 && counts[1] === 2) {
    const tripRank = getRankWithCount(rankCounts, 3);
    const pairRank = getRankWithCount(rankCounts, 2);
    return {
      rank: 'full-house',
      rankValue: 7,
      cards: sortedCards,
      kickers: [getRankValue(tripRank), getRankValue(pairRank)],
      description: `Full House, ${rankName(getRankValue(tripRank))}s full of ${rankName(getRankValue(pairRank))}s`,
    };
  }

  // Flush
  if (isFlush) {
    return {
      rank: 'flush',
      rankValue: 6,
      cards: sortedCards,
      kickers: values,
      description: `Flush, ${rankName(values[0])} high`,
    };
  }

  // Straight
  if (isStraight || isLowStraight) {
    const highCard = isLowStraight ? 5 : values[0];
    return {
      rank: 'straight',
      rankValue: 5,
      cards: sortedCards,
      kickers: [highCard],
      description: `Straight, ${rankName(highCard)} high`,
    };
  }

  // Three of a Kind
  if (counts[0] === 3) {
    const tripRank = getRankWithCount(rankCounts, 3);
    const kickers = values.filter(v => v !== getRankValue(tripRank)).slice(0, 2);
    return {
      rank: 'three-of-a-kind',
      rankValue: 4,
      cards: sortedCards,
      kickers: [getRankValue(tripRank), ...kickers],
      description: `Three of a Kind, ${rankName(getRankValue(tripRank))}s`,
    };
  }

  // Two Pair
  if (counts[0] === 2 && counts[1] === 2) {
    const pairs = getRanksWithCount(rankCounts, 2).sort((a, b) => getRankValue(b) - getRankValue(a));
    const kicker = getRankWithCount(rankCounts, 1);
    return {
      rank: 'two-pair',
      rankValue: 3,
      cards: sortedCards,
      kickers: [getRankValue(pairs[0]), getRankValue(pairs[1]), getRankValue(kicker)],
      description: `Two Pair, ${rankName(getRankValue(pairs[0]))}s and ${rankName(getRankValue(pairs[1]))}s`,
    };
  }

  // Pair
  if (counts[0] === 2) {
    const pairRank = getRankWithCount(rankCounts, 2);
    const kickers = values.filter(v => v !== getRankValue(pairRank)).slice(0, 3);
    return {
      rank: 'pair',
      rankValue: 2,
      cards: sortedCards,
      kickers: [getRankValue(pairRank), ...kickers],
      description: `Pair of ${rankName(getRankValue(pairRank))}s`,
    };
  }

  // High Card
  return {
    rank: 'high-card',
    rankValue: 1,
    cards: sortedCards,
    kickers: values,
    description: `${rankName(values[0])} High`,
  };
}

/**
 * Check if values form a straight (high ace)
 */
function checkStraight(values: number[]): boolean {
  for (let i = 0; i < values.length - 1; i++) {
    if (values[i] - values[i + 1] !== 1) {
      return false;
    }
  }
  return true;
}

/**
 * Check for A-2-3-4-5 straight (wheel)
 */
function checkLowStraight(values: number[]): boolean {
  const sorted = [...values].sort((a, b) => b - a);
  return sorted[0] === 14 && sorted[1] === 5 && sorted[2] === 4 && sorted[3] === 3 && sorted[4] === 2;
}

/**
 * Get the rank that appears exactly `count` times
 */
function getRankWithCount(counts: Map<Rank, number>, count: number): Rank {
  for (const [rank, c] of counts) {
    if (c === count) return rank;
  }
  throw new Error(`No rank with count ${count}`);
}

/**
 * Get all ranks that appear exactly `count` times
 */
function getRanksWithCount(counts: Map<Rank, number>, count: number): Rank[] {
  const result: Rank[] = [];
  for (const [rank, c] of counts) {
    if (c === count) result.push(rank);
  }
  return result;
}

/**
 * Get display name for a rank value
 */
function rankName(value: number): string {
  const names: Record<number, string> = {
    2: 'Two',
    3: 'Three',
    4: 'Four',
    5: 'Five',
    6: 'Six',
    7: 'Seven',
    8: 'Eight',
    9: 'Nine',
    10: 'Ten',
    11: 'Jack',
    12: 'Queen',
    13: 'King',
    14: 'Ace',
  };
  return names[value] || String(value);
}

/**
 * Compare two hands
 * @returns positive if hand1 wins, negative if hand2 wins, 0 for tie
 */
export function compareHands(hand1: HandEvaluation, hand2: HandEvaluation): number {
  // Compare by rank first
  if (hand1.rankValue !== hand2.rankValue) {
    return hand1.rankValue - hand2.rankValue;
  }

  // Same rank, compare kickers
  for (let i = 0; i < hand1.kickers.length; i++) {
    if (hand1.kickers[i] !== hand2.kickers[i]) {
      return hand1.kickers[i] - hand2.kickers[i];
    }
  }

  return 0; // True tie
}

/**
 * Find the winner(s) among active players
 * @returns Array of winners (multiple in case of tie)
 */
export function findWinners(
  players: Player[],
  communityCards: Card[]
): { winners: Player[]; handDescription: string } {
  const activePlayers = players.filter(p => !p.isFolded && p.hand.length > 0);

  if (activePlayers.length === 0) {
    throw new Error('No active players');
  }

  if (activePlayers.length === 1) {
    return {
      winners: [activePlayers[0]],
      handDescription: 'Last player standing',
    };
  }

  // Evaluate all hands
  const evaluations = activePlayers.map(player => ({
    player,
    hand: evaluateHand(player.hand, communityCards),
  }));

  // Find best hand(s)
  let bestEval = evaluations[0];
  for (let i = 1; i < evaluations.length; i++) {
    const comparison = compareHands(evaluations[i].hand, bestEval.hand);
    if (comparison > 0) {
      bestEval = evaluations[i];
    }
  }

  // Find all players with the best hand (ties)
  const winners = evaluations
    .filter(e => compareHands(e.hand, bestEval.hand) === 0)
    .map(e => e.player);

  return {
    winners,
    handDescription: bestEval.hand.description,
  };
}
