"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type ReactNode } from "react";
import type { ShapeKind } from "./ShapeScene";
import type { Pose } from "./Mascot";

const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });
const ShapeScene = dynamic(() => import("./ShapeScene"), { ssr: false });

/** True when the device can handle WebGL and the visitor hasn't asked for less motion. */
function useCan3D(minWidth: number) {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wide = window.matchMedia(`(min-width: ${minWidth}px)`).matches;
    let gl = false;
    try {
      gl = !!document.createElement("canvas").getContext("webgl2");
    } catch {}
    setOk(!reduce && wide && gl);
  }, [minWidth]);
  return ok;
}

export function Hero3D({ fallback }: { fallback: ReactNode }) {
  const ok = useCan3D(1024);
  return ok ? <HeroScene /> : <>{fallback}</>;
}

export function Shape3D({ kind, minWidth = 768 }: { kind: ShapeKind; minWidth?: number }) {
  const ok = useCan3D(minWidth);
  return ok ? <ShapeScene kind={kind} /> : null;
}

/** Kai, the YUKINE mascot, on any screen size (falls back to the logo without WebGL). */
export function Mascot3D({ pose = "read" }: { pose?: Pose }) {
  const ok = useCan3D(0);
  return ok ? <ShapeScene kind={`mascot-${pose}`} /> : null;
}
