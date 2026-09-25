import { useEffect, useRef, useState, type FC } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react';
import { Broadcast, Brain, GridNine, SealCheck } from '@phosphor-icons/react';
import { biomeById } from '../../data/biomes';

const PHASES = [
  {
    icon: Broadcast,
    title: 'Capture',
    body: 'Sentinel-2 images the whole planet every five days in free, 10 m pixels.',
  },
  {
    icon: Brain,
    title: 'Attend',
    body: 'Gaia-HAT reads long-range context through channel and shifted-window attention.',
  },
  {
    icon: GridNine,
    title: 'Reconstruct',
    body: 'Sixteen pixels are inferred for every original one, across all four bands.',
  },
  {
    icon: SealCheck,
    title: 'Verify',
    body: 'The output is downsampled and checked against the original capture, then exported.',
  },
];

const LR_SIZE = 158;
const RESOLVE_START = 0.1;
const RESOLVE_END = 0.82;

/**
 * Sticky, scroll-scrubbed story: the canvas re-samples the 2.5 m scene at a
 * resolution driven by scroll position, so the viewer literally scrolls the
 * ground sample distance from 10 m down to 2.5 m.
 */
export const ResolveStory: FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const offRef = useRef<HTMLCanvasElement | null>(null);
  const [phase, setPhase] = useState(0);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });

  const resolveT = useTransform(progress, [RESOLVE_START, RESOLVE_END], [0, 1], { clamp: true });
  const gsd = useTransform(resolveT, (t) => (10 / Math.pow(4, t)).toFixed(2));
  const px = useTransform(resolveT, (t) => Math.round(Math.pow(16, t)).toString());
  const railScale = useTransform(progress, [0, 1], [0, 1]);

  const draw = (t: number) => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !img.complete) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const n = Math.max(8, Math.round(LR_SIZE * Math.pow(4, t)));
    if (!offRef.current) offRef.current = document.createElement('canvas');
    const off = offRef.current;
    off.width = n;
    off.height = n;
    const octx = off.getContext('2d')!;
    octx.imageSmoothingEnabled = true;
    octx.imageSmoothingQuality = 'high';
    octx.drawImage(img, 0, 0, n, n);

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    const img = new Image();
    img.src = biomeById('Landcover-785992').sr;
    img.onload = () => draw(resolveT.get());
    imgRef.current = img;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(([entry]) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(entry.contentRect.width * dpr);
      canvas.height = Math.round(entry.contentRect.height * dpr);
      draw(resolveT.get());
    });
    ro.observe(canvas);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rafRef = useRef(0);
  useMotionValueEvent(resolveT, 'change', (t) => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => draw(t));
  });

  useMotionValueEvent(progress, 'change', (p) => {
    const next = Math.min(3, Math.max(0, Math.floor(((p - 0.02) / 0.9) * 4)));
    setPhase((cur) => (cur === next ? cur : next));
  });

  return (
    <section ref={sectionRef} className="relative h-[360vh]">
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0 hairline-grid opacity-40 [mask-image:radial-gradient(ellipse_70%_60%_at_60%_50%,black,transparent)]" />

        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-5 pt-16 lg:grid-cols-[1fr_minmax(0,560px)] lg:gap-16">
          {/* Narrative */}
          <div className="order-2 lg:order-1">
            <h2 className="text-4xl font-medium leading-[1.06] tracking-[-0.025em] text-gradient-silver pb-[0.06em] sm:text-5xl">
              Scroll the ground from <span className="text-gradient-dim">10&nbsp;m</span> to{' '}
              <span className="text-gradient">2.5&nbsp;m.</span>
            </h2>

            <div className="relative mt-10 pl-6">
              <div className="absolute left-0 top-1 bottom-1 w-px bg-white/10" />
              <motion.div
                style={{ scaleY: railScale }}
                className="absolute left-0 top-1 bottom-1 w-px origin-top bg-gradient-to-b from-lime-400 via-cyan-400 to-sky-400"
              />
              <ol className="space-y-2">
                {PHASES.map((p, i) => {
                  const active = i === phase;
                  const done = i < phase;
                  return (
                    <li key={p.title} className="relative">
                      <span
                        className={`absolute -left-[29px] top-3 h-2.5 w-2.5 rounded-full border transition-all duration-500 ${
                          active
                            ? 'border-lime-400 bg-lime-400 shadow-[0_0_14px_rgba(141,252,95,0.9)]'
                            : done
                              ? 'border-cyan-400 bg-cyan-400/60'
                              : 'border-white/20 bg-ink-950'
                        }`}
                      />
                      <div
                        className={`rounded-2xl px-4 py-3 transition-all duration-500 ${
                          active ? 'bg-white/[0.04] ring-1 ring-white/[0.08]' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <p.icon
                            weight={active ? 'fill' : 'regular'}
                            className={`h-5 w-5 transition-colors duration-500 ${active ? 'text-lime-400' : 'text-fg-dim'}`}
                          />
                          <span
                            className={`text-lg font-medium transition-colors duration-500 ${active ? 'text-fg' : 'text-fg-dim'}`}
                          >
                            {p.title}
                          </span>
                        </div>
                        <AnimatePresence initial={false}>
                          {active && (
                            <motion.p
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                              className="overflow-hidden pl-8 text-[15px] leading-relaxed text-fg-muted"
                            >
                              <span className="block pt-2">{p.body}</span>
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>

          {/* Canvas stage */}
          <div className="order-1 lg:order-2">
            <div className="relative mx-auto aspect-square w-full max-w-[min(560px,58svh)] lg:max-w-[min(560px,70svh)]">
              <canvas
                ref={canvasRef}
                className="absolute inset-0 h-full w-full rounded-[20px] border border-white/10 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]"
              />

              {/* Phase overlays */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[20px]">
                <AnimatePresence>
                  {phase === 0 && (
                    <motion.div
                      key="scan"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-x-0 h-24 animate-scan bg-gradient-to-b from-transparent via-cyan-300/25 to-transparent"
                    >
                      <div className="absolute inset-x-0 top-1/2 h-px bg-cyan-300/80 shadow-[0_0_12px_rgba(122,240,245,0.9)]" />
                    </motion.div>
                  )}
                  {phase === 1 && (
                    <motion.div
                      key="windows"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 grid grid-cols-6 grid-rows-6"
                    >
                      {Array.from({ length: 36 }).map((_, i) => (
                        <span key={i} className="relative border border-white/10">
                          <span
                            className="absolute inset-0 animate-blink"
                            style={{
                              background: `rgba(141,252,95,${0.12 + ((i * 7) % 5) * 0.04})`,
                              animationDuration: '2.2s',
                              animationDelay: `${((i % 6) + Math.floor(i / 6)) * 0.12}s`,
                            }}
                          />
                        </span>
                      ))}
                    </motion.div>
                  )}
                  {phase === 2 && (
                    <motion.div
                      key="brackets"
                      initial={{ opacity: 0, scale: 1.08 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-6"
                    >
                      {['left-0 top-0 border-l-2 border-t-2', 'right-0 top-0 border-r-2 border-t-2', 'left-0 bottom-0 border-l-2 border-b-2', 'right-0 bottom-0 border-r-2 border-b-2'].map((c) => (
                        <span key={c} className={`absolute h-8 w-8 border-lime-400 ${c}`} />
                      ))}
                    </motion.div>
                  )}
                  {phase === 3 && (
                    <motion.div
                      key="verify"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-lime-400 py-1.5 pl-2 pr-3.5 text-[12px] font-medium text-ink-950 shadow-[0_0_30px_rgba(141,252,95,0.6)]"
                    >
                      <SealCheck weight="fill" className="h-4 w-4" />
                      Re-observation check passed
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* GSD readout */}
              <div className="absolute bottom-4 right-4 rounded-2xl glass-strong px-4 py-3 shadow-2xl">
                <div className="text-[11px] font-medium text-fg-muted">Ground sample distance</div>
                <div className="mt-1 flex items-baseline gap-1 font-mono">
                  <motion.span className="text-3xl font-medium tabular-nums text-fg">{gsd}</motion.span>
                  <span className="text-sm text-fg-muted">m</span>
                  <span className="ml-3 text-[11px] text-lime-300">
                    ×<motion.span>{px}</motion.span> px
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
