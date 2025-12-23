import Link from "next/link";
import PixelButton from "@/components/PixelButton";

export default function OliverGame() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-4">
      <div className="text-center mb-3">
        <p className="font-pixel text-xs text-christmas-green mb-1">OLIVER</p>
        <h1 className="font-pixel text-xl text-foreground">CODE QUEST</h1>
      </div>

      {/* Difficulty selector */}
      <div className="flex justify-center gap-4 mb-3">
        <button className="font-pixel text-xs px-4 py-2 bg-christmas-green text-white pixel-border-sm hover:bg-green-700 transition-colors">
          BEGINNER
        </button>
        <button className="font-pixel text-xs px-4 py-2 bg-grey-light text-foreground pixel-border-sm hover:bg-grey-medium transition-colors">
          AVERAGE
        </button>
        <button className="font-pixel text-xs px-4 py-2 bg-grey-light text-foreground pixel-border-sm hover:bg-grey-medium transition-colors">
          ADVANCED
        </button>
      </div>

      {/* Game canvas placeholder */}
      <div className="bg-white pixel-border aspect-video flex items-center justify-center mb-3">
        <div className="text-center">
          <div className="font-pixel text-4xl mb-4 text-gray-300">&lt;/&gt;</div>
          <p className="font-pixel text-xs text-gray-400">GAME LOADING...</p>
          <p className="font-pixel text-xs text-christmas-red mt-2">
            COMING SOON
          </p>
        </div>
      </div>

      {/* Progress display */}
      <div className="bg-grey-light pixel-border-sm p-3 mb-3">
        <div className="flex justify-center gap-8 font-pixel text-xs">
          <div className="text-center">
            <p className="text-gray-500">PUZZLES SOLVED</p>
            <p className="text-xl text-foreground">0/10</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500">LEVEL</p>
            <p className="text-xl text-christmas-green">BEGINNER</p>
          </div>
        </div>
      </div>

      <div className="text-center">
        <Link href="/games">
          <PixelButton variant="secondary">&lt; BACK</PixelButton>
        </Link>
      </div>
    </div>
  );
}
