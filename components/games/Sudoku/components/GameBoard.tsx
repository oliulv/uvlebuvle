import { Grid, CellPosition } from "../types";
import { isRelatedCell } from "../gameLogic";
import Cell from "./Cell";

interface GameBoardProps {
  grid: Grid;
  selectedCell: CellPosition | null;
  onCellClick: (row: number, col: number) => void;
}

export default function GameBoard({
  grid,
  selectedCell,
  onCellClick,
}: GameBoardProps) {
  // Get the value of the selected cell for highlighting matching values
  const selectedValue = selectedCell
    ? grid[selectedCell.row][selectedCell.col].value
    : null;

  return (
    <div className="sudoku-board w-full max-w-[400px] mx-auto">
      <div
        className="grid grid-cols-9 pixel-border-sm bg-foreground p-0.5"
        role="grid"
        aria-label="Sudoku puzzle grid"
      >
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const isSelected =
              selectedCell?.row === rowIndex && selectedCell?.col === colIndex;

            const isHighlighted =
              !isSelected &&
              selectedCell !== null &&
              isRelatedCell(selectedCell, { row: rowIndex, col: colIndex });

            const isSameValue =
              !isSelected &&
              selectedValue !== null &&
              cell.value === selectedValue;

            return (
              <Cell
                key={`${rowIndex}-${colIndex}`}
                cell={cell}
                row={rowIndex}
                col={colIndex}
                isSelected={isSelected}
                isHighlighted={isHighlighted}
                isSameValue={isSameValue}
                onClick={() => onCellClick(rowIndex, colIndex)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
