import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type FC,
  type MouseEvent as ReactMouseEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react';
import {
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  ArrowsCounterClockwise,
  HandGrabbing,
  Crosshair,
  Lock,
  LockOpen,
  Planet,
} from '@phosphor-icons/react';
import { PixelLoader } from './PixelLoader';

interface SideBySideViewerProps {
  leftImage: string;
  rightImage: string;
  leftLabel: string;
  rightLabel: string;
  isLoading?: boolean;
  is10mPixelated?: boolean;
  onToggle10mPixelated?: () => void;
  is25mPixelated?: boolean;
  onToggle25mPixelated?: () => void;
  isSyncLocked?: boolean;
  onToggleSyncLocked?: () => void;
}

export const SideBySideViewer: FC<SideBySideViewerProps> = ({
  leftImage,
  rightImage,
  leftLabel,
  rightLabel,
  isLoading = false,
  is10mPixelated = true,
  is25mPixelated = true,
  isSyncLocked = true,
}) => {
  // Independent / Synchronized Zoom & Pan state
  const [leftZoom, setLeftZoom] = useState<number>(1);
  const [rightZoom, setRightZoom] = useState<number>(1);
  const [leftPan, setLeftPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rightPan, setRightPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragTarget, setDragTarget] = useState<'left' | 'right' | null>(null);

  // Crosshair synchronized reticle
  const [reticle, setReticle] = useState<{ x: number; y: number; visible: boolean }>({
    x: 50,
    y: 50,
    visible: false,
  });

  const leftViewportRef = useRef<HTMLDivElement>(null);
  const rightViewportRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ clientX: number; clientY: number; panX: number; panY: number }>({
    clientX: 0,
    clientY: 0,
    panX: 0,
    panY: 0,
  });

  // Clamp pan so image cannot be dragged completely outside the viewport
  const clampPan = useCallback(
    (x: number, y: number, currentZoom: number, width: number, height: number) => {
      if (currentZoom <= 1) return { x: 0, y: 0 };
      const maxX = ((currentZoom - 1) * width) / 2;
      const maxY = ((currentZoom - 1) * height) / 2;
      return {
        x: Math.min(maxX, Math.max(-maxX, x)),
        y: Math.min(maxY, Math.max(-maxY, y)),
      };
    },
    []
  );

  // Zoom adjustment
  const handleZoomChange = useCallback(
    (newZoom: number, target: 'left' | 'right' | 'both' = 'both') => {
      const clampedZoom = Math.min(8, Math.max(1, Math.round(newZoom * 10) / 10));
      const shouldUpdateBoth = isSyncLocked || target === 'both';

      const updateViewport = (
        viewportRef: React.RefObject<HTMLDivElement | null>,
        setZoomFn: React.Dispatch<React.SetStateAction<number>>,
        setPanFn: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>
      ) => {
        if (clampedZoom === 1) {
          setZoomFn(1);
          setPanFn({ x: 0, y: 0 });
          return;
        }
        setZoomFn(clampedZoom);
        if (viewportRef.current) {
          const rect = viewportRef.current.getBoundingClientRect();
          setPanFn((prev) => clampPan(prev.x, prev.y, clampedZoom, rect.width, rect.height));
        }
      };

      if (shouldUpdateBoth) {
        updateViewport(leftViewportRef, setLeftZoom, setLeftPan);
        updateViewport(rightViewportRef, setRightZoom, setRightPan);
      } else if (target === 'left') {
        updateViewport(leftViewportRef, setLeftZoom, setLeftPan);
      } else {
        updateViewport(rightViewportRef, setRightZoom, setRightPan);
      }
    },
    [isSyncLocked, clampPan]
  );

  const activeZoom = isSyncLocked ? leftZoom : Math.max(leftZoom, rightZoom);
  const effectiveRightZoom = isSyncLocked ? leftZoom : rightZoom;
  const effectiveRightPan = isSyncLocked ? leftPan : rightPan;

  const zoomIn = useCallback(
    () => handleZoomChange(activeZoom + (activeZoom >= 4 ? 1 : activeZoom >= 2 ? 0.5 : 0.25)),
    [activeZoom, handleZoomChange]
  );

  const zoomOut = useCallback(
    () => handleZoomChange(activeZoom - (activeZoom > 4 ? 1 : activeZoom > 2 ? 0.5 : 0.25)),
    [activeZoom, handleZoomChange]
  );

  const resetZoom = useCallback(() => {
    setLeftZoom(1);
    setLeftPan({ x: 0, y: 0 });
    setRightZoom(1);
    setRightPan({ x: 0, y: 0 });
  }, []);

  // Mouse wheel zoom
  const handleWheel = (e: ReactWheelEvent<HTMLDivElement>, target: 'left' | 'right') => {
    e.preventDefault();
    const currentZ = target === 'left' ? leftZoom : rightZoom;
    const factor = e.deltaY < 0 ? 1.2 : 0.8;
    const targetZoom = Math.min(8, Math.max(1, Math.round(currentZ * factor * 100) / 100));

    handleZoomChange(targetZoom, isSyncLocked ? 'both' : target);
  };

  // Drag-to-Pan handlers
  const handleMouseDown = (e: ReactMouseEvent<HTMLDivElement>, target: 'left' | 'right') => {
    const currentZ = target === 'left' ? leftZoom : rightZoom;
    const currentP = target === 'left' ? leftPan : rightPan;
    if (currentZ <= 1) return;

    setIsDragging(true);
    setDragTarget(target);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      panX: currentP.x,
      panY: currentP.y,
    };
  };

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>, target: 'left' | 'right') => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    const relY = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
    setReticle({ x: relX, y: relY, visible: true });

    if (!isDragging || !dragTarget) return;

    const currentZ = target === 'left' ? leftZoom : rightZoom;
    if (currentZ <= 1) return;

    const deltaX = e.clientX - dragStartRef.current.clientX;
    const deltaY = e.clientY - dragStartRef.current.clientY;
    const nextPanX = dragStartRef.current.panX + deltaX;
    const nextPanY = dragStartRef.current.panY + deltaY;

    const clamped = clampPan(nextPanX, nextPanY, currentZ, rect.width, rect.height);

    if (isSyncLocked) {
      setLeftPan(clamped);
      setRightPan(clamped);
    } else if (dragTarget === 'left') {
      setLeftPan(clamped);
    } else {
      setRightPan(clamped);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragTarget(null);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setDragTarget(null);
    setReticle((prev) => ({ ...prev, visible: false }));
  };

  const handleDoubleClick = (target: 'left' | 'right') => {
    const currentZ = target === 'left' ? leftZoom : rightZoom;
    if (currentZ > 1) {
      resetZoom();
    } else {
      handleZoomChange(2.5, isSyncLocked ? 'both' : target);
    }
  };

  // Keyboard zoom controls (+, -, 0, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        zoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        zoomOut();
      } else if (e.key === '0' || e.key === 'Escape') {
        resetZoom();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomIn, zoomOut, resetZoom]);

  return (
    <div className="flex-1 min-h-0 flex flex-col space-y-1.5 h-full overflow-hidden">
      {/* Streamlined Viewport Top Toolbar - No 1x 2x 4x SOTA 8x Max buttons */}
      <div className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50/90 px-2.5 py-1 text-xs shrink-0">
        {/* Left: Sync status indicator */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${
              isSyncLocked
                ? 'bg-brand-50 border-brand-200 text-brand-700'
                : 'bg-white border-slate-200 text-slate-500'
            }`}
          >
            {isSyncLocked ? <Lock className="h-3 w-3 text-brand-600" /> : <LockOpen className="h-3 w-3 text-slate-400" />}
            <span>{isSyncLocked ? 'Synchronized Viewports' : 'Independent Viewports'}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
            {is10mPixelated && <span className="bg-slate-200/80 px-1.5 py-0.5 rounded text-slate-700 font-semibold">10m Grid</span>}
            {is25mPixelated && <span className="bg-brand-100/80 px-1.5 py-0.5 rounded text-brand-800 font-semibold">2.5m Grid</span>}
          </div>
        </div>

        {/* Right: Clean Zoom In/Out/Slider/Reset */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={zoomOut}
            disabled={activeZoom <= 1}
            className="flex h-6 w-6 items-center justify-center rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-35 transition-all"
            title="Zoom Out (-)"
          >
            <MagnifyingGlassMinus className="h-3 w-3" />
          </button>

          <div className="flex items-center gap-1 px-1">
            <input
              type="range"
              min="1"
              max="8"
              step="0.1"
              value={activeZoom}
              onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
              className="h-1.5 w-16 sm:w-20 accent-brand-600 cursor-pointer bg-slate-200 rounded"
              title="Drag to zoom"
            />
            <span className="w-10 text-right text-[11px] font-mono font-bold text-slate-700">
              {(activeZoom * 100).toFixed(0)}%
            </span>
          </div>

          <button
            type="button"
            onClick={zoomIn}
            disabled={activeZoom >= 8}
            className="flex h-6 w-6 items-center justify-center rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-35 transition-all"
            title="Zoom In (+)"
          >
            <MagnifyingGlassPlus className="h-3 w-3" />
          </button>

          <button
            type="button"
            onClick={resetZoom}
            disabled={activeZoom === 1 && leftPan.x === 0 && leftPan.y === 0}
            className="flex items-center gap-1 px-2 py-0.5 rounded border border-slate-200 bg-white text-[11px] font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-35 transition-all ml-0.5"
            title="Reset Zoom to Fit (0 / Esc)"
          >
            <ArrowsCounterClockwise className="h-3 w-3" />
            <span>Fit</span>
          </button>
        </div>
      </div>

      {/* Dual Viewport Canvas (Side-by-Side) - Fills remaining height */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-2.5 h-full overflow-hidden select-none">
        {/* Left Viewport (10 m Input) */}
        <div className="flex-1 min-h-0 flex flex-col h-full overflow-hidden space-y-1">
          {/* Header label */}
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wide text-slate-600 px-0.5 shrink-0">
            <span className="truncate font-semibold text-slate-700">{leftLabel}</span>
            <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200 shrink-0">
              Input 10m
            </span>
          </div>

          {/* Viewport Frame */}
          <div
            ref={leftViewportRef}
            onWheel={(e) => handleWheel(e, 'left')}
            onMouseDown={(e) => handleMouseDown(e, 'left')}
            onMouseMove={(e) => handleMouseMove(e, 'left')}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onDoubleClick={() => handleDoubleClick('left')}
            className={`relative flex-1 min-h-0 w-full h-full overflow-hidden rounded-lg border border-slate-200 bg-slate-950 shadow-xs ${
              leftZoom > 1 ? (isDragging && dragTarget === 'left' ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-crosshair'
            }`}
          >
            {leftImage ? (
              <img
                src={leftImage}
                alt={leftLabel}
                draggable={false}
                style={{
                  transform: `translate(${leftPan.x}px, ${leftPan.y}px) scale(${leftZoom})`,
                  transformOrigin: 'center center',
                  imageRendering: is10mPixelated ? 'pixelated' : 'auto',
                }}
                className={`h-full w-full object-contain pointer-events-none select-none ${
                  isDragging ? '' : 'transition-transform duration-100 ease-out'
                }`}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full w-full gap-2 text-slate-500 p-4 text-center">
                <Planet className="h-8 w-8 text-slate-600" />
                <p className="text-xs font-semibold text-slate-400">No input image</p>
              </div>
            )}

            {/* Synchronized Reticle Crosshair */}
            {reticle.visible && (
              <div
                style={{ left: `${reticle.x}%`, top: `${reticle.y}%` }}
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center text-white drop-shadow-md"
              >
                <div className="relative flex h-5 w-5 items-center justify-center">
                  <Crosshair className="h-4 w-4 text-brand-400/90" />
                  <div className="absolute h-1 w-1 rounded-full bg-brand-400"></div>
                </div>
              </div>
            )}

            {/* Floating Zoom Indicator Pill */}
            {leftZoom > 1 && (
              <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1 rounded bg-slate-900/85 px-2 py-0.5 text-[10px] font-mono text-white backdrop-blur-xs shadow-md border border-white/10">
                <HandGrabbing className="h-2.5 w-2.5 text-brand-400" />
                <span>{(leftZoom * 100).toFixed(0)}% &bull; Pan</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Viewport (2.5 m Super-Resolved Output) */}
        <div className="flex-1 min-h-0 flex flex-col h-full overflow-hidden space-y-1">
          {/* Header label */}
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wide text-slate-600 px-0.5 shrink-0">
            <span className="truncate font-semibold text-brand-900">{rightLabel}</span>
            <span className="inline-flex items-center gap-1 rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-700 border border-brand-200 shrink-0">
              Enhanced 2.5m
            </span>
          </div>

          {/* Viewport Frame */}
          <div
            ref={rightViewportRef}
            onWheel={(e) => handleWheel(e, 'right')}
            onMouseDown={(e) => handleMouseDown(e, 'right')}
            onMouseMove={(e) => handleMouseMove(e, 'right')}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onDoubleClick={() => handleDoubleClick('right')}
            className={`relative flex-1 min-h-0 w-full h-full overflow-hidden rounded-lg border border-slate-200 bg-slate-950 shadow-xs ${
              effectiveRightZoom > 1 ? (isDragging && dragTarget === 'right' ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-crosshair'
            }`}
          >
            {rightImage ? (
              <img
                src={rightImage}
                alt={rightLabel}
                draggable={false}
                style={{
                  transform: `translate(${effectiveRightPan.x}px, ${effectiveRightPan.y}px) scale(${effectiveRightZoom})`,
                  transformOrigin: 'center center',
                  imageRendering: is25mPixelated ? 'pixelated' : 'auto',
                }}
                className={`h-full w-full object-contain pointer-events-none select-none ${
                  isDragging ? '' : 'transition-transform duration-100 ease-out'
                }`}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full w-full gap-2 text-slate-500 p-4 text-center">
                <Planet className="h-8 w-8 text-slate-600" />
                <p className="text-xs font-semibold text-slate-400">No enhanced output</p>
              </div>
            )}

            {/* Synchronized Reticle Crosshair */}
            {reticle.visible && (
              <div
                style={{ left: `${reticle.x}%`, top: `${reticle.y}%` }}
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center text-white drop-shadow-md"
              >
                <div className="relative flex h-5 w-5 items-center justify-center">
                  <Crosshair className="h-4 w-4 text-emerald-400/90" />
                  <div className="absolute h-1 w-1 rounded-full bg-emerald-400"></div>
                </div>
              </div>
            )}

            {/* Floating Zoom Indicator Pill */}
            {effectiveRightZoom > 1 && (
              <div className="absolute bottom-2 right-2 z-20 flex items-center gap-1 rounded bg-slate-900/85 px-2 py-0.5 text-[10px] font-mono text-white backdrop-blur-xs shadow-md border border-white/10">
                <span className="text-emerald-400 font-bold">2.5m</span>
                <span>&bull; {(effectiveRightZoom * 100).toFixed(0)}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Global Loading Overlay */}
        {isLoading && <PixelLoader label="Synchronizing Dual Viewports..." />}
      </div>

      {/* Helper Guidance Subtitle - Compact 1 line */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 shrink-0">
        <span>Scroll wheel to zoom (1x-8x) &bull; Drag to pan in sync</span>
        <div className="hidden sm:flex items-center gap-1.5 font-mono">
          <kbd className="rounded border border-slate-200 bg-slate-100 px-1 py-0.2 text-[9px] text-slate-600">+</kbd>
          <kbd className="rounded border border-slate-200 bg-slate-100 px-1 py-0.2 text-[9px] text-slate-600">-</kbd>
          <span>Zoom</span>
          <kbd className="rounded border border-slate-200 bg-slate-100 px-1 py-0.2 text-[9px] text-slate-600">0</kbd>
          <span>Fit</span>
        </div>
      </div>
    </div>
  );
};
