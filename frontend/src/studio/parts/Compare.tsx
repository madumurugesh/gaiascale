import { useRef, useState, type FC, type PointerEvent as ReactPointerEvent } from 'react';
import { useWheelZoom, viewTransform, type PanZoom, type View } from '../state/usePanZoom';
import type { LayerPair } from '../state/layers';

export type Cursor = { x: number; y: number } | null;

/** Map a pointer position to output-pixel coordinates for a contain-fitted, transformed image. */
function toImagePx(e: ReactPointerEvent, el: HTMLElement, view: View, W: number, H: number): Cursor {
  const r = el.getBoundingClientRect();
  const s = Math.min(r.width / W, r.height / H);
  const x = (e.clientX - r.left - r.width / 2 - view.x) / (view.z * s) + W / 2;
  const y = (e.clientY - r.top - r.height / 2 - view.y) / (view.z * s) + H / 2;
  if (x < 0 || y < 0 || x >= W || y >= H) return null;
  return { x: Math.floor(x), y: Math.floor(y) };
}

const Label: FC<{ children: React.ReactNode; accent?: boolean; side: 'left' | 'right'; hidden?: boolean }> = ({
  children,
  accent,
  side,
  hidden,
}) => (
  <div
    className={`pointer-events-none absolute top-2.5 z-20 rounded px-1.5 py-0.5 text-[11px] font-medium transition-opacity duration-150 ${
      side === 'left' ? 'left-2.5' : 'right-2.5'
    } ${accent ? 'bg-accent text-app-bg' : 'bg-black/70 text-app-text'} ${hidden ? 'opacity-0' : 'opacity-100'}`}
  >
    {children}
  </div>
);

const imgStyle = (v: View, dragging: boolean, nearest: boolean): React.CSSProperties => ({
  transform: viewTransform(v),
  transition: dragging ? 'none' : 'transform 160ms cubic-bezier(0.22,1,0.36,1)',
  imageRendering: nearest ? 'pixelated' : 'auto',
});

interface CommonProps {
  layers: LayerPair;
  size: { W: number; H: number };
  nearestInput: boolean;
  nearestOutput: boolean;
  onCursor: (c: Cursor) => void;
}

/** Before/after swipe. Both layers share one transform; only the input layer is clipped. */
export const SwipeCompare: FC<CommonProps & { pz: PanZoom }> = ({ layers, size, nearestInput, nearestOutput, onCursor, pz }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50);
  const [sliding, setSliding] = useState(false);
  useWheelZoom(ref, (f, x, y) => pz.zoomAt(f, ref.current, x, y));

  const posOf = (e: ReactPointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100));
  };

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const onHandle = (e.target as HTMLElement).closest('[data-handle]');
    if (!onHandle && pz.beginPan(e)) return;
    setSliding(true);
    ref.current!.setPointerCapture(e.pointerId);
    setPos(posOf(e));
  };

  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (sliding) setPos(posOf(e));
    else pz.movePan(e);
    onCursor(toImagePx(e, e.currentTarget, pz.view, size.W, size.H));
  };

  const zoomed = pz.view.z > 1;

  return (
    <div
      ref={ref}
      tabIndex={0}
      aria-label="Swipe comparison. Arrow keys move the divider."
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={() => {
        setSliding(false);
        pz.endPan();
      }}
      onPointerLeave={() => onCursor(null)}
      onDoubleClick={(e) => (zoomed ? pz.reset() : pz.zoomAt(2, ref.current, e.clientX, e.clientY))}
      onKeyDown={(e) => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        e.preventDefault();
        const step = e.shiftKey ? 10 : 2;
        setPos((p) => Math.min(100, Math.max(0, p + (e.key === 'ArrowLeft' ? -step : step))));
      }}
      className={`absolute inset-0 touch-none select-none overflow-hidden outline-none ${
        zoomed ? (pz.dragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-col-resize'
      }`}
    >
      <img
        src={layers.right}
        alt={layers.rightLabel}
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full object-contain"
        style={imgStyle(pz.view, pz.dragging, nearestOutput)}
      />
      <div className="pointer-events-none absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <img
          src={layers.left}
          alt={layers.leftLabel}
          draggable={false}
          className="absolute inset-0 h-full w-full object-contain"
          style={imgStyle(pz.view, pz.dragging, nearestInput)}
        />
      </div>

      <div className="absolute inset-y-0 z-10 w-0" style={{ left: `${pos}%` }}>
        <div className="absolute inset-y-0 -left-px w-px bg-white/90" />
        <div
          data-handle
          className={`absolute left-1/2 top-1/2 flex h-9 w-5 -translate-x-1/2 -translate-y-1/2 cursor-col-resize items-center justify-center gap-[3px] rounded-md border bg-app-panel shadow-lg transition-colors ${
            sliding ? 'border-accent' : 'border-app-border-strong hover:border-app-muted'
          }`}
        >
          <span className="h-3.5 w-px bg-app-muted" />
          <span className="h-3.5 w-px bg-app-muted" />
        </div>
      </div>

      <Label side="left" hidden={pos < 14}>
        {layers.leftLabel} · {layers.leftTag}
      </Label>
      <Label side="right" accent hidden={pos > 86}>
        {layers.rightLabel} · {layers.rightTag}
      </Label>
    </div>
  );
};

interface PaneProps {
  src: string;
  label: string;
  accent?: boolean;
  nearest: boolean;
  pz: PanZoom;
  size: { W: number; H: number };
  reticle: { x: number; y: number } | null;
  onReticle: (r: { x: number; y: number } | null) => void;
  onCursor: (c: Cursor) => void;
}

const Pane: FC<PaneProps> = ({ src, label, accent, nearest, pz, size, reticle, onReticle, onCursor }) => {
  const ref = useRef<HTMLDivElement>(null);
  useWheelZoom(ref, (f, x, y) => pz.zoomAt(f, ref.current, x, y));
  const zoomed = pz.view.z > 1;

  return (
    <div
      ref={ref}
      onPointerDown={(e) => pz.beginPan(e)}
      onPointerMove={(e) => {
        pz.movePan(e);
        const r = e.currentTarget.getBoundingClientRect();
        onReticle({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        onCursor(toImagePx(e, e.currentTarget, pz.view, size.W, size.H));
      }}
      onPointerUp={pz.endPan}
      onPointerLeave={() => {
        onReticle(null);
        onCursor(null);
      }}
      onDoubleClick={(e) => (zoomed ? pz.reset() : pz.zoomAt(2, ref.current, e.clientX, e.clientY))}
      className={`relative min-h-[220px] flex-1 touch-none select-none overflow-hidden ${
        zoomed ? (pz.dragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-crosshair'
      }`}
    >
      <img
        src={src}
        alt={label}
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full object-contain"
        style={imgStyle(pz.view, pz.dragging, nearest)}
      />
      {reticle && (
        <>
          <div className="pointer-events-none absolute inset-x-0 z-10 h-px bg-white/25" style={{ top: `${reticle.y}%` }} />
          <div className="pointer-events-none absolute inset-y-0 z-10 w-px bg-white/25" style={{ left: `${reticle.x}%` }} />
          <div
            className={`pointer-events-none absolute z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 border ${accent ? 'border-accent' : 'border-white'}`}
            style={{ left: `${reticle.x}%`, top: `${reticle.y}%` }}
          />
        </>
      )}
      <Label side="left" accent={accent}>
        {label}
      </Label>
    </div>
  );
};

/** Two viewports with a shared crosshair; pan and zoom are linked unless unlinked in the top bar. */
export const SideBySideCompare: FC<CommonProps & { left: PanZoom; right: PanZoom; linked: boolean }> = ({
  layers,
  size,
  nearestInput,
  nearestOutput,
  onCursor,
  left,
  right,
  linked,
}) => {
  const [reticle, setReticle] = useState<{ x: number; y: number } | null>(null);
  return (
    <div className="absolute inset-0 flex flex-col divide-y divide-app-border md:flex-row md:divide-x md:divide-y-0">
      <Pane
        src={layers.left}
        label={`${layers.leftLabel} · ${layers.leftTag}`}
        nearest={nearestInput}
        pz={left}
        size={size}
        reticle={reticle}
        onReticle={setReticle}
        onCursor={onCursor}
      />
      <Pane
        src={layers.right}
        label={`${layers.rightLabel} · ${layers.rightTag}`}
        accent
        nearest={nearestOutput}
        pz={linked ? left : right}
        size={size}
        reticle={reticle}
        onReticle={setReticle}
        onCursor={onCursor}
      />
    </div>
  );
};
