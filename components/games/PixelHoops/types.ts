// Game state types and constants for Pixel Hoops Showdown

export interface GameState {
  score: number;
  timeRemaining: number;
  isPlaying: boolean;
  shotsMade: number;
  shotsMissed: number;
  isCharging: boolean;
  chargeLevel: number;
}

export type ShotResult = "made" | "missed" | "swish" | "bank";

export interface ShotData {
  result: ShotResult;
  points: number;
  wasThreePointer: boolean;
  wasSwish: boolean;
  wasBank: boolean;
}

// Game constants
export const GAME_DURATION = 90; // seconds
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

// Scoring
export const POINTS = {
  TWO_POINTER: 2,
  THREE_POINTER: 3,
  SWISH_BONUS: 1,
  BANK_BONUS: 1,
} as const;

// Court dimensions
export const COURT = {
  FLOOR_Y: 520,
  HOOP_X: 700,
  HOOP_Y: 200,
  THREE_POINT_LINE_X: 400, // Shots from X < this are 3-pointers
  PLAYER_START_X: 200,
  PLAYER_START_Y: 480,
  LEFT_BOUNDARY: 50,
  RIGHT_BOUNDARY: 650,
} as const;

// Player settings
export const PLAYER = {
  WIDTH: 32,
  HEIGHT: 48,
  SPEED: 300,
  JUMP_VELOCITY: -400,
  GRAVITY: 800,
} as const;

// Ball settings
export const BALL = {
  RADIUS: 12,
  GRAVITY: 600,
  MAX_POWER: 800,
  MIN_POWER: 300,
} as const;

// Shot settings
export const SHOT = {
  CHARGE_RATE: 2, // % per frame
  MAX_CHARGE: 100,
  OPTIMAL_CHARGE_MIN: 70,
  OPTIMAL_CHARGE_MAX: 90,
} as const;

// Colors (Christmas theme)
export const COLORS = {
  CHRISTMAS_RED: 0xc41e3a,
  CHRISTMAS_GREEN: 0x228b22,
  COURT_BROWN: 0x8b4513,
  COURT_LIGHT: 0xcd853f,
  WHITE: 0xffffff,
  BALL_ORANGE: 0xff6600,
  BACKBOARD_WHITE: 0xeeeeee,
  RIM_ORANGE: 0xff4500,
  NET_WHITE: 0xcccccc,
} as const;

// Event names for React-Phaser communication
export const EVENTS = {
  GAME_START: "game-start",
  GAME_OVER: "game-over",
  SCORE_UPDATE: "score-update",
  SHOT_MADE: "shot-made",
  SHOT_MISSED: "shot-missed",
  CHARGE_UPDATE: "charge-update",
  TIME_UPDATE: "time-update",
} as const;

export const GAME_NAME = "pixel-hoops";
