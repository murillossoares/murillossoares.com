import { MONOGRAM } from "@/lib/monogram";

/** The MS monogram in the current text colour (light lines on the dark themes). Decorative: the name is in the h1. */
export default function Monogram({ className, strokeWidth = 44 }: { className?: string; strokeWidth?: number }) {
  const { frame } = MONOGRAM;
  return (
    <svg viewBox="100 97 815 818" className={className} aria-hidden="true" focusable="false"
      fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <rect x={frame.x} y={frame.y} width={frame.width} height={frame.height} rx={frame.rx} />
      {MONOGRAM.paths.map((d) => <path key={d} d={d} />)}
    </svg>
  );
}
