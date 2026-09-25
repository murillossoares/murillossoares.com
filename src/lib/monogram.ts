/**
 * The MS monogram, drawn on a 1024-unit canvas. Single source for the header mark (components/Monogram.tsx) and for
 * the generated icons and brand files (scripts/icon/render.mjs).
 */
export const MONOGRAM = {
  viewBox: "0 0 1024 1024",
  frame: { x: 125, y: 122, width: 765, height: 768, rx: 6 },
  paths: [
    "M283 122 L508 357 L733 122",
    "M125 125 C128 200 160 255 205 297 L490 545 C530 585 550 645 550 712 C550 770 530 805 508 828 C480 858 440 888 378 888",
    "M890 125 C887 200 855 255 810 297 L525 545 C485 585 465 645 465 712 C465 770 485 805 508 828 C536 858 576 888 638 888",
    "M125 393 C230 440 292 530 292 640 C292 750 230 840 140 885",
    "M890 393 C785 440 723 530 723 640 C723 750 785 840 875 885",
  ],
} as const;

/** SVG markup of the lines only, for a given stroke colour and width. */
export function monogramShapes(stroke: string, width: number): string {
  const { frame } = MONOGRAM;
  return (
    `<g fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round">` +
    `<rect x="${frame.x}" y="${frame.y}" width="${frame.width}" height="${frame.height}" rx="${frame.rx}"/>` +
    MONOGRAM.paths.map((d) => `<path d="${d}"/>`).join("") +
    `</g>`
  );
}
