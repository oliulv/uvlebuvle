import { getSudoku } from "sudoku-gen";
import type { Difficulty as SudokuGenDifficulty } from "sudoku-gen/dist/types/difficulty.type";
import {
  Grid,
  Cell,
  CellValue,
  Difficulty,
  CellPosition,
  DIFFICULTY_BASE_SCORES,
  TIME_BONUS_THRESHOLDS,
  PERFECT_TIME_BONUS,
  GOOD_TIME_BONUS,
  MISTAKE_PENALTY,
  HINT_PENALTY,
} from "./types";

// Map our difficulty to sudoku-gen difficulty
function mapDifficulty(difficulty: Difficulty): SudokuGenDifficulty {
  return difficulty as SudokuGenDifficulty;
}

// Convert 81-char string to Grid
export function parseGrid(puzzle: string, solution: string): Grid {
  const grid: Grid = [];
  for (let row = 0; row < 9; row++) {
    grid[row] = [];
    for (let col = 0; col < 9; col++) {
      const index = row * 9 + col;
      const puzzleChar = puzzle[index];
      const solutionChar = solution[index];

      const value =
        puzzleChar === "-" ? null : (parseInt(puzzleChar) as CellValue);
      const solutionValue = parseInt(solutionChar) as CellValue;

      grid[row][col] = {
        value,
        solution: solutionValue,
        isGiven: value !== null,
        isError: false,
        notes: new Set(),
      };
    }
  }
  return grid;
}

// Generate new puzzle
export function generatePuzzle(difficulty: Difficulty): Grid {
  const { puzzle, solution } = getSudoku(mapDifficulty(difficulty));
  return parseGrid(puzzle, solution);
}

// Deep clone grid
export function cloneGrid(grid: Grid): Grid {
  return grid.map((row) =>
    row.map((cell) => ({
      ...cell,
      notes: new Set(cell.notes),
    }))
  );
}

// Check if placing a value at a position violates Sudoku rules
// (duplicate in same row, column, or 3x3 box)
export function hasConflict(
  grid: Grid,
  row: number,
  col: number,
  value: CellValue
): boolean {
  if (value === null) return false;

  // Check row for duplicate
  for (let c = 0; c < 9; c++) {
    if (c !== col && grid[row][c].value === value) {
      return true;
    }
  }

  // Check column for duplicate
  for (let r = 0; r < 9; r++) {
    if (r !== row && grid[r][col].value === value) {
      return true;
    }
  }

  // Check 3x3 box for duplicate
  const boxStartRow = Math.floor(row / 3) * 3;
  const boxStartCol = Math.floor(col / 3) * 3;
  for (let r = boxStartRow; r < boxStartRow + 3; r++) {
    for (let c = boxStartCol; c < boxStartCol + 3; c++) {
      if (r !== row || c !== col) {
        if (grid[r][c].value === value) {
          return true;
        }
      }
    }
  }

  return false;
}

// Update all cell error states based on current Sudoku rule violations
export function updateAllErrors(grid: Grid): Grid {
  const newGrid = cloneGrid(grid);

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const cell = newGrid[row][col];
      if (cell.value !== null) {
        cell.isError = hasConflict(newGrid, row, col, cell.value);
      } else {
        cell.isError = false;
      }
    }
  }

  return newGrid;
}

// Set cell value with validation against Sudoku rules (not solution)
export function setCellValue(
  grid: Grid,
  row: number,
  col: number,
  value: CellValue
): { grid: Grid; causedConflict: boolean } {
  const newGrid = cloneGrid(grid);
  const cell = newGrid[row][col];

  if (cell.isGiven) return { grid, causedConflict: false };

  cell.value = value;
  cell.notes.clear();

  // Check if this placement causes a conflict (for mistake tracking)
  const causedConflict = value !== null && hasConflict(newGrid, row, col, value);

  // Update error states for all cells (conflicts can be bidirectional)
  const gridWithErrors = updateAllErrors(newGrid);

  return { grid: gridWithErrors, causedConflict };
}

// Toggle note on a cell
export function toggleNote(
  grid: Grid,
  row: number,
  col: number,
  note: number
): Grid {
  const newGrid = cloneGrid(grid);
  const cell = newGrid[row][col];

  if (cell.isGiven || cell.value !== null) return grid;

  if (cell.notes.has(note)) {
    cell.notes.delete(note);
  } else {
    cell.notes.add(note);
  }

  return newGrid;
}

// Use hint - fill selected cell with correct value
export function applyHint(
  grid: Grid,
  selectedCell: CellPosition | null
): Grid | null {
  if (!selectedCell) return null;

  const { row, col } = selectedCell;
  const cell = grid[row][col];

  // Can't hint on given cells or already correct cells
  if (cell.isGiven || cell.value === cell.solution) return null;

  const newGrid = cloneGrid(grid);
  const targetCell = newGrid[row][col];

  targetCell.value = targetCell.solution;
  targetCell.notes.clear();

  // Re-evaluate all errors since placing the correct value may resolve conflicts
  return updateAllErrors(newGrid);
}

// Check if puzzle is complete
export function checkWin(grid: Grid): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const cell = grid[row][col];
      if (cell.value !== cell.solution) return false;
    }
  }
  return true;
}

// Calculate final score
export function calculateScore(
  difficulty: Difficulty,
  elapsedTime: number,
  mistakes: number,
  hintsUsed: number
): number {
  let score = DIFFICULTY_BASE_SCORES[difficulty];

  // Time bonus
  const thresholds = TIME_BONUS_THRESHOLDS[difficulty];
  if (elapsedTime <= thresholds.perfect) {
    score += PERFECT_TIME_BONUS;
  } else if (elapsedTime <= thresholds.good) {
    score += GOOD_TIME_BONUS;
  }

  // Penalties
  score -= mistakes * MISTAKE_PENALTY;
  score -= hintsUsed * HINT_PENALTY;

  return Math.max(0, score);
}

// Check if a cell is in the same row, column, or 3x3 box as another cell
export function isRelatedCell(
  pos1: CellPosition,
  pos2: CellPosition
): boolean {
  // Same row
  if (pos1.row === pos2.row) return true;
  // Same column
  if (pos1.col === pos2.col) return true;
  // Same 3x3 box
  const box1Row = Math.floor(pos1.row / 3);
  const box1Col = Math.floor(pos1.col / 3);
  const box2Row = Math.floor(pos2.row / 3);
  const box2Col = Math.floor(pos2.col / 3);
  if (box1Row === box2Row && box1Col === box2Col) return true;

  return false;
}

// Format time as MM:SS
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
