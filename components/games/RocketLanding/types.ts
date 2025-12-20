export interface RocketState {
  x: number;          // World X position (0-100)
  y: number;          // World Y position (negative = up in sky, positive = down toward ground)
  vx: number;
  vy: number;
  angle: number;
  fuel: number;
  isThrusting: boolean;
  hasSeparated: boolean;  // Has the rocket tip separated?
  maxAltitude: number;    // Track max altitude reached
}

export type GameState =
  | "idle"        // On pad, waiting to start
  | "countdown"   // 3...2...1...
  | "launching"   // Auto-thrust phase (first 2 seconds)
  | "ascending"   // Flying up toward target altitude
  | "separation"  // Stage separation animation
  | "descending"  // Falling back down, avoid satellites
  | "landing"     // Near ground, landing phase
  | "success"     // Landed successfully
  | "crash";      // Crashed

export interface Controls {
  left: boolean;
  right: boolean;
  thrust: boolean;
}

export interface LandingResult {
  success: boolean;
  reason?: string;
}

export interface Satellite {
  x: number;      // World X position
  y: number;      // World Y position (altitude)
  size: number;   // Size of satellite (smaller, more realistic)
  speed: number;  // Horizontal movement speed
  type: 'satellite' | 'debris';  // Visual type
}

export const PHYSICS = {
  GRAVITY: 0.06,
  THRUST_POWER: 0.13,      // Reduced by 40% from 0.22
  LATERAL_THRUST: 0.05,
  ANGULAR_SPEED: 1.8,
  FUEL_CONSUMPTION: 0.08,
  MAX_VELOCITY: 5,
  MAX_LANDING_VELOCITY: 1.2,
  MAX_LANDING_ANGLE: 12,
  GROUND_Y: 0,             // Ground is at Y=0 in world coordinates
  PAD_X_START: 40,
  PAD_X_END: 60,
  TARGET_ALTITUDE: -400,   // Target altitude for separation (negative = up)
  SEPARATION_ALTITUDE: -350, // Auto-separate at this altitude
} as const;

export const INITIAL_ROCKET_STATE: RocketState = {
  x: 50,
  y: PHYSICS.GROUND_Y - 5,  // On the pad
  vx: 0,
  vy: 0,
  angle: 0,
  fuel: 100,
  isThrusting: false,
  hasSeparated: false,
  maxAltitude: 0,
};

// Camera settings
export const CAMERA = {
  // Rocket stays between these positions on screen (0-100%)
  MIN_SCREEN_Y: 25,  // Q1 - don't let rocket go above this on screen
  MAX_SCREEN_Y: 75,  // Q3 - don't let rocket go below this on screen
  SMOOTHING: 0.3,    // How smoothly camera follows (higher = faster)
} as const;
