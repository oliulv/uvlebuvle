"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import PixelButton from "@/components/PixelButton";

const MemoryGame = dynamic(
  () => import("@/components/games/Memory/MemoryGame"),
  { ssr: false }
);

export default function TorvaldGame() {

  return (
    <div className="w-full h-[100dvh] flex flex-col px-2 sm:px-3 py-1 overflow-hidden">
      {/* Header - compact */}
      <div className="text-center shrink-0">
        <p className="font-pixel text-[10px] text-christmas-green">TORVALD</p>
        <h1 className="font-pixel text-sm sm:text-base text-foreground">MEMORY</h1>
      </div>

      {/* Game takes remaining space */}
      <div className="flex-1 min-h-0 my-1">
        <MemoryGame />
      </div>

      {/* Footer - compact */}
      <div className="shrink-0 flex items-center justify-center gap-4 py-1">
        <Link href="/games">
          <PixelButton variant="secondary" className="text-[10px] px-2 py-0.5">&lt; BACK</PixelButton>
        </Link>

        <span className="font-pixel text-[8px] text-gray-500">
          CLICK TO FLIP • MATCH PAIRS • TAP TO ZOOM
        </span>
      </div>
    </div>
  );
}
