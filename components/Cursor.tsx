"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

/** Dot + trailing ring. The ring grows over links and shows a label over [data-cursor]. */
export default function Cursor() {
  const [on, setOn] = useState(false);
  const [mode, setMode] = useState<"idle" | "link" | "label">("idle");
  const [label, setLabel] = useState("");
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const rx = useSpring(x, { stiffness: 380, damping: 32, mass: 0.6 });
  const ry = useSpring(y, { stiffness: 380, damping: 32, mass: 0.6 });

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    setOn(true);
    document.documentElement.classList.add("has-cursor");
    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const t = e.target as HTMLElement | null;
      const lab = t?.closest<HTMLElement>("[data-cursor]");
      if (lab) {
        setMode("label");
        setLabel(lab.dataset.cursor ?? "");
      } else if (t?.closest("a, button")) setMode("link");
      else setMode("idle");
    };
    window.addEventListener("pointermove", move);
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.classList.remove("has-cursor");
    };
  }, [x, y]);

  if (!on) return null;
  const size = mode === "label" ? 96 : mode === "link" ? 56 : 34;

  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[100] flex items-center justify-center rounded-full font-mono text-[11px] font-medium uppercase tracking-widest text-[#0d0618]"
        style={{ x: rx, y: ry, translateX: "-50%", translateY: "-50%" }}
        animate={{
          width: size,
          height: size,
          backgroundColor: mode === "label" ? "#c642f3" : "rgba(198,66,243,0)",
          borderColor: mode === "idle" ? "rgba(241,239,233,.45)" : "rgba(198,66,243,1)",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <span className="absolute inset-0 rounded-full border" style={{ borderColor: "inherit" }} />
        {mode === "label" && label}
      </motion.div>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[101] h-1.5 w-1.5 rounded-full bg-brand"
        style={{ x, y, translateX: "-50%", translateY: "-50%" }}
        animate={{ opacity: mode === "label" ? 0 : 1 }}
      />
    </>
  );
}
