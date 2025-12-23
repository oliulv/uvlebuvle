import Phaser from "phaser";
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  COURT,
  COLORS,
} from "../../types";

export class Court {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.graphics = scene.add.graphics();
    this.draw();
  }

  private draw(): void {
    const g = this.graphics;

    // Background wall - warm living room color
    g.fillStyle(0x4a3f35); // Warm brown wall
    g.fillRect(0, 0, GAME_WIDTH, COURT.FLOOR_Y);

    // Wall texture - subtle brick/panel pattern
    g.lineStyle(1, 0x3d342c, 0.3);
    const panelWidth = 100;
    const panelHeight = 80;
    for (let y = 0; y < COURT.FLOOR_Y; y += panelHeight) {
      for (let x = 0; x < GAME_WIDTH; x += panelWidth) {
        g.strokeRect(x + 2, y + 2, panelWidth - 4, panelHeight - 4);
      }
    }

    // Picture frames on the wall (placeholders for family pictures)
    this.drawPictureFrame(g, 80, 100, 100, 80, 0xc41e3a); // Red frame
    this.drawPictureFrame(g, 220, 80, 80, 100, 0x228b22); // Green frame
    this.drawPictureFrame(g, 340, 120, 90, 70, 0xc41e3a); // Red frame
    this.drawPictureFrame(g, 100, 250, 70, 90, 0x228b22); // Green frame
    this.drawPictureFrame(g, 250, 220, 110, 85, 0xc41e3a); // Red frame

    // Christmas decorations - garland across top
    g.lineStyle(6, 0x228b22);
    g.beginPath();
    g.moveTo(0, 30);
    for (let x = 0; x < GAME_WIDTH; x += 60) {
      const y = 30 + Math.sin(x / 60) * 15;
      g.lineTo(x, y);
    }
    g.strokePath();

    // Garland ornaments
    for (let x = 30; x < GAME_WIDTH - 100; x += 80) {
      const y = 30 + Math.sin(x / 60) * 15;
      g.fillStyle(x % 160 === 30 ? 0xc41e3a : 0xffd700);
      g.fillCircle(x, y + 10, 6);
    }

    // Floor - hardwood
    g.fillStyle(0x654321);
    g.fillRect(0, COURT.FLOOR_Y, GAME_WIDTH, GAME_HEIGHT - COURT.FLOOR_Y);

    // Floor wood grain
    g.lineStyle(2, 0x8b7355, 0.4);
    for (let x = 0; x < GAME_WIDTH; x += 50) {
      g.lineBetween(x, COURT.FLOOR_Y, x, GAME_HEIGHT);
    }

    // Floor highlight line
    g.lineStyle(2, 0x8b7355, 0.6);
    g.lineBetween(0, COURT.FLOOR_Y, GAME_WIDTH, COURT.FLOOR_Y);

    // 3-point line on floor (subtle)
    g.lineStyle(2, 0xffffff, 0.3);
    g.beginPath();
    g.arc(
      COURT.HOOP_X,
      COURT.FLOOR_Y,
      COURT.HOOP_X - COURT.THREE_POINT_LINE_X,
      Phaser.Math.DegToRad(180),
      Phaser.Math.DegToRad(270),
      false
    );
    g.strokePath();
  }

  private drawPictureFrame(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    width: number,
    height: number,
    frameColor: number
  ): void {
    // Frame border
    g.fillStyle(frameColor);
    g.fillRect(x - 5, y - 5, width + 10, height + 10);

    // Inner frame (wood)
    g.fillStyle(0x5c4033);
    g.fillRect(x, y, width, height);

    // Picture area (placeholder - grey with subtle pattern)
    g.fillStyle(0x888888);
    g.fillRect(x + 4, y + 4, width - 8, height - 8);

    // Placeholder silhouette
    g.fillStyle(0x666666);
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    // Simple person silhouette
    g.fillCircle(centerX, centerY - 10, 12); // Head
    g.fillRect(centerX - 15, centerY + 2, 30, 25); // Body

    // Frame shine
    g.lineStyle(1, 0xffffff, 0.2);
    g.lineBetween(x, y, x + width, y);
    g.lineBetween(x, y, x, y + height);
  }

  destroy(): void {
    this.graphics.destroy();
  }
}
