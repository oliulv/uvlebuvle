"use client";

import { useState, useEffect } from "react";
import GameCard from "@/components/GameCard";
import PlayerSelect, {
  getStoredPlayer,
  CurrentPlayerBadge,
} from "@/components/PlayerSelect";
import { FamilyMember } from "@/lib/supabase";

const games = [
  {
    name: "DAD",
    title: "SOLITAIRE",
    description: "Classic Klondike card game",
    icon: "♠♥",
    href: "/games/dad",
  },
  {
    name: "MOM",
    title: "STITCH MASTER",
    description: "Sewing and crafting challenge",
    icon: "-*-",
    href: "/games/mom",
  },
  {
    name: "JONAS",
    title: "AI POKER",
    description: "Play poker against AI models",
    icon: "[A]",
    href: "/games/jonas",
  },
  {
    name: "BO",
    title: "HOOPS",
    description: "Basketball shooting game",
    icon: "(O)",
    href: "/games/bo",
  },
  {
    name: "OLIVER",
    title: "CODE QUEST",
    description: "JavaScript puzzles to solve",
    icon: "</>",
    href: "/games/oliver",
  },
  {
    name: "TORVALD",
    title: "TUG OF WAR",
    description: "Dog-themed tug of war game",
    icon: "^.^",
    href: "/games/torvald",
  },
];

export default function GamesHub() {
  const [currentPlayer, setCurrentPlayer] = useState<FamilyMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setCurrentPlayer(getStoredPlayer());
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <p className="font-pixel text-xs text-gray-500">LOADING...</p>
      </div>
    );
  }

  if (!currentPlayer) {
    return <PlayerSelect onSelect={setCurrentPlayer} />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <CurrentPlayerBadge
          player={currentPlayer}
          onChangePlayer={() => setCurrentPlayer(null)}
        />
      </div>

      <div className="text-center mb-12">
        <h1 className="font-pixel text-xl text-christmas-red mb-4">
          SELECT GAME
        </h1>
        <p className="font-pixel text-xs text-gray-500">
          Choose your game below
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {games.map((game) => (
          <GameCard key={game.name} {...game} />
        ))}
      </div>

      <div className="text-center mt-12">
        <p className="font-pixel text-xs text-christmas-green">
          * * * MERRY CHRISTMAS * * *
        </p>
      </div>
    </div>
  );
}
