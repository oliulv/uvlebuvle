import Phaser from "phaser";
import { BALL, COLORS, COURT } from "../../types";

export type BallState = "held" | "shooting" | "bouncing" | "scored" | "missed";

export class Ball {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;
  public sprite: Phaser.Physics.Arcade.Sprite;

  public state: BallState = "held";
  public touchedRim: boolean = false;
  public touchedBackboard: boolean = false;
  public passedThroughRimTop: boolean = false; // Must be true for valid basket

  private rotation: number = 0;
  private lastBackboardBounceTime: number = 0;
  private lastRimBounceTime: number = 0;
  private readonly BOUNCE_COOLDOWN = 150; // ms between bounces

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // Create a texture for the ball
    this.createBallTexture();

    // Create sprite with physics
    this.sprite = scene.physics.add.sprite(
      COURT.PLAYER_START_X,
      COURT.PLAYER_START_Y - 30,
      "ball"
    );
    this.sprite.setCircle(BALL.RADIUS);
    this.sprite.setBounce(0.6);
    this.sprite.setCollideWorldBounds(false);
    this.sprite.setDepth(5);

    this.graphics = scene.add.graphics();
  }

  private createBallTexture(): void {
    const g = this.scene.add.graphics();
    const size = BALL.RADIUS * 2;

    // Ball base
    g.fillStyle(COLORS.BALL_ORANGE);
    g.fillCircle(BALL.RADIUS, BALL.RADIUS, BALL.RADIUS);

    // Ball lines
    g.lineStyle(2, 0x000000);
    g.strokeCircle(BALL.RADIUS, BALL.RADIUS, BALL.RADIUS - 1);

    // Vertical line
    g.lineBetween(BALL.RADIUS, 2, BALL.RADIUS, size - 2);

    // Horizontal curved line
    g.beginPath();
    g.arc(BALL.RADIUS, BALL.RADIUS, BALL.RADIUS - 2, Phaser.Math.DegToRad(0), Phaser.Math.DegToRad(180), false);
    g.strokePath();

    // Generate texture
    g.generateTexture("ball", size, size);
    g.destroy();
  }

  shoot(velocityX: number, velocityY: number): void {
    this.state = "shooting";
    this.touchedRim = false;
    this.touchedBackboard = false;
    this.passedThroughRimTop = false;

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setGravityY(BALL.GRAVITY);
    body.setVelocity(velocityX, velocityY);
  }

  markPassedRimTop(): void {
    this.passedThroughRimTop = true;
  }

  hold(x: number, y: number): void {
    this.state = "held";
    this.sprite.setPosition(x, y);

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setGravityY(0);
    body.setVelocity(0, 0);
  }

  markScored(): void {
    this.state = "scored";
    // Stop the ball when scored
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setGravityY(0);
    body.setVelocity(0, 0);
  }

  markMissed(): void {
    this.state = "missed";
  }

  bounceOffRim(fromLeft: boolean): boolean {
    const now = Date.now();
    if (now - this.lastRimBounceTime < this.BOUNCE_COOLDOWN) {
      return false; // Too soon, skip this bounce
    }
    this.lastRimBounceTime = now;
    this.touchedRim = true;
    this.state = "bouncing";

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const currentVelX = body.velocity.x;
    const currentVelY = body.velocity.y;

    // Bounce with some randomness
    const bounceX = fromLeft ? Math.abs(currentVelX) * 0.5 : -Math.abs(currentVelX) * 0.5;
    body.setVelocity(
      bounceX + Phaser.Math.Between(-50, 50),
      -Math.abs(currentVelY) * 0.4
    );
    return true;
  }

  bounceOffBackboard(): boolean {
    const now = Date.now();
    if (now - this.lastBackboardBounceTime < this.BOUNCE_COOLDOWN) {
      return false; // Too soon, skip this bounce
    }
    this.lastBackboardBounceTime = now;
    this.touchedBackboard = true;

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(-Math.abs(body.velocity.x) * 0.7);
    return true;
  }

  update(): void {
    if (this.state === "shooting" || this.state === "bouncing") {
      // Rotate based on velocity
      const body = this.sprite.body as Phaser.Physics.Arcade.Body;
      this.rotation += body.velocity.x * 0.001;
      this.sprite.setRotation(this.rotation);

      // Check if ball fell below court
      if (this.sprite.y > COURT.FLOOR_Y + 50) {
        this.markMissed();
      }
    }
  }

  reset(x: number, y: number): void {
    this.state = "held";
    this.touchedRim = false;
    this.touchedBackboard = false;
    this.passedThroughRimTop = false;
    this.rotation = 0;
    this.sprite.setRotation(0);
    this.hold(x, y);
  }

  destroy(): void {
    this.sprite.destroy();
    this.graphics.destroy();
  }
}
