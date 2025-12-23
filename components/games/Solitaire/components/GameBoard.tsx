import { GameState, Card as CardType } from "../types";
import StockPile from "./StockPile";
import WastePile from "./WastePile";
import FoundationPile from "./FoundationPile";
import TableauPile from "./TableauPile";

interface GameBoardProps {
  gameState: GameState;
  onDraw: () => void;
  onRecycle: () => void;
  onAutoMove: (card: CardType, source: "waste" | "tableau" | "foundation", sourceIndex?: number) => void;
}

export default function GameBoard({
  gameState,
  onDraw,
  onRecycle,
  onAutoMove,
}: GameBoardProps) {
  const { stock, waste, foundations, tableau } = gameState;

  const handleWasteDoubleClick = (card: CardType) => {
    onAutoMove(card, "waste");
  };

  const handleTableauDoubleClick = (card: CardType, index: number) => {
    onAutoMove(card, "tableau", index);
  };

  const handleFoundationDoubleClick = (card: CardType, index: number) => {
    onAutoMove(card, "foundation", index);
  };

  return (
    <div className="flex flex-col mx-auto" style={{ gap: "var(--pile-gap)" }}>
      {/* Top row: Stock, Waste, spacer, Foundations */}
      <div className="flex items-start" style={{ gap: "var(--card-gap)" }}>
        {/* Stock */}
        <StockPile cards={stock} wasteHasCards={waste.length > 0} onDraw={onDraw} onRecycle={onRecycle} />

        {/* Waste */}
        <WastePile cards={waste} onDoubleClick={handleWasteDoubleClick} />

        {/* Spacer */}
        <div className="card-size" />

        {/* Foundations */}
        {foundations.map((pile, index) => (
          <FoundationPile
            key={index}
            cards={pile}
            index={index}
            onDoubleClick={(card) => handleFoundationDoubleClick(card, index)}
          />
        ))}
      </div>

      {/* Tableau */}
      <div className="flex" style={{ gap: "var(--card-gap)" }}>
        {tableau.map((pile, index) => (
          <TableauPile
            key={index}
            cards={pile}
            index={index}
            onDoubleClick={(card) => handleTableauDoubleClick(card, index)}
          />
        ))}
      </div>
    </div>
  );
}
