import { useEffect, useRef } from 'react';

let lastNavigationTime = 0;
const COOLDOWN_MS = 650;
const DELTA_THRESHOLD = 40;

const useScrollDetection = (callback) => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const handleWheel = (event) => {
      if (Math.abs(event.deltaY) < DELTA_THRESHOLD) return;
      const now = Date.now();
      if (now - lastNavigationTime < COOLDOWN_MS) return;
      lastNavigationTime = now;
      callbackRef.current({ deltaX: event.deltaX, deltaY: event.deltaY });
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);
};

export default useScrollDetection;
