import { useState, useEffect } from "react";
import { useScroll, useReducedMotion } from "framer-motion";

const STEP_COUNT = 4;

interface UseScrollProgressOptions {
  containerRef: React.RefObject<HTMLElement | null>;
}

interface UseScrollProgressReturn {
  progress: number;
  activeIndex: number;
  prefersReducedMotion: boolean | null;
}

export function useScrollProgress({
  containerRef,
}: UseScrollProgressOptions): UseScrollProgressReturn {
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const [progress, setProgress] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      setProgress(latest);
      const index = Math.min(
        Math.floor(latest * STEP_COUNT),
        STEP_COUNT - 1,
      );
      setActiveIndex(index);
    });

    return unsubscribe;
  }, [scrollYProgress]);

  return { progress, activeIndex, prefersReducedMotion };
}
