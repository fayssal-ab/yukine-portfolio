"use client";

import { useEffect, useRef, useState } from "react";

/** Stops rendering a canvas while it is off screen, so scrolling stays smooth and the GPU rests. */
export function useInViewFrameloop() {
  const ref = useRef<HTMLDivElement>(null);
  const [frameloop, setFrameloop] = useState<"always" | "never">("always");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setFrameloop(e.isIntersecting ? "always" : "never"), { rootMargin: "100px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, frameloop };
}
