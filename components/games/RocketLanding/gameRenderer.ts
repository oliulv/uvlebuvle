import { RocketState, GameState, Satellite, PHYSICS, CAMERA } from "./types";

const COLORS = {
  sky: "#87CEEB",
  space: "#0a0a1a",
  ground: "#228b22",
  pad: "#c41e3a",
  padMarking: "#ffffff",
  rocket: "#ffffff",
  rocketStripe: "#c41e3a",
  booster: "#888888",
  flame: ["#ff6600", "#ffcc00", "#ffffff"],
  text: "#1a1a1a",
  textLight: "#666666",
  success: "#228b22",
  danger: "#c41e3a",
  satellite: "#444444",
  targetLine: "#ffcc00",
};

// Convert world Y to screen Y based on camera
function worldToScreenY(worldY: number, cameraY: number, height: number): number {
  // cameraY is the world Y position that should be at screen center
  const screenCenterY = height * 0.5;
  const scale = height / 100; // Scale factor
  return screenCenterY + (worldY - cameraY) * scale;
}

// Calculate camera Y position to keep rocket in view (Q1-Q3 of viewport)
export function calculateCameraY(rocketY: number, currentCameraY: number, height: number = 400): number {
  // Calculate where rocket would appear on screen with current camera
  const screenCenterY = height * 0.5;
  const scale = height / 100;
  const rocketScreenY = screenCenterY + (rocketY - currentCameraY) * scale;

  // Calculate screen bounds (Q1 = 25%, Q3 = 75%)
  const minScreenY = height * (CAMERA.MIN_SCREEN_Y / 100);
  const maxScreenY = height * (CAMERA.MAX_SCREEN_Y / 100);

  let targetCameraY = currentCameraY;

  // If rocket is above Q1 (going too high on screen), move camera up
  if (rocketScreenY < minScreenY) {
    // Calculate what cameraY should be to put rocket at Q1
    targetCameraY = rocketY - (minScreenY - screenCenterY) / scale;
  }
  // If rocket is below Q3 (going too low on screen), move camera down
  else if (rocketScreenY > maxScreenY) {
    // Calculate what cameraY should be to put rocket at Q3
    targetCameraY = rocketY - (maxScreenY - screenCenterY) / scale;
  }

  // Apply smoothing (but faster when difference is large)
  const diff = targetCameraY - currentCameraY;
  const smoothing = Math.min(0.8, CAMERA.SMOOTHING + Math.abs(diff) * 0.01);
  return currentCameraY + diff * smoothing;
}

export function renderGame(
  ctx: CanvasRenderingContext2D,
  rocket: RocketState,
  gameState: GameState,
  countdown: number,
  score: number | null,
  crashReason: string | null,
  cameraY: number,
  satellites: Satellite[],
  separationTimer: number,
  canSeparate: boolean
) {
  const { width, height } = ctx.canvas;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Draw background (based on altitude)
  drawBackground(ctx, rocket.y, cameraY);

  // Draw stars if high enough
  if (rocket.y < -50) {
    drawStars(ctx, cameraY);
  }

  // Draw target altitude line
  if (!rocket.hasSeparated) {
    drawTargetLine(ctx, cameraY, height);
  }

  // Draw satellites
  drawSatellites(ctx, satellites, cameraY);

  // Draw ground and landing pad
  drawGround(ctx, cameraY);
  drawLandingPad(ctx, cameraY);

  // Draw rocket
  drawRocket(ctx, rocket, gameState, cameraY, separationTimer);

  // Draw HUD (fixed on screen, not affected by camera)
  drawHUD(ctx, rocket, canSeparate);

  // Draw state overlays
  if (gameState === "idle") {
    drawStartScreen(ctx);
  } else if (gameState === "countdown") {
    drawCountdown(ctx, countdown);
  } else if (gameState === "separation") {
    drawSeparationMessage(ctx);
  } else if (gameState === "success") {
    drawSuccessScreen(ctx, score);
  } else if (gameState === "crash") {
    drawCrashScreen(ctx, crashReason);
  }
}

function drawBackground(ctx: CanvasRenderingContext2D, rocketY: number, cameraY: number) {
  const { width, height } = ctx.canvas;

  // Gradient from space to sky based on altitude
  const gradient = ctx.createLinearGradient(0, 0, 0, height);

  // The higher up (more negative Y), the darker
  const spaceRatio = Math.min(1, Math.max(0, -rocketY / 300));

  if (spaceRatio < 0.3) {
    // Near ground - blue sky
    gradient.addColorStop(0, COLORS.sky);
    gradient.addColorStop(1, COLORS.sky);
  } else {
    // In space - dark with gradient
    const skyColor = lerpColor(COLORS.sky, COLORS.space, spaceRatio);
    gradient.addColorStop(0, COLORS.space);
    gradient.addColorStop(0.7, skyColor);
    gradient.addColorStop(1, COLORS.sky);
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawStars(ctx: CanvasRenderingContext2D, cameraY: number) {
  const { width, height } = ctx.canvas;
  const starOpacity = Math.min(1, Math.max(0, -cameraY / 200));

  ctx.fillStyle = `rgba(255, 255, 255, ${starOpacity})`;

  // Parallax stars at different layers
  const stars = [
    [0.1, 0.1], [0.3, 0.15], [0.5, 0.08], [0.7, 0.2], [0.9, 0.12],
    [0.15, 0.3], [0.4, 0.25], [0.6, 0.35], [0.85, 0.28],
    [0.2, 0.5], [0.45, 0.45], [0.75, 0.52], [0.95, 0.4],
    [0.05, 0.7], [0.35, 0.65], [0.55, 0.75], [0.8, 0.68],
  ];

  for (const [sx, sy] of stars) {
    // Parallax effect - stars move slower than camera
    const parallaxY = (sy * height + cameraY * 0.1) % height;
    ctx.beginPath();
    ctx.arc(sx * width, parallaxY, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTargetLine(ctx: CanvasRenderingContext2D, cameraY: number, height: number) {
  const targetScreenY = worldToScreenY(PHYSICS.TARGET_ALTITUDE, cameraY, height);

  // Only draw if on screen
  if (targetScreenY < -50 || targetScreenY > height + 50) return;

  ctx.strokeStyle = COLORS.targetLine;
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(0, targetScreenY);
  ctx.lineTo(ctx.canvas.width, targetScreenY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Label
  ctx.font = "bold 10px 'Press Start 2P', monospace";
  ctx.fillStyle = COLORS.targetLine;
  ctx.textAlign = "right";
  ctx.fillText("TARGET ALTITUDE", ctx.canvas.width - 10, targetScreenY - 5);
  ctx.textAlign = "left";
}

function drawSatellites(
  ctx: CanvasRenderingContext2D,
  satellites: Satellite[],
  cameraY: number
) {
  const { width, height } = ctx.canvas;

  for (const sat of satellites) {
    const screenX = (sat.x / 100) * width;
    const screenY = worldToScreenY(sat.y, cameraY, height);

    // Only draw if on screen
    if (screenY < -50 || screenY > height + 50) continue;

    const size = sat.size * 3; // Scale for visibility

    if (sat.type === 'satellite') {
      // Draw satellite body (small box)
      ctx.fillStyle = COLORS.satellite;
      ctx.fillRect(screenX - size/2, screenY - size/4, size, size/2);

      // Draw solar panels (lines extending from body)
      ctx.fillStyle = "#3355aa";
      ctx.fillRect(screenX - size - 8, screenY - 2, 10, 4);
      ctx.fillRect(screenX + size/2 - 2, screenY - 2, 10, 4);

      // Panel detail lines
      ctx.strokeStyle = "#222266";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(screenX - size - 6, screenY - 2);
      ctx.lineTo(screenX - size - 6, screenY + 2);
      ctx.moveTo(screenX - size - 3, screenY - 2);
      ctx.lineTo(screenX - size - 3, screenY + 2);
      ctx.moveTo(screenX + size/2 + 2, screenY - 2);
      ctx.lineTo(screenX + size/2 + 2, screenY + 2);
      ctx.moveTo(screenX + size/2 + 5, screenY - 2);
      ctx.lineTo(screenX + size/2 + 5, screenY + 2);
      ctx.stroke();
    } else {
      // Draw debris (small irregular shape)
      ctx.fillStyle = "#666666";
      ctx.beginPath();
      ctx.arc(screenX, screenY, size/2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawGround(ctx: CanvasRenderingContext2D, cameraY: number) {
  const { width, height } = ctx.canvas;
  const groundScreenY = worldToScreenY(PHYSICS.GROUND_Y, cameraY, height);

  // Only draw if visible
  if (groundScreenY > height + 50) return;

  ctx.fillStyle = COLORS.ground;
  ctx.fillRect(0, groundScreenY, width, height - groundScreenY + 100);
}

function drawLandingPad(ctx: CanvasRenderingContext2D, cameraY: number) {
  const { width, height } = ctx.canvas;
  const groundScreenY = worldToScreenY(PHYSICS.GROUND_Y, cameraY, height);

  // Only draw if visible
  if (groundScreenY > height + 50) return;

  const padStart = (PHYSICS.PAD_X_START / 100) * width;
  const padEnd = (PHYSICS.PAD_X_END / 100) * width;
  const padWidth = padEnd - padStart;

  // Pad base
  ctx.fillStyle = COLORS.pad;
  ctx.fillRect(padStart, groundScreenY - 8, padWidth, 16);

  // Pad markings (X)
  ctx.strokeStyle = COLORS.padMarking;
  ctx.lineWidth = 3;
  const centerX = (padStart + padEnd) / 2;

  ctx.beginPath();
  ctx.moveTo(centerX - 15, groundScreenY - 6);
  ctx.lineTo(centerX + 15, groundScreenY + 6);
  ctx.moveTo(centerX + 15, groundScreenY - 6);
  ctx.lineTo(centerX - 15, groundScreenY + 6);
  ctx.stroke();
}

function drawRocket(
  ctx: CanvasRenderingContext2D,
  rocket: RocketState,
  gameState: GameState,
  cameraY: number,
  separationTimer: number
) {
  const { width, height } = ctx.canvas;
  const screenX = (rocket.x / 100) * width;
  const screenY = worldToScreenY(rocket.y, cameraY, height);

  ctx.save();
  ctx.translate(screenX, screenY);
  ctx.rotate((rocket.angle * Math.PI) / 180);

  const scale = 1.5;

  if (gameState === "crash") {
    // Draw explosion
    drawExplosion(ctx, scale);
  } else if (gameState === "separation") {
    // Draw separation animation
    drawBooster(ctx, scale, rocket.isThrusting);
    drawSeparatingTip(ctx, scale, separationTimer);
  } else if (rocket.hasSeparated) {
    // Draw just the booster
    drawBooster(ctx, scale, rocket.isThrusting);
  } else {
    // Draw full rocket
    drawFullRocket(ctx, scale, rocket.isThrusting);
  }

  ctx.restore();
}

function drawFullRocket(ctx: CanvasRenderingContext2D, scale: number, isThrusting: boolean) {
  // Draw flames first (behind rocket)
  if (isThrusting) {
    drawFlames(ctx, scale);
  }

  // Draw rocket body
  ctx.fillStyle = COLORS.rocket;
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 2;

  // Nose cone
  ctx.beginPath();
  ctx.moveTo(0, -30 * scale);
  ctx.lineTo(-8 * scale, -12 * scale);
  ctx.lineTo(8 * scale, -12 * scale);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Upper body (payload)
  ctx.fillStyle = "#dddddd";
  ctx.fillRect(-8 * scale, -12 * scale, 16 * scale, 12 * scale);
  ctx.strokeRect(-8 * scale, -12 * scale, 16 * scale, 12 * scale);

  // Lower body (booster)
  ctx.fillStyle = COLORS.rocket;
  ctx.fillRect(-8 * scale, 0, 16 * scale, 25 * scale);
  ctx.strokeRect(-8 * scale, 0, 16 * scale, 25 * scale);

  // Red stripe
  ctx.fillStyle = COLORS.rocketStripe;
  ctx.fillRect(-8 * scale, 8 * scale, 16 * scale, 8 * scale);

  // Landing legs
  drawLandingLegs(ctx, scale);
}

function drawBooster(ctx: CanvasRenderingContext2D, scale: number, isThrusting: boolean) {
  // Draw flames first
  if (isThrusting) {
    drawFlames(ctx, scale);
  }

  // Booster body
  ctx.fillStyle = COLORS.rocket;
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 2;

  // Flat top (where tip was)
  ctx.fillRect(-8 * scale, -5 * scale, 16 * scale, 30 * scale);
  ctx.strokeRect(-8 * scale, -5 * scale, 16 * scale, 30 * scale);

  // Red stripe
  ctx.fillStyle = COLORS.rocketStripe;
  ctx.fillRect(-8 * scale, 8 * scale, 16 * scale, 8 * scale);

  // Landing legs
  drawLandingLegs(ctx, scale);
}

function drawSeparatingTip(ctx: CanvasRenderingContext2D, scale: number, timer: number) {
  // Tip moves up and slightly to the side during separation
  const offsetY = -timer * 3;
  const offsetX = timer * 0.5;

  ctx.save();
  ctx.translate(offsetX * scale, offsetY * scale);

  // Nose cone
  ctx.fillStyle = COLORS.rocket;
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(0, -30 * scale);
  ctx.lineTo(-8 * scale, -12 * scale);
  ctx.lineTo(8 * scale, -12 * scale);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Payload section
  ctx.fillStyle = "#dddddd";
  ctx.fillRect(-8 * scale, -12 * scale, 16 * scale, 12 * scale);
  ctx.strokeRect(-8 * scale, -12 * scale, 16 * scale, 12 * scale);

  // Small thrusters on tip
  if (timer > 5) {
    ctx.fillStyle = COLORS.flame[1];
    ctx.beginPath();
    ctx.moveTo(-6 * scale, 0);
    ctx.lineTo(-8 * scale, 8 * scale);
    ctx.lineTo(-4 * scale, 0);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(6 * scale, 0);
    ctx.lineTo(8 * scale, 8 * scale);
    ctx.lineTo(4 * scale, 0);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

function drawLandingLegs(ctx: CanvasRenderingContext2D, scale: number) {
  ctx.strokeStyle = "#333333";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-6 * scale, 25 * scale);
  ctx.lineTo(-14 * scale, 35 * scale);
  ctx.moveTo(6 * scale, 25 * scale);
  ctx.lineTo(14 * scale, 35 * scale);
  ctx.stroke();

  // Leg feet
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-17 * scale, 35 * scale);
  ctx.lineTo(-11 * scale, 35 * scale);
  ctx.moveTo(11 * scale, 35 * scale);
  ctx.lineTo(17 * scale, 35 * scale);
  ctx.stroke();
}

function drawFlames(ctx: CanvasRenderingContext2D, scale: number) {
  const flameHeight = 15 + Math.random() * 10;

  for (let i = 0; i < 3; i++) {
    const offset = (i - 1) * 4;
    ctx.fillStyle = COLORS.flame[i % 3];
    ctx.beginPath();
    ctx.moveTo((-5 + offset) * scale, 25 * scale);
    ctx.lineTo(offset * scale, (25 + flameHeight) * scale);
    ctx.lineTo((5 + offset) * scale, 25 * scale);
    ctx.closePath();
    ctx.fill();
  }
}

function drawExplosion(ctx: CanvasRenderingContext2D, scale: number) {
  const colors = ["#ff6600", "#ffcc00", "#ff3300", "#ffffff"];

  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const distance = 20 + Math.random() * 20;
    const size = 5 + Math.random() * 10;

    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    ctx.beginPath();
    ctx.arc(
      Math.cos(angle) * distance * scale,
      Math.sin(angle) * distance * scale,
      size * scale,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
}

function drawHUD(ctx: CanvasRenderingContext2D, rocket: RocketState, canSeparate: boolean) {
  const { width, height } = ctx.canvas;
  const padding = 15;

  ctx.font = "bold 10px 'Press Start 2P', monospace";

  // Fuel gauge
  const fuelWidth = 100;
  const fuelHeight = 10;
  const fuelX = padding;
  const fuelY = padding;

  ctx.fillStyle = "#333";
  ctx.fillRect(fuelX, fuelY, fuelWidth, fuelHeight);

  const fuelColor = rocket.fuel > 30 ? COLORS.success : COLORS.danger;
  ctx.fillStyle = fuelColor;
  ctx.fillRect(fuelX, fuelY, (rocket.fuel / 100) * fuelWidth, fuelHeight);

  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;
  ctx.strokeRect(fuelX, fuelY, fuelWidth, fuelHeight);

  ctx.fillStyle = COLORS.text;
  ctx.fillText(`FUEL ${Math.round(rocket.fuel)}%`, fuelX, fuelY + fuelHeight + 12);

  // Altitude (negative Y = higher)
  const altitude = Math.max(0, Math.round(-rocket.y * 10));
  ctx.textAlign = "right";
  ctx.fillStyle = COLORS.text;
  ctx.fillText(`ALT: ${altitude}m`, width - padding, padding + 10);

  // Velocity
  const velocity = Math.sqrt(rocket.vx * rocket.vx + rocket.vy * rocket.vy);
  const velColor = velocity <= PHYSICS.MAX_LANDING_VELOCITY ? COLORS.success : COLORS.danger;
  ctx.fillStyle = COLORS.text;
  ctx.fillText(`VEL: `, width - padding - 40, padding + 24);
  ctx.fillStyle = velColor;
  ctx.fillText(`${velocity.toFixed(1)}`, width - padding, padding + 24);

  // Angle
  const angleColor = Math.abs(rocket.angle) <= PHYSICS.MAX_LANDING_ANGLE ? COLORS.success : COLORS.danger;
  ctx.fillStyle = COLORS.text;
  ctx.fillText(`ANG: `, width - padding - 40, padding + 38);
  ctx.fillStyle = angleColor;
  ctx.fillText(`${Math.round(rocket.angle)}°`, width - padding, padding + 38);

  // ===== ALTITUDE BAR (left side) =====
  const barX = padding;
  const barY = padding + 50;
  const barWidth = 12;
  const barHeight = height - 100;
  const targetAltitude = Math.abs(PHYSICS.TARGET_ALTITUDE * 10); // 4000m
  const maxAltitudeDisplay = 5000; // Show up to 5000m on bar

  // Bar background
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.fillRect(barX, barY, barWidth, barHeight);

  // Current altitude fill (from bottom)
  const altitudeRatio = Math.min(1, altitude / maxAltitudeDisplay);
  const fillHeight = altitudeRatio * barHeight;

  // Gradient: green at bottom, yellow in middle, red at top
  const gradient = ctx.createLinearGradient(0, barY + barHeight, 0, barY);
  gradient.addColorStop(0, COLORS.success);
  gradient.addColorStop(0.4, COLORS.targetLine);
  gradient.addColorStop(1, COLORS.danger);

  ctx.fillStyle = gradient;
  ctx.fillRect(barX, barY + barHeight - fillHeight, barWidth, fillHeight);

  // Bar border
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;
  ctx.strokeRect(barX, barY, barWidth, barHeight);

  // Target altitude marker
  const targetRatio = targetAltitude / maxAltitudeDisplay;
  const targetY = barY + barHeight - (targetRatio * barHeight);

  ctx.fillStyle = COLORS.targetLine;
  ctx.beginPath();
  ctx.moveTo(barX + barWidth, targetY);
  ctx.lineTo(barX + barWidth + 8, targetY - 4);
  ctx.lineTo(barX + barWidth + 8, targetY + 4);
  ctx.closePath();
  ctx.fill();

  // Altitude labels
  ctx.font = "6px 'Press Start 2P', monospace";
  ctx.fillStyle = COLORS.text;
  ctx.textAlign = "left";
  ctx.fillText("5K", barX + barWidth + 4, barY + 6);
  ctx.fillText("0", barX + barWidth + 4, barY + barHeight);

  // Mission status
  ctx.font = "bold 10px 'Press Start 2P', monospace";
  ctx.textAlign = "center";
  if (!rocket.hasSeparated) {
    if (canSeparate) {
      // Flashing "PRESS S TO SEPARATE" when can separate
      const flash = Math.floor(Date.now() / 300) % 2 === 0;
      ctx.fillStyle = flash ? COLORS.targetLine : "#ffffff";
      ctx.fillText("PRESS [S] TO SEPARATE!", width / 2, padding + 10);
    } else {
      ctx.fillStyle = COLORS.targetLine;
      ctx.fillText(`REACH 2000m TO SEPARATE`, width / 2, padding + 10);
    }
  } else {
    ctx.fillStyle = COLORS.success;
    ctx.fillText("LAND THE BOOSTER", width / 2, padding + 10);
  }

  ctx.textAlign = "left";
}

function drawStartScreen(ctx: CanvasRenderingContext2D) {
  const { width, height } = ctx.canvas;

  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(0, 0, width, height);

  ctx.font = "bold 14px 'Press Start 2P', monospace";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText("ROCKET LANDING", width / 2, height / 2 - 60);

  ctx.font = "9px 'Press Start 2P', monospace";
  ctx.fillStyle = COLORS.targetLine;
  ctx.fillText("MISSION: FLY HIGH, SEPARATE", width / 2, height / 2 - 30);
  ctx.fillText("& LAND THE BOOSTER", width / 2, height / 2 - 15);

  ctx.font = "10px 'Press Start 2P', monospace";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("PRESS ENTER TO START", width / 2, height / 2 + 20);

  ctx.font = "8px 'Press Start 2P', monospace";
  ctx.fillStyle = COLORS.textLight;
  ctx.fillText("SPACE = THRUST | A/D = STEER", width / 2, height / 2 + 45);
  ctx.fillText("S = SEPARATE (when high enough)", width / 2, height / 2 + 60);

  ctx.textAlign = "left";
}

function drawCountdown(ctx: CanvasRenderingContext2D, count: number) {
  const { width, height } = ctx.canvas;

  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.fillRect(0, 0, width, height);

  ctx.font = "bold 48px 'Press Start 2P', monospace";
  ctx.fillStyle = COLORS.danger;
  ctx.textAlign = "center";

  const text = count > 0 ? count.toString() : "LIFTOFF!";
  ctx.fillText(text, width / 2, height / 2);

  ctx.textAlign = "left";
}

function drawSeparationMessage(ctx: CanvasRenderingContext2D) {
  const { width, height } = ctx.canvas;

  ctx.font = "bold 16px 'Press Start 2P', monospace";
  ctx.fillStyle = COLORS.targetLine;
  ctx.textAlign = "center";
  ctx.fillText("STAGE SEPARATION!", width / 2, height / 2 - 60);

  ctx.font = "10px 'Press Start 2P', monospace";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("LAND THE BOOSTER", width / 2, height / 2 - 35);

  ctx.textAlign = "left";
}

function drawSuccessScreen(ctx: CanvasRenderingContext2D, score: number | null) {
  const { width, height } = ctx.canvas;

  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(0, 0, width, height);

  ctx.font = "bold 16px 'Press Start 2P', monospace";
  ctx.fillStyle = COLORS.success;
  ctx.textAlign = "center";
  ctx.fillText("LANDING SUCCESS!", width / 2, height / 2 - 40);

  if (score !== null) {
    ctx.font = "bold 20px 'Press Start 2P', monospace";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`SCORE: ${score}`, width / 2, height / 2 + 10);
  }

  ctx.font = "10px 'Press Start 2P', monospace";
  ctx.fillStyle = COLORS.textLight;
  ctx.fillText("PRESS ENTER TO RETRY", width / 2, height / 2 + 50);

  ctx.textAlign = "left";
}

function drawCrashScreen(ctx: CanvasRenderingContext2D, reason: string | null) {
  const { width, height } = ctx.canvas;

  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(0, 0, width, height);

  ctx.font = "bold 16px 'Press Start 2P', monospace";
  ctx.fillStyle = COLORS.danger;
  ctx.textAlign = "center";
  ctx.fillText("MISSION FAILED", width / 2, height / 2 - 40);

  if (reason) {
    ctx.font = "11px 'Press Start 2P', monospace";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(reason, width / 2, height / 2);
  }

  ctx.font = "10px 'Press Start 2P', monospace";
  ctx.fillStyle = COLORS.textLight;
  ctx.fillText("PRESS ENTER TO RETRY", width / 2, height / 2 + 40);

  ctx.textAlign = "left";
}

function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);

  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);

  return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}
