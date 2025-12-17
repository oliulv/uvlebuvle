import PasscodeEntry from "@/components/PasscodeEntry";
import Snowfall from "@/components/Snowfall";

export default function Home() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center relative overflow-hidden">
      <Snowfall />

      <div className="relative z-10 flex flex-col items-center gap-12 p-8">
        {/* Pixel art Christmas tree */}
        <div className="font-pixel text-christmas-green text-center leading-tight">
          <div className="text-xs">*</div>
          <div className="text-xs">***</div>
          <div className="text-xs">*****</div>
          <div className="text-xs">*******</div>
          <div className="text-xs text-amber-800">||</div>
        </div>

        <div className="text-center">
          <h1 className="font-pixel text-lg md:text-xl text-christmas-red mb-4">
            FAMILY GAMES
          </h1>
          <p className="font-pixel text-xs text-gray-500 mb-2">
            CHRISTMAS 2024
          </p>
          <div className="w-32 h-1 bg-christmas-green mx-auto mb-8" />
          <p className="font-pixel text-xs text-gray-600 mb-8">
            ENTER PASSCODE
          </p>
        </div>

        <PasscodeEntry />

        {/* Bottom decoration */}
        <div className="font-pixel text-xs text-christmas-red mt-8">
          * * * * * * *
        </div>
      </div>
    </main>
  );
}
