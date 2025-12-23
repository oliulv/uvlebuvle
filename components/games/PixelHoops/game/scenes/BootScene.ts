import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload(): void {
    // Create loading bar
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    const loadingText = this.add.text(width / 2, height / 2 - 50, "LOADING...", {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: "16px",
      color: "#ffffff",
    });
    loadingText.setOrigin(0.5, 0.5);

    // Update progress bar
    this.load.on("progress", (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xc41e3a, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });

    this.load.on("complete", () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    // Since we're using programmatic graphics, we don't need to load external assets
    // Just add a small delay to show the loading screen
    for (let i = 0; i < 10; i++) {
      this.load.image(`dummy${i}`, "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==");
    }
  }

  create(): void {
    // Transition to game scene after a brief moment
    this.time.delayedCall(500, () => {
      this.scene.start("GameScene");
    });
  }
}
