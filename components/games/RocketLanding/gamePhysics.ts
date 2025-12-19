import { RocketState, Controls, LandingResult, Satellite, PHYSICS } from "./types";

export function updatePhysics(
  rocket: RocketState,
  controls: Controls,
  deltaTime: number,
  autoThrust: boolean = false
): RocketState {
  let { x, y, vx, vy, angle, fuel, isThrusting, hasSeparated, maxAltitude } = rocket;

  // Apply gravity
  vy += PHYSICS.GRAVITY * deltaTime;

  // Handle thrust (either from controls or auto-thrust during launch)
  const shouldThrust = (controls.thrust || autoThrust) && fuel > 0;
  isThrusting = shouldThrust;

  if (shouldThrust) {
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

  // Track max altitude (y goes negative when higher)
  if (y < maxAltitude) {
    maxAltitude = y;
  }

  return { x, y, vx, vy, angle, fuel, isThrusting, hasSeparated, maxAltitude };
}

export function checkLanding(rocket: RocketState, isDescending: boolean): LandingResult | null {
  // Only check landing when descending (after separation)
  if (!isDescending) {
    return null;
  }

  // Check if rocket has reached ground level (y >= 0 means at or below ground)
  if (rocket.y < PHYSICS.GROUND_Y - 5) {
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

  // Must have separated before landing
  if (!rocket.hasSeparated) {
    return { success: false, reason: "REACH TARGET ALTITUDE FIRST" };
  }

  // Successful landing!
  return { success: true };
}

export function checkSatelliteCollision(
  rocket: RocketState,
  satellites: Satellite[]
): boolean {
  const rocketRadius = 6; // Smaller, more accurate collision

  for (const sat of satellites) {
    // Circle collision - more forgiving
    const dx = rocket.x - sat.x;
    const dy = rocket.y - sat.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = rocketRadius + sat.size;

    if (distance < minDistance) {
      return true;
    }
  }

  return false;
}

export function updateSatellites(
  satellites: Satellite[],
  deltaTime: number
): Satellite[] {
  return satellites.map((sat) => ({
    ...sat,
    x: sat.x + sat.speed * deltaTime,
  })).filter((sat) => sat.x > -20 && sat.x < 120);
}

export function spawnSatellite(rocketY: number): Satellite | null {
  // Only spawn satellites at certain altitudes (in space)
  if (rocketY > -150) return null;

  // Much lower spawn rate
  if (Math.random() > 0.008) return null;

  const fromLeft = Math.random() > 0.5;
  const isSatellite = Math.random() > 0.3;

  return {
    x: fromLeft ? -5 : 105,
    y: rocketY + (Math.random() - 0.5) * 80,
    size: isSatellite ? 4 + Math.random() * 3 : 2 + Math.random() * 2,
    speed: (fromLeft ? 1 : -1) * (0.2 + Math.random() * 0.3),
    type: isSatellite ? 'satellite' : 'debris',
  };
}

export function calculateScore(rocket: RocketState): number {
  const baseScore = 1000;

  // Altitude bonus (how high did they go before separation)
  const altitudeBonus = Math.round(Math.abs(rocket.maxAltitude) * 0.5);

  // Fuel bonus (0-500 points)
  const fuelBonus = Math.round(rocket.fuel * 5);

  // Accuracy bonus (how close to center of pad)
  const padCenter = (PHYSICS.PAD_X_START + PHYSICS.PAD_X_END) / 2;
  const distanceFromCenter = Math.abs(rocket.x - padCenter);
  const maxDistance = (PHYSICS.PAD_X_END - PHYSICS.PAD_X_START) / 2;
  const accuracyBonus = Math.round((1 - distanceFromCenter / maxDistance) * 300);

  // Velocity bonus (slower = more points)
  const velocity = Math.sqrt(rocket.vx * rocket.vx + rocket.vy * rocket.vy);
  const velocityBonus = Math.round(Math.max(0, (1 - velocity / PHYSICS.MAX_LANDING_VELOCITY) * 200));

  return baseScore + altitudeBonus + fuelBonus + accuracyBonus + velocityBonus;
}
