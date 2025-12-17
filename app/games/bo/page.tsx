import Link from "next/link";
import PixelButton from "@/components/PixelButton";

export default function BoGame() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <p className="font-pixel text-xs text-christmas-green mb-2">BO</p>
        <h1 className="font-pixel text-xl text-foreground mb-4">HOOPS</h1>
        <p className="text-gray-600 max-w-md mx-auto">
          Shoot hoops and beat your high score in this basketball arcade game.
          Perfect your timing and aim for nothing but net.
        </p>
      </div>

      {/* Game canvas placeholder */}
      <div className="bg-white pixel-border aspect-video flex items-center justify-center mb-8">
        <div className="text-center">
          <div className="font-pixel text-4xl mb-4 text-gray-300">(O)</div>
          <p className="font-pixel text-xs text-gray-400">GAME LOADING...</p>
          <p className="font-pixel text-xs text-christmas-red mt-2">
            COMING SOON
          </p>
        </div>
      </div>

      {/* Score display */}
      <div className="bg-grey-light pixel-border-sm p-4 mb-8">
        <div className="flex justify-center gap-8 font-pixel text-xs">
          <div className="text-center">
            <p className="text-gray-500">SCORE</p>
            <p className="text-xl text-foreground">0</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500">HIGH SCORE</p>
            <p className="text-xl text-christmas-green">---</p>
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
