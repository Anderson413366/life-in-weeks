import React, { useEffect, useRef, useState } from "react";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ value, duration = 1200 }) => {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = prevRef.current;
    const diff = value - start;
    if (diff === 0) return;

    const startTime = performance.now();

    function step(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + diff * eased);
      setDisplay(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        prevRef.current = value;
      }
    }

    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value, duration]);

  return <>{display.toLocaleString()}</>;
};

export default AnimatedCounter;
