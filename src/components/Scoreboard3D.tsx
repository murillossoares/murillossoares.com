"use client";

import { Html, RoundedBox } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { memo, useMemo, useRef } from "react";
import * as THREE from "three";

import type { ScoreboardData, ScoreboardMetric } from "@/models/metrics";

const MODULE_POSITIONS: [number, number, number][] = [
  [-2.7, 0, 0],
  [-0.9, 0, 0],
  [0.9, 0, 0],
  [2.7, 0, 0],
];

function CareerModule({ metric, position, color, delay }: { metric: ScoreboardMetric; position: [number, number, number]; color: string; delay: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const startedAt = useRef<number | null>(null);

  useFrame((state) => {
    if (!ref.current) return;
    startedAt.current ??= state.clock.elapsedTime;
    const elapsed = state.clock.elapsedTime - startedAt.current - delay;
    const progress = Math.min(1, Math.max(0, elapsed / 0.62));
    const eased = 1 - Math.pow(1 - progress, 5);

    ref.current.scale.y = Math.max(0.01, eased);
    ref.current.position.y = 0.8 * eased;
    if (progress < 1) state.invalidate();
  });

  return (
    <group position={position}>
      <RoundedBox ref={ref} args={[1.25, 1.6, 1.25]} radius={0.06} smoothness={3} scale={[1, 0.01, 1]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.22} roughness={0.38} metalness={0.45} />
      </RoundedBox>
      <Html position={[0, -0.38, 0]} center transform={false}>
        <strong className="pointer-events-none block min-w-8 text-center font-mono text-sm tabular-nums text-white">{metric.value}</strong>
      </Html>
    </group>
  );
}

function IntroCamera() {
  const camera = useThree((state) => state.camera);
  const startedAt = useRef<number | null>(null);

  useFrame((state) => {
    startedAt.current ??= state.clock.elapsedTime;
    const progress = Math.min(1, (state.clock.elapsedTime - startedAt.current) / 0.95);
    const eased = 1 - Math.pow(1 - progress, 5);
    const offset = 0.9 * (1 - eased);
    camera.position.set(offset, 4.8, 7.5);
    camera.lookAt(0, 0.7, 0);
    if (progress < 1) state.invalidate();
  });

  return null;
}

function Scene({ data, accentColor, secondaryColor, bgColor }: { data: ScoreboardData; accentColor: string; secondaryColor: string; bgColor: string }) {
  const colors = useMemo(() => [accentColor, secondaryColor, accentColor, secondaryColor], [accentColor, secondaryColor]);

  return (
    <>
      <color attach="background" args={[bgColor]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 7, 5]} intensity={0.9} />
      <pointLight position={[0, 3, 2]} intensity={0.45} color={accentColor} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[18, 12]} />
        <meshStandardMaterial color={bgColor} roughness={0.9} />
      </mesh>
      {data.metrics.map((metric, index) => (
        <CareerModule
          key={metric.id}
          metric={metric}
          position={MODULE_POSITIONS[index]}
          color={colors[index]}
          delay={index * 0.08}
        />
      ))}
      <IntroCamera />
    </>
  );
}

const Scoreboard3D = memo(function Scoreboard3D({
  data,
  accentColor = "#007acc",
  secondaryColor = "#22c55e",
  bgColor = "#0e1116",
  onReady,
}: {
  data: ScoreboardData;
  accentColor?: string;
  secondaryColor?: string;
  bgColor?: string;
  onReady?: () => void;
}) {
  return (
    <div className="h-full w-full overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg)]" aria-hidden="true">
      <Canvas
        camera={{ position: [0.9, 4.8, 7.5], fov: 45 }}
        dpr={[1, 1.5]}
        frameloop="demand"
        gl={{ antialias: true, powerPreference: "low-power" }}
        onCreated={onReady}
      >
        <Scene data={data} accentColor={accentColor} secondaryColor={secondaryColor} bgColor={bgColor} />
      </Canvas>
    </div>
  );
});

export default Scoreboard3D;
