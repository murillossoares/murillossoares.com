"use client";

import { useCallback, useEffect, useState } from "react";

let webglSupport: boolean | undefined;

/** Probes WebGL once per page load: each probe allocates a context, and browsers cap how many can be alive. */
export function supportsWebGL(): boolean {
  if (webglSupport !== undefined) return webglSupport;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    webglSupport = Boolean(gl);
    (gl as WebGLRenderingContext | null)?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}

/**
 * Whether to mount a three.js scene (wide viewport, motion allowed, WebGL available) plus a `ready` flag for
 * cross-fading from the static fallback. `ready` resets whenever 3D is switched off, so the fallback never fades
 * out before a new canvas exists. `markReady` is stable, which keeps memoised canvases from re-rendering.
 */
export function use3DMode(minWidth = 768) {
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const wide = window.matchMedia(`(min-width: ${minWidth}px)`);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      const next = wide.matches && !reduced.matches && supportsWebGL();
      setEnabled(next);
      if (!next) setReady(false);
    };
    update();
    wide.addEventListener("change", update);
    reduced.addEventListener("change", update);
    return () => {
      wide.removeEventListener("change", update);
      reduced.removeEventListener("change", update);
    };
  }, [minWidth]);

  const markReady = useCallback(() => setReady(true), []);
  return { enabled, ready: enabled && ready, markReady };
}
