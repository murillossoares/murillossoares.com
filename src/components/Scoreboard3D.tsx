"use client";
import { memo, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, RoundedBox, Environment, Html } from "@react-three/drei";
import * as THREE from "three";
import type { ScoreboardData, ScoreboardMetric } from "@/models/metrics";

type BarProps = {
  position: [number, number, number];
  height: number;
  color: string;
  emissive: string;
  delay: number;
  metric: ScoreboardMetric;
};

function metricHeight(percent: number) {
  return Math.max(0.4, (percent / 100) * 4);
}

function Bar({ position, height, color, emissive, delay, metric }: BarProps) {
  const ref = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((state) => {
    if (!ref.current || !mat.current) return;
    const t = Math.max(0, state.clock.elapsedTime - delay * 0.3);
    const e = 1 - Math.exp(-t * 2.5);
    ref.current.scale.y = THREE.MathUtils.lerp(ref.current.scale.y, e, 0.1);
    ref.current.position.y = (height * ref.current.scale.y) / 2;
    mat.current.emissiveIntensity = Math.sin(state.clock.elapsedTime * 2 + delay) * 0.15 + 0.85;
  });
  return (
    <group position={position}>
      <RoundedBox ref={ref} args={[0.8, height, 0.8]} radius={0.05} smoothness={4} castShadow receiveShadow scale={[1, 0.01, 1]}>
        <meshStandardMaterial ref={mat} color={color} emissive={emissive} emissiveIntensity={0.8} roughness={0.3} metalness={0.4} />
      </RoundedBox>
      <Html position={[0, -0.42, 0]} center transform={false}>
        <span className="pointer-events-none whitespace-nowrap rounded bg-black/50 px-2 py-1 text-[10px] font-mono uppercase text-white/70">
          {metric.label}
        </span>
      </Html>
    </group>
  );
}

function Scene({ accentColor, bgColor, data }: { accentColor: string; bgColor: string; data: ScoreboardData }) {
  const bars = useMemo(() => [
    { p: [-2.7, 0, 0] as [number, number, number], h: metricHeight(data.uptime.percent), c: "#22c55e", e: "#15803d", d: 0, metric: data.uptime },
    { p: [-0.9, 0, 0] as [number, number, number], h: metricHeight(data.stackDepth.percent), c: "#3b82f6", e: "#1d4ed8", d: 1, metric: data.stackDepth },
    { p: [0.9, 0, 0] as [number, number, number], h: metricHeight(data.architecture.percent), c: "#a855f7", e: "#7e22ce", d: 2, metric: data.architecture },
    { p: [2.7, 0, 0] as [number, number, number], h: metricHeight(data.projects.percent), c: "#f97316", e: "#c2410c", d: 3, metric: data.projects },
  ], [data]);
  const a = useMemo(() => new THREE.Color(accentColor), [accentColor]);
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 8, 5]} intensity={0.8} castShadow />
      <pointLight position={[0, 4, 2]} intensity={0.6} color={a} />
      <Environment preset="city" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color={bgColor} roughness={0.8} />
      </mesh>
      <gridHelper args={[20, 40, "#222", "#1a1a1a"]} />
      {bars.map((b) => <Bar key={b.metric.label} position={b.p} height={b.h} color={b.c} emissive={b.e} delay={b.d} metric={b.metric} />)}
      <OrbitControls autoRotate autoRotateSpeed={0.5} enablePan={false} minDistance={5} maxDistance={15} maxPolarAngle={Math.PI / 2.1} enableDamping dampingFactor={0.05} />
    </>
  );
}

const Scoreboard3D = memo(function Scoreboard3D({ data, accentColor = "#007acc", bgColor = "#0e1116" }: { data: ScoreboardData; accentColor?: string; bgColor?: string }) {
  return (
    <div className="w-full h-[400px] md:h-[500px] rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--bg)]">
      <Canvas shadows camera={{ position: [6, 5, 6], fov: 45 }} dpr={[1, 2]}>
        <color attach="background" args={[bgColor]} />
        <Scene accentColor={accentColor} bgColor={bgColor} data={data} />
      </Canvas>
    </div>
  );
});
export default Scoreboard3D;
