import { RocketState, GameState, PHYSICS } from "./types";

const COLORS = {
  sky: "#87CEEB",
  space: "#1a1a2e",
  ground: "#228b22",
  pad: "#c41e3a",
  padMarking: "#ffffff",
  rocket: "#ffffff",
  rocketStripe: "#c41e3a",
  flame: ["#ff6600", "#ffcc00", "#ffffff"],
  text: "#1a1a1a",
  textLight: "#666666",
  success: "#228b22",
  danger: "#c41e3a",
};

export function renderGame(
  ctx: CanvasRenderingContext2D,
  rocket: RocketState,
  gameState: GameState,
  countdown: number,
  score: number | null,
  crashReason: string | null
) {
  const { width, height } = ctx.canvas;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Draw background
  drawBackground(ctx, rocket.y);

  // Draw stars if high enough
  if (rocket.y < 50) {
    drawStars(ctx, rocket.y);
  }

  // Draw ground and landing pad
  drawGround(ctx);
  drawLandingPad(ctx);

  // Draw rocket
  drawRocket(ctx, rocket, gameState);

  // Draw HUD
  drawHUD(ctx, rocket);

  // Draw state overlays
  if (gameState === "idle") {
    drawStartScreen(ctx);
  } else if (gameState === "countdown") {
    drawCountdown(ctx, countdown);
  } else if (gameState === "success") {
    drawSuccessScreen(ctx, score);
  } else if (gameState === "crash") {
    drawCrashScreen(ctx, crashReason);
  }
}

function drawBackground(ctx: CanvasRenderingContext2D, rocketY: number) {
  const { width, height } = ctx.canvas;

  // Gradient from space to sky based on altitude
  const skyRatio = Math.min(1, rocketY / 80);
  const gradient = ctx.createLinearGradient(0, 0, 0, height);

  if (skyRatio > 0.5) {
    gradient.addColorStop(0, COLORS.sky);
    gradient.addColorStop(1, COLORS.sky);
  } else {
    gradient.addColorStop(0, COLORS.space);
    gradient.addColorStop(0.5, lerpColor(COLORS.space, COLORS.sky, skyRatio * 2));
    gradient.addColorStop(1, COLORS.sky);
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawStars(ctx: CanvasRenderingContext2D, rocketY: number) {
  const { width, height } = ctx.canvas;
  const starOpacity = Math.max(0, 1 - rocketY / 50);

  ctx.fillStyle = `rgba(255, 255, 255, ${starOpacity})`;

  // Fixed star positions
  const stars = [
    [0.1, 0.1], [0.3, 0.15], [0.5, 0.08], [0.7, 0.2], [0.9, 0.12],
    [0.15, 0.3], [0.4, 0.25], [0.6, 0.35], [0.85, 0.28],
    [0.2, 0.45], [0.45, 0.4], [0.75, 0.42],
  ];

  for (const [sx, sy] of stars) {
    ctx.beginPath();
    ctx.arc(sx * width, sy * height, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGround(ctx: CanvasRenderingContext2D) {
  const { width, height } = ctx.canvas;
  const groundY = (PHYSICS.GROUND_Y / 100) * height;

  ctx.fillStyle = COLORS.ground;
  ctx.fillRect(0, groundY, width, height - groundY);
}

function drawLandingPad(ctx: CanvasRenderingContext2D) {
  const { width, height } = ctx.canvas;
  const groundY = (PHYSICS.GROUND_Y / 100) * height;
  const padStart = (PHYSICS.PAD_X_START / 100) * width;
  const padEnd = (PHYSICS.PAD_X_END / 100) * width;
  const padWidth = padEnd - padStart;

  // Pad base
  ctx.fillStyle = COLORS.pad;
  ctx.fillRect(padStart, groundY - 8, padWidth, 16);

  // Pad markings (X)
  ctx.strokeStyle = COLORS.padMarking;
  ctx.lineWidth = 3;
  const centerX = (padStart + padEnd) / 2;

  ctx.beginPath();
  ctx.moveTo(centerX - 15, groundY - 6);
  ctx.lineTo(centerX + 15, groundY + 6);
  ctx.moveTo(centerX + 15, groundY - 6);
  ctx.lineTo(centerX - 15, groundY + 6);
  ctx.stroke();
}

function drawRocket(
  ctx: CanvasRenderingContext2D,
  rocket: RocketState,
  gameState: GameState
) {
  const { width, height } = ctx.canvas;
  const x = (rocket.x / 100) * width;
  const y = (rocket.y / 100) * height;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rocket.angle * Math.PI) / 180);

  const scale = 1.5;

  if (gameState === "crash") {
    // Draw explosion
    drawExplosion(ctx, scale);
  } else {
    // Draw flames first (behind rocket)
    if (rocket.isThrusting) {
      drawFlames(ctx, scale);
    }

    // Draw rocket body
    ctx.fillStyle = COLORS.rocket;
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;

    // Nose cone
    ctx.beginPath();
    ctx.moveTo(0, -25 * scale);
    ctx.lineTo(-8 * scale, -10 * scale);
    ctx.lineTo(8 * scale, -10 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Body
    ctx.fillRect(-8 * scale, -10 * scale, 16 * scale, 30 * scale);
    ctx.strokeRect(-8 * scale, -10 * scale, 16 * scale, 30 * scale);

    // Red stripe
    ctx.fillStyle = COLORS.rocketStripe;
    ctx.fillRect(-8 * scale, 2 * scale, 16 * scale, 8 * scale);

    // Landing legs
    ctx.strokeStyle = "#333333";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-6 * scale, 20 * scale);
    ctx.lineTo(-14 * scale, 30 * scale);
    ctx.moveTo(6 * scale, 20 * scale);
    ctx.lineTo(14 * scale, 30 * scale);
    ctx.stroke();

    // Leg feet
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-17 * scale, 30 * scale);
    ctx.lineTo(-11 * scale, 30 * scale);
    ctx.moveTo(11 * scale, 30 * scale);
    ctx.lineTo(17 * scale, 30 * scale);
    ctx.stroke();
  }

  ctx.restore();
}

function drawFlames(ctx: CanvasRenderingContext2D, scale: number) {
  const flameHeight = 15 + Math.random() * 10;

  for (let i = 0; i < 3; i++) {
    const offset = (i - 1) * 4;
    ctx.fillStyle = COLORS.flame[i % 3];
    ctx.beginPath();
    ctx.moveTo((-5 + offset) * scale, 20 * scale);
    ctx.lineTo(offset * scale, (20 + flameHeight) * scale);
    ctx.lineTo((5 + offset) * scale, 20 * scale);
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

function drawHUD(ctx: CanvasRenderingContext2D, rocket: RocketState) {
  const { width } = ctx.canvas;
  const padding = 15;

  ctx.font = "bold 12px 'Press Start 2P', monospace";

  // Fuel gauge
  const fuelWidth = 120;
  const fuelHeight = 12;
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
  ctx.fillText(`FUEL ${Math.round(rocket.fuel)}%`, fuelX, fuelY + fuelHeight + 14);

  // Velocity
  const velocity = Math.sqrt(rocket.vx * rocket.vx + rocket.vy * rocket.vy);
  const velColor = velocity <= PHYSICS.MAX_LANDING_VELOCITY ? COLORS.success : COLORS.danger;

  ctx.fillStyle = COLORS.text;
  ctx.textAlign = "right";
  ctx.fillText(`VEL: `, width - padding - 60, padding + 12);
  ctx.fillStyle = velColor;
  ctx.fillText(`${velocity.toFixed(1)}`, width - padding, padding + 12);

  // Altitude
  const altitude = Math.max(0, PHYSICS.GROUND_Y - rocket.y);
  ctx.fillStyle = COLORS.text;
  ctx.fillText(`ALT: ${Math.round(altitude * 10)}m`, width - padding, padding + 28);

  // Angle
  const angleColor = Math.abs(rocket.angle) <= PHYSICS.MAX_LANDING_ANGLE ? COLORS.success : COLORS.danger;
  ctx.fillStyle = COLORS.text;
  ctx.fillText(`ANG: `, width - padding - 50, padding + 44);
  ctx.fillStyle = angleColor;
  ctx.fillText(`${Math.round(rocket.angle)}°`, width - padding, padding + 44);

  ctx.textAlign = "left";
}

function drawStartScreen(ctx: CanvasRenderingContext2D) {
  const { width, height } = ctx.canvas;

  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(0, 0, width, height);

  ctx.font = "bold 16px 'Press Start 2P', monospace";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText("ROCKET LANDING", width / 2, height / 2 - 30);

  ctx.font = "10px 'Press Start 2P', monospace";
  ctx.fillText("PRESS ENTER TO LAUNCH", width / 2, height / 2 + 10);

  ctx.font = "8px 'Press Start 2P', monospace";
  ctx.fillStyle = COLORS.textLight;
  ctx.fillText("SPACE = THRUST | ARROWS = STEER", width / 2, height / 2 + 40);

  ctx.textAlign = "left";
}

function drawCountdown(ctx: CanvasRenderingContext2D, count: number) {
  const { width, height } = ctx.canvas;

  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.fillRect(0, 0, width, height);

  ctx.font = "bold 48px 'Press Start 2P', monospace";
  ctx.fillStyle = COLORS.danger;
  ctx.textAlign = "center";

  const text = count > 0 ? count.toString() : "GO!";
  ctx.fillText(text, width / 2, height / 2);

  ctx.textAlign = "left";
}

function drawSuccessScreen(ctx: CanvasRenderingContext2D, score: number | null) {
  const { width, height } = ctx.canvas;

  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(0, 0, width, height);

  ctx.font = "bold 18px 'Press Start 2P', monospace";
  ctx.fillStyle = COLORS.success;
  ctx.textAlign = "center";
  ctx.fillText("LANDING SUCCESS!", width / 2, height / 2 - 40);

  if (score !== null) {
    ctx.font = "bold 24px 'Press Start 2P', monospace";
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

  ctx.font = "bold 18px 'Press Start 2P', monospace";
  ctx.fillStyle = COLORS.danger;
  ctx.textAlign = "center";
  ctx.fillText("MISSION FAILED", width / 2, height / 2 - 40);

  if (reason) {
    ctx.font = "12px 'Press Start 2P', monospace";
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
