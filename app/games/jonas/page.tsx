import Link from "next/link";
import PixelButton from "@/components/PixelButton";

export default function JonasGame() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-4">
      <div className="text-center mb-3">
        <p className="font-pixel text-xs text-christmas-green mb-1">JONAS</p>
        <h1 className="font-pixel text-xl text-foreground">AI POKER</h1>
      </div>

      {/* Game canvas placeholder */}
      <div className="bg-white pixel-border aspect-video flex items-center justify-center mb-3">
        <div className="text-center">
          <div className="font-pixel text-4xl mb-4 text-gray-300">[A]</div>
          <p className="font-pixel text-xs text-gray-400">GAME LOADING...</p>
          <p className="font-pixel text-xs text-christmas-red mt-2">
            COMING SOON
          </p>
        </div>
      </div>

      {/* AI opponents preview */}
      <div className="bg-grey-light pixel-border-sm p-3 mb-3">
        <p className="font-pixel text-xs text-gray-600 text-center mb-1">
          AI OPPONENTS
        </p>
        <div className="flex justify-center gap-4 font-pixel text-xs">
          <span className="text-christmas-green">GPT-4</span>
          <span className="text-christmas-red">CLAUDE</span>
          <span className="text-blue-600">GEMINI</span>
          <span className="text-purple-600">LLAMA</span>
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
