import Link from "next/link";
import PixelButton from "@/components/PixelButton";
import PokerGame from "@/components/poker/PokerGame";

export default function JonasGame() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <p className="font-pixel text-xs text-christmas-green mb-2">JONAS</p>
        <h1 className="font-pixel text-xl text-foreground mb-4">AI POKER</h1>
        <p className="text-gray-600 max-w-md mx-auto">
          Test your poker skills against the world&apos;s leading AI models.
          Play Texas Hold&apos;em against Claude, Gemini, and GPT.
        </p>
      </div>

      {/* Poker Game */}
      <div className="mb-8">
        <PokerGame />
      </div>

      <div className="text-center">
        <Link href="/games">
          <PixelButton variant="secondary">&lt; BACK</PixelButton>
        </Link>
      </div>
    </div>
  );
}
