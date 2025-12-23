import Phaser from "phaser";
import { COURT, COLORS } from "../../types";

export class Hoop {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;

  // Collision zones
  public rimLeft: Phaser.GameObjects.Zone;
  public rimRight: Phaser.GameObjects.Zone;
  public rimTop: Phaser.GameObjects.Zone; // Top of rim to detect ball passing through properly
  public backboard: Phaser.GameObjects.Zone;
  public basket: Phaser.GameObjects.Zone;

  // Positions
  public readonly rimLeftX: number;
  public readonly rimRightX: number;
  public readonly rimY: number;
  public readonly backboardX: number;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.graphics = scene.add.graphics();

    // Calculate positions
    this.backboardX = COURT.HOOP_X + 40;
    this.rimLeftX = COURT.HOOP_X - 25;
    this.rimRightX = COURT.HOOP_X + 25;
    this.rimY = COURT.HOOP_Y + 60;

    // Create collision zones
    this.backboard = scene.add.zone(this.backboardX, COURT.HOOP_Y + 40, 10, 100);

    // Rim collision zones - taller to catch balls from both directions
    this.rimLeft = scene.add.zone(this.rimLeftX, this.rimY, 10, 16);
    this.rimRight = scene.add.zone(this.rimRightX, this.rimY, 10, 16);

    // Top of rim zone - ball must pass through this BEFORE basket to count as valid
    // This zone is ABOVE the rim - ball must clear the rim height to trigger this
    this.rimTop = scene.add.zone(COURT.HOOP_X, this.rimY - 18, 36, 10);

    // Basket zone - well below rim, ball must actually fall through the net
    // Ball must have passed through rimTop first for a valid score
    this.basket = scene.add.zone(COURT.HOOP_X, this.rimY + 30, 30, 12);

    // Enable physics on zones
    scene.physics.add.existing(this.backboard, true);
    scene.physics.add.existing(this.rimLeft, true);
    scene.physics.add.existing(this.rimRight, true);
    scene.physics.add.existing(this.rimTop, true);
    scene.physics.add.existing(this.basket, true);

    this.draw();
  }

  private draw(): void {
    const g = this.graphics;
    g.setDepth(10);

    // Backboard
    g.fillStyle(COLORS.BACKBOARD_WHITE);
    g.fillRect(this.backboardX - 5, COURT.HOOP_Y - 20, 12, 120);

    // Backboard border
    g.lineStyle(3, 0x333333);
    g.strokeRect(this.backboardX - 5, COURT.HOOP_Y - 20, 12, 120);

    // Backboard square (target)
    g.lineStyle(2, COLORS.CHRISTMAS_RED);
    g.strokeRect(this.backboardX - 3, COURT.HOOP_Y + 20, 8, 40);

    // Rim (front part - drawn on top)
    g.lineStyle(6, COLORS.RIM_ORANGE);
    g.lineBetween(this.rimLeftX, this.rimY, this.rimRightX, this.rimY);

    // Rim connection to backboard
    g.lineStyle(4, COLORS.RIM_ORANGE);
    g.lineBetween(this.rimRightX, this.rimY, this.backboardX - 5, this.rimY);

    // Net (simple lines)
    g.lineStyle(2, COLORS.NET_WHITE, 0.8);
    const netDepth = 40;
    const netSegments = 5;

    for (let i = 0; i <= netSegments; i++) {
      const x = this.rimLeftX + (i * (this.rimRightX - this.rimLeftX)) / netSegments;
      const bottomX = COURT.HOOP_X + (i - netSegments / 2) * 6;
      g.lineBetween(x, this.rimY + 2, bottomX, this.rimY + netDepth);
    }

    // Horizontal net lines
    for (let row = 1; row < 3; row++) {
      const y = this.rimY + row * (netDepth / 3);
      const width = 50 - row * 8;
      g.lineBetween(
        COURT.HOOP_X - width / 2,
        y,
        COURT.HOOP_X + width / 2,
        y
      );
    }

    // Pole/support
    g.fillStyle(0x444444);
    g.fillRect(this.backboardX + 2, COURT.HOOP_Y + 80, 8, COURT.FLOOR_Y - COURT.HOOP_Y - 60);
  }

  destroy(): void {
    this.graphics.destroy();
    this.rimLeft.destroy();
    this.rimRight.destroy();
    this.rimTop.destroy();
    this.backboard.destroy();
    this.basket.destroy();
  }
}
