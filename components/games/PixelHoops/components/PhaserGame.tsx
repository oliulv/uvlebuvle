"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import Phaser from "phaser";
import { createGameConfig } from "../game/config";

export interface PhaserGameRef {
  game: Phaser.Game | null;
  scene: Phaser.Scene | null;
}

interface PhaserGameProps {
  className?: string;
}

export const PhaserGame = forwardRef<PhaserGameRef, PhaserGameProps>(
  function PhaserGame({ className }, ref) {
    const gameRef = useRef<Phaser.Game | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      get game() {
        return gameRef.current;
      },
      get scene() {
        return gameRef.current?.scene?.getScene("GameScene") ?? null;
      },
    }));

    useEffect(() => {
      if (!containerRef.current) return;

      // Create game instance
      const config = createGameConfig(containerRef.current);
      gameRef.current = new Phaser.Game(config);

      // Cleanup on unmount
      return () => {
        if (gameRef.current) {
          gameRef.current.destroy(true);
          gameRef.current = null;
        }
      };
    }, []);

    return (
      <div
        ref={containerRef}
        className={className}
        style={{
          width: "100%",
          maxWidth: "800px",
          aspectRatio: "4/3",
        }}
      />
    );
  }
);
