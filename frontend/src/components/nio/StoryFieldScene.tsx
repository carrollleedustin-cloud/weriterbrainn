"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

function ParticleField({ mouse }: { mouse: { x: number; y: number } }) {
  const ref = useRef<THREE.Points>(null);
  const count = 1200;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      pos[i] = (Math.random() - 0.5) * 40;
      pos[i + 1] = (Math.random() - 0.5) * 40;
      pos[i + 2] = (Math.random() - 0.5) * 20;
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
        size={0.04}
        sizeAttenuation
        depthWrite={false}
        color="#c084fc"
        opacity={0.6}
        blending={THREE.AdditiveBlending}
      />
    </Points>
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
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#8b5cf6" />
      <ParticleField mouse={mouse} />
    </Canvas>
  );
}
