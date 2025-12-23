'use client';

import { useState, useCallback, useEffect, RefObject } from 'react';

interface UseFullscreenReturn {
  isFullscreen: boolean;
  toggle: () => void;
  enter: () => void;
  exit: () => void;
  isSupported: boolean;
}

export function useFullscreen(elementRef?: RefObject<HTMLElement | null>): UseFullscreenReturn {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isSupported = typeof document !== 'undefined' &&
    !!(document.fullscreenEnabled ||
       (document as unknown as { webkitFullscreenEnabled?: boolean }).webkitFullscreenEnabled);

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleChange);
    document.addEventListener('webkitfullscreenchange', handleChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleChange);
      document.removeEventListener('webkitfullscreenchange', handleChange);
    };
  }, []);

  const enter = useCallback(() => {
    const element = elementRef?.current || document.documentElement;

    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if ((element as unknown as { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen) {
      (element as unknown as { webkitRequestFullscreen: () => void }).webkitRequestFullscreen();
    }
  }, [elementRef]);

  const exit = useCallback(() => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if ((document as unknown as { webkitExitFullscreen?: () => void }).webkitExitFullscreen) {
      (document as unknown as { webkitExitFullscreen: () => void }).webkitExitFullscreen();
    }
  }, []);

  const toggle = useCallback(() => {
    if (isFullscreen) {
      exit();
    } else {
      enter();
    }
  }, [isFullscreen, enter, exit]);

  return { isFullscreen, toggle, enter, exit, isSupported };
}
