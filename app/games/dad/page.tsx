"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import PixelButton from "@/components/PixelButton";
import Leaderboard from "@/components/Leaderboard";

const SolitaireGame = dynamic(
  () => import("@/components/games/Solitaire/SolitaireGame"),
  { ssr: false }
);

export default function DadGame() {
  const [leaderboardKey, setLeaderboardKey] = useState(0);

  const handleScoreSubmit = () => {
    setLeaderboardKey((k) => k + 1);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4">
      <div className="text-center mb-3">
        <p className="font-pixel text-xs text-christmas-green mb-1">DAD</p>
        <h1 className="font-pixel text-xl text-foreground">SOLITAIRE</h1>
      </div>

      <SolitaireGame onScoreSubmit={handleScoreSubmit} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="bg-grey-light pixel-border-sm p-3">
          <p className="font-pixel text-xs text-gray-600 text-center mb-2">
            HOW TO PLAY
          </p>
          <div className="font-pixel text-xs text-gray-500 space-y-1">
            <p>DRAG cards to move</p>
            <p>DOUBLE-CLICK to auto-move</p>
            <p>CLICK stock to draw 3</p>
            <p>BUILD foundations A to K</p>
          </div>
        </div>

        <div className="bg-grey-light pixel-border-sm p-3">
          <Leaderboard game="solitaire" refreshKey={leaderboardKey} />
        </div>
      </div>

      <div className="text-center mt-4">
        <Link href="/games">
          <PixelButton variant="secondary">&lt; BACK</PixelButton>
        </Link>
      </div>
    </div>
  );
}
