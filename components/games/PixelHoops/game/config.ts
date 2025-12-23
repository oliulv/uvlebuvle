import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../types";
import { BootScene } from "./scenes/BootScene";
import { GameScene } from "./scenes/GameScene";

export const createGameConfig = (
  parent: HTMLElement
): Phaser.Types.Core.GameConfig => ({
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent,
  backgroundColor: "#1a1a2e",
  pixelArt: true,
  antialias: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, GameScene],
});
