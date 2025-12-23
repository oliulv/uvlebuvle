import Phaser from "phaser";
import { PLAYER, COLORS, COURT } from "../../types";

export type PlayerState = "idle" | "running" | "jumping" | "charging" | "shooting";

export class Player {
  private scene: Phaser.Scene;
  public sprite: Phaser.Physics.Arcade.Sprite;
  public state: PlayerState = "idle";

  private isOnGround: boolean = true;
  private facingRight: boolean = true;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // Create player texture
    this.createPlayerTexture();

    // Create sprite with physics
    this.sprite = scene.physics.add.sprite(
      COURT.PLAYER_START_X,
      COURT.PLAYER_START_Y,
      "player"
    );

    this.sprite.setOrigin(0.5, 1);
    this.sprite.setDepth(4);

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(PLAYER.WIDTH - 8, PLAYER.HEIGHT - 4);
    body.setOffset(4, 4);
    body.setCollideWorldBounds(false);
    body.setGravityY(PLAYER.GRAVITY);
  }

  private createPlayerTexture(): void {
    const g = this.scene.add.graphics();

    // Body (jersey - Christmas red)
    g.fillStyle(COLORS.CHRISTMAS_RED);
    g.fillRect(4, 16, PLAYER.WIDTH - 8, 20);

    // Shorts (white)
    g.fillStyle(COLORS.WHITE);
    g.fillRect(6, 36, PLAYER.WIDTH - 12, 8);

    // Head (skin tone)
    g.fillStyle(0xffdbac);
    g.fillCircle(PLAYER.WIDTH / 2, 10, 8);

    // Hair
    g.fillStyle(0x4a3728);
    g.fillRect(PLAYER.WIDTH / 2 - 6, 2, 12, 6);

    // Arms (skin tone)
    g.fillStyle(0xffdbac);
    g.fillRect(0, 18, 4, 12);
    g.fillRect(PLAYER.WIDTH - 4, 18, 4, 12);

    // Legs (skin tone)
    g.fillStyle(0xffdbac);
    g.fillRect(8, 44, 6, 4);
    g.fillRect(PLAYER.WIDTH - 14, 44, 6, 4);

    // Shoes
    g.fillStyle(COLORS.CHRISTMAS_GREEN);
    g.fillRect(6, 46, 8, 4);
    g.fillRect(PLAYER.WIDTH - 14, 46, 8, 4);

    // Jersey number
    g.fillStyle(COLORS.WHITE);
    g.fillRect(PLAYER.WIDTH / 2 - 3, 22, 6, 8);

    // Generate texture
    g.generateTexture("player", PLAYER.WIDTH, PLAYER.HEIGHT + 2);
    g.destroy();
  }

  moveLeft(): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(-PLAYER.SPEED);
    this.facingRight = false;
    this.sprite.setFlipX(true);
    if (this.isOnGround && this.state !== "charging") {
      this.state = "running";
    }
  }

  moveRight(): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(PLAYER.SPEED);
    this.facingRight = true;
    this.sprite.setFlipX(false);
    if (this.isOnGround && this.state !== "charging") {
      this.state = "running";
    }
  }

  stop(): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(0);
    if (this.isOnGround && this.state !== "charging") {
      this.state = "idle";
    }
  }

  jump(): void {
    if (this.isOnGround) {
      const body = this.sprite.body as Phaser.Physics.Arcade.Body;
      body.setVelocityY(PLAYER.JUMP_VELOCITY);
      this.isOnGround = false;
      this.state = "jumping";
    }
  }

  startCharging(): void {
    this.state = "charging";
  }

  shoot(): void {
    this.state = "shooting";
    // Brief shooting animation, then back to idle
    this.scene.time.delayedCall(300, () => {
      if (this.state === "shooting") {
        this.state = this.isOnGround ? "idle" : "jumping";
      }
    });
  }

  update(): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    // Ground check - player origin is at bottom, so check against floor
    const onFloor = this.sprite.y >= COURT.FLOOR_Y;

    if (onFloor) {
      // Clamp to floor
      this.sprite.y = COURT.FLOOR_Y;

      // Only stop vertical velocity if falling down
      if (body.velocity.y > 0) {
        body.setVelocityY(0);
      }

      // Just landed
      if (!this.isOnGround) {
        this.isOnGround = true;
        if (this.state === "jumping") {
          this.state = body.velocity.x !== 0 ? "running" : "idle";
        }
      }
    } else {
      // In the air
      this.isOnGround = false;
    }

    // Boundary check
    if (this.sprite.x < COURT.LEFT_BOUNDARY) {
      this.sprite.x = COURT.LEFT_BOUNDARY;
      body.setVelocityX(0);
    }
    if (this.sprite.x > COURT.RIGHT_BOUNDARY) {
      this.sprite.x = COURT.RIGHT_BOUNDARY;
      body.setVelocityX(0);
    }
  }

  getBallHoldPosition(): { x: number; y: number } {
    // Position ball near player's hands
    const offsetX = this.facingRight ? 15 : -15;
    return {
      x: this.sprite.x + offsetX,
      y: this.sprite.y - PLAYER.HEIGHT + 20,
    };
  }

  getShootPosition(): { x: number; y: number } {
    // Position where ball is released during shot
    const offsetX = this.facingRight ? 20 : -20;
    return {
      x: this.sprite.x + offsetX,
      y: this.sprite.y - PLAYER.HEIGHT - 5,
    };
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
