import type { FC } from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from '@phosphor-icons/react';
import CountUp from '../reactbits/CountUp';
import { Button } from '../ui/Button';
import { SectionHeading } from '../ui/SectionHeading';
import { BENCHMARK, normalizedScore, type BenchmarkKey, type Direction } from '../../data/metrics';

interface Proof {
  key: BenchmarkKey;
  direction: Direction;
  label: string;
  value: number;
  prefix?: string;
  suffix: string;
  note: string;
}

const PROOFS: Proof[] = [
  { key: 'psnr', direction: 'higher', label: 'PSNR', value: 35.68, suffix: ' dB', note: '+2.43 dB over bicubic' },
  { key: 'ssim', direction: 'higher', label: 'SSIM', value: 0.9213, suffix: '', note: 'Highest structural fidelity tested' },
  { key: 'sam', direction: 'lower', label: 'Spectral angle', value: 1.12, suffix: '°', note: 'Lowest colour distortion tested' },
  { key: 'spearman', direction: 'higher', label: 'Uncertainty rₛ', value: 0.363, prefix: '+', suffix: '', note: 'Best-calibrated confidence map' },
];

/** Tiny rank chart: every model's normalised score on this metric, flagship lit. */
const RankBars: FC<{ metric: BenchmarkKey; direction: Direction }> = ({ metric, direction }) => (
  <div className="flex h-10 items-end gap-1.5" aria-hidden>
    {BENCHMARK.map((m, i) => (
      <motion.span
        key={m.id}
        className={`w-2.5 rounded-full ${m.flagship ? 'bg-lime-400 shadow-[0_0_12px_rgba(141,252,95,0.7)]' : 'bg-white/15'}`}
        initial={{ height: 0 }}
        whileInView={{ height: `${normalizedScore(metric, m[metric], direction) * 100}%` }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, delay: 0.3 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
      />
    ))}
  </div>
);

export const ProofNumbers: FC<{ onMetrics: () => void }> = ({ onMetrics }) => (
  <section className="relative mx-auto max-w-6xl px-5 py-20 sm:py-28">
    <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
      <SectionHeading
        title={
          <>
            Benchmark <span className="text-gradient">results</span>
          </>
        }
        body="Held-out Sentinel-2 scenes scored against Airbus SPOT-6/7 2.5 m ground truth."
      />
      <Button variant="ghost" onClick={onMetrics} trailingIcon={<ArrowRight className="h-4 w-4" />}>
        Open the metrics lab
      </Button>
    </div>

    <div className="mt-14 grid gap-px overflow-hidden rounded-[20px] border border-white/[0.07] bg-white/[0.07] sm:grid-cols-2 lg:grid-cols-4">
      {PROOFS.map((p, i) => (
        <motion.div
          key={p.key}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.8, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="group relative flex flex-col gap-8 bg-ink-900 p-7 transition-colors hover:bg-ink-850"
        >
          <div className="flex items-start justify-between">
            <span className="text-[13px] font-semibold text-fg-muted">{p.label}</span>
            <RankBars metric={p.key} direction={p.direction} />
          </div>
          <div>
            <div className="flex items-baseline font-mono text-5xl font-medium tracking-tight text-gradient-silver">
              {p.prefix}
              <CountUp to={p.value} duration={1.6} />
              <span className="ml-1 text-2xl text-gradient-dim">{p.suffix}</span>
            </div>
            <p className="mt-3 text-sm text-fg-muted">{p.note}</p>
          </div>
          <span className="absolute inset-x-0 bottom-0 h-px scale-x-0 bg-signal transition-transform duration-500 group-hover:scale-x-100" />
        </motion.div>
      ))}
    </div>
    <p className="mt-4 text-right text-[11px] text-fg-dim">
      Bars rank Gaia-HAT (lit) against every other model tested on each metric.
    </p>
  </section>
);
