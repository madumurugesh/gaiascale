import { useEffect, type FC } from 'react';
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'motion/react';
import { ArrowUpRight, ChartLineUp, CursorClick } from '@phosphor-icons/react';
import LiquidEther from '../reactbits/LiquidEther';
import RotatingText from '../reactbits/RotatingText';
import Magnet from '../reactbits/Magnet';
import PixelTransition from '../reactbits/PixelTransition';
import { Button } from '../ui/Button';
import { biomeById } from '../../data/biomes';

interface HeroProps {
  onLaunch: () => void;
  onMetrics: () => void;
}

const EASE = [0.22, 1, 0.36, 1] as const;

const STATS = [
  { value: '10 → 2.5 m', label: 'Ground sample distance' },
  { value: '4×', label: 'Linear upscale' },
  { value: '16×', label: 'Pixel density' },
  { value: 'R·G·B·NIR', label: 'Spectral bands kept' },
];

/** "Every pixel, resolved.": each glyph of the last word snaps from a blurred, oversized state into focus. */
const Headline: FC = () => {
  const word = 'resolved.';
  return (
    <h1 className="text-balance text-[clamp(3rem,9vw,7.5rem)] font-bold leading-[0.92] tracking-[-0.035em] text-fg">
      <span className="block overflow-hidden pb-2">
        {['Every', 'pixel,'].map((w, i) => (
          <motion.span
            key={w}
            className="mr-[0.22em] inline-block text-gradient-silver pb-[0.06em]"
            initial={{ y: '105%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.25 + i * 0.08 }}
          >
            {w}
          </motion.span>
        ))}
      </span>
      <span className="block">
        {word.split('').map((ch, i) => (
          <motion.span
            key={i}
            className="inline-block text-gradient pb-[0.08em]"
            initial={{ opacity: 0, filter: 'blur(18px)', scale: 1.6, y: 10 }}
            animate={{ opacity: 1, filter: 'blur(0px)', scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.6 + i * 0.055 }}
          >
            {ch}
          </motion.span>
        ))}
      </span>
    </h1>
  );
};

interface FloatingTileProps {
  biomeId: string;
  className: string;
  rotate: number;
  depth: number;
  mx: MotionValue<number>;
  my: MotionValue<number>;
  delay: number;
}

/** Hover-to-resolve preview tile: React Bits PixelTransition from the 10 m capture to the 2.5 m output. */
const FloatingTile: FC<FloatingTileProps> = ({ biomeId, className, rotate, depth, mx, my, delay }) => {
  const biome = biomeById(biomeId);
  const x = useTransform(mx, (v) => v * depth);
  const y = useTransform(my, (v) => v * depth);

  return (
    <motion.div
      style={{ x, y }}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, ease: EASE, delay }}
      className={`absolute hidden xl:block ${className}`}
    >
      <div className="animate-float-slow" style={{ animationDelay: `${delay}s` }}>
        <div style={{ rotate: `${rotate}deg` }} className="group w-[210px]">
          <PixelTransition
            gridSize={12}
            pixelColor="#8dfc5f"
            animationStepDuration={0.35}
            className="rounded-[22px] border border-white/15 bg-ink-800 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] ring-1 ring-white/5 cursor-crosshair"
            firstContent={
              <div className="relative h-full w-full">
                <img src={biome.lr} alt={`${biome.label} at 10 m`} className="h-full w-full object-cover pixelated" />
                <span className="absolute left-3 top-3 rounded-md bg-ink-950/80 px-2 py-1 text-[11px] font-medium text-fg backdrop-blur">
                  10 m input
                </span>
              </div>
            }
            secondContent={
              <div className="relative h-full w-full">
                <img src={biome.sr} alt={`${biome.label} at 2.5 m`} className="h-full w-full object-cover" />
                <span className="absolute left-3 top-3 rounded-md bg-lime-400 px-2 py-1 text-[11px] font-semibold text-ink-950">
                  2.5 m output
                </span>
              </div>
            }
          />
          <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-fg-dim transition-colors group-hover:text-fg-muted">
            <CursorClick className="h-3.5 w-3.5" />
            Hover to resolve {biome.label.toLowerCase()}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const Hero: FC<HeroProps> = ({ onLaunch, onMetrics }) => {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const mx = useSpring(rawX, { stiffness: 60, damping: 18 });
  const my = useSpring(rawY, { stiffness: 60, damping: 18 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      rawX.set((e.clientX / window.innerWidth - 0.5) * 2);
      rawY.set((e.clientY / window.innerHeight - 0.5) * 2);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [rawX, rawY]);

  return (
    <section className="relative isolate flex min-h-[100svh] flex-col overflow-hidden">
      {/* Interactive fluid field (React Bits LiquidEther) follows the cursor, idles on its own */}
      <div className="absolute inset-0 -z-20">
        <LiquidEther
          colors={['#071a3a', '#1b6fd0', '#1cc3cc', '#8dfc5f']}
          mouseForce={16}
          cursorSize={95}
          resolution={0.5}
          autoDemo
          autoSpeed={0.45}
          autoIntensity={2.1}
          takeoverDuration={0.3}
          autoResumeDelay={2500}
        />
      </div>

      {/* Legibility scrims */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 55% 42% at 50% 42%, rgba(3,6,12,0.72) 0%, rgba(3,6,12,0.25) 60%, transparent 100%), linear-gradient(to bottom, rgba(3,6,12,0.55), transparent 22%)',
        }}
      />

      {/* Orbital track with a satellite making its pass */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full"
        viewBox="0 0 1600 1000"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="sat-glow">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#8dfc5f" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#8dfc5f" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path
          id="orbit"
          d="M -100 760 C 300 420, 1300 300, 1700 520"
          fill="none"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth="1"
          strokeDasharray="2 8"
        />
        <circle r="14" fill="url(#sat-glow)">
          <animateMotion dur="16s" repeatCount="indefinite" rotate="auto">
            <mpath href="#orbit" />
          </animateMotion>
        </circle>
      </svg>

      {/* Planet horizon */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 -z-10 aspect-square w-[240vw] -translate-x-1/2 rounded-full sm:w-[200vw]"
        style={{
          top: 'calc(100% - 15vh)',
          background: 'radial-gradient(circle at 50% 0%, #0b1a2c 0%, #050a14 18%, #03060c 40%)',
          boxShadow:
            '0 -1px 0 rgba(122,240,245,0.55), 0 -40px 120px -20px rgba(62,224,232,0.35), inset 0 40px 80px -40px rgba(141,252,95,0.28)',
        }}
      />

      <FloatingTile biomeId="Landcover-1339025" className="left-[4%] top-[28%]" rotate={-7} depth={-14} mx={mx} my={my} delay={1.1} />
      <FloatingTile biomeId="Landcover-613267" className="right-[4%] top-[20%]" rotate={6} depth={18} mx={mx} my={my} delay={1.3} />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-5 pt-32 text-center sm:pt-44">
        <Headline />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 1.1 }}
          className="mt-6 flex max-w-xl flex-col items-center gap-3 text-lg text-fg-muted sm:text-xl"
        >
          <p className="text-pretty leading-snug">
            Free 10&nbsp;m Sentinel-2 imagery, reconstructed at 2.5&nbsp;m with its physics intact. Built for
          </p>
          <RotatingText
            texts={['farmland.', 'coastlines.', 'forests.', 'cities.', 'rivers.']}
            mainClassName="overflow-hidden rounded-lg bg-lime-400 px-3 py-1 font-semibold text-ink-950 justify-center"
            splitLevelClassName="overflow-hidden pb-0.5"
            staggerFrom="last"
            staggerDuration={0.025}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-120%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            rotationInterval={2200}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 1.3 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Magnet padding={24} magnetStrength={12}>
            <Button size="lg" onClick={onLaunch} trailingIcon={<ArrowUpRight weight="bold" className="h-4 w-4" />}>
              Open the studio
            </Button>
          </Magnet>
          <Button size="lg" variant="ghost" onClick={onMetrics} icon={<ChartLineUp className="h-4 w-4" />}>
            See the metrics
          </Button>
        </motion.div>

        <motion.dl
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE, delay: 1.5 }}
          className="mb-8 mt-12 grid w-full max-w-3xl grid-cols-2 overflow-hidden rounded-2xl glass sm:grid-cols-4"
        >
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={`px-5 py-4 text-left ${i % 2 === 1 ? 'border-l border-white/[0.06]' : ''} ${
                i >= 2 ? 'border-t border-white/[0.06] sm:border-t-0' : ''
              } ${i === 2 ? 'sm:border-l' : ''}`}
            >
              <dt className="text-[11px] text-fg-dim">{s.label}</dt>
              <dd className="mt-1 font-mono text-[15px] font-medium text-fg">{s.value}</dd>
            </div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
};
