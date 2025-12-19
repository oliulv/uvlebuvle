"use client";

import { useState, useEffect } from "react";
import { Score } from "@/lib/supabase";

interface LeaderboardProps {
  game: string;
  refreshKey?: number;
}

export default function Leaderboard({ game, refreshKey }: LeaderboardProps) {
  const [scores, setScores] = useState<Score[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchScores() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/scores?game=${game}`);
        if (!response.ok) {
          throw new Error("Failed to fetch scores");
        }
        const data = await response.json();
        setScores(data);
      } catch (err) {
        setError("Could not load leaderboard");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchScores();
  }, [game, refreshKey]);

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

  if (scores.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="font-pixel text-xs text-gray-500">NO SCORES YET</p>
        <p className="font-pixel text-xs text-gray-400 mt-1">BE THE FIRST!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="font-pixel text-xs text-christmas-green text-center mb-3">
        TOP SCORES
      </h3>
      <div className="space-y-1">
        {scores.map((score, index) => (
          <div
            key={score.id}
            className={`flex justify-between items-center px-3 py-2 ${
              index === 0 ? "bg-yellow-100" : "bg-grey-light"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="font-pixel text-xs text-gray-500 w-4">
                {index + 1}.
              </span>
              <span className="font-pixel text-xs text-foreground">
                {score.player.toUpperCase()}
              </span>
            </div>
            <span className="font-pixel text-xs text-christmas-red">
              {score.score.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
