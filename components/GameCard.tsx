import Link from "next/link";

interface GameCardProps {
  name: string;
  title: string;
  description: string;
  icon: string;
  href: string;
}

export default function GameCard({
  name,
  title,
  description,
  icon,
  href,
}: GameCardProps) {
  return (
    <Link
      href={href}
      className="group block bg-white pixel-border p-6 hover:bg-grey-light transition-colors"
    >
      <div className="flex flex-col gap-4">
        <div className="text-4xl font-pixel text-center">{icon}</div>
        <div className="text-center">
          <p className="text-christmas-green font-pixel text-xs mb-2">{name}</p>
          <h3 className="font-pixel text-sm text-foreground mb-2">{title}</h3>
          <p className="text-xs text-gray-600">{description}</p>
        </div>
        <div className="text-center">
          <span className="font-pixel text-xs text-christmas-red group-hover:text-red-700 transition-colors">
            [ PLAY ]
          </span>
        </div>
      </div>
    </Link>
  );
}
