"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import PixelButton from "@/components/PixelButton";
import Leaderboard from "@/components/Leaderboard";
import { getStoredPlayer } from "@/components/PlayerSelect";

const PixelHoopsGame = dynamic(
  () => import("@/components/games/PixelHoops/PixelHoopsGame"),
  { ssr: false }
);

export default function BoGame() {
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
        <h1 className="font-pixel text-xl text-foreground">PIXEL HOOPS</h1>
      </div>

      <PixelHoopsGame onScoreSubmit={handleScoreSubmit} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="bg-grey-light pixel-border-sm p-3">
          <p className="font-pixel text-xs text-gray-600 text-center mb-2">
            HOW TO PLAY
          </p>
          <div className="font-pixel text-xs text-gray-500 space-y-1">
            <p>A/D or ARROWS: Move</p>
            <p>SPACE: Jump / Start</p>
            <p>X or DOWN: Hold to charge shot</p>
            <p>GREEN zone = perfect power!</p>
            <p>3PT shots from far away</p>
            <p>SWISH/BANK = bonus points</p>
          </div>
        </div>

        <div className="bg-grey-light pixel-border-sm p-3">
          <Leaderboard game="pixel-hoops" refreshKey={leaderboardKey} />
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
