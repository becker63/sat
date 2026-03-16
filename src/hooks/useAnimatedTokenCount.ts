import { useEffect, useRef, useState } from "react";

export function useAnimatedTokenCount(target: number) {
  const [value, setValue] = useState(target);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (raf.current !== null) {
      cancelAnimationFrame(raf.current);
    }

    const step = () => {
      setValue((prev) => {
        const next = prev + (target - prev) * 0.15;

        if (Math.abs(target - next) < 0.5) {
          return target;
        }

        raf.current = requestAnimationFrame(step);
        return next;
      });
    };

    raf.current = requestAnimationFrame(step);

    return () => {
      if (raf.current !== null) {
        cancelAnimationFrame(raf.current);
      }
    };
  }, [target]);

  return value;
}
