import type { FC } from 'react';
import { motion } from 'motion/react';
import { Globe, Ruler, ShieldCheck } from '@phosphor-icons/react';
import Threads from '../reactbits/Threads';
import { SectionHeading } from '../ui/SectionHeading';
import { ScoreRings } from './ScoreRings';
import { MetricExplorer } from './MetricExplorer';
import { ModelComparison } from './ModelComparison';

const EASE = [0.22, 1, 0.36, 1] as const;

const STANDARDS = [
  { icon: Globe, title: 'ESA conventions', body: 'PSNR, SSIM, SAM on held-out spaceborne pairs' },
  { icon: Ruler, title: 'CNES ERGAS', body: 'Band-normalised multispectral synthesis error' },
  { icon: ShieldCheck, title: 'NTRO requirement #8', body: 'Calibrated, rank-correlated uncertainty' },
];

export const MetricsPage: FC = () => (
  <div className="relative">
    {/* Header with interactive thread field (React Bits Threads) */}
    <section className="relative isolate overflow-hidden pb-20 pt-36 sm:pt-44">
      <div className="absolute inset-0 -z-10 opacity-70 [mask-image:linear-gradient(to_bottom,black_40%,transparent)]">
        <Threads color={[0.55, 0.99, 0.37]} amplitude={1.2} distance={0.1} enableMouseInteraction />
      </div>
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_50%_60%_at_50%_30%,rgba(3,6,12,0.75),transparent)]" />

      <div className="pointer-events-none mx-auto flex max-w-4xl flex-col items-center px-5 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 24, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.1 }}
          className="text-balance text-5xl font-bold leading-[1.02] tracking-[-0.03em] text-gradient-silver pb-[0.06em] sm:text-7xl"
        >
          Evaluation <span className="text-gradient">metrics</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.25 }}
          className="mt-6 max-w-xl text-lg text-fg-muted"
        >
          Gaia-HAT, its back-projection mode and three reference models, scored on held-out Sentinel-2 (10&nbsp;m) scenes against Airbus SPOT-6/7 (2.5&nbsp;m) ground truth.
        </motion.p>
      </div>
    </section>

    <section className="mx-auto max-w-6xl px-5">
      <ScoreRings />
    </section>

    <section className="mx-auto max-w-6xl px-5 py-28">
      <SectionHeading
        title={
          <>
            Model <span className="text-gradient">comparison</span>
          </>
        }
        body="Hover a model to isolate it, or an axis label to read the raw values. The outer edge is the best score on each axis."
        className="mb-12"
      />
      <ModelComparison />
    </section>

    <section className="mx-auto max-w-6xl px-5 pb-24">
      <SectionHeading
        title={
          <>
            Metric <span className="text-gradient">reference</span>
          </>
        }
        body="Each metric is plotted on a scale that reads worse on the left and better on the right, with its target range shaded."
        className="mb-12"
      />
      <MetricExplorer />
    </section>

    <section className="mx-auto max-w-6xl px-5 pb-28">
      <div className="grid gap-px overflow-hidden rounded-[20px] border border-white/[0.07] bg-white/[0.07] sm:grid-cols-3">
        {STANDARDS.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: i * 0.08, ease: EASE }}
            className="flex items-start gap-4 bg-ink-900 p-6"
          >
            <s.icon weight="duotone" className="h-6 w-6 shrink-0 text-cyan-300" />
            <div>
              <div className="text-[15px] font-medium text-fg">{s.title}</div>
              <div className="mt-1 text-[13px] text-fg-dim">{s.body}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  </div>
);
