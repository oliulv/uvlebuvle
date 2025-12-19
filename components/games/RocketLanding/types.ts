export interface RocketState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  fuel: number;
  isThrusting: boolean;
}

export type GameState =
  | "idle"
  | "countdown"
  | "flying"
  | "success"
  | "crash";

export interface Controls {
  left: boolean;
  right: boolean;
  thrust: boolean;
}

export interface LandingResult {
  success: boolean;
  reason?: string;
}

export const PHYSICS = {
  GRAVITY: 0.08,
  THRUST_POWER: 0.22,
  LATERAL_THRUST: 0.08,
  ANGULAR_SPEED: 2,
  FUEL_CONSUMPTION: 0.12,
  MAX_VELOCITY: 6,
  MAX_LANDING_VELOCITY: 1.5,
  MAX_LANDING_ANGLE: 15,
  GROUND_Y: 85,
  PAD_X_START: 40,
  PAD_X_END: 60,
} as const;

export const INITIAL_ROCKET_STATE: RocketState = {
  x: 50,
  y: PHYSICS.GROUND_Y - 5,
  vx: 0,
  vy: 0,
  angle: 0,
  fuel: 100,
  isThrusting: false,
};

export const LAUNCH_STATE: RocketState = {
  x: 50,
  y: 20,
  vx: (Math.random() - 0.5) * 2,
  vy: 0.5,
  angle: (Math.random() - 0.5) * 20,
  fuel: 80,
  isThrusting: false,
};
