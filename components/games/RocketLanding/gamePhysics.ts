import { RocketState, Controls, LandingResult, PHYSICS } from "./types";

export function updatePhysics(
  rocket: RocketState,
  controls: Controls,
  deltaTime: number
): RocketState {
  let { x, y, vx, vy, angle, fuel, isThrusting } = rocket;

  // Apply gravity
  vy += PHYSICS.GRAVITY * deltaTime;

  // Handle thrust
  isThrusting = controls.thrust && fuel > 0;
  if (isThrusting) {
    const angleRad = (angle * Math.PI) / 180;
    vx += Math.sin(angleRad) * PHYSICS.THRUST_POWER * deltaTime;
    vy -= Math.cos(angleRad) * PHYSICS.THRUST_POWER * deltaTime;
    fuel -= PHYSICS.FUEL_CONSUMPTION * deltaTime;
  }

  // Handle rotation
  if (controls.left) {
    angle -= PHYSICS.ANGULAR_SPEED * deltaTime;
  }
  if (controls.right) {
    angle += PHYSICS.ANGULAR_SPEED * deltaTime;
  }

  // Clamp angle
  angle = Math.max(-60, Math.min(60, angle));

  // Clamp velocity
  const speed = Math.sqrt(vx * vx + vy * vy);
  if (speed > PHYSICS.MAX_VELOCITY) {
    const scale = PHYSICS.MAX_VELOCITY / speed;
    vx *= scale;
    vy *= scale;
  }

  // Update position
  x += vx * deltaTime;
  y += vy * deltaTime;

  // Clamp horizontal position
  x = Math.max(5, Math.min(95, x));

  // Clamp fuel
  fuel = Math.max(0, fuel);

  return { x, y, vx, vy, angle, fuel, isThrusting };
}

export function checkLanding(rocket: RocketState): LandingResult | null {
  // Check if rocket has reached ground level
  if (rocket.y < PHYSICS.GROUND_Y) {
    return null; // Still in the air
  }

  const velocity = Math.sqrt(rocket.vx * rocket.vx + rocket.vy * rocket.vy);
  const absAngle = Math.abs(rocket.angle);
  const onPad = rocket.x >= PHYSICS.PAD_X_START && rocket.x <= PHYSICS.PAD_X_END;

  // Check crash conditions
  if (!onPad) {
    return { success: false, reason: "MISSED THE PAD" };
  }

  if (velocity > PHYSICS.MAX_LANDING_VELOCITY) {
    return { success: false, reason: "TOO FAST" };
  }

  if (absAngle > PHYSICS.MAX_LANDING_ANGLE) {
    return { success: false, reason: "BAD ANGLE" };
  }

  // Successful landing!
  return { success: true };
}

export function calculateScore(rocket: RocketState): number {
  const baseScore = 1000;

  // Fuel bonus (0-500 points)
  const fuelBonus = Math.round(rocket.fuel * 5);

  // Accuracy bonus (how close to center of pad)
  const padCenter = (PHYSICS.PAD_X_START + PHYSICS.PAD_X_END) / 2;
  const distanceFromCenter = Math.abs(rocket.x - padCenter);
  const maxDistance = (PHYSICS.PAD_X_END - PHYSICS.PAD_X_START) / 2;
  const accuracyBonus = Math.round((1 - distanceFromCenter / maxDistance) * 300);

  // Velocity bonus (slower = more points)
  const velocity = Math.sqrt(rocket.vx * rocket.vx + rocket.vy * rocket.vy);
  const velocityBonus = Math.round((1 - velocity / PHYSICS.MAX_LANDING_VELOCITY) * 200);

  return baseScore + fuelBonus + accuracyBonus + velocityBonus;
}
