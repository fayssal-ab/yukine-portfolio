"use client";

import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

/**
 * Kai: YUKINE's original mascot, modelled like a soft-vinyl chibi figure.
 * Chunky wheat-blond locks, big amber eyes with a serious little pout,
 * a forest-green parka with a cream fur collar and hood, white tee, jeans,
 * brown boots and his red book. Built from primitives with matte "painted
 * vinyl" materials. Eyes follow the pointer and blink; each page gives him a
 * pose and a prop.
 */

export type Pose = "idle" | "read" | "wave" | "laptop" | "think" | "cheer" | "lost";

const C = {
  skin: "#f9d6c0",
  blush: "#ffb3a6",
  hair: "#e3c47e",
  hairShade: "#c49f55",
  hairLight: "#f4e7bf",
  brow: "#a9824a",
  irisRing: "#4a1d0b",
  iris: "#b0561d",
  irisLight: "#eaa04c",
  pupil: "#1a0b06",
  lash: "#3a2414",
  parka: "#2f6a3b",
  parkaShade: "#22512c",
  fur: "#f1e8d4",
  furShade: "#ddd0b4",
  tee: "#f4f1ea",
  jeans: "#2d4a64",
  boot: "#6b4226",
  sole: "#3b2516",
  book: "#8f2621",
  bookDark: "#6a1916",
  pages: "#f3ead3",
  gold: "#f2d77a",
  brand: "#c642f3",
  cyan: "#45bcf4",
};

/** Matte painted-vinyl finish, like a collectible figure. */
const Vinyl = ({ color, rough = 0.62, emissive, glow = 0 }: { color: string; rough?: number; emissive?: string; glow?: number }) => (
  <meshStandardMaterial color={color} roughness={rough} metalness={0} envMapIntensity={0.2} emissive={emissive ?? "#000000"} emissiveIntensity={glow} />
);

type Lock = { pos: [number, number, number]; quat: THREE.Quaternion; len: number; r: number; flat: number; shade: 0 | 1 | 2 };
type V3 = [number, number, number];

/** A pointed lock from root `a` to tip `b`, flattened so its broad side faces away from the head. */
function lock(a: V3, b: V3, r: number, shade: 0 | 1 | 2 = 0, flat = 0.7): Lock {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const y = B.clone().sub(A);
  const len = y.length();
  y.normalize();
  const mid = A.clone().add(B).multiplyScalar(0.5);
  const out = mid.clone().normalize();
  const z = out.sub(y.clone().multiplyScalar(out.dot(y))).normalize();
  const x = new THREE.Vector3().crossVectors(y, z).normalize();
  const quat = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
  return { pos: mid.toArray() as V3, quat, len, r, flat, shade };
}

/** Unit leaf-shaped lock (y from -0.5 to 0.5): rounded at the root, widest near it, sharp tip. */
function useLeafGeometry() {
  return useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      pts.push(new THREE.Vector2(Math.max(0.001, Math.sin(Math.PI * Math.pow(t, 0.65))) * 1, t - 0.5));
    }
    return new THREE.LatheGeometry(pts, 14);
  }, []);
}

/** Point on a sphere: polar angle from the top, azimuth from the front (+z). */
const onSphere = (radius: number, theta: number, phi: number): V3 => [
  radius * Math.sin(theta) * Math.sin(phi),
  radius * Math.cos(theta),
  radius * Math.sin(theta) * Math.cos(phi),
];

/** Layered petal locks like the sculpted figure: heavy bangs, side locks, a two-tier helmet and a few spikes. */
function makeHair(): Lock[] {
  const out: Lock[] = [];
  // bangs: hang over the forehead down to the brows, slightly swept
  [
    [-0.66, -0.74, 0.02, 0.21, 1],
    [-0.44, -0.5, 0.14, 0.22, 0],
    [-0.22, -0.26, 0.06, 0.22, 2],
    [0.0, -0.02, 0.16, 0.22, 0],
    [0.22, 0.2, 0.08, 0.22, 1],
    [0.44, 0.46, 0.15, 0.21, 0],
    [0.65, 0.74, 0.0, 0.2, 2],
  ].forEach(([x0, x1, y1, r, shade]) => out.push(lock([x0, 0.98, 0.5 - Math.abs(x0) * 0.25], [x1, y1, 0.97 - Math.abs(x1) * 0.42], r, shade as 0 | 1 | 2)));
  // side locks framing the cheeks
  for (const s of [1, -1]) {
    out.push(lock([s * 0.86, 0.55, 0.35], [s * 0.98, -0.5, 0.5], 0.22, 1));
    out.push(lock([s * 0.95, 0.5, 0.0], [s * 1.08, -0.55, 0.12], 0.24, 0));
  }
  // helmet: upper and lower tiers of petals around the sides and back, tips flaring out
  for (let i = 0; i <= 14; i++) {
    const phi = 0.9 + (i / 14) * (Math.PI * 2 - 1.8);
    out.push(lock(onSphere(1.02, 0.35, phi), onSphere(1.24, 1.12, phi + 0.06), 0.22, i % 3 === 0 ? 2 : 0));
    out.push(lock(onSphere(1.06, 0.95, phi - 0.1), onSphere(1.22, 1.9, phi), 0.22, i % 2 ? 1 : 0));
  }
  // crown petals over the top of the cap
  for (let i = 0; i < 7; i++) {
    const phi = -0.9 + (i / 6) * 1.8;
    out.push(lock(onSphere(1.02, 0.05, phi + Math.PI), onSphere(1.16, 0.62, phi), 0.22, i % 3 === 1 ? 2 : 0));
  }
  // a few short spikes on top
  out.push(lock([0.05, 1.0, 0.05], [0.18, 1.42, -0.12], 0.13, 2));
  out.push(lock([-0.15, 1.0, -0.05], [-0.32, 1.32, -0.3], 0.12, 0));
  out.push(lock([0.25, 0.95, -0.2], [0.5, 1.22, -0.42], 0.11, 1));
  return out;
}

function Eye({ side, look, blink }: { side: 1 | -1; look: React.RefObject<THREE.Vector2>; blink: React.RefObject<number> }) {
  const lid = useRef<THREE.Group>(null);
  const iris = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (iris.current && look.current) {
      iris.current.position.x = THREE.MathUtils.damp(iris.current.position.x, look.current.x * 0.045, 10, dt);
      iris.current.position.y = THREE.MathUtils.damp(iris.current.position.y, look.current.y * 0.04, 10, dt);
    }
    if (lid.current) lid.current.scale.y = blink.current ?? 1;
  });
  return (
    <group position={[side * 0.36, -0.2, 0.83]} rotation={[0.05, side * 0.36, 0]}>
      <group ref={lid}>
        <mesh scale={[0.23, 0.26, 0.06]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="#fffdf8" roughness={0.25} />
        </mesh>
        <group ref={iris} position={[side * -0.015, -0.015, 0.04]}>
          <mesh scale={[0.18, 0.215, 0.04]}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial color={C.irisRing} roughness={0.2} />
          </mesh>
          <mesh scale={[0.155, 0.19, 0.04]} position={[0, 0, 0.006]}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial color={C.iris} roughness={0.15} />
          </mesh>
          {/* warm lower glow, painted-figure style */}
          <mesh scale={[0.12, 0.08, 0.03]} position={[0, -0.09, 0.022]}>
            <sphereGeometry args={[1, 24, 16]} />
            <meshStandardMaterial color={C.irisLight} roughness={0.2} />
          </mesh>
          <mesh scale={[0.075, 0.095, 0.03]} position={[0, 0.01, 0.025]}>
            <sphereGeometry args={[1, 24, 24]} />
            <meshStandardMaterial color={C.pupil} roughness={0.1} />
          </mesh>
          <mesh position={[side * -0.06, 0.08, 0.05]} scale={[0.05, 0.06, 0.02]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[side * 0.06, -0.07, 0.05]} scale={0.022}>
            <sphereGeometry args={[1, 12, 12]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      </group>
      {/* thick upper lash line */}
      <mesh position={[0, 0.03, 0.04]} rotation={[0, 0, side * -0.08]} scale={[1.05, 0.95, 1]}>
        <torusGeometry args={[0.235, 0.028, 8, 28, Math.PI * 0.95]} />
        <meshStandardMaterial color={C.lash} roughness={0.5} />
      </mesh>
      {/* brow: slightly furrowed, the serious reading look */}
      <mesh position={[side * 0.01, 0.37, 0.02]} rotation={[0, 0, Math.PI / 2 + side * 0.14]}>
        <capsuleGeometry args={[0.022, 0.18, 4, 8]} />
        <meshStandardMaterial color={C.brow} roughness={0.6} />
      </mesh>
    </group>
  );
}

function Arm({ armRef, side }: { armRef: (g: THREE.Group | null) => void; side: 1 | -1 }) {
  return (
    <group ref={armRef} position={[side * 0.56, -1.12, 0]}>
      <mesh position={[side * 0.05, -0.3, 0]} rotation={[0, 0, side * 0.1]}>
        <capsuleGeometry args={[0.17, 0.42, 8, 16]} />
        <Vinyl color={C.parka} />
      </mesh>
      {/* rolled cuff */}
      <mesh position={[side * 0.1, -0.6, 0]} rotation={[Math.PI / 2, 0, side * 0.1]}>
        <torusGeometry args={[0.15, 0.045, 10, 24]} />
        <Vinyl color={C.parkaShade} />
      </mesh>
      <mesh position={[side * 0.11, -0.74, 0]} scale={[1, 1.05, 0.9]}>
        <sphereGeometry args={[0.135, 20, 20]} />
        <Vinyl color={C.skin} rough={0.5} />
      </mesh>
    </group>
  );
}

function Book() {
  return (
    <group position={[0, -1.62, 0.8]} rotation={[-0.75, 0, 0]}>
      {[1, -1].map((s) => (
        <group key={s} rotation={[0, 0, s * -0.22]}>
          {/* cover */}
          <mesh position={[s * 0.24, 0, 0]}>
            <boxGeometry args={[0.48, 0.035, 0.64]} />
            <Vinyl color={C.book} rough={0.55} />
          </mesh>
          {/* page block */}
          <mesh position={[s * 0.22, 0.05, 0]}>
            <boxGeometry args={[0.42, 0.07, 0.58]} />
            <Vinyl color={C.pages} rough={0.85} />
          </mesh>
        </group>
      ))}
      {/* spine with gold bands */}
      <mesh position={[0, -0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.64, 16]} />
        <Vinyl color={C.bookDark} />
      </mesh>
      {[0.2, -0.2].map((z) => (
        <mesh key={z} position={[0, -0.02, z]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.052, 0.012, 6, 16]} />
          <meshStandardMaterial color={C.gold} metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

function Prop({ pose }: { pose: Pose }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((s) => ref.current && (ref.current.rotation.y = Math.sin(s.clock.elapsedTime * 1.2) * 0.2));
  if (pose === "idle" || pose === "read") return <Book />;
  if (pose === "laptop")
    return (
      <group ref={ref} position={[0, -1.72, 0.78]} rotation={[0.25, 0, 0]}>
        <mesh>
          <boxGeometry args={[1.1, 0.06, 0.7]} />
          <meshStandardMaterial color="#25202f" metalness={0.6} roughness={0.35} />
        </mesh>
        <group position={[0, 0.34, -0.34]} rotation={[-0.35, 0, 0]}>
          <mesh>
            <boxGeometry args={[1.1, 0.68, 0.05]} />
            <meshStandardMaterial color="#25202f" metalness={0.6} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0, 0.03]}>
            <planeGeometry args={[0.98, 0.56]} />
            <meshBasicMaterial color={C.brand} />
          </mesh>
          {[0.16, 0.02, -0.12].map((y, i) => (
            <mesh key={y} position={[-0.12 + i * 0.05, y, 0.035]}>
              <planeGeometry args={[0.6 - i * 0.12, 0.05]} />
              <meshBasicMaterial color={i === 1 ? C.cyan : "#fbf7ff"} />
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
            <Vinyl color="#fbf7ff" rough={0.4} />
          </mesh>
        ))}
        <mesh position={[0.35, 0.4, 0]}>
          <octahedronGeometry args={[0.28, 0]} />
          <meshStandardMaterial color={C.gold} metalness={0.7} roughness={0.25} emissive={C.gold} emissiveIntensity={0.2} />
        </mesh>
      </group>
    );
  if (pose === "cheer")
    return (
      <group ref={ref} position={[0, 2.05, 0]}>
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.32, 0.13, 0.44, 32]} />
          <meshStandardMaterial color={C.gold} metalness={0.85} roughness={0.25} />
        </mesh>
        <mesh position={[0, -0.1, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.22, 12]} />
          <meshStandardMaterial color={C.gold} metalness={0.85} roughness={0.25} />
        </mesh>
        <mesh position={[0, -0.22, 0]}>
          <cylinderGeometry args={[0.18, 0.2, 0.08, 24]} />
          <meshStandardMaterial color={C.gold} metalness={0.85} roughness={0.25} />
        </mesh>
      </group>
    );
  if (pose === "lost")
    return (
      <group ref={ref} position={[1.25, 1.4, 0]}>
        <mesh>
          <torusGeometry args={[0.2, 0.07, 12, 32, Math.PI * 1.4]} />
          <Vinyl color={C.cyan} rough={0.35} />
        </mesh>
        <mesh position={[0.02, -0.42, 0]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <Vinyl color={C.cyan} rough={0.35} />
        </mesh>
      </group>
    );
  return null;
}

/** Fluffy fur collar: a soft ring plus a crown of little tufts, like the sculpted figure. */
function FurCollar() {
  const tufts = useMemo(() => {
    const up = new THREE.Vector3(0, 1, 0);
    return Array.from({ length: 34 }, (_, i) => {
      const a = (i / 34) * Math.PI * 2;
      const row = i % 2;
      const radial = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
      const dir = radial.clone().multiplyScalar(1).add(new THREE.Vector3(0, row ? 0.6 : 0.1, 0)).normalize();
      const pos = new THREE.Vector3(Math.sin(a) * 0.62, row ? 0.04 : -0.05, Math.cos(a) * 0.54);
      return { pos: pos.toArray() as [number, number, number], rot: new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(up, dir)), shade: i % 3 === 0 };
    });
  }, []);
  return (
    <group position={[0, -1.18, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1.1, 0.95, 1]}>
        <torusGeometry args={[0.52, 0.14, 16, 40]} />
        <Vinyl color={C.fur} rough={0.9} />
      </mesh>
      {tufts.map((t, i) => (
        <mesh key={i} position={t.pos} rotation={t.rot}>
          <coneGeometry args={[0.06, 0.18, 6]} />
          <Vinyl color={t.shade ? C.furShade : C.fur} rough={0.92} />
        </mesh>
      ))}
    </group>
  );
}

export default function Mascot({ scale = 1, position = [0, 0, 0] as [number, number, number], pose = "idle" as Pose }) {
  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const hairRef = useRef<THREE.Group>(null);
  const mouth = useRef<THREE.Mesh>(null);
  const arms = useRef<Record<string, THREE.Group | null>>({});
  const look = useRef(new THREE.Vector2());
  const blink = useRef(1);
  const mood = useRef(0);
  const nextBlink = useRef(2);
  const hop = useRef(0);
  const [hover, setHover] = useState(false);
  const hair = useMemo(makeHair, []);
  const leaf = useLeafGeometry();
  const reading = pose === "idle" || pose === "read";

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    look.current.set(state.pointer.x, reading && !hover ? -0.6 : state.pointer.y);
    mood.current = THREE.MathUtils.damp(mood.current, hover || pose === "cheer" ? 1 : 0, 8, dt);

    if (head.current) {
      const tilt = pose === "think" ? 0.2 : pose === "lost" ? Math.sin(t * 2) * 0.15 : 0;
      // reading: eyes down on the book until you hover him, then he looks up at you
      const down = reading && !hover ? 0.16 : pose === "laptop" ? 0.2 : 0;
      head.current.rotation.y = THREE.MathUtils.damp(head.current.rotation.y, state.pointer.x * (reading && !hover ? 0.15 : 0.5), 4, dt);
      head.current.rotation.x = THREE.MathUtils.damp(head.current.rotation.x, -state.pointer.y * 0.25 + down, 4, dt);
      head.current.rotation.z = THREE.MathUtils.damp(head.current.rotation.z, tilt + Math.sin(t * 0.8) * 0.03, 4, dt);
    }
    if (hairRef.current) hairRef.current.rotation.z = Math.sin(t * 1.3) * 0.02;
    // pout by default, small smile when happy
    if (mouth.current) mouth.current.rotation.z = mood.current > 0.5 ? Math.PI : 0;

    const L = arms.current.l, R = arms.current.r;
    const set = (g: THREE.Group | null | undefined, z: number, x: number) => {
      if (!g) return;
      g.rotation.z = THREE.MathUtils.damp(g.rotation.z, z, 6, dt);
      g.rotation.x = THREE.MathUtils.damp(g.rotation.x, x, 6, dt);
    };
    const wave = Math.sin(t * 7) * 0.35;
    switch (pose) {
      case "idle":
      case "read":
        set(R, -0.38, -1.05 + Math.sin(t * 1.4) * 0.03);
        set(L, 0.38, -1.05 + Math.sin(t * 1.4) * 0.03);
        break;
      case "wave":
        set(R, 2.5 + wave, 0);
        set(L, -0.12, 0);
        break;
      case "laptop":
        set(R, -0.3, -1.15 + Math.sin(t * 14) * 0.06);
        set(L, 0.3, -1.15 + Math.cos(t * 14) * 0.06);
        break;
      case "think":
        set(R, -0.5, -1.9);
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
        {/* legs: jeans + brown boots */}
        {[1, -1].map((s) => (
          <group key={s} position={[s * 0.23, -2.3, 0]}>
            <mesh>
              <capsuleGeometry args={[0.18, 0.3, 8, 16]} />
              <Vinyl color={C.jeans} rough={0.75} />
            </mesh>
            <mesh position={[0, -0.33, 0.06]} scale={[1, 0.78, 1.3]}>
              <sphereGeometry args={[0.22, 24, 20]} />
              <Vinyl color={C.boot} rough={0.5} />
            </mesh>
            <mesh position={[0, -0.47, 0.07]} scale={[1, 1, 1.3]}>
              <cylinderGeometry args={[0.21, 0.22, 0.07, 24]} />
              <Vinyl color={C.sole} rough={0.8} />
            </mesh>
            {/* boot cuff */}
            <mesh position={[0, -0.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.18, 0.035, 8, 24]} />
              <Vinyl color={C.boot} rough={0.5} />
            </mesh>
          </group>
        ))}

        {/* parka */}
        <group position={[0, -1.55, 0]}>
          <mesh scale={[1, 1, 0.82]}>
            <capsuleGeometry args={[0.52, 0.42, 8, 24]} />
            <Vinyl color={C.parka} />
          </mesh>
          {/* flared hem */}
          <mesh position={[0, -0.42, 0]} scale={[1, 1, 0.84]}>
            <cylinderGeometry args={[0.5, 0.64, 0.38, 32]} />
            <Vinyl color={C.parka} />
          </mesh>
          {/* open front showing the white tee */}
          <mesh position={[0, 0.18, 0.4]} scale={[0.24, 0.3, 0.08]}>
            <sphereGeometry args={[1, 24, 16]} />
            <Vinyl color={C.tee} rough={0.85} />
          </mesh>
          {/* placket + toggles */}
          <mesh position={[0, -0.25, 0.47]}>
            <boxGeometry args={[0.06, 0.62, 0.04]} />
            <Vinyl color={C.parkaShade} />
          </mesh>
          {[-0.05, -0.3].map((y) => (
            <mesh key={y} position={[0, y, 0.5]} rotation={[0, 0, Math.PI / 2]}>
              <capsuleGeometry args={[0.025, 0.08, 4, 8]} />
              <Vinyl color={C.fur} rough={0.5} />
            </mesh>
          ))}
          {/* pockets */}
          {[1, -1].map((s) => (
            <mesh key={s} position={[s * 0.33, -0.42, 0.46]} rotation={[0, s * 0.45, 0]}>
              <boxGeometry args={[0.26, 0.2, 0.03]} />
              <Vinyl color={C.parkaShade} />
            </mesh>
          ))}
        </group>

        {/* hood resting on the back */}
        <mesh position={[0, -1.02, -0.5]} scale={[1.1, 0.75, 0.7]}>
          <sphereGeometry args={[0.58, 32, 24]} />
          <Vinyl color={C.parka} />
        </mesh>
        <FurCollar />

        <Arm side={1} armRef={(g) => (arms.current.r = g)} />
        <Arm side={-1} armRef={(g) => (arms.current.l = g)} />

        <group ref={head}>
          {/* big round chibi face */}
          <mesh scale={[0.96, 0.94, 0.9]}>
            <sphereGeometry args={[1, 48, 48]} />
            <Vinyl color={C.skin} rough={0.48} />
          </mesh>
          <mesh position={[0, -0.5, 0.3]} scale={[0.62, 0.42, 0.55]}>
            <sphereGeometry args={[1, 32, 32]} />
            <Vinyl color={C.skin} rough={0.48} />
          </mesh>
          {[1, -1].map((s) => (
            <mesh key={s} position={[s * 0.93, -0.18, 0]} scale={[0.1, 0.18, 0.13]}>
              <sphereGeometry args={[1, 16, 16]} />
              <Vinyl color={C.skin} rough={0.48} />
            </mesh>
          ))}
          <Eye side={1} look={look} blink={blink} />
          <Eye side={-1} look={look} blink={blink} />
          {/* button nose */}
          <mesh position={[0, -0.44, 0.88]} scale={[0.035, 0.03, 0.025]}>
            <sphereGeometry args={[1, 12, 12]} />
            <Vinyl color="#f5c9b4" rough={0.5} />
          </mesh>
          {/* small pout (flips to a smile when happy) */}
          <mesh ref={mouth} position={[0, -0.55, 0.83]} rotation={[0.25, 0, 0]}>
            <torusGeometry args={[0.07, 0.017, 6, 20, Math.PI * 0.8]} />
            <meshStandardMaterial color="#6e3426" roughness={0.5} />
          </mesh>
          {[1, -1].map((s) => (
            <mesh key={s} position={[s * 0.5, -0.45, 0.68]} rotation={[0, s * 0.6, 0]} scale={[0.13, 0.06, 0.02]}>
              <sphereGeometry args={[1, 16, 16]} />
              <meshStandardMaterial color={C.blush} transparent opacity={0.45} roughness={0.6} />
            </mesh>
          ))}

          {/* hair */}
          <group ref={hairRef}>
            <mesh rotation={[-0.32, 0, 0]} scale={[1, 1, 0.98]}>
              <sphereGeometry args={[1.08, 48, 32, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
              <Vinyl color={C.hair} rough={0.6} />
            </mesh>
            <mesh position={[0, -0.1, -0.24]} scale={[0.98, 1.02, 0.9]}>
              <sphereGeometry args={[1, 40, 32]} />
              <Vinyl color={C.hair} rough={0.6} />
            </mesh>
            {hair.map((h, i) => (
              <mesh key={i} position={h.pos} quaternion={h.quat} scale={[h.r, h.len, h.r * h.flat]} geometry={leaf}>
                <Vinyl color={h.shade === 1 ? C.hairShade : h.shade === 2 ? C.hairLight : C.hair} rough={0.6} />
              </mesh>
            ))}
          </group>
        </group>

        <Prop pose={pose} />
      </group>
    </Float>
  );
}
