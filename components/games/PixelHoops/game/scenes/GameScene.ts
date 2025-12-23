import Phaser from "phaser";
import { EventBus } from "../EventBus";
import { Court } from "../objects/Court";
import { Hoop } from "../objects/Hoop";
import { Ball } from "../objects/Ball";
import { Player } from "../objects/Player";
import {
  GAME_DURATION,
  GAME_WIDTH,
  COURT,
  BALL,
  SHOT,
  POINTS,
  EVENTS,
  COLORS,
  ShotData,
} from "../../types";

export class GameScene extends Phaser.Scene {
  private court!: Court;
  private hoop!: Hoop;
  private ball!: Ball;
  private player!: Player;

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keyX!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;

  // Game state
  private score: number = 0;
  private timeRemaining: number = GAME_DURATION;
  private isPlaying: boolean = false;
  private shotsMade: number = 0;
  private shotsMissed: number = 0;

  // Shot state
  private isCharging: boolean = false;
  private chargeLevel: number = 0;
  private shotFromX: number = 0;

  // Timer
  private gameTimer?: Phaser.Time.TimerEvent;

  // UI elements
  private scoreText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private instructionText!: Phaser.GameObjects.Text;
  private chargeBar!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: "GameScene" });
  }

  create(): void {
    // Create game objects
    this.court = new Court(this);
    this.hoop = new Hoop(this);
    this.player = new Player(this);
    this.ball = new Ball(this);

    // Setup input
    this.setupInput();

    // Setup collisions
    this.setupCollisions();

    // Create UI
    this.createUI();

    // Listen for game start from React
    EventBus.on(EVENTS.GAME_START, this.startGame.bind(this));

    // Emit ready event
    EventBus.emit("scene-ready", this);
  }

  private setupInput(): void {
    if (!this.input.keyboard) return;

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyX = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  private setupCollisions(): void {
    // Rim collisions
    this.physics.add.overlap(
      this.ball.sprite,
      this.hoop.rimLeft,
      () => this.handleRimCollision(true),
      undefined,
      this
    );

    this.physics.add.overlap(
      this.ball.sprite,
      this.hoop.rimRight,
      () => this.handleRimCollision(false),
      undefined,
      this
    );

    // Backboard collision
    this.physics.add.overlap(
      this.ball.sprite,
      this.hoop.backboard,
      () => this.handleBackboardCollision(),
      undefined,
      this
    );

    // Rim top zone - ball passing through the top of the rim (valid entry)
    this.physics.add.overlap(
      this.ball.sprite,
      this.hoop.rimTop,
      () => this.handleRimTopPass(),
      undefined,
      this
    );

    // Basket (scoring) zone
    this.physics.add.overlap(
      this.ball.sprite,
      this.hoop.basket,
      () => this.handleBasketEntry(),
      undefined,
      this
    );
  }

  private createUI(): void {
    // Score display
    this.scoreText = this.add.text(20, 20, "SCORE: 0", {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: "20px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4,
    });
    this.scoreText.setDepth(100);

    // Timer display
    this.timerText = this.add.text(GAME_WIDTH - 20, 20, `TIME: ${GAME_DURATION}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: "20px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4,
    });
    this.timerText.setOrigin(1, 0);
    this.timerText.setDepth(100);

    // Instruction text
    this.instructionText = this.add.text(
      GAME_WIDTH / 2,
      GAME_WIDTH / 3,
      "PRESS SPACE TO START",
      {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: "24px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
      }
    );
    this.instructionText.setOrigin(0.5, 0.5);
    this.instructionText.setDepth(100);

    // Charge bar
    this.chargeBar = this.add.graphics();
    this.chargeBar.setDepth(100);
  }

  private startGame(): void {
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.score = 0;
    this.timeRemaining = GAME_DURATION;
    this.shotsMade = 0;
    this.shotsMissed = 0;
    this.chargeLevel = 0;
    this.isCharging = false;

    this.instructionText.setVisible(false);

    // Reset player and ball positions
    this.player.sprite.setPosition(COURT.PLAYER_START_X, COURT.PLAYER_START_Y);
    const holdPos = this.player.getBallHoldPosition();
    this.ball.reset(holdPos.x, holdPos.y);

    // Start game timer
    this.gameTimer = this.time.addEvent({
      delay: 1000,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true,
    });

    // Emit score update
    this.emitScoreUpdate();
  }

  private updateTimer(): void {
    this.timeRemaining--;
    this.timerText.setText(`TIME: ${this.timeRemaining}`);

    // Flash timer when low
    if (this.timeRemaining <= 10) {
      this.timerText.setColor(this.timeRemaining % 2 === 0 ? "#ff0000" : "#ffffff");
    }

    EventBus.emit(EVENTS.TIME_UPDATE, this.timeRemaining);

    if (this.timeRemaining <= 0) {
      this.endGame();
    }
  }

  private endGame(): void {
    this.isPlaying = false;

    if (this.gameTimer) {
      this.gameTimer.destroy();
    }

    // Show game over text
    this.instructionText.setText(`GAME OVER!\nSCORE: ${this.score}`);
    this.instructionText.setVisible(true);

    EventBus.emit(EVENTS.GAME_OVER, {
      score: this.score,
      shotsMade: this.shotsMade,
      shotsMissed: this.shotsMissed,
    });
  }

  private handleRimCollision(fromLeft: boolean): void {
    if (this.ball.state !== "shooting" && this.ball.state !== "bouncing") return;

    // Ball handles its own cooldown for multiple bounces
    this.ball.bounceOffRim(fromLeft);
  }

  private handleBackboardCollision(): void {
    if (this.ball.state !== "shooting" && this.ball.state !== "bouncing") return;

    // Ball handles its own cooldown for multiple bounces
    this.ball.bounceOffBackboard();
  }

  private handleRimTopPass(): void {
    // Ball is passing through the top of the rim (valid entry point)
    if (this.ball.state !== "shooting" && this.ball.state !== "bouncing") return;

    // Only mark if ball is moving downward (entering the rim, not exiting)
    const body = this.ball.sprite.body as Phaser.Physics.Arcade.Body;
    if (body.velocity.y > 0) {
      this.ball.markPassedRimTop();
    }
  }

  private handleBasketEntry(): void {
    // Only allow scoring from shooting or bouncing states
    if (this.ball.state !== "shooting" && this.ball.state !== "bouncing") return;

    // Check ball is moving downward
    const body = this.ball.sprite.body as Phaser.Physics.Arcade.Body;
    if (body.velocity.y < 0) return;

    // Ball must have passed through the rim top to count as valid basket
    // This prevents balls going under the rim from counting
    if (!this.ball.passedThroughRimTop) {
      // Ball went under the rim, not through it - this is a miss
      return;
    }

    // Mark as scored immediately to prevent multiple triggers
    this.ball.markScored();

    // Calculate points
    const isThreePointer = this.shotFromX < COURT.THREE_POINT_LINE_X;
    const wasSwish = !this.ball.touchedRim && !this.ball.touchedBackboard;
    const wasBank = this.ball.touchedBackboard && !this.ball.touchedRim;

    let points = isThreePointer ? POINTS.THREE_POINTER : POINTS.TWO_POINTER;
    if (wasSwish) points += POINTS.SWISH_BONUS;
    if (wasBank) points += POINTS.BANK_BONUS;

    this.score += points;
    this.shotsMade++;

    // Show score popup
    this.showScorePopup(points, wasSwish, wasBank, isThreePointer);

    // Emit events
    const shotData: ShotData = {
      result: wasSwish ? "swish" : wasBank ? "bank" : "made",
      points,
      wasThreePointer: isThreePointer,
      wasSwish,
      wasBank,
    };
    EventBus.emit(EVENTS.SHOT_MADE, shotData);
    this.emitScoreUpdate();

    // Reset ball after delay
    this.time.delayedCall(500, () => {
      const holdPos = this.player.getBallHoldPosition();
      this.ball.reset(holdPos.x, holdPos.y);
    });
  }

  private showScorePopup(points: number, wasSwish: boolean, wasBank: boolean, isThree: boolean): void {
    let text = `+${points}`;
    if (wasSwish) text += " SWISH!";
    else if (wasBank) text += " BANK!";
    else if (isThree) text += " 3PT!";

    const popup = this.add.text(
      this.hoop.rimLeftX,
      this.hoop.rimY - 50,
      text,
      {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: "24px",
        color: wasSwish ? "#ffff00" : isThree ? "#00ff00" : "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
      }
    );
    popup.setOrigin(0.5, 0.5);
    popup.setDepth(100);

    // Animate popup
    this.tweens.add({
      targets: popup,
      y: popup.y - 80,
      alpha: 0,
      scale: 1.5,
      duration: 1000,
      ease: "Power2",
      onComplete: () => popup.destroy(),
    });
  }

  private emitScoreUpdate(): void {
    this.scoreText.setText(`SCORE: ${this.score}`);
    EventBus.emit(EVENTS.SCORE_UPDATE, {
      score: this.score,
      timeRemaining: this.timeRemaining,
      shotsMade: this.shotsMade,
      shotsMissed: this.shotsMissed,
    });
  }

  private handleInput(): void {
    if (!this.isPlaying) {
      // Check for game start
      if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {
        this.startGame();
        EventBus.emit(EVENTS.GAME_START);
      }
      return;
    }

    // Movement
    const leftPressed = this.cursors.left.isDown || this.keyA.isDown;
    const rightPressed = this.cursors.right.isDown || this.keyD.isDown;

    if (leftPressed) {
      this.player.moveLeft();
    } else if (rightPressed) {
      this.player.moveRight();
    } else {
      this.player.stop();
    }

    // Jump
    if (Phaser.Input.Keyboard.JustDown(this.keySpace) || Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      this.player.jump();
    }

    // Shot charging
    if (this.ball.state === "held") {
      if (this.keyX.isDown || this.cursors.down.isDown) {
        if (!this.isCharging) {
          this.isCharging = true;
          this.chargeLevel = 0;
          this.player.startCharging();
          this.shotFromX = this.player.sprite.x;
        }
        // Increase charge
        this.chargeLevel = Math.min(this.chargeLevel + SHOT.CHARGE_RATE, SHOT.MAX_CHARGE);
        EventBus.emit(EVENTS.CHARGE_UPDATE, this.chargeLevel);
        this.updateChargeBar();
      } else if (this.isCharging) {
        // Release shot
        this.shootBall();
        this.isCharging = false;
        this.chargeBar.clear();
        EventBus.emit(EVENTS.CHARGE_UPDATE, 0);
      }
    }
  }

  private updateChargeBar(): void {
    this.chargeBar.clear();

    const barWidth = 60;
    const barHeight = 10;
    const x = this.player.sprite.x - barWidth / 2;
    const y = this.player.sprite.y - 70;

    // Background
    this.chargeBar.fillStyle(0x333333, 0.8);
    this.chargeBar.fillRect(x, y, barWidth, barHeight);

    // Fill based on charge
    const fillWidth = (this.chargeLevel / SHOT.MAX_CHARGE) * barWidth;

    // Color based on optimal zone
    let color: number = COLORS.CHRISTMAS_RED;
    if (this.chargeLevel >= SHOT.OPTIMAL_CHARGE_MIN && this.chargeLevel <= SHOT.OPTIMAL_CHARGE_MAX) {
      color = COLORS.CHRISTMAS_GREEN;
    } else if (this.chargeLevel > SHOT.OPTIMAL_CHARGE_MAX) {
      color = 0xff0000; // Overcharged
    }

    this.chargeBar.fillStyle(color);
    this.chargeBar.fillRect(x, y, fillWidth, barHeight);

    // Border
    this.chargeBar.lineStyle(2, 0xffffff);
    this.chargeBar.strokeRect(x, y, barWidth, barHeight);

    // Optimal zone markers
    const optMinX = x + (SHOT.OPTIMAL_CHARGE_MIN / SHOT.MAX_CHARGE) * barWidth;
    const optMaxX = x + (SHOT.OPTIMAL_CHARGE_MAX / SHOT.MAX_CHARGE) * barWidth;
    this.chargeBar.lineStyle(2, 0xffff00);
    this.chargeBar.lineBetween(optMinX, y - 2, optMinX, y + barHeight + 2);
    this.chargeBar.lineBetween(optMaxX, y - 2, optMaxX, y + barHeight + 2);
  }

  private shootBall(): void {
    this.player.shoot();

    const shootPos = this.player.getShootPosition();
    this.ball.sprite.setPosition(shootPos.x, shootPos.y);

    // Calculate distance to hoop
    const dx = COURT.HOOP_X - shootPos.x;
    const dy = COURT.HOOP_Y - shootPos.y; // Negative because hoop is above player

    // Power scales with charge (0-100%)
    let powerMultiplier = this.chargeLevel / 100;
    if (this.chargeLevel >= SHOT.OPTIMAL_CHARGE_MIN && this.chargeLevel <= SHOT.OPTIMAL_CHARGE_MAX) {
      // Sweet spot gives better accuracy
      powerMultiplier = 0.9 + (this.chargeLevel - SHOT.OPTIMAL_CHARGE_MIN) * 0.005;
    }

    // Calculate shot angle - we want a nice high arc
    // Shoot at roughly 60-65 degrees for a good basketball arc
    const baseAngle = 62 * (Math.PI / 180); // 62 degrees in radians

    // Adjust angle based on distance - closer shots can be more direct
    const distanceFactor = Math.min(dx / 500, 1); // 0 to 1 based on distance
    const shotAngle = baseAngle - distanceFactor * 0.1; // Slightly flatter for far shots

    // Base velocity scales with distance
    const baseVelocity = 378 + dx * 0.675;

    // Apply power multiplier - now the full range of the bar is useful
    // At 0% charge: velocity = baseVelocity * 0.6
    // At 100% charge: velocity = baseVelocity * 1.1
    const velocity = baseVelocity * (0.6 + powerMultiplier * 0.5);

    // Calculate velocity components
    const velocityX = velocity * Math.cos(shotAngle);
    const velocityY = -velocity * Math.sin(shotAngle); // Negative = upward in Phaser

    this.ball.shoot(velocityX, velocityY);
  }

  update(): void {
    if (!this.player || !this.ball) return;

    this.handleInput();
    this.player.update();
    this.ball.update();

    // Update ball position when held
    if (this.ball.state === "held" && !this.isCharging) {
      const holdPos = this.player.getBallHoldPosition();
      this.ball.hold(holdPos.x, holdPos.y);
    } else if (this.ball.state === "held" && this.isCharging) {
      // Keep ball at shoot position while charging
      const shootPos = this.player.getShootPosition();
      this.ball.hold(shootPos.x, shootPos.y);
    }

    // Check for missed shot
    if (this.ball.state === "missed") {
      this.shotsMissed++;
      EventBus.emit(EVENTS.SHOT_MISSED);
      this.emitScoreUpdate();

      // Reset ball
      const holdPos = this.player.getBallHoldPosition();
      this.ball.reset(holdPos.x, holdPos.y);
    }

    // Safety: if ball is scored but fell off screen, reset it
    if (this.ball.state === "scored" && this.ball.sprite.y > COURT.FLOOR_Y + 100) {
      const holdPos = this.player.getBallHoldPosition();
      this.ball.reset(holdPos.x, holdPos.y);
    }
  }

  shutdown(): void {
    EventBus.removeAllListeners();
    if (this.gameTimer) {
      this.gameTimer.destroy();
    }
  }
}
