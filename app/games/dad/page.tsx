import Link from "next/link";
import PixelButton from "@/components/PixelButton";

export default function DadGame() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <p className="font-pixel text-xs text-christmas-green mb-2">DAD</p>
        <h1 className="font-pixel text-xl text-foreground mb-4">
          ROCKET LAUNCH
        </h1>
        <p className="text-gray-600 max-w-md mx-auto">
          Launch rockets into space in this SpaceX-inspired game. Navigate
          through obstacles and land safely on the platform.
        </p>
      </div>

      {/* Game canvas placeholder */}
      <div className="bg-white pixel-border aspect-video flex items-center justify-center mb-8">
        <div className="text-center">
          <div className="font-pixel text-4xl mb-4 text-gray-300">[=]&gt;</div>
          <p className="font-pixel text-xs text-gray-400">GAME LOADING...</p>
          <p className="font-pixel text-xs text-christmas-red mt-2">
            COMING SOON
          </p>
        </div>
      </div>

      {/* Controls hint */}
      <div className="bg-grey-light pixel-border-sm p-4 mb-8">
        <p className="font-pixel text-xs text-gray-600 text-center">
          CONTROLS: ARROW KEYS TO NAVIGATE | SPACE TO THRUST
        </p>
      </div>

      <div className="text-center">
        <Link href="/games">
          <PixelButton variant="secondary">&lt; BACK</PixelButton>
        </Link>
      </div>
    </div>
  );
}
