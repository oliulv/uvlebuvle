import { NextRequest, NextResponse } from "next/server";
import { supabase, Score, FAMILY_MEMBERS, FamilyMember, isSupabaseConfigured } from "@/lib/supabase";
import { calculateNormalizedPoints, GameType } from "@/lib/scoring";

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json([]);
  }

  const searchParams = request.nextUrl.searchParams;
  const game = searchParams.get("game");

  if (!game) {
    return NextResponse.json({ error: "Game parameter required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("scores")
    .select("*")
    .eq("game", game)
    .order("score", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Supabase error:", error);
    return NextResponse.json([]);
  }

  return NextResponse.json(data || []);
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const body = await request.json();
  const { game, player, score } = body as Score;

  if (!game || !player || typeof score !== "number") {
    return NextResponse.json(
      { error: "Missing required fields: game, player, score" },
      { status: 400 }
    );
  }

  if (!FAMILY_MEMBERS.includes(player as FamilyMember)) {
    return NextResponse.json(
      { error: "Invalid player name" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("scores")
    .insert([{ game, player, score }])
    .select()
    .single();

  if (error) {
    console.error("Supabase error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Calculate and save normalized points for global leaderboard
  const normalized = calculateNormalizedPoints(game as GameType, score);
  const { error: normalizedError } = await supabase
    .from("normalized_points")
    .insert([{
      player,
      game,
      base_points: normalized.base,
      bonus_points: normalized.bonus,
      score_id: data.id,
    }]);

  if (normalizedError) {
    console.error("Normalized points error:", normalizedError);
    // Don't fail the request, score was saved successfully
  }

  return NextResponse.json(data);
}
