import Link from "next/link";
import PixelButton from "@/components/PixelButton";

export default function TorvaldGame() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <p className="font-pixel text-xs text-christmas-green mb-2">TORVALD</p>
        <h1 className="font-pixel text-xl text-foreground mb-4">TUG OF WAR</h1>
        <p className="text-gray-600 max-w-md mx-auto">
          Help your dog win the ultimate tug of war! Tap rapidly to pull the
          rope and defeat your opponent.
        </p>
      </div>

      {/* Game canvas placeholder */}
      <div className="bg-white pixel-border aspect-video flex items-center justify-center mb-8">
        <div className="text-center">
          <div className="font-pixel text-4xl mb-4 text-gray-300">^.^</div>
          <p className="font-pixel text-xs text-gray-400">GAME LOADING...</p>
          <p className="font-pixel text-xs text-christmas-red mt-2">
            COMING SOON
          </p>
        </div>
      </div>

      {/* Game info */}
      <div className="bg-grey-light pixel-border-sm p-4 mb-8">
        <p className="font-pixel text-xs text-gray-600 text-center">
          TAP OR CLICK RAPIDLY TO PULL THE ROPE!
        </p>
        <div className="flex justify-center items-center gap-4 mt-4 font-pixel text-sm">
          <span className="text-christmas-green">WOOF!</span>
          <span className="text-gray-400">----====----</span>
          <span className="text-christmas-red">RUFF!</span>
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
