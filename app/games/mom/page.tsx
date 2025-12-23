"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import PixelButton from "@/components/PixelButton";
import Leaderboard from "@/components/Leaderboard";
import { getStoredPlayer } from "@/components/PlayerSelect";

const SudokuGame = dynamic(
  () => import("@/components/games/Sudoku/SudokuGame"),
  { ssr: false }
);

export default function MomGame() {
  const [leaderboardKey, setLeaderboardKey] = useState(0);
  const player = getStoredPlayer();

  const handleScoreSubmit = () => {
    setLeaderboardKey((k) => k + 1);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4">
      <div className="text-center mb-3">
        <p className="font-pixel text-xs text-christmas-green mb-1">
          {player?.toUpperCase() || "PLAYER"}
        </p>
        <h1 className="font-pixel text-xl text-foreground">SUDOKU</h1>
      </div>

      <SudokuGame onScoreSubmit={handleScoreSubmit} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="bg-grey-light pixel-border-sm p-3">
          <p className="font-pixel text-xs text-gray-600 text-center mb-2">
            HOW TO PLAY
          </p>
          <div className="font-pixel text-xs text-gray-500 space-y-1">
            <p>CLICK cell to select</p>
            <p>TYPE or TAP number 1-9</p>
            <p>FILL all cells correctly</p>
            <p>FASTER = more points!</p>
          </div>
        </div>

        <div className="bg-grey-light pixel-border-sm p-3">
          <Leaderboard game="sudoku" refreshKey={leaderboardKey} />
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
