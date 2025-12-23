import Link from "next/link";
import Snowfall from "@/components/Snowfall";

export default function GamesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-grey-light">
      <Snowfall />

      <header className="bg-white pixel-border-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/games"
            className="font-pixel text-xs text-christmas-red hover:text-red-700 transition-colors"
          >
            FAMILY GAMES
          </Link>
          <nav className="font-pixel text-xs text-gray-500">
            <span className="text-christmas-green">*</span> CHRISTMAS 2025{" "}
            <span className="text-christmas-green">*</span>
          </nav>
        </div>
      </header>

      <main className="relative z-10">{children}</main>
    </div>
  );
}
