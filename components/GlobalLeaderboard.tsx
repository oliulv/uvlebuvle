"use client";

import { useState, useEffect } from "react";

interface PlayerPoints {
  player: string;
  totalPoints: number;
  gamesPlayed: number;
}

interface GlobalLeaderboardProps {
  refreshKey?: number;
}

export default function GlobalLeaderboard({ refreshKey }: GlobalLeaderboardProps) {
  const [players, setPlayers] = useState<PlayerPoints[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/leaderboard");
        if (!response.ok) {
          throw new Error("Failed to fetch leaderboard");
        }
        const data = await response.json();
        setPlayers(data);
      } catch (err) {
        setError("Could not load leaderboard");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLeaderboard();
  }, [refreshKey]);

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <p className="font-pixel text-xs text-gray-500">LOADING...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="font-pixel text-xs text-christmas-red">{error}</p>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="font-pixel text-xs text-gray-500">NO SCORES YET</p>
        <p className="font-pixel text-xs text-gray-400 mt-1">PLAY SOME GAMES!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        {players.map((player, index) => (
          <div
            key={player.player}
            className={`flex justify-between items-center px-3 py-2 ${
              index === 0 ? "bg-yellow-100" : "bg-grey-light"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="font-pixel text-xs text-gray-500 w-4">
                {index + 1}.
              </span>
              <span className="font-pixel text-xs text-foreground">
                {player.player.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-pixel text-xs text-gray-400">
                {player.gamesPlayed} {player.gamesPlayed === 1 ? "game" : "games"}
              </span>
              <span className="font-pixel text-xs text-christmas-red">
                {player.totalPoints.toLocaleString()} pts
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
