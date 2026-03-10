"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

function pseudoRandom(seed: number, offset: number) {
  return (Math.sin(seed * 1337.77 + offset * 0.73) + 1) * 0.5;
}

function ParticleField({ mouse }: { mouse: { x: number; y: number } }) {
  const ref = useRef<THREE.Points>(null);
  const count = 1600;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      const idx = i / 3 + 1;
      pos[i] = (pseudoRandom(idx, 1) - 0.5) * 40;
      pos[i + 1] = (pseudoRandom(idx, 2) - 0.5) * 40;
      pos[i + 2] = (pseudoRandom(idx, 3) - 0.5) * 20;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime * 0.08;
    const positions = ref.current.geometry.attributes.position.array as Float32Array;
    const mx = mouse.x * 2;
    const my = mouse.y * 2;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const x = positions[i3];
      const y = positions[i3 + 1];
      const z = positions[i3 + 2];
      const dist = Math.sqrt((x - mx) ** 2 + (y - my) ** 2 + z * z);
      const pull = Math.max(0, 1 - dist / 12) * 0.02;
      positions[i3] += (mx - x) * pull + Math.sin(t + i * 0.01) * 0.002;
      positions[i3 + 1] += (my - y) * pull + Math.cos(t * 0.7 + i * 0.01) * 0.002;
      positions[i3 + 2] += Math.sin(t * 0.5 + i * 0.02) * 0.002;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
    ref.current.rotation.y = t * 0.02;
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        size={0.05}
        sizeAttenuation
        depthWrite={false}
        color="#c084fc"
        opacity={0.6}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

function EmberField() {
  const ref = useRef<THREE.Points>(null);
  const count = 280;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      const idx = i / 3 + 13;
      pos[i] = (pseudoRandom(idx, 5) - 0.5) * 30;
      pos[i + 1] = (pseudoRandom(idx, 6) - 0.5) * 30;
      pos[i + 2] = (pseudoRandom(idx, 7) - 0.5) * 18;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime * 0.12;
    const positions = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3 + 1] += Math.sin(t + i * 0.2) * 0.002;
      positions[i3] += Math.cos(t * 0.6 + i * 0.15) * 0.002;
      positions[i3 + 2] += Math.sin(t * 0.4 + i * 0.1) * 0.0015;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
    ref.current.rotation.z = Math.sin(t * 0.2) * 0.04;
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        size={0.08}
        sizeAttenuation
        depthWrite={false}
        color="#60a5fa"
        opacity={0.5}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

function LatticeCore() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.x = t * 0.12;
    ref.current.rotation.y = t * 0.08;
    const s = 1.05 + Math.sin(t * 0.8) * 0.03;
    ref.current.scale.setScalar(s);
  });

  return (
    <mesh ref={ref}>
      <torusKnotGeometry args={[2.2, 0.32, 420, 64]} />
      <meshBasicMaterial color="#7c3aed" wireframe transparent opacity={0.32} />
    </mesh>
  );
}

function PulseShell() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime * 0.8;
    const s = 1.25 + Math.sin(t) * 0.05;
    ref.current.scale.setScalar(s);
    const material = ref.current.material as THREE.MeshBasicMaterial;
    material.opacity = 0.14 + 0.04 * Math.sin(t + Math.PI / 3);
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[3.8, 42, 42]} />
      <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.16} />
    </mesh>
  );
}

export default function StoryFieldScene({ mouse }: { mouse: { x: number; y: number } }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 60 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
    >
      <color attach="background" args={["transparent"]} />
      <ambientLight intensity={0.22} />
      <pointLight position={[8, 8, 10]} intensity={0.6} color="#8b5cf6" />
      <pointLight position={[-6, -6, -4]} intensity={0.35} color="#06b6d4" />
      <PulseShell />
      <LatticeCore />
      <EmberField />
      <ParticleField mouse={mouse} />
    </Canvas>
  );
}
