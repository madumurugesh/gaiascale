import type { FC, ReactNode } from 'react';
import { motion } from 'motion/react';
import { FileImage, MapTrifold, Package, ShieldCheck, Waveform, Fire, Cpu } from '@phosphor-icons/react';
import { SectionHeading } from '../ui/SectionHeading';

const EASE = [0.22, 1, 0.36, 1] as const;

const CardShell: FC<{
  className?: string;
  icon: ReactNode;
  title: string;
  stat?: ReactNode;
  children: ReactNode;
  delay?: number;
}> = ({ className = '', icon, title, stat, children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.25 }}
    transition={{ duration: 0.8, ease: EASE, delay }}
    className={className}
  >
    <div className="flex h-full flex-col rounded-[20px] border border-white/[0.07] bg-ink-900/70 p-6 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-lime-300">
          {icon}
        </span>
        {stat}
      </div>
      <h3 className="mt-4 max-w-sm text-xl font-semibold leading-snug tracking-tight text-gradient-silver">{title}</h3>
      <div className="relative mt-6 flex-1">{children}</div>
    </div>
  </motion.div>
);

const Stat: FC<{ value: string; label: string; tone?: string }> = ({ value, label, tone = 'text-gradient' }) => (
  <div className="text-right">
    <div className={`font-mono text-lg font-medium ${tone}`}>{value}</div>
    <div className="text-[10px] text-fg-dim">{label}</div>
  </div>
);

/* ---- Spectral signature: truth vs output reflectance across the four bands ---- */
const BANDS = [
  { id: 'B2', name: 'Blue', nm: 490, color: '#3aa8ff', truth: 0.06, out: 0.063 },
  { id: 'B3', name: 'Green', nm: 560, color: '#8dfc5f', truth: 0.11, out: 0.106 },
  { id: 'B4', name: 'Red', nm: 665, color: '#ff6b6b', truth: 0.07, out: 0.074 },
  { id: 'B8', name: 'NIR', nm: 842, color: '#c084fc', truth: 0.42, out: 0.412 },
];

const MAX_REFLECTANCE = 0.45;

/** One row per band: output reflectance as a bar, ground truth as a tick, and the difference. */
const SpectralChart: FC = () => (
  <div>
    <div className="grid grid-cols-[92px_1fr_64px] items-center gap-x-4 pb-2 text-[11px] text-fg-dim sm:grid-cols-[110px_1fr_110px]">
      <span>Band</span>
      <span>Reflectance</span>
      <span className="text-right">Difference</span>
    </div>
    <div className="divide-y divide-white/[0.05] border-y border-white/[0.05]">
      {BANDS.map((b, i) => {
        const diff = b.out - b.truth;
        return (
          <div key={b.id} className="grid grid-cols-[92px_1fr_64px] items-center gap-x-4 py-3 sm:grid-cols-[110px_1fr_110px]">
            <div className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: b.color }} />
              <span>
                <span className="block text-[13px] font-semibold leading-tight text-fg">{b.name}</span>
                <span className="block text-[11px] text-fg-dim">
                  {b.id} · {b.nm} nm
                </span>
              </span>
            </div>
            <div className="relative h-2 rounded-full bg-white/[0.05]">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ background: b.color }}
                initial={{ width: 0 }}
                whileInView={{ width: `${(b.out / MAX_REFLECTANCE) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.2 + i * 0.1, ease: EASE }}
              />
              <span
                className="absolute -top-1 h-4 w-0.5 -translate-x-1/2 rounded-full bg-white"
                style={{ left: `${(b.truth / MAX_REFLECTANCE) * 100}%` }}
                title={`Ground truth ${b.truth.toFixed(3)}`}
              />
            </div>
            <div className="text-right font-mono text-[12px]">
              <span className="text-fg">{b.out.toFixed(3)}</span>
              <span className="hidden text-fg-dim sm:inline"> ({diff >= 0 ? '+' : '−'}
              {Math.abs(diff).toFixed(3)})</span>
            </div>
          </div>
        );
      })}
    </div>
    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-fg-dim">
      <span className="flex items-center gap-2">
        <span className="h-2 w-5 rounded-full bg-fg-muted" /> GaiaScale 2.5 m
      </span>
      <span className="flex items-center gap-2">
        <span className="h-3 w-0.5 rounded-full bg-white" /> Ground truth
      </span>
      <span className="ml-auto">Illustrative vegetation signature</span>
    </div>
  </div>
);

/* ---- Re-observation: 16 fine pixels collapse back into the original coarse one ---- */
const ReobservationViz: FC = () => (
  <div className="flex h-full items-center justify-center gap-5 py-2">
    <div className="relative h-24 w-24">
      <div className="grid h-full w-full grid-cols-4 gap-0.5">
        {Array.from({ length: 16 }).map((_, i) => (
          <span
            key={i}
            className="rounded-[3px]"
            style={{ background: `hsl(${160 + ((i * 29) % 50)} 70% ${38 + ((i * 11) % 22)}%)` }}
          />
        ))}
      </div>
      {/* the 16 fine pixels average back into one coarse value */}
      <span className="absolute inset-0 rounded-lg bg-[hsl(180_60%_46%)] animate-merge" />
    </div>
    <div className="flex flex-col items-center gap-1 font-mono text-[10px] text-fg-dim">
      <span>↓ 4×</span>
      <span className="text-lg text-fg-muted">=</span>
    </div>
    <div className="relative h-24 w-24 rounded-lg bg-[hsl(180_60%_46%)]">
      <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-lime-400 text-ink-950 animate-pop">
        <ShieldCheck weight="fill" className="h-4 w-4" />
      </span>
      <span className="absolute bottom-1.5 left-2 font-mono text-[10px] text-ink-950/70">10 m</span>
    </div>
  </div>
);

/* ---- Uncertainty heat: magma cells that flare where the model is least sure ---- */
const MAGMA = ['#0d0829', '#3b0f70', '#8c2981', '#de4968', '#fe9f6d', '#fcfdbf'];
const HeatViz: FC = () => (
  <div className="grid grid-cols-10 gap-[3px]">
    {Array.from({ length: 60 }).map((_, i) => {
      const r = Math.floor(i / 10);
      const c = i % 10;
      const d = Math.hypot(c - 6.5, r - 2.2);
      const base = Math.max(0, 4 - d * 0.9);
      const lo = MAGMA[Math.min(5, Math.floor(base))];
      const hi = MAGMA[Math.min(5, Math.floor(base) + 1)];
      return (
        <span key={i} className="relative aspect-square overflow-hidden rounded-[3px]" style={{ background: lo }}>
          <span
            className="absolute inset-0 animate-blink"
            style={{ background: hi, animationDuration: `${2.4 + (i % 5) * 0.3}s`, animationDelay: `${(i % 7) * 0.2}s` }}
          />
        </span>
      );
    })}
  </div>
);

/* ---- Hybrid attention: a shifting window scans a feature grid ---- */
const AttentionViz: FC = () => {
  const positions = [
    { x: 0, y: 0 },
    { x: 3, y: 0 },
    { x: 1.5, y: 1.5 },
    { x: 0, y: 3 },
    { x: 3, y: 3 },
  ];
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[180px]">
      <div className="grid h-full w-full grid-cols-6 grid-rows-6 gap-1">
        {Array.from({ length: 36 }).map((_, i) => (
          <span key={i} className="rounded-[4px] bg-white/[0.05]" />
        ))}
      </div>
      <motion.div
        className="absolute h-1/2 w-1/2 rounded-lg border-2 border-lime-400 bg-lime-400/10"
        animate={{
          left: positions.map((p) => `${(p.x / 6) * 100}%`),
          top: positions.map((p) => `${(p.y / 6) * 100}%`),
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
};

/* ---- Export formats ---- */
const FILES = [
  { icon: MapTrifold, ext: '.tif', label: 'GeoTIFF', meta: '4-band, EPSG CRS' },
  { icon: FileImage, ext: '.png', label: 'Rendered view', meta: 'Active layer' },
  { icon: Package, ext: '.npz', label: 'NumPy tensor', meta: 'float32 array' },
];

const ExportViz: FC = () => (
  <div className="flex flex-col gap-2">
    {FILES.map((f) => (
      <div key={f.ext} className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-2.5">
        <f.icon className="h-4 w-4 text-lime-300" />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-fg">{f.label}</div>
          <div className="text-[11px] text-fg-dim">{f.meta}</div>
        </div>
        <span className="font-mono text-[11px] text-fg-muted">{f.ext}</span>
      </div>
    ))}
  </div>
);

export const CapabilityBento: FC = () => (
  <section className="relative mx-auto max-w-6xl px-5 py-20 sm:py-28">
    <SectionHeading
      title={
        <>
          Detail you can <span className="text-gradient">check.</span>
        </>
      }
      body="Every output is tested against the original Sentinel-2 capture and ships with a per-pixel confidence map."
    />

    <div className="mt-14 grid gap-4 lg:grid-cols-6">
      <CardShell
        className="lg:col-span-4"
        icon={<Waveform className="h-4 w-4" />}
        title="All four bands keep their spectral signature."
        stat={<Stat value="1.12°" label="Spectral angle" />}
      >
        <SpectralChart />
      </CardShell>

      <CardShell
        className="lg:col-span-2"
        icon={<ShieldCheck className="h-4 w-4" />}
        title="Downsampling the output returns the original capture."
        delay={0.1}
      >
        <ReobservationViz />
      </CardShell>

      <CardShell
        className="lg:col-span-2"
        icon={<Fire className="h-4 w-4" />}
        title="A confidence map flags pixels that need a second look."
        stat={<Stat value="+0.363" label="rₛ · NTRO #8" />}
      >
        <HeatViz />
      </CardShell>

      <CardShell
        className="lg:col-span-2"
        icon={<Cpu className="h-4 w-4" />}
        title="Hybrid attention follows roads and field edges across the tile."
        delay={0.1}
      >
        <AttentionViz />
      </CardShell>

      <CardShell
        className="lg:col-span-2"
        icon={<MapTrifold className="h-4 w-4" />}
        title="Georeferenced exports open directly in GIS tools."
        delay={0.2}
      >
        <ExportViz />
      </CardShell>
    </div>
  </section>
);
