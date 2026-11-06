"use client";

import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, Outlines } from "@react-three/drei";
import * as THREE from "three";

/**
 * Kai: YUKINE's original anime mascot, built from primitives and cel-shaded
 * (3-step toon ramp + ink outlines) so he reads like a 2D anime drawing.
 * Silver-lavender layered hair with cyan tips, big violet eyes, a black
 * techwear jacket with glowing seams and a headset resting on his neck.
 * Eyes follow the pointer and blink; each page gives him a pose and a prop.
 */

export type Pose = "idle" | "wave" | "laptop" | "think" | "cheer" | "lost";

const C = {
  skin: "#ffe3d6",
  hair: "#dcd4f5",
  hairShade: "#a99fd6",
  tip: "#45bcf4",
  iris: "#9b4dff",
  jacket: "#17131f",
  seam: "#c642f3",
  pants: "#2a2438",
  shoe: "#f6f2e7",
  ink: "#140c22",
  gold: "#f2d77a",
};

/** 3-step ramp: light, mid, shadow; this is what makes it look hand-drawn. */
function useToonRamp() {
  return useMemo(() => {
    const data = new Uint8Array([70, 70, 70, 255, 170, 170, 170, 255, 255, 255, 255, 255]);
    const tex = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    tex.needsUpdate = true;
    return tex;
  }, []);
}

type ToonProps = { color: string; ramp: THREE.Texture; emissive?: string; glow?: number };
const Toon = ({ color, ramp, emissive = "#000000", glow = 0 }: ToonProps) => (
  <meshToonMaterial color={color} gradientMap={ramp} emissive={emissive} emissiveIntensity={glow} />
);
const Ink = ({ t = 0.025 }: { t?: number }) => <Outlines thickness={t} color={C.ink} />;

type Strand = { pos: [number, number, number]; rot: THREE.Euler; len: number; r: number; tip: boolean };

/** Layered, side-swept hair. Strands start on the scalp and point outward/downward. */
function makeHair(): Strand[] {
  const out: Strand[] = [];
  const up = new THREE.Vector3(0, 1, 0);
  const add = (theta: number, phi: number, len: number, r: number, bend: THREE.Vector3, tip = false) => {
    const dir = new THREE.Vector3(Math.sin(theta) * Math.sin(phi), Math.cos(theta), Math.sin(theta) * Math.cos(phi));
    const along = dir.clone().add(bend).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(up, along);
    const base = dir.clone().multiplyScalar(0.95).add(along.clone().multiplyScalar(len * 0.45));
    out.push({ pos: [base.x, base.y, base.z], rot: new THREE.Euler().setFromQuaternion(q), len, r, tip });
  };
  // crown layers, swept back and to the right
  for (let i = 0; i < 14; i++) {
    const phi = (i / 14) * Math.PI * 2;
    add(0.7 + (i % 3) * 0.12, phi, 0.5 + (i % 2) * 0.12, 0.3, new THREE.Vector3(0.2, -1.2, -0.4), i % 5 === 0);
  }
  // back of the head: longer, falling down
  for (let i = 0; i < 10; i++) {
    const phi = Math.PI * 0.55 + (i / 9) * Math.PI * 0.9;
    add(1.15, phi, 0.8, 0.3, new THREE.Vector3(0, -2, -0.15), i % 3 === 1);
  }
  // sideburns
  for (const s of [1, -1]) add(1.35, s * 1.25, 0.8, 0.2, new THREE.Vector3(0, -1.8, 0.1), s === 1);
  // bangs: asymmetric, sweeping across to his left
  [
    [-0.75, 0.75, 0.2],
    [-0.42, 0.85, 0.21],
    [-0.1, 0.95, 0.23],
    [0.22, 0.85, 0.22],
    [0.52, 0.72, 0.2],
  ].forEach(([phi, len, r], i) => add(0.68, phi, len, r, new THREE.Vector3(-0.55, -1.7, 0.45), i === 1 || i === 3));
  return out;
}

function Eye({ side, look, blink, mood, ramp }: { side: 1 | -1; look: React.RefObject<THREE.Vector2>; blink: React.RefObject<number>; mood: React.RefObject<number>; ramp: THREE.Texture }) {
  const lid = useRef<THREE.Group>(null);
  const iris = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (iris.current && look.current) {
      iris.current.position.x = THREE.MathUtils.damp(iris.current.position.x, look.current.x * 0.05, 10, dt);
      iris.current.position.y = THREE.MathUtils.damp(iris.current.position.y, look.current.y * 0.05, 10, dt);
    }
    if (lid.current) lid.current.scale.y = Math.min(blink.current ?? 1, 1 - (mood.current ?? 0) * 0.5);
  });
  return (
    <group position={[side * 0.33, -0.12, 0.84]} rotation={[0, side * 0.34, 0]}>
      <group ref={lid}>
        {/* white */}
        <mesh scale={[0.2, 0.25, 0.06]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial color="#ffffff" />
          <Ink t={0.012} />
        </mesh>
        <group ref={iris} position={[side * -0.02, -0.01, 0.045]}>
          <mesh scale={[0.15, 0.2, 0.04]}>
            <sphereGeometry args={[1, 32, 32]} />
            <Toon color={C.iris} ramp={ramp} emissive={C.iris} glow={0.35} />
          </mesh>
          <mesh scale={[0.09, 0.12, 0.03]} position={[0, -0.02, 0.02]}>
            <sphereGeometry args={[1, 24, 24]} />
            <meshBasicMaterial color={C.ink} />
          </mesh>
          {/* lower iris glow, a common anime touch */}
          <mesh scale={[0.1, 0.05, 0.02]} position={[0, -0.12, 0.03]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshBasicMaterial color={C.tip} />
          </mesh>
          <mesh position={[side * -0.05, 0.08, 0.05]} scale={0.045}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[side * 0.05, -0.05, 0.05]} scale={0.022}>
            <sphereGeometry args={[1, 12, 12]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      </group>
      {/* upper lash line */}
      <mesh position={[0, 0.2, 0.05]} rotation={[0, 0, side * -0.12]} scale={[1, 0.6, 1]}>
        <torusGeometry args={[0.19, 0.026, 8, 24, Math.PI]} />
        <meshBasicMaterial color={C.ink} />
      </mesh>
      {/* brow */}
      <mesh position={[side * 0.02, 0.36, 0.04]} rotation={[0, 0, side * -0.18]}>
        <capsuleGeometry args={[0.022, 0.2, 4, 8]} />
        <meshBasicMaterial color={C.hairShade} />
      </mesh>
    </group>
  );
}

function Limb({ armRef, side, ramp }: { armRef: (g: THREE.Group | null) => void; side: 1 | -1; ramp: THREE.Texture }) {
  return (
    <group ref={armRef} position={[side * 0.55, -1.12, 0]}>
      <mesh position={[side * 0.06, -0.33, 0]} rotation={[0, 0, side * 0.12]}>
        <capsuleGeometry args={[0.14, 0.48, 6, 16]} />
        <Toon color={C.jacket} ramp={ramp} />
        <Ink />
      </mesh>
      {/* glowing cuff */}
      <mesh position={[side * 0.11, -0.66, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.13, 0.03, 8, 24]} />
        <meshBasicMaterial color={C.seam} />
      </mesh>
      <mesh position={[side * 0.12, -0.8, 0]}>
        <sphereGeometry args={[0.13, 20, 20]} />
        <Toon color={C.skin} ramp={ramp} />
        <Ink t={0.02} />
      </mesh>
    </group>
  );
}

function Prop({ pose, ramp }: { pose: Pose; ramp: THREE.Texture }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((s) => ref.current && (ref.current.rotation.y = Math.sin(s.clock.elapsedTime * 1.2) * 0.2));
  if (pose === "laptop")
    return (
      <group ref={ref} position={[0, -1.85, 0.75]} rotation={[0.25, 0, 0]}>
        <mesh>
          <boxGeometry args={[1.1, 0.06, 0.7]} />
          <Toon color="#25202f" ramp={ramp} />
          <Ink />
        </mesh>
        <group position={[0, 0.34, -0.34]} rotation={[-0.35, 0, 0]}>
          <mesh>
            <boxGeometry args={[1.1, 0.68, 0.05]} />
            <Toon color="#25202f" ramp={ramp} />
            <Ink />
          </mesh>
          <mesh position={[0, 0, 0.03]}>
            <planeGeometry args={[0.98, 0.56]} />
            <meshBasicMaterial color={C.seam} />
          </mesh>
          {[0.16, 0.02, -0.12].map((y, i) => (
            <mesh key={y} position={[-0.12 + i * 0.05, y, 0.035]}>
              <planeGeometry args={[0.6 - i * 0.12, 0.05]} />
              <meshBasicMaterial color={i === 1 ? C.tip : "#fbf7ff"} />
            </mesh>
          ))}
        </group>
      </group>
    );
  if (pose === "think")
    return (
      <group ref={ref} position={[1.4, 1.35, 0]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[-i * 0.28, -i * 0.3, 0]} scale={0.18 - i * 0.05}>
            <sphereGeometry args={[1, 20, 20]} />
            <meshBasicMaterial color="#fbf7ff" />
            <Ink t={0.04} />
          </mesh>
        ))}
        <mesh position={[0.35, 0.4, 0]}>
          <octahedronGeometry args={[0.28, 0]} />
          <Toon color={C.gold} ramp={ramp} emissive={C.gold} glow={0.3} />
          <Ink />
        </mesh>
      </group>
    );
  if (pose === "cheer")
    return (
      <group ref={ref} position={[0, 2.0, 0]}>
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.32, 0.13, 0.44, 32]} />
          <Toon color={C.gold} ramp={ramp} emissive={C.gold} glow={0.25} />
          <Ink />
        </mesh>
        <mesh position={[0, -0.1, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.22, 12]} />
          <Toon color={C.gold} ramp={ramp} />
        </mesh>
        <mesh position={[0, -0.22, 0]}>
          <cylinderGeometry args={[0.18, 0.2, 0.08, 24]} />
          <Toon color={C.gold} ramp={ramp} />
          <Ink />
        </mesh>
      </group>
    );
  if (pose === "lost")
    return (
      <group ref={ref} position={[1.25, 1.4, 0]}>
        <mesh>
          <torusGeometry args={[0.2, 0.07, 12, 32, Math.PI * 1.4]} />
          <meshBasicMaterial color={C.tip} />
          <Ink />
        </mesh>
        <mesh position={[0.02, -0.42, 0]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial color={C.tip} />
          <Ink />
        </mesh>
      </group>
    );
  return null;
}

export default function Mascot({ scale = 1, position = [0, 0, 0] as [number, number, number], pose = "idle" as Pose }) {
  const ramp = useToonRamp();
  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const hairRef = useRef<THREE.Group>(null);
  const arms = useRef<Record<string, THREE.Group | null>>({});
  const look = useRef(new THREE.Vector2());
  const blink = useRef(1);
  const mood = useRef(0);
  const nextBlink = useRef(2);
  const hop = useRef(0);
  const [hover, setHover] = useState(false);
  const hair = useMemo(makeHair, []);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    look.current.set(state.pointer.x, state.pointer.y);
    mood.current = THREE.MathUtils.damp(mood.current, hover || pose === "cheer" ? 1 : 0, 8, dt);

    if (head.current) {
      const tilt = pose === "think" ? 0.2 : pose === "lost" ? Math.sin(t * 2) * 0.15 : 0;
      head.current.rotation.y = THREE.MathUtils.damp(head.current.rotation.y, state.pointer.x * 0.5, 4, dt);
      head.current.rotation.x = THREE.MathUtils.damp(head.current.rotation.x, -state.pointer.y * 0.28 + (pose === "laptop" ? 0.2 : 0), 4, dt);
      head.current.rotation.z = THREE.MathUtils.damp(head.current.rotation.z, tilt + Math.sin(t * 0.8) * 0.03, 4, dt);
    }
    // hair sways a little, like wind
    if (hairRef.current) hairRef.current.rotation.z = Math.sin(t * 1.3) * 0.025;

    const L = arms.current.l, R = arms.current.r;
    const set = (g: THREE.Group | null | undefined, z: number, x: number) => {
      if (!g) return;
      g.rotation.z = THREE.MathUtils.damp(g.rotation.z, z, 6, dt);
      g.rotation.x = THREE.MathUtils.damp(g.rotation.x, x, 6, dt);
    };
    const wave = Math.sin(t * 7) * 0.35;
    switch (pose) {
      case "wave":
        set(R, 2.5 + wave, 0);
        set(L, -0.12, 0);
        break;
      case "laptop":
        set(R, 0.3, -1.15 + Math.sin(t * 14) * 0.06);
        set(L, -0.3, -1.15 + Math.cos(t * 14) * 0.06);
        break;
      case "think":
        set(R, 0.95, -1.7);
        set(L, -0.2, -0.3);
        break;
      case "cheer":
        set(R, 2.75 + Math.sin(t * 5) * 0.1, 0);
        set(L, -2.75 - Math.sin(t * 5) * 0.1, 0);
        break;
      case "lost":
        set(R, 0.6 + Math.sin(t * 2) * 0.2, -0.4);
        set(L, -0.6 - Math.sin(t * 2) * 0.2, -0.4);
        break;
      default:
        set(R, hover ? 2.5 + wave : 0.1, 0);
        set(L, -0.1, 0);
    }

    if (t > nextBlink.current) {
      const k = (t - nextBlink.current) / 0.15;
      blink.current = k < 1 ? Math.abs(1 - 2 * k) * 0.95 + 0.05 : 1;
      if (k >= 1) nextBlink.current = t + 2 + Math.random() * 3;
    }

    if (root.current) {
      if (hop.current > 0) {
        hop.current = Math.max(0, hop.current - dt * 1.6);
        const p = 1 - hop.current;
        root.current.position.y = position[1] + Math.sin(p * Math.PI) * 0.6;
        root.current.rotation.y = p * Math.PI * 2;
      } else {
        root.current.position.y = position[1] + (pose === "cheer" ? Math.abs(Math.sin(t * 5)) * 0.1 : 0);
        root.current.rotation.y = 0;
      }
      const s = scale * (hover ? 1.04 : 1);
      root.current.scale.setScalar(THREE.MathUtils.damp(root.current.scale.x, s, 8, dt));
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.45}>
      <group
        ref={root}
        position={position}
        scale={scale}
        onPointerOver={(e) => (e.stopPropagation(), setHover(true), (document.body.style.cursor = "pointer"))}
        onPointerOut={() => (setHover(false), (document.body.style.cursor = ""))}
        onClick={(e) => (e.stopPropagation(), hop.current <= 0 && (hop.current = 1))}
      >
        {/* legs + shoes */}
        {[1, -1].map((s) => (
          <group key={s} position={[s * 0.22, -2.45, 0]}>
            <mesh>
              <capsuleGeometry args={[0.16, 0.45, 6, 16]} />
              <Toon color={C.pants} ramp={ramp} />
              <Ink />
            </mesh>
            <mesh position={[0, -0.42, 0.08]} scale={[1, 0.6, 1.4]}>
              <sphereGeometry args={[0.19, 20, 20]} />
              <Toon color={C.shoe} ramp={ramp} />
              <Ink />
            </mesh>
            <mesh position={[0, -0.5, 0.08]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1.4, 1]}>
              <torusGeometry args={[0.17, 0.025, 8, 24]} />
              <meshBasicMaterial color={C.tip} />
            </mesh>
          </group>
        ))}

        {/* torso: techwear jacket */}
        <group position={[0, -1.6, 0]}>
          <mesh scale={[1, 1, 0.78]}>
            <capsuleGeometry args={[0.5, 0.55, 8, 24]} />
            <Toon color={C.jacket} ramp={ramp} />
            <Ink />
          </mesh>
          {/* zip + glowing seams */}
          <mesh position={[0, 0, 0.4]}>
            <boxGeometry args={[0.03, 0.95, 0.02]} />
            <meshBasicMaterial color="#8d86a0" />
          </mesh>
          {[1, -1].map((s) => (
            <mesh key={s} position={[s * 0.26, -0.05, 0.36]} rotation={[0, s * 0.35, s * 0.18]}>
              <boxGeometry args={[0.025, 0.8, 0.02]} />
              <meshBasicMaterial color={C.seam} />
            </mesh>
          ))}
          <mesh position={[0, -0.5, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.78, 1]}>
            <torusGeometry args={[0.5, 0.04, 8, 40]} />
            <meshBasicMaterial color={C.seam} />
          </mesh>
          {/* high collar */}
          <mesh position={[0, 0.58, 0]}>
            <cylinderGeometry args={[0.3, 0.38, 0.28, 24, 1, true]} />
            <Toon color={C.jacket} ramp={ramp} />
            <Ink />
          </mesh>
        </group>

        {/* neck */}
        <mesh position={[0, -0.92, 0]}>
          <cylinderGeometry args={[0.15, 0.17, 0.3, 16]} />
          <Toon color={C.skin} ramp={ramp} />
        </mesh>
        {/* headset resting on the neck */}
        <group position={[0, -1.02, 0.05]}>
          <mesh rotation={[Math.PI / 2 + 0.2, 0, 0]}>
            <torusGeometry args={[0.36, 0.045, 10, 40, Math.PI * 1.25]} />
            <Toon color="#25202f" ramp={ramp} />
            <Ink t={0.015} />
          </mesh>
          {[1, -1].map((s) => (
            <group key={s} position={[s * 0.36, -0.02, 0.18]} rotation={[0, s * 0.5, Math.PI / 2]}>
              <mesh>
                <cylinderGeometry args={[0.17, 0.17, 0.12, 24]} />
                <Toon color="#25202f" ramp={ramp} />
                <Ink t={0.015} />
              </mesh>
              <mesh position={[0, s * 0.065, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.11, 0.022, 8, 32]} />
                <meshBasicMaterial color={C.tip} />
              </mesh>
            </group>
          ))}
        </group>

        <Limb side={1} armRef={(g) => (arms.current.r = g)} ramp={ramp} />
        <Limb side={-1} armRef={(g) => (arms.current.l = g)} ramp={ramp} />

        <group ref={head}>
          {/* face: slightly long, soft jaw */}
          <mesh scale={[0.9, 1, 0.88]}>
            <sphereGeometry args={[1, 48, 48]} />
            <Toon color={C.skin} ramp={ramp} />
            <Ink t={0.02} />
          </mesh>
          <mesh position={[0, -0.55, 0.32]} scale={[0.55, 0.42, 0.5]}>
            <sphereGeometry args={[1, 32, 32]} />
            <Toon color={C.skin} ramp={ramp} />
          </mesh>
          {/* ears */}
          {[1, -1].map((s) => (
            <mesh key={s} position={[s * 0.88, -0.12, 0]} scale={[0.1, 0.18, 0.12]}>
              <sphereGeometry args={[1, 16, 16]} />
              <Toon color={C.skin} ramp={ramp} />
              <Ink t={0.015} />
            </mesh>
          ))}
          <Eye side={1} look={look} blink={blink} mood={mood} ramp={ramp} />
          <Eye side={-1} look={look} blink={blink} mood={mood} ramp={ramp} />
          {/* tiny nose + mouth */}
          <mesh position={[0, -0.36, 0.86]} scale={[0.025, 0.035, 0.02]}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshBasicMaterial color="#e8a99a" />
          </mesh>
          <mesh position={[0.02, -0.55, 0.78]} rotation={[0.3, 0, pose === "lost" ? 0 : Math.PI]}>
            <torusGeometry args={[0.07, 0.014, 6, 20, Math.PI * 0.8]} />
            <meshBasicMaterial color={C.ink} />
          </mesh>
          {/* blush */}
          {[1, -1].map((s) => (
            <mesh key={s} position={[s * 0.48, -0.38, 0.7]} rotation={[0, s * 0.6, 0]} scale={[0.13, 0.055, 0.02]}>
              <sphereGeometry args={[1, 16, 16]} />
              <meshBasicMaterial color="#ff9fc0" transparent opacity={0.6} />
            </mesh>
          ))}

          {/* hair */}
          <group ref={hairRef}>
            <mesh rotation={[-0.3, 0, 0]} scale={[0.97, 1, 0.97]}>
              <sphereGeometry args={[1.1, 48, 32, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
              <Toon color={C.hair} ramp={ramp} />
              <Ink t={0.02} />
            </mesh>
            <mesh position={[0, -0.12, -0.22]} scale={[0.95, 1.02, 0.9]}>
              <sphereGeometry args={[1, 40, 32]} />
              <Toon color={C.hair} ramp={ramp} />
            </mesh>
            {hair.map((h, i) => (
              <group key={i} position={h.pos} rotation={h.rot}>
                <mesh>
                  <coneGeometry args={[h.r, h.len, 8]} />
                  <Toon color={i % 4 === 0 ? C.hairShade : C.hair} ramp={ramp} />
                  <Ink t={0.018} />
                </mesh>
                {h.tip && (
                  <mesh position={[0, h.len * 0.32, 0]}>
                    <coneGeometry args={[h.r * 0.36, h.len * 0.36, 8]} />
                    <Toon color={C.tip} ramp={ramp} emissive={C.tip} glow={0.4} />
                  </mesh>
                )}
              </group>
            ))}
          </group>
        </group>

        <Prop pose={pose} ramp={ramp} />
      </group>
    </Float>
  );
}
