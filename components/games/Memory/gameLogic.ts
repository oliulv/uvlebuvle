import {
  MemoryCard,
  GameState,
  Difficulty,
  MEMORY_RETENTION,
  POINTS_PER_MATCH,
  WIN_MULTIPLIER,
  TIE_MULTIPLIER,
  TOTAL_PAIRS,
} from './types';

/**
 * Selects random images from a pool for the game
 * @param allImagePaths - All available images
 * @param count - How many unique images to select (default: TOTAL_PAIRS)
 */
export function selectRandomImages(allImagePaths: string[], count: number = TOTAL_PAIRS): string[] {
  // Shuffle and take the first `count` images
  const shuffled = [...allImagePaths].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function createDeck(imagePaths: string[]): MemoryCard[] {
  const cards: MemoryCard[] = [];

  imagePaths.forEach((path, index) => {
    // Create two cards for each image (a pair)
    for (let i = 0; i < 2; i++) {
      cards.push({
        id: `card-${index}-${i}`,
        imageId: `image-${index}`,
        imagePath: path,
        faceUp: false,
        matched: false,
        matchedBy: null,
        position: cards.length,
      });
    }
  });

  return cards;
}

export function shuffleDeck(cards: MemoryCard[]): MemoryCard[] {
  const shuffled = [...cards];

  // Fisher-Yates shuffle
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Update positions after shuffle
  return shuffled.map((card, index) => ({
    ...card,
    position: index,
  }));
}

export function flipCard(state: GameState, cardId: string): GameState {
  // Can't flip if already 2 cards flipped, or card is already matched/face-up
  if (state.flippedCards.length >= 2) return state;

  const card = state.cards.find(c => c.id === cardId);
  if (!card || card.matched || card.faceUp) return state;

  const updatedCards = state.cards.map(c =>
    c.id === cardId ? { ...c, faceUp: true } : c
  );

  return {
    ...state,
    cards: updatedCards,
    flippedCards: [...state.flippedCards, cardId],
  };
}

export function checkMatch(state: GameState): {
  isMatch: boolean;
  newState: GameState;
} {
  if (state.flippedCards.length !== 2) {
    return { isMatch: false, newState: state };
  }

  const [card1Id, card2Id] = state.flippedCards;
  const card1 = state.cards.find(c => c.id === card1Id)!;
  const card2 = state.cards.find(c => c.id === card2Id)!;

  const isMatch = card1.imageId === card2.imageId;

  if (isMatch) {
    const currentPlayer = state.currentPlayer;
    const pointsEarned = POINTS_PER_MATCH[state.difficulty];

    // Mark cards as matched with who matched them
    const updatedCards = state.cards.map(c =>
      c.id === card1Id || c.id === card2Id
        ? { ...c, matched: true, matchedBy: currentPlayer }
        : c
    );

    // Update match count and score for current player
    const humanMatches = currentPlayer === 'human'
      ? state.humanMatches + 1
      : state.humanMatches;
    const aiMatches = currentPlayer === 'ai'
      ? state.aiMatches + 1
      : state.aiMatches;
    const humanScore = currentPlayer === 'human'
      ? state.humanScore + pointsEarned
      : state.humanScore;
    const aiScore = currentPlayer === 'ai'
      ? state.aiScore + pointsEarned
      : state.aiScore;

    return {
      isMatch: true,
      newState: {
        ...state,
        cards: updatedCards,
        flippedCards: [],
        humanMatches,
        aiMatches,
        humanScore,
        aiScore,
        // Player keeps turn on match
      },
    };
  } else {
    // No match - flip cards back and switch player
    const updatedCards = state.cards.map(c =>
      c.id === card1Id || c.id === card2Id
        ? { ...c, faceUp: false }
        : c
    );

    return {
      isMatch: false,
      newState: {
        ...state,
        cards: updatedCards,
        flippedCards: [],
        currentPlayer: state.currentPlayer === 'human' ? 'ai' : 'human',
      },
    };
  }
}

export function updateAIMemory(
  memory: Record<string, number[]>,
  card: MemoryCard,
  difficulty: Difficulty
): Record<string, number[]> {
  const retention = MEMORY_RETENTION[difficulty];
  const roll = Math.random();
  const remembers = roll <= retention;

  console.log(`[Memory] AI memory check: difficulty=${difficulty}, retention=${retention}, roll=${roll.toFixed(2)}, remembers=${remembers}`);

  // Random chance to remember based on difficulty
  if (!remembers) {
    console.log(`[Memory] AI FORGOT card at position ${card.position}`);
    return memory;
  }

  const existing = memory[card.imageId] || [];

  // Don't add duplicate positions
  if (existing.includes(card.position)) {
    return memory;
  }

  console.log(`[Memory] AI REMEMBERED card at position ${card.position} (imageId: ${card.imageId})`);
  return {
    ...memory,
    [card.imageId]: [...existing, card.position],
  };
}

export function getUnmatchedPositions(state: GameState): number[] {
  return state.cards
    .filter(c => !c.matched)
    .map(c => c.position);
}

export function isGameOver(state: GameState): boolean {
  return state.cards.every(c => c.matched);
}

export function calculateFinalScore(state: GameState): number {
  const { humanScore, humanMatches, aiMatches } = state;

  // Apply multiplier based on result
  if (humanMatches > aiMatches) {
    return Math.floor(humanScore * WIN_MULTIPLIER);
  } else if (humanMatches === aiMatches) {
    return Math.floor(humanScore * TIE_MULTIPLIER);
  }
  // Loss - no multiplier
  return humanScore;
}

export function getWinner(state: GameState): 'human' | 'ai' | 'tie' {
  if (state.humanMatches > state.aiMatches) return 'human';
  if (state.aiMatches > state.humanMatches) return 'ai';
  return 'tie';
}

export function createInitialState(
  imagePaths: string[],
  difficulty: Difficulty = 'medium'
): GameState {
  const deck = createDeck(imagePaths);
  const shuffledDeck = shuffleDeck(deck);

  return {
    cards: shuffledDeck,
    flippedCards: [],
    currentPlayer: 'human',
    humanMatches: 0,
    aiMatches: 0,
    humanScore: 0,
    aiScore: 0,
    difficulty,
    gamePhase: 'playing',
    aiMemory: {},
  };
}
