import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

export interface View {
  z: number;
  x: number;
  y: number;
}

export const MAX_ZOOM = 8;
const IDENTITY: View = { z: 1, x: 0, y: 0 };

/** Keep the zoomed image covering its viewport (no dragging it off into empty space). */
function clampView(v: View, w: number, h: number): View {
  const z = Math.min(MAX_ZOOM, Math.max(1, v.z));
  if (z <= 1.001) return IDENTITY;
  const mx = ((z - 1) * w) / 2;
  const my = ((z - 1) * h) / 2;
  return { z, x: Math.min(mx, Math.max(-mx, v.x)), y: Math.min(my, Math.max(-my, v.y)) };
}

/**
 * Pan & zoom state for an image viewport rendered with
 * `translate(x, y) scale(z)` about its centre. Zooming keeps the point under
 * the cursor fixed, which feels far more natural than zooming to centre.
 */
export function usePanZoom() {
  const [view, setView] = useState<View>(IDENTITY);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ id: number; sx: number; sy: number; vx: number; vy: number } | null>(null);

  const zoomAt = useCallback((factor: number, el: HTMLElement | null, clientX?: number, clientY?: number) => {
    if (!el) return;
    const r = el.getBoundingClientRect();
    setView((prev) => {
      const px = clientX === undefined ? 0 : clientX - r.left - r.width / 2;
      const py = clientY === undefined ? 0 : clientY - r.top - r.height / 2;
      const z = Math.min(MAX_ZOOM, Math.max(1, prev.z * factor));
      const k = z / prev.z;
      return clampView({ z, x: px - (px - prev.x) * k, y: py - (py - prev.y) * k }, r.width, r.height);
    });
  }, []);

  const setZoom = useCallback((z: number, el: HTMLElement | null) => {
    if (!el) return;
    const r = el.getBoundingClientRect();
    setView((prev) => {
      const k = z / prev.z;
      return clampView({ z, x: prev.x * k, y: prev.y * k }, r.width, r.height);
    });
  }, []);

  const reset = useCallback(() => setView(IDENTITY), []);

  /** Returns true when the pointer-down started a pan (i.e. the view is zoomed). */
  const beginPan = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (view.z <= 1) return false;
      drag.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y };
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragging(true);
      return true;
    },
    [view]
  );

  const movePan = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return false;
    const r = e.currentTarget.getBoundingClientRect();
    setView((prev) =>
      clampView({ z: prev.z, x: d.vx + e.clientX - d.sx, y: d.vy + e.clientY - d.sy }, r.width, r.height)
    );
    return true;
  }, []);

  const endPan = useCallback(() => {
    drag.current = null;
    setDragging(false);
  }, []);

  return { view, setView, zoomAt, setZoom, reset, beginPan, movePan, endPan, dragging };
}

export type PanZoom = ReturnType<typeof usePanZoom>;

/** Non-passive wheel listener so wheel-zoom can suppress page scroll. */
export function useWheelZoom(
  ref: React.RefObject<HTMLElement | null>,
  onZoom: (factor: number, clientX: number, clientY: number) => void,
  enabled = true
) {
  const cb = useRef(onZoom);
  useEffect(() => {
    cb.current = onZoom;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * 0.0022);
      cb.current(factor, e.clientX, e.clientY);
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [ref, enabled]);
}

export const viewTransform = (v: View) => `translate3d(${v.x}px, ${v.y}px, 0) scale(${v.z})`;
