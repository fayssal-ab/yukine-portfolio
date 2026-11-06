"use client";

import { Suspense, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, Image, Lightformer, RoundedBox, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { useInViewFrameloop } from "./useInViewFrameloop";
import Mascot from "./Mascot";

type ScreenProps = {
  url: string;
  aspect: number;
  width: number;
  position: [number, number, number];
  rotation: [number, number, number];
  speed: number;
};

/** A project screenshot on a thin rounded slab that lifts toward the camera on hover. */
function Screen({ url, aspect, width, position, rotation, speed }: ScreenProps) {
  const group = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);
  const h = width / aspect;

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const s = hover ? 1.06 : 1;
    g.scale.x = THREE.MathUtils.damp(g.scale.x, s, 6, dt);
    g.scale.y = THREE.MathUtils.damp(g.scale.y, s, 6, dt);
    g.position.z = THREE.MathUtils.damp(g.position.z, position[2] + (hover ? 0.35 : 0), 6, dt);
  });

  return (
    <Float speed={speed} rotationIntensity={0.25} floatIntensity={0.6}>
      <group
        ref={group}
        position={position}
        rotation={rotation}
        onPointerOver={(e) => (e.stopPropagation(), setHover(true))}
        onPointerOut={() => setHover(false)}
      >
        <RoundedBox args={[width + 0.08, h + 0.08, 0.06]} radius={0.06} smoothness={4} position={[0, 0, -0.04]}>
          <meshStandardMaterial color="#141418" metalness={0.6} roughness={0.35} />
        </RoundedBox>
        <Image url={url} scale={[width, h]} radius={0.05} toneMapped={false} />
      </group>
    </Float>
  );
}

function Chrome({ position, scale, kind }: { position: [number, number, number]; scale: number; kind: "torus" | "ico" | "sphere" }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.x += dt * 0.25;
    ref.current.rotation.y += dt * 0.35;
  });
  return (
    <Float speed={1.4} rotationIntensity={0.8} floatIntensity={1.2}>
      <mesh ref={ref} position={position} scale={scale}>
        {kind === "torus" && <torusGeometry args={[1, 0.36, 48, 120]} />}
        {kind === "ico" && <icosahedronGeometry args={[1, 0]} />}
        {kind === "sphere" && <sphereGeometry args={[1, 48, 48]} />}
        <meshStandardMaterial color={kind === "sphere" ? "#c642f3" : "#e9e7e2"} metalness={1} roughness={kind === "sphere" ? 0.25 : 0.08} />
      </mesh>
    </Float>
  );
}

/** Camera eases toward the pointer, so the whole scene tilts with the mouse. */
function Rig() {
  useFrame((state, dt) => {
    const cam = state.camera;
    cam.position.x = THREE.MathUtils.damp(cam.position.x, state.pointer.x * 0.9, 2.5, dt);
    cam.position.y = THREE.MathUtils.damp(cam.position.y, state.pointer.y * 0.6, 2.5, dt);
    cam.lookAt(0, 0, 0);
  });
  return null;
}

export default function HeroScene() {
  const { ref, frameloop } = useInViewFrameloop();

  return (
    <div ref={ref} className="h-full w-full">
      <Canvas
        frameloop={frameloop}
        dpr={[1, 1.6]}
        camera={{ position: [0, 0, 7], fov: 34 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        eventSource={typeof document !== "undefined" ? document.body : undefined}
        eventPrefix="client"
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <Screen url="/projects/ravo-home.webp" aspect={1440 / 900} width={3.1} position={[0.25, 1.05, -0.6]} rotation={[0.05, -0.32, 0.06]} speed={1.2} />
          <Screen url="/projects/ono.webp" aspect={1440 / 900} width={3.0} position={[-0.8, -0.15, 0.2]} rotation={[0, 0.28, -0.04]} speed={1.5} />
          <Screen url="/projects/jballin.webp" aspect={1440 / 840} width={2.5} position={[0.45, -1.3, 0.9]} rotation={[-0.04, -0.2, 0.03]} speed={1.8} />

          <Chrome kind="torus" position={[-1.9, 1.55, -0.4]} scale={0.32} />
          <Chrome kind="ico" position={[1.9, -0.1, 0.4]} scale={0.3} />
          <directionalLight position={[3, 4, 5]} intensity={1.2} />
          <pointLight position={[-3, 0, 3]} intensity={6} color="#c642f3" />
          <Mascot scale={0.42} position={[-0.85, -0.45, 1.9]} pose="laptop" />

          <Sparkles count={60} scale={[7, 5, 3]} size={2} speed={0.3} color="#b57cff" opacity={0.6} />

          <Environment resolution={256} frames={1}>
            <Lightformer form="rect" intensity={3} position={[0, 4, 3]} scale={[8, 2, 1]} />
            <Lightformer form="rect" intensity={2.5} color="#c642f3" position={[-5, 0, 1]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} />
            <Lightformer form="rect" intensity={2} color="#45bcf4" position={[5, -1, 1]} rotation-y={-Math.PI / 2} scale={[6, 3, 1]} />
            <Lightformer form="ring" intensity={2} position={[0, 0, -6]} scale={4} />
          </Environment>
          <Rig />
        </Suspense>
      </Canvas>
    </div>
  );
}
