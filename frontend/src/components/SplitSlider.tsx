import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type FC,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
} from 'react';
import { PixelLoader } from './PixelLoader';
import { Planet } from '@phosphor-icons/react';

interface SplitSliderProps {
  leftImage: string;
  rightImage: string;
  leftLabel: string;
  rightLabel: string;
  isLoading?: boolean;
  is10mPixelated?: boolean;
  onToggle10mPixelated?: () => void;
  is25mPixelated?: boolean;
  onToggle25mPixelated?: () => void;
}

export const SplitSlider: FC<SplitSliderProps> = ({
  leftImage,
  rightImage,
  leftLabel,
  rightLabel,
  isLoading = false,
  is10mPixelated = true,
  is25mPixelated = true,
}) => {
  const [sliderPos, setSliderPos] = useState<number>(50); // percentage 0 - 100
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const leftImgRef = useRef<HTMLImageElement>(null);

  // Synchronize left image dimensions to container dimensions so the image is clipped rather than squished
  const syncLeftImageDimensions = useCallback(() => {
    if (containerRef.current && leftImgRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      leftImgRef.current.style.width = `${containerWidth}px`;
      leftImgRef.current.style.height = `${containerHeight}px`;
    }
  }, []);

  useEffect(() => {
    syncLeftImageDimensions();
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      syncLeftImageDimensions();
    });
    observer.observe(containerRef.current);
    window.addEventListener('resize', syncLeftImageDimensions);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', syncLeftImageDimensions);
    };
  }, [syncLeftImageDimensions, leftImage, rightImage]);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let offsetX = clientX - rect.left;
    if (offsetX < 0) offsetX = 0;
    if (offsetX > rect.width) offsetX = rect.width;
    const percentage = (offsetX / rect.width) * 100;
    setSliderPos(percentage);
  }, []);

  const handleMouseDown = (e: ReactMouseEvent) => {
    setIsDragging(true);
    updatePosition(e.clientX);
  };

  const handleTouchStart = (e: ReactTouchEvent) => {
    setIsDragging(true);
    if (e.touches.length > 0) {
      updatePosition(e.touches[0].clientX);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (!isDragging) return;
      updatePosition(e.clientX);
    };

    const handleTouchMove = (e: globalThis.TouchEvent) => {
      if (!isDragging || e.touches.length === 0) return;
      updatePosition(e.touches[0].clientX);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, updatePosition]);

  return (
    <div className="flex-1 min-h-0 flex flex-col space-y-1.5 h-full overflow-hidden">
      {/* Top Labels Bar */}
      <div className="flex items-center justify-between gap-3 px-1 text-[11px] font-mono uppercase tracking-wide text-slate-500 shrink-0">
        <span className="truncate max-w-[40%] font-semibold text-slate-700">{leftLabel}</span>

        {/* Center: Split percentage indicator */}
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
          {Math.round(sliderPos)}% Split
        </span>

        <span className="truncate max-w-[40%] text-right font-semibold text-brand-900">{rightLabel}</span>
      </div>

      {/* Split Viewer Container - flex-1 min-h-0 fills available static window height */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className="relative flex-1 min-h-0 w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-950 cursor-ew-resize select-none shadow-xs"
      >
        {/* Background Image (Right / Enhanced SR) */}
        {rightImage ? (
          <img
            src={rightImage}
            alt="Super-Resolved Output"
            className="absolute inset-0 h-full w-full object-contain pointer-events-none"
            style={{ imageRendering: is25mPixelated ? 'pixelated' : 'auto' }}
            onLoad={syncLeftImageDimensions}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full w-full gap-2.5 text-slate-500 p-6 text-center">
            <Planet className="h-10 w-10 text-slate-600 animate-pulse" />
            <div>
              <p className="text-sm font-semibold text-slate-300">No imagery loaded</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Drop a Sentinel-2 GeoTIFF or image in the sidebar to run 4× super-resolution
              </p>
            </div>
          </div>
        )}

        {/* Foreground Image Overlay (Left / Input LR clipped) */}
        {leftImage && (
          <div
            style={{ width: `${sliderPos}%` }}
            className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-brand-400 pointer-events-none shadow-[2px_0_12px_rgba(30,136,229,0.35)]"
          >
            <img
              ref={leftImgRef}
              src={leftImage}
              alt="Sentinel-2 Input"
              className="absolute inset-y-0 left-0 h-full max-w-none object-contain pointer-events-none"
              style={{ imageRendering: is10mPixelated ? 'pixelated' : 'auto' }}
              onLoad={syncLeftImageDimensions}
            />
          </div>
        )}

        {/* Draggable Divider Handle */}
        {rightImage && (
          <div
            style={{ left: `${sliderPos}%` }}
            className="absolute inset-y-0 -ml-4 w-8 flex items-center justify-center pointer-events-none z-10"
          >
            {/* Vertical line glow */}
            <div className="absolute inset-y-0 w-0.5 bg-brand-400"></div>

            {/* Central handle pill */}
            <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-white border-2 border-brand-500 text-brand-700 shadow-md">
              <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24">
                <path
                  d="M8.5 6L2.5 12L8.5 18M15.5 6L21.5 12L15.5 18"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && <PixelLoader label="Executing Flagship Super-Resolution..." />}
      </div>
    </div>
  );
};
