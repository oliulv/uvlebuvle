"use client";

import { useState } from "react";
import Link from "next/link";
import PixelButton from "@/components/PixelButton";
import RocketLandingGame from "@/components/games/RocketLanding/RocketLandingGame";
import Leaderboard from "@/components/Leaderboard";

export default function DadGame() {
  const [leaderboardKey, setLeaderboardKey] = useState(0);

  const handleScoreSubmit = () => {
    // Refresh leaderboard when a new score is submitted
    setLeaderboardKey((k) => k + 1);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4">
      <div className="text-center mb-3">
        <p className="font-pixel text-xs text-christmas-green mb-1">DAD</p>
        <h1 className="font-pixel text-xl text-foreground">ROCKET LAUNCH</h1>
      </div>

      <RocketLandingGame onScoreSubmit={handleScoreSubmit} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="bg-grey-light pixel-border-sm p-3">
          <p className="font-pixel text-xs text-gray-600 text-center mb-2">
            CONTROLS
          </p>
          <div className="font-pixel text-xs text-gray-500 space-y-1">
            <p>SPACE / W = THRUST</p>
            <p>A / D = STEER</p>
            <p>S = SEPARATE STAGE</p>
            <p>ENTER = START / RESTART</p>
          </div>
        </div>

        <div className="bg-grey-light pixel-border-sm p-3">
          <Leaderboard game="rocketLanding" refreshKey={leaderboardKey} />
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
