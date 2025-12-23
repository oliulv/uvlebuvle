'use client';

import { useRef } from 'react';
import Link from "next/link";
import PokerGame from "@/components/poker/PokerGame";
import { useFullscreen } from "@/hooks/useFullscreen";

export default function JonasGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, toggle, isSupported } = useFullscreen(containerRef);

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 ${
        isFullscreen ? 'h-screen' : 'h-[calc(100vh-60px)]'
      }`}
    >
      {/* Header - compact */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-slate-900/50">
        <div className="flex items-center gap-4">
          <p className="font-pixel text-xs text-emerald-400">JONAS</p>
          <h1 className="font-pixel text-sm text-white">AI POKER</h1>
        </div>
        <div className="flex items-center gap-2">
          {isSupported && (
            <button
              onClick={toggle}
              className="font-pixel text-[10px] px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? 'EXIT FS' : 'FULLSCREEN'}
            </button>
          )}
          {!isFullscreen && (
            <Link
              href="/games"
              className="font-pixel text-[10px] px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
            >
              BACK
            </Link>
          )}
        </div>
      </div>

      {/* Game area - takes remaining space */}
      <div className="flex-1 min-h-0 px-4 pb-4 flex flex-col">
        <PokerGame isFullscreen={isFullscreen} />
      </div>
    </div>
  );
}
