import { Cell as CellType } from "../types";

interface CellProps {
  cell: CellType;
  row: number;
  col: number;
  isSelected: boolean;
  isHighlighted: boolean;
  isSameValue: boolean;
  onClick: () => void;
}

export default function Cell({
  cell,
  row,
  col,
  isSelected,
  isHighlighted,
  isSameValue,
  onClick,
}: CellProps) {
  // Determine cell styling based on state
  const getBackgroundClass = () => {
    if (isSelected) return "bg-[#b8e6b8]"; // Light green for selected
    if (cell.isError) return "bg-[#ffe0e0]"; // Light red for error
    if (isSameValue && cell.value) return "bg-[#d4edda]"; // Green tint for same value
    if (isHighlighted) return "bg-[#f0f0f0]"; // Light gray for related cells
    if (cell.isGiven) return "bg-grey-light"; // Given cells
    return "bg-white";
  };

  const getTextColorClass = () => {
    if (cell.isError) return "text-christmas-red";
    if (cell.isGiven) return "text-foreground";
    return "text-[#2563eb]"; // Blue for user-entered values
  };

  // Add thicker borders for 3x3 box separators
  const getBorderClasses = () => {
    const classes: string[] = [];

    // Right border for columns 2, 5 (before 3rd and 6th column ends)
    if (col === 2 || col === 5) {
      classes.push("border-r-2 border-r-foreground");
    }

    // Bottom border for rows 2, 5
    if (row === 2 || row === 5) {
      classes.push("border-b-2 border-b-foreground");
    }

    return classes.join(" ");
  };

  return (
    <button
      onClick={onClick}
      className={`
        sudoku-cell
        w-full aspect-square
        flex items-center justify-center
        font-pixel text-sm sm:text-base
        border border-gray-300
        transition-colors duration-100
        cursor-pointer
        hover:bg-[#e8f5e9]
        focus:outline-none focus:ring-2 focus:ring-christmas-green focus:ring-inset
        ${getBackgroundClass()}
        ${getTextColorClass()}
        ${getBorderClasses()}
        ${cell.isGiven ? "font-bold" : ""}
      `}
      aria-label={`Row ${row + 1}, Column ${col + 1}${cell.value ? `, Value ${cell.value}` : ", Empty"}`}
    >
      {cell.value ? (
        <span>{cell.value}</span>
      ) : cell.notes.size > 0 ? (
        <div className="grid grid-cols-3 gap-0 text-[6px] sm:text-[8px] text-gray-400 w-full h-full p-0.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <span
              key={n}
              className="flex items-center justify-center"
            >
              {cell.notes.has(n) ? n : ""}
            </span>
          ))}
        </div>
      ) : null}
    </button>
  );
}
