import { useRef, useState, useEffect, useCallback } from "react";
import { useInView, useReducedMotion } from "framer-motion";

interface UseCountUpOptions {
  end: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
}

interface UseCountUpReturn {
  ref: React.RefObject<HTMLElement | null>;
  value: number;
  formattedValue: string;
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function useCountUp({
  end,
  duration = 2,
  decimals = 0,
  suffix = "",
}: UseCountUpOptions): UseCountUpReturn {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true });
  const prefersReducedMotion = useReducedMotion();
  const [animatedValue, setAnimatedValue] = useState(0);

  const format = useCallback(
    (v: number) => v.toFixed(decimals) + suffix,
    [decimals, suffix],
  );

  useEffect(() => {
    if (!isInView || prefersReducedMotion) return;

    const durationMs = duration * 1000;
    let startTime: number | null = null;
    let frameId: number;

    const step = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const easedProgress = easeOut(progress);

      setAnimatedValue(easedProgress * end);

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      }
    };

    frameId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frameId);
  }, [isInView, end, duration, prefersReducedMotion]);

  // Snap to final value immediately when reduced motion is preferred
  const value = prefersReducedMotion && isInView ? end : animatedValue;

  return {
    ref,
    value,
    formattedValue: format(value),
  };
}
