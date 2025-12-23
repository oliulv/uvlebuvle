import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface PlayerPoints {
  player: string;
  totalPoints: number;
  gamesPlayed: number;
}

export async function GET() {
  if (!isSupabaseConfigured) {
    return NextResponse.json([]);
  }

  // Aggregate total points per player from normalized_points table
  const { data, error } = await supabase
    .from("normalized_points")
    .select("player, base_points, bonus_points");

  if (error) {
    console.error("Supabase error:", error);
    return NextResponse.json([]);
  }

  // Aggregate by player
  const playerMap = new Map<string, { total: number; count: number }>();

  for (const row of data || []) {
    const current = playerMap.get(row.player) || { total: 0, count: 0 };
    current.total += row.base_points + row.bonus_points;
    current.count += 1;
    playerMap.set(row.player, current);
  }

  // Convert to array and sort by total points descending
  const leaderboard: PlayerPoints[] = Array.from(playerMap.entries())
    .map(([player, { total, count }]) => ({
      player,
      totalPoints: total,
      gamesPlayed: count,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints);

  return NextResponse.json(leaderboard);
}
