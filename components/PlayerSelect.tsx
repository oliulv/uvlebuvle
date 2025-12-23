"use client";

import { useState, useEffect } from "react";
import { FAMILY_MEMBERS, FamilyMember } from "@/lib/supabase";
import PixelButton from "./PixelButton";

const PLAYER_STORAGE_KEY = "currentPlayer";

export function getStoredPlayer(): FamilyMember | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(PLAYER_STORAGE_KEY);
  if (stored && FAMILY_MEMBERS.includes(stored as FamilyMember)) {
    return stored as FamilyMember;
  }
  return null;
}

export function setStoredPlayer(player: FamilyMember): void {
  localStorage.setItem(PLAYER_STORAGE_KEY, player);
}

interface PlayerSelectProps {
  onSelect: (player: FamilyMember) => void;
}

export default function PlayerSelect({ onSelect }: PlayerSelectProps) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="font-pixel text-xl text-christmas-red mb-4">
          WHO&apos;S PLAYING?
        </h1>
        <p className="font-pixel text-xs text-gray-500">
          Select your name to track scores
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {FAMILY_MEMBERS.map((member) => (
          <button
            key={member}
            onClick={() => {
              setStoredPlayer(member);
              onSelect(member);
            }}
            className="font-pixel text-sm px-4 py-6 pixel-border bg-white hover:bg-grey-light transition-colors text-center"
          >
            {member.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}

interface CurrentPlayerProps {
  player: FamilyMember;
  onChangePlayer: () => void;
}

export function CurrentPlayerBadge({ player, onChangePlayer }: CurrentPlayerProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-pixel text-xs text-gray-500">Playing as:</span>
      <button
        onClick={onChangePlayer}
        className="font-pixel text-xs text-christmas-green hover:underline"
      >
        {player.toUpperCase()} [CHANGE]
      </button>
    </div>
  );
}
