import { useEffect, useRef, useCallback } from "react";

export function useGameLoop(
  callback: (deltaTime: number) => void,
  isRunning: boolean
) {
  const callbackRef = useRef(callback);
  const previousTimeRef = useRef<number>(0);
  const frameIdRef = useRef<number>(0);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!isRunning) {
      previousTimeRef.current = 0;
      return;
    }

    const loop = (currentTime: number) => {
      if (previousTimeRef.current === 0) {
        previousTimeRef.current = currentTime;
      }

      const deltaTime = Math.min((currentTime - previousTimeRef.current) / 16.67, 2);
      previousTimeRef.current = currentTime;

      callbackRef.current(deltaTime);
      frameIdRef.current = requestAnimationFrame(loop);
    };

    frameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
    };
  }, [isRunning]);
}
