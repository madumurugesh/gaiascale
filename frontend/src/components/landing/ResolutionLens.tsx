import { useEffect, useRef, useState, type FC, type PointerEvent as ReactPointerEvent } from 'react';
import {
  animate,
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
} from 'motion/react';
import { MagnifyingGlass, SplitHorizontal, Minus, Plus } from '@phosphor-icons/react';
import { BIOMES, biomeById } from '../../data/biomes';
import { Segmented } from '../ui/Segmented';
import { SectionHeading } from '../ui/SectionHeading';

type Mode = 'lens' | 'swipe';

const LENS = 190;

/**
 * Interactive comparison stage. "Lens" mode shows the 10 m capture with a
 * magnifier that reveals the 2.5 m reconstruction under the cursor (and drifts
 * on its own when idle); "Swipe" mode is a draggable before/after split.
 */
export const ResolutionLens: FC = () => {
  const [biomeId, setBiomeId] = useState(BIOMES[0].id);
  const [mode, setMode] = useState<Mode>('lens');
  const [zoom, setZoom] = useState(1.2);
  const [hovering, setHovering] = useState(false);
  const biome = biomeById(biomeId);

  const stageRef = useRef<HTMLDivElement>(null);
  const size = useMotionValue(560);
  const tx = useMotionValue(280);
  const ty = useMotionValue(280);
  const lx = useSpring(tx, { stiffness: 260, damping: 30, mass: 0.6 });
  const ly = useSpring(ty, { stiffness: 260, damping: 30, mass: 0.6 });
  const zoomTarget = useMotionValue(zoom);
  const z = useSpring(zoomTarget, { stiffness: 200, damping: 26 });
  const split = useMotionValue(50);
  const draggingRef = useRef(false);
  const inView = useInView(stageRef);

  useEffect(() => zoomTarget.set(zoom), [zoom, zoomTarget]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => size.set(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [size]);

  // Idle drift: a slow Lissajous path so the lens is alive before anyone touches it.
  useAnimationFrame((t) => {
    if (mode !== 'lens' || hovering || !inView) return;
    const s = size.get();
    const sec = t / 1000;
    tx.set(s * (0.5 + 0.27 * Math.sin(sec * 0.55)));
    ty.set(s * (0.5 + 0.22 * Math.sin(sec * 0.83 + 1.2)));
  });



  // Swipe mode opens with a quick demonstration sweep.
  useEffect(() => {
    if (mode !== 'swipe') return;
    const controls = animate(split, [50, 22, 78, 50], { duration: 2.4, ease: 'easeInOut' });
    return () => controls.stop();
  }, [mode, split]);

  const lensX = useTransform(lx, (v) => v - LENS / 2);
  const lensY = useTransform(ly, (v) => v - LENS / 2);
  const bgSize = useTransform(() => `${size.get() * z.get()}px ${size.get() * z.get()}px`);
  const bgPos = useTransform(
    () => `${-(lx.get() * z.get() - LENS / 2)}px ${-(ly.get() * z.get() - LENS / 2)}px`
  );
  const clip = useTransform(split, (p) => `inset(0 ${100 - p}% 0 0)`);
  const handleLeft = useTransform(split, (p) => `${p}%`);

  const localPoint = (e: ReactPointerEvent) => {
    const rect = stageRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top, w: rect.width };
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    const p = localPoint(e);
    if (mode === 'lens') {
      tx.set(p.x);
      ty.set(p.y);
    } else if (draggingRef.current) {
      split.set(Math.min(100, Math.max(0, (p.x / p.w) * 100)));
    }
  };

  const onPointerDown = (e: ReactPointerEvent) => {
    if (mode !== 'swipe') return;
    draggingRef.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    split.stop();
    const p = localPoint(e);
    split.set(Math.min(100, Math.max(0, (p.x / p.w) * 100)));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (mode === 'swipe' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      e.preventDefault();
      split.set(Math.min(100, Math.max(0, split.get() + (e.key === 'ArrowLeft' ? -5 : 5))));
    }
    if (mode === 'lens' && (e.key === '+' || e.key === '=')) setZoom((v) => Math.min(3, +(v + 0.2).toFixed(1)));
    if (mode === 'lens' && e.key === '-') setZoom((v) => Math.max(1, +(v - 0.2).toFixed(1)));
  };

  return (
    <section id="lens" className="relative mx-auto max-w-6xl px-5 py-20 sm:py-28">
      <SectionHeading
        title={
          <>
            Put the lens on <span className="text-gradient">any landscape.</span>
          </>
        }
        body="The base layer is the raw 10 m Sentinel-2 capture. Everything under the lens is GaiaScale's 2.5 m reconstruction of the same ground."
      />

      <div className="mt-14 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
        {/* Stage */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-[640px]"
        >
          <div
            ref={stageRef}
            tabIndex={0}
            role="img"
            aria-label={`${biome.label}: 10 metre input compared with 2.5 metre GaiaScale output`}
            onPointerMove={onPointerMove}
            onPointerDown={onPointerDown}
            onPointerUp={() => (draggingRef.current = false)}
            onPointerEnter={() => setHovering(true)}
            onPointerLeave={() => {
              setHovering(false);
              draggingRef.current = false;
            }}
            onKeyDown={onKeyDown}
            className={`relative aspect-square w-full touch-none select-none overflow-hidden rounded-2xl border border-white/10 bg-ink-900 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] ${
              mode === 'lens' ? 'cursor-none' : 'cursor-ew-resize'
            }`}
          >
            {/* 2.5 m layer (swipe background) */}
            {mode === 'swipe' && (
              <img src={biome.sr} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" />
            )}

            {/* 10 m layer */}
            <motion.img
              key={biome.id}
              src={biome.lr}
              alt=""
              draggable={false}
              initial={{ opacity: 0.4, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              style={mode === 'swipe' ? { clipPath: clip } : undefined}
              className="absolute inset-0 h-full w-full object-cover pixelated"
            />

            {mode === 'lens' && (
              <motion.div style={{ x: lensX, y: lensY }} className="pointer-events-none absolute left-0 top-0 z-10">
                <motion.div
                  className="relative overflow-hidden rounded-full"
                  style={{
                    width: LENS,
                    height: LENS,
                    backgroundImage: `url(${biome.sr})`,
                    backgroundSize: bgSize,
                    backgroundPosition: bgPos,
                    backgroundRepeat: 'no-repeat',
                  }}
                >
                  <div className="absolute inset-0 rounded-full shadow-[inset_0_0_0_2px_rgba(255,255,255,0.9),inset_0_0_40px_rgba(0,0,0,0.35)]" />
                  <div className="absolute left-1/2 top-1/2 h-4 w-px -translate-x-1/2 -translate-y-1/2 bg-white/80" />
                  <div className="absolute left-1/2 top-1/2 h-px w-4 -translate-x-1/2 -translate-y-1/2 bg-white/80" />
                </motion.div>
                <div className="absolute -right-3 bottom-2 rounded-md bg-lime-400 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-ink-950 shadow-lg">
                  {zoom.toFixed(1)}×
                </div>
              </motion.div>
            )}

            {mode === 'swipe' && (
              <motion.div
                style={{ left: handleLeft }}
                className="pointer-events-none absolute inset-y-0 z-10 w-0"
              >
                <div className="absolute inset-y-0 -left-px w-0.5 bg-white" />
                <div className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg border border-white/30 bg-ink-950/80 text-fg backdrop-blur-md">
                  <SplitHorizontal weight="bold" className="h-5 w-5" />
                </div>
              </motion.div>
            )}

            {/* Layer labels */}
            <div className="pointer-events-none absolute inset-x-3 top-3 z-20 flex items-start justify-between gap-2 text-[11px] font-medium">
              <span className="rounded-md bg-ink-950/80 px-2 py-1 text-fg backdrop-blur">10 m input</span>
              <span className="rounded-md bg-lime-400 px-2 py-1 font-semibold text-ink-950">2.5 m output</span>
            </div>
          </div>
        </motion.div>

        {/* Controls */}
        <motion.aside
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          className="flex flex-col gap-4"
        >
          <div className="rounded-2xl glass p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-fg">Landscape</span>
              <span className="text-[12px] text-fg-muted">{biome.label}</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {BIOMES.map((b) => {
                const active = b.id === biomeId;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBiomeId(b.id)}
                    title={b.label}
                    aria-label={b.label}
                    aria-pressed={active}
                    className="group relative aspect-square overflow-hidden rounded-xl"
                  >
                    <img
                      src={b.sr}
                      alt=""
                      className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-110 ${
                        active ? '' : 'opacity-60 saturate-50 group-hover:opacity-100 group-hover:saturate-100'
                      }`}
                    />
                    {active && (
                      <motion.span
                        layoutId="biome-ring"
                        className="absolute inset-0 rounded-xl ring-2 ring-inset ring-lime-400"
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      />
                    )}
                    <b.icon
                      weight="fill"
                      className="absolute bottom-1 right-1 h-3.5 w-3.5 text-white opacity-0 drop-shadow transition-opacity group-hover:opacity-100"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl glass p-5 space-y-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-fg">Compare</span>
              <Segmented
                size="sm"
                value={mode}
                onChange={setMode}
                ariaLabel="Comparison mode"
                options={[
                  { value: 'lens', label: 'Lens', icon: <MagnifyingGlass className="h-3.5 w-3.5" /> },
                  { value: 'swipe', label: 'Swipe', icon: <SplitHorizontal className="h-3.5 w-3.5" /> },
                ]}
              />
            </div>

            <div className={`space-y-3 transition-opacity ${mode === 'lens' ? '' : 'pointer-events-none opacity-30'}`}>
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-fg-muted">Lens magnification</span>
                <span className="font-mono text-fg">{zoom.toFixed(1)}×</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Decrease magnification"
                  onClick={() => setZoom((v) => Math.max(1, +(v - 0.2).toFixed(1)))}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-fg-muted hover:text-fg hover:border-white/25"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  aria-label="Lens magnification"
                  className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-lime-400"
                />
                <button
                  type="button"
                  aria-label="Increase magnification"
                  onClick={() => setZoom((v) => Math.min(3, +(v + 0.2).toFixed(1)))}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-fg-muted hover:text-fg hover:border-white/25"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl glass p-5">
              <div className="text-[11px] text-fg-dim">One 10 m pixel</div>
              <div className="mt-3 grid h-14 w-14 grid-cols-1 overflow-hidden rounded-md bg-sky-400/70" />
              <div className="mt-3 font-mono text-sm text-fg">1 value</div>
            </div>
            <div className="rounded-2xl glass p-5">
              <div className="text-[11px] text-fg-dim">Becomes</div>
              <div className="mt-3 grid h-14 w-14 grid-cols-4 gap-px overflow-hidden rounded-md">
                {Array.from({ length: 16 }).map((_, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0.4 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + i * 0.04, type: 'spring', stiffness: 300, damping: 20 }}
                    className="block"
                    style={{
                      background: `hsl(${150 + ((i * 37) % 60)} 80% ${45 + ((i * 13) % 25)}%)`,
                    }}
                  />
                ))}
              </div>
              <div className="mt-3 font-mono text-sm text-lime-300">16 values</div>
            </div>
          </div>
        </motion.aside>
      </div>
    </section>
  );
};
