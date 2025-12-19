import { useEffect, useState, useCallback } from "react";
import { Controls } from "./types";

export function useKeyboardControls() {
  const [controls, setControls] = useState<Controls>({
    left: false,
    right: false,
    thrust: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      switch (e.code) {
        case "ArrowLeft":
        case "KeyA":
          setControls((c) => ({ ...c, left: true }));
          break;
        case "ArrowRight":
        case "KeyD":
          setControls((c) => ({ ...c, right: true }));
          break;
        case "Space":
        case "ArrowUp":
        case "KeyW":
          e.preventDefault();
          setControls((c) => ({ ...c, thrust: true }));
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case "ArrowLeft":
        case "KeyA":
          setControls((c) => ({ ...c, left: false }));
          break;
        case "ArrowRight":
        case "KeyD":
          setControls((c) => ({ ...c, right: false }));
          break;
        case "Space":
        case "ArrowUp":
        case "KeyW":
          setControls((c) => ({ ...c, thrust: false }));
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return controls;
}

export function useEnterKey(callback: () => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Enter") {
        e.preventDefault();
        callback();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [callback, enabled]);
}
