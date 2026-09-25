"use client";

import { Html, Line } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { memo, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { ARCH_STYLE } from "@/lib/arch-style";
import { yearToX, type GalaxyLayout, type GalaxyNode } from "@/lib/galaxy";

function Starfield({ count = 500, dim }: { count?: number; dim: string }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    // Seeded pseudo-random so the field is stable across renders.
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (rnd() - 0.5) * 30;
      arr[i * 3 + 1] = (rnd() - 0.5) * 16;
      arr[i * 3 + 2] = (rnd() - 0.5) * 16 - 4;
    }
    return arr;
  }, [count]);
  useFrame((_, delta) => { if (ref.current) ref.current.rotation.y += delta * 0.01; });
  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
      <pointsMaterial size={0.035} color={dim} transparent opacity={0.55} sizeAttenuation />
    </points>
  );
}

function CareerNode({ node, active, onSelect }: { node: GalaxyNode; active: boolean; onSelect: (id: string) => void }) {
  const core = useRef<THREE.Mesh>(null);
  const shell = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const color = ARCH_STYLE[node.archType].hex;
  const phase = useMemo(() => node.position[0] * 1.7, [node.position]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (core.current) {
      core.current.position.y = Math.sin(t * 0.8 + phase) * 0.06;
      const target = active ? 1.35 : hovered ? 1.2 : 1;
      core.current.scale.setScalar(THREE.MathUtils.lerp(core.current.scale.x, target, Math.min(1, delta * 8)));
    }
    if (shell.current) {
      shell.current.rotation.x += delta * 0.3;
      shell.current.rotation.y += delta * 0.45;
      shell.current.position.y = core.current?.position.y ?? 0;
    }
  });

  return (
    <group position={node.position}>
      <mesh ref={core}
        onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = ""; }}>
        <sphereGeometry args={[node.radius, 24, 24]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={active ? 1.4 : 0.55} roughness={0.3} metalness={0.2} />
      </mesh>
      <mesh ref={shell} scale={active ? 2.3 : 1.8}>
        <icosahedronGeometry args={[node.radius, 1]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={active ? 0.55 : 0.18} />
      </mesh>
      {node.current ? (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[node.radius * 2.8, 0.012, 8, 48]} />
          <meshBasicMaterial color="#22c55e" transparent opacity={0.7} />
        </mesh>
      ) : null}
      {active || hovered ? (
        <Html position={[0, node.radius * 2.6 + 0.15, 0]} center distanceFactor={9} zIndexRange={[20, 0]}>
          <span className="pointer-events-none whitespace-nowrap rounded border border-[var(--border)] bg-surface-strong px-2 py-0.5 font-mono text-[11px] text-strong shadow-sm">
            {node.label} · {node.year}
          </span>
        </Html>
      ) : null}
    </group>
  );
}

function Scene({ layout, activeId, onSelect, ink, dim }: { layout: GalaxyLayout; activeId: string | null; onSelect: (id: string) => void; ink: string; dim: string }) {
  const group = useRef<THREE.Group>(null);
  const byId = useMemo(() => new Map(layout.nodes.map((n) => [n.id, n])), [layout]);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    // Gentle sway plus a little parallax from the pointer.
    group.current.rotation.y = Math.sin(t * 0.12) * 0.22 + state.pointer.x * 0.12;
    group.current.rotation.x = -0.1 + state.pointer.y * 0.06;
  });

  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight position={[0, 4, 6]} intensity={30} color="#ffffff" />
      <Starfield dim={dim} />
      <group ref={group}>
        {/* time axis */}
        <Line points={[[-5.6, -1.9, 0], [5.6, -1.9, 0]]} color={ink} transparent opacity={0.15} lineWidth={1} />
        {layout.years.map((year) => (
          <group key={year} position={[yearToX(year, layout), -1.9, 0]}>
            <Line points={[[0, 0, 0], [0, 0.12, 0]]} color={ink} transparent opacity={0.3} lineWidth={1} />
            <Html position={[0, -0.28, 0]} center distanceFactor={10} zIndexRange={[10, 0]}>
              <span className="pointer-events-none font-mono text-[10px] text-[var(--muted)]">{year}</span>
            </Html>
          </group>
        ))}
        {layout.edges.map((edge) => {
          const a = byId.get(edge.from)!, b = byId.get(edge.to)!;
          const on = activeId === edge.from || activeId === edge.to;
          return <Line key={`${edge.from}-${edge.to}`} points={[a.position, b.position]} color={on ? ink : dim} transparent opacity={on ? 0.55 : 0.12 + Math.min(edge.shared.length, 4) * 0.03} lineWidth={on ? 1.6 : 1} />;
        })}
        {layout.nodes.map((node) => <CareerNode key={node.id} node={node} active={node.id === activeId} onSelect={onSelect} />)}
      </group>
    </>
  );
}

const CareerGalaxy3D = memo(function CareerGalaxy3D({ layout, activeId, onSelect, running, onReady, ink = "#ffffff", dim = "#64748b" }: {
  layout: GalaxyLayout; activeId: string | null; onSelect: (id: string) => void; running: boolean; onReady?: () => void;
  /** Line and label colours from the theme (--scene-ink / --scene-dim), so the scene reads on light themes too. */
  ink?: string; dim?: string;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0.6, 8.2], fov: 50 }}
      dpr={[1, 1.5]}
      frameloop={running ? "always" : "never"}
      gl={{ antialias: true, powerPreference: "low-power", alpha: true }}
      onCreated={() => onReady?.()}
      aria-hidden="true"
    >
      <Scene layout={layout} activeId={activeId} onSelect={onSelect} ink={ink} dim={dim} />
    </Canvas>
  );
});

export default CareerGalaxy3D;
