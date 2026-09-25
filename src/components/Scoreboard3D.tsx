"use client";

import { Html, RoundedBox } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { memo, useMemo, useRef } from "react";
import * as THREE from "three";


import type { YearRow } from "./Scoreboard3DFallback";

const MAX_HEIGHT = 3;
const SPACING = 0.72;

function YearColumn({ row, max, x, color, delay }: { row: YearRow; max: number; x: number; color: string; delay: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const startedAt = useRef<number | null>(null);
  // Height encodes the value: all columns share one unit (distinct technologies in that year).
  const height = Math.max(0.04, (row.count / max) * MAX_HEIGHT);

  useFrame((state) => {
    if (!ref.current) return;
    startedAt.current ??= state.clock.elapsedTime;
    const elapsed = state.clock.elapsedTime - startedAt.current - delay;
    const progress = Math.min(1, Math.max(0, elapsed / 0.62));
    const eased = 1 - Math.pow(1 - progress, 5);
    ref.current.scale.y = Math.max(0.001, eased);
    ref.current.position.y = (height / 2) * eased;
    if (progress < 1) state.invalidate();
  });

  return (
    <group position={[x, 0, 0]}>
      <RoundedBox ref={ref} args={[0.5, height, 0.5]} radius={0.04} smoothness={3} scale={[1, 0.001, 1]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} roughness={0.38} metalness={0.45} transparent opacity={row.count ? 1 : 0.3} />
      </RoundedBox>
      <Html position={[0, height + 0.3, 0]} center transform={false}>
        <strong className="pointer-events-none block text-center font-mono text-xs tabular-nums text-white">{row.count}</strong>
      </Html>
      <Html position={[0, -0.3, 0.4]} center transform={false}>
        <span className="pointer-events-none block text-center font-mono text-[10px] text-white/60">{String(row.year).slice(2)}&apos;</span>
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
    camera.position.set(offset, 3.6, 8.2);
    camera.lookAt(0, 1.1, 0);
    if (progress < 1) state.invalidate();
  });

  return null;
}

function Scene({ rows, accentColor, secondaryColor, bgColor }: { rows: YearRow[]; accentColor: string; secondaryColor: string; bgColor: string }) {
  const max = useMemo(() => Math.max(1, ...rows.map((r) => r.count)), [rows]);

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
      {rows.map((row, index) => (
        <YearColumn
          key={row.year}
          row={row}
          max={max}
          x={(index - (rows.length - 1) / 2) * SPACING}
          color={index % 2 === 0 ? accentColor : secondaryColor}
          delay={index * 0.05}
        />
      ))}
      <IntroCamera />
    </>
  );
}

const Scoreboard3D = memo(function Scoreboard3D({
  rows,
  accentColor = "#007acc",
  secondaryColor = "#22c55e",
  bgColor = "#0e1116",
  onReady,
}: {
  rows: YearRow[];
  accentColor?: string;
  secondaryColor?: string;
  bgColor?: string;
  onReady?: () => void;
}) {
  return (
    <div className="h-full w-full overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg)]" aria-hidden="true">
      <Canvas
        camera={{ position: [0.9, 3.6, 8.2], fov: 45 }}
        dpr={[1, 1.5]}
        frameloop="demand"
        gl={{ antialias: true, powerPreference: "low-power" }}
        onCreated={onReady}
      >
        <Scene rows={rows} accentColor={accentColor} secondaryColor={secondaryColor} bgColor={bgColor} />
      </Canvas>
    </div>
  );
});

export default Scoreboard3D;
