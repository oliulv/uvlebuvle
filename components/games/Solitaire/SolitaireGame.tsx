"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { getStoredPlayer } from "@/components/PlayerSelect";
import { useGameState } from "./useGameState";
import { Card as CardType, PileLocation } from "./types";
import { isValidMove, getCardsFromPile } from "./gameLogic";
import GameBoard from "./components/GameBoard";
import Card from "./components/Card";
import ScoreDisplay from "./components/ScoreDisplay";
import GameControls from "./components/GameControls";
import WinModal from "./components/WinModal";

const GAME_NAME = "solitaire";

interface SolitaireGameProps {
  onScoreSubmit?: (score: number) => void;
}

export default function SolitaireGame({ onScoreSubmit }: SolitaireGameProps) {
  const {
    gameState,
    newGame,
    undo,
    draw,
    recycle,
    moveCards,
    autoMove,
    canUndo,
  } = useGameState();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeCard, setActiveCard] = useState<CardType | null>(null);
  const [draggedCards, setDraggedCards] = useState<CardType[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasSubmittedRef = useRef(false);
  const draggedCardsRef = useRef<CardType[]>([]);
  const dragFromRef = useRef<PileLocation | null>(null);

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 5,
    },
  });

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 100,
      tolerance: 5,
    },
  });

  const sensors = useSensors(mouseSensor, touchSensor);

  // Handle score submission
  const submitScore = useCallback(async (score: number) => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;

    const player = getStoredPlayer();
    if (!player) {
      hasSubmittedRef.current = false;
      return;
    }

    try {
      await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game: GAME_NAME, player, score }),
      });
      onScoreSubmit?.(score);
    } catch (error) {
      console.error("Failed to submit score:", error);
    }
  }, [onScoreSubmit]);

  // Submit score when game is won
  useEffect(() => {
    if (gameState.gameWon && !hasSubmittedRef.current) {
      submitScore(gameState.score);
    }
  }, [gameState.gameWon, gameState.score, submitScore]);

  // Reset submission flag on new game
  const handleNewGame = useCallback(() => {
    hasSubmittedRef.current = false;
    newGame();
  }, [newGame]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Parse drag ID to get pile location and card
  const parseDragId = (id: string): { location: PileLocation; cardId: string } | null => {
    const parts = id.split("-");
    if (parts[0] === "waste") {
      return { location: { pile: "waste", index: 0 }, cardId: parts.slice(1).join("-") };
    } else if (parts[0] === "foundation") {
      return { location: { pile: "foundation", index: parseInt(parts[1]) }, cardId: parts.slice(2).join("-") };
    } else if (parts[0] === "tableau") {
      return { location: { pile: "tableau", index: parseInt(parts[1]) }, cardId: parts.slice(2).join("-") };
    }
    return null;
  };

  // Parse drop ID to get pile location
  const parseDropId = (id: string): PileLocation | null => {
    const parts = id.split("-");
    if (parts[0] === "foundation") {
      return { pile: "foundation", index: parseInt(parts[1]) };
    } else if (parts[0] === "tableau") {
      return { pile: "tableau", index: parseInt(parts[1]) };
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const parsed = parseDragId(active.id as string);
    if (!parsed) return;

    const { location, cardId } = parsed;
    dragFromRef.current = location;

    // Check if drag data contains cards array (from tableau stack)
    const dragData = active.data.current as { cards?: CardType[]; card?: CardType } | undefined;

    if (location.pile === "waste") {
      const card = gameState.waste.find((c) => c.id === cardId);
      if (card) {
        setActiveCard(card);
        setDraggedCards([card]);
        draggedCardsRef.current = [card];
      }
    } else if (location.pile === "foundation") {
      const card = gameState.foundations[location.index].find((c) => c.id === cardId);
      if (card) {
        setActiveCard(card);
        setDraggedCards([card]);
        draggedCardsRef.current = [card];
      }
    } else if (location.pile === "tableau") {
      // Use cards from drag data if available (for stacked cards)
      if (dragData?.cards && dragData.cards.length > 0) {
        setActiveCard(dragData.cards[0]);
        setDraggedCards(dragData.cards);
        draggedCardsRef.current = dragData.cards;
      } else {
        const pile = gameState.tableau[location.index];
        const result = getCardsFromPile(pile, cardId);
        if (result) {
          setActiveCard(result.cards[0]);
          setDraggedCards(result.cards);
          draggedCardsRef.current = result.cards;
        }
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { over } = event;

    const from = dragFromRef.current;
    const cards = draggedCardsRef.current;

    setActiveCard(null);
    setDraggedCards([]);
    draggedCardsRef.current = [];
    dragFromRef.current = null;

    if (!over || !from || cards.length === 0) return;

    const toParsed = parseDropId(over.id as string);
    if (!toParsed) return;

    const cardIds = cards.map((c) => c.id);

    // Validate and execute move
    if (isValidMove(from, toParsed, cardIds, gameState)) {
      moveCards(from, toParsed, cardIds);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`solitaire-game bg-[#1a6b1a] ${isFullscreen ? "fullscreen h-screen w-screen p-8" : "pixel-border p-4"}`}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <ScoreDisplay score={gameState.score} moves={gameState.moves} />
        <GameControls
          onNewGame={handleNewGame}
          onUndo={undo}
          onToggleFullscreen={toggleFullscreen}
          canUndo={canUndo}
          isFullscreen={isFullscreen}
        />
      </div>

      {/* Game Board */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <GameBoard
          gameState={gameState}
          onDraw={draw}
          onRecycle={recycle}
          onAutoMove={autoMove}
        />

        {/* Drag Overlay */}
        <DragOverlay>
          {activeCard && (
            <div className="relative">
              {draggedCards.map((card, index) => (
                <div
                  key={card.id}
                  className="absolute left-0"
                  style={{ top: `calc(${index} * var(--face-up-offset))` }}
                >
                  <Card card={card} isDragging />
                </div>
              ))}
              {/* Spacer to give the overlay proper dimensions */}
              <div
                style={{
                  width: "var(--card-width)",
                  height: `calc(${draggedCards.length - 1} * var(--face-up-offset) + var(--card-height))`,
                }}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Win Modal */}
      {gameState.gameWon && (
        <WinModal
          score={gameState.score}
          moves={gameState.moves}
          onNewGame={handleNewGame}
        />
      )}
    </div>
  );
}
