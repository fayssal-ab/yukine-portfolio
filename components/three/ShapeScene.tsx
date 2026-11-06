"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, Lightformer, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useInViewFrameloop } from "./useInViewFrameloop";
import Mascot, { type Pose } from "./Mascot";

export type ShapeKind = "knot" | "torus" | "gem" | "blob" | "rings" | "mascot" | `mascot-${Pose}`;

const chrome = { color: "#efe9f7", metalness: 1, roughness: 0.1 } as const;

function Geometry({ kind }: { kind: ShapeKind }) {
  switch (kind) {
    case "knot":
      return (
        <mesh>
          <torusKnotGeometry args={[1, 0.32, 260, 40, 2, 3]} />
          <meshStandardMaterial {...chrome} />
        </mesh>
      );
    case "torus":
      return (
        <mesh rotation={[0.6, 0.2, 0]}>
          <torusGeometry args={[1.15, 0.42, 64, 160]} />
          <meshStandardMaterial {...chrome} />
        </mesh>
      );
    case "gem":
      return (
        <mesh scale={1.35}>
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial {...chrome} roughness={0.04} flatShading />
        </mesh>
      );
    case "blob":
      return (
        <mesh scale={1.35}>
          <sphereGeometry args={[1, 96, 96]} />
          <MeshDistortMaterial {...chrome} roughness={0.06} distort={0.38} speed={1.6} />
        </mesh>
      );
    case "rings":
      return (
        <group>
          {[0, 1, 2].map((i) => (
            <mesh key={i} rotation={[i * 0.9, i * 0.6, 0]} scale={1 - i * 0.2}>
              <torusGeometry args={[1.3, 0.07, 32, 160]} />
              <meshStandardMaterial {...chrome} color={i === 1 ? "#c642f3" : chrome.color} />
            </mesh>
          ))}
          <mesh scale={0.42}>
            <icosahedronGeometry args={[1, 0]} />
            <meshStandardMaterial {...chrome} color="#45bcf4" flatShading />
          </mesh>
        </group>
      );
  }
}

/** Spins slowly and leans toward the pointer. */
function Spinner({ kind }: { kind: ShapeKind }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state, dt) => {
    const g = ref.current;
    if (!g) return;
    g.rotation.x += dt * 0.12;
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, state.pointer.x * 0.8 + state.clock.elapsedTime * 0.18, 2, dt);
    g.rotation.z = THREE.MathUtils.damp(g.rotation.z, state.pointer.y * 0.4, 2, dt);
  });
  return (
    <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.8}>
      <group ref={ref}>
        <Geometry kind={kind} />
      </group>
    </Float>
  );
}

/** A single chrome object lit in the brand colours (violet + cyan from the logo). */
export default function ShapeScene({ kind = "knot" }: { kind?: ShapeKind }) {
  const { ref, frameloop } = useInViewFrameloop();
  return (
    <div ref={ref} className="h-full w-full">
      <Canvas
        frameloop={frameloop}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 7.4], fov: 35 }}
        gl={{ antialias: true, alpha: true }}
        eventSource={typeof document !== "undefined" ? document.body : undefined}
        eventPrefix="client"
      >
        <Suspense fallback={null}>
          {kind.startsWith("mascot") ? (
            <>
              {/* soft studio light so the figure keeps its painted colours; brand colours only as rims */}
              <ambientLight intensity={0.35} />
              <directionalLight position={[2.5, 4, 5]} intensity={1.3} color="#fff4e6" />
              <directionalLight position={[-3, 1, 3]} intensity={0.6} color="#e8eeff" />
              <pointLight position={[-3, 1.5, -2.5]} intensity={4} color="#c642f3" />
              <pointLight position={[3, -0.5, -2.5]} intensity={5} color="#45bcf4" />
              <Mascot scale={0.9} position={[0, 0.85, 0]} pose={(kind.split("-")[1] as Pose) || "read"} />
            </>
          ) : (
            <Spinner kind={kind} />
          )}
          <Environment resolution={256} frames={1}>
            <Lightformer form="rect" intensity={3} position={[0, 5, 2]} scale={[10, 2, 1]} />
            <Lightformer form="rect" intensity={4} color="#c642f3" position={[-5, -1, 0]} rotation-y={Math.PI / 2} scale={[8, 4, 1]} />
            <Lightformer form="rect" intensity={3.5} color="#45bcf4" position={[5, 1, 0]} rotation-y={-Math.PI / 2} scale={[8, 4, 1]} />
            <Lightformer form="circle" intensity={2} color="#f2d77a" position={[0, -4, -3]} scale={3} />
          </Environment>
        </Suspense>
      </Canvas>
    </div>
  );
}
