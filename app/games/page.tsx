import GameCard from "@/components/GameCard";

const games = [
  {
    name: "DAD",
    title: "ROCKET LAUNCH",
    description: "SpaceX-inspired rocketship game",
    icon: "[=]>",
    href: "/games/dad",
  },
  {
    name: "MOM",
    title: "STITCH MASTER",
    description: "Sewing and crafting challenge",
    icon: "-*-",
    href: "/games/mom",
  },
  {
    name: "JONAS",
    title: "AI POKER",
    description: "Play poker against AI models",
    icon: "[A]",
    href: "/games/jonas",
  },
  {
    name: "BO",
    title: "HOOPS",
    description: "Basketball shooting game",
    icon: "(O)",
    href: "/games/bo",
  },
  {
    name: "OLIVER",
    title: "CODE QUEST",
    description: "JavaScript puzzles to solve",
    icon: "</>",
    href: "/games/oliver",
  },
  {
    name: "TORVALD",
    title: "TUG OF WAR",
    description: "Dog-themed tug of war game",
    icon: "^.^",
    href: "/games/torvald",
  },
];

export default function GamesHub() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="font-pixel text-xl text-christmas-red mb-4">
          SELECT PLAYER
        </h1>
        <p className="font-pixel text-xs text-gray-500">
          Choose your game below
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {games.map((game) => (
          <GameCard key={game.name} {...game} />
        ))}
      </div>

      <div className="text-center mt-12">
        <p className="font-pixel text-xs text-christmas-green">
          * * * MERRY CHRISTMAS * * *
        </p>
      </div>
    </div>
  );
}
