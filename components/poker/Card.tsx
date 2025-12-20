import { Card as CardType } from '@/lib/poker/types';
import { isRedSuit } from '@/lib/poker/deck';

interface CardProps {
  card?: CardType;
  faceDown?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const suitSymbols: Record<string, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

export default function Card({ card, faceDown = false, size = 'md' }: CardProps) {
  const sizeClasses = {
    sm: 'w-8 h-12 text-[8px]',
    md: 'w-12 h-16 text-xs',
    lg: 'w-16 h-24 text-sm',
  };

  if (faceDown || !card) {
    return (
      <div
        className={`${sizeClasses[size]} pixel-border-sm bg-christmas-red flex items-center justify-center`}
      >
        <div className="text-white font-pixel opacity-80">
          <div className="text-center leading-tight">
            *<br />*<br />*
          </div>
        </div>
      </div>
    );
  }

  const isRed = isRedSuit(card.suit);
  const textColor = isRed ? 'text-christmas-red' : 'text-foreground';

  return (
    <div
      className={`${sizeClasses[size]} pixel-border-sm bg-white flex flex-col justify-between p-1`}
    >
      <div className={`${textColor} font-pixel leading-none`}>
        <div>{card.rank}</div>
        <div>{suitSymbols[card.suit]}</div>
      </div>
      <div className={`${textColor} font-pixel leading-none self-end rotate-180`}>
        <div>{card.rank}</div>
        <div>{suitSymbols[card.suit]}</div>
      </div>
    </div>
  );
}

interface CardHandProps {
  cards: CardType[];
  faceDown?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function CardHand({ cards, faceDown = false, size = 'md' }: CardHandProps) {
  return (
    <div className="flex gap-1">
      {cards.map((card, index) => (
        <Card key={index} card={card} faceDown={faceDown} size={size} />
      ))}
    </div>
  );
}
