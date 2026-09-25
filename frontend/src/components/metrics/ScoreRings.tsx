import type { FC } from 'react';
import { motion } from 'motion/react';
import { ArrowDown, ArrowUp } from '@phosphor-icons/react';
import CountUp from '../reactbits/CountUp';
import { METRICS, goodness, type MetricDef } from '../../data/metrics';

const R = 52;
const C = 2 * Math.PI * R;
const ARC = 0.75; // gauge sweeps 270°

const Gauge: FC<{ metric: MetricDef; index: number }> = ({ metric, index }) => {
  const g = goodness(metric, metric.gaia);
  const target = goodness(metric, metric.target.value);
  const base = goodness(metric, metric.baseline);
  const Dir = metric.direction === 'higher' ? ArrowUp : ArrowDown;
  const tickAngle = (t: number) => 135 + t * 270;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.8, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col items-center rounded-[20px] border border-white/[0.07] bg-ink-900/70 px-5 pb-6 pt-7 transition-colors hover:border-white/15"
    >
      <div className="relative h-40 w-40">
        <svg viewBox="0 0 140 140" className="h-full w-full">
          <defs>
            <linearGradient id={`g-${metric.id}`} x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#3f9a2a" />
              <stop offset="55%" stopColor="#6fe43f" />
              <stop offset="100%" stopColor="#b5ff94" />
            </linearGradient>
          </defs>
          <g transform="rotate(135 70 70)">
            <circle
              cx="70"
              cy="70"
              r={R}
              fill="none"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={`${C * ARC} ${C}`}
            />
            <motion.circle
              cx="70"
              cy="70"
              r={R}
              fill="none"
              stroke={`url(#g-${metric.id})`}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={`${C * ARC} ${C}`}
              initial={{ strokeDashoffset: C * ARC }}
              whileInView={{ strokeDashoffset: C * ARC * (1 - g) }}
              viewport={{ once: true }}
              transition={{ duration: 1.6, delay: 0.2 + index * 0.1, ease: [0.22, 1, 0.36, 1] }}
            />
          </g>
          {/* target threshold tick */}
          <line
            x1="70"
            y1="8"
            x2="70"
            y2="22"
            stroke="#e9eef6"
            strokeWidth="2"
            strokeLinecap="round"
            transform={`rotate(${tickAngle(target) + 90} 70 70)`}
          />
          {/* baseline dot */}
          <circle
            cx="70"
            cy="18"
            r="3.5"
            fill="#93a0b4"
            transform={`rotate(${tickAngle(base) + 90} 70 70)`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-mono text-[22px] font-medium tracking-tight text-gradient-silver">
            {metric.gaia > 0 && metric.id === 'spearman' ? '+' : ''}
            <CountUp to={metric.gaia} duration={1.6} delay={0.2} />
          </div>
          <div className="text-[11px] text-fg-dim">{metric.unit}</div>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span className="text-lg font-medium text-fg">{metric.short}</span>
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full ${
            metric.direction === 'higher' ? 'bg-sky-400/15 text-sky-300' : 'bg-lime-400/15 text-lime-300'
          }`}
          title={metric.direction === 'higher' ? 'Higher is better' : 'Lower is better'}
        >
          <Dir weight="bold" className="h-3 w-3" />
        </span>
      </div>
      <span className="mt-3 rounded-full bg-lime-400/10 px-3 py-1 font-mono text-[11px] text-lime-300">
        {metric.gain} vs bicubic
      </span>
    </motion.div>
  );
};

const FEATURED = ['psnr', 'ssim', 'sam', 'spearman'];

export const ScoreRings: FC = () => (
  <div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {METRICS.filter((m) => FEATURED.includes(m.id)).map((m, i) => (
        <Gauge key={m.id} metric={m} index={i} />
      ))}
    </div>
    <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-fg-dim">
      <span className="flex items-center gap-2">
        <span className="h-1.5 w-5 rounded-full bg-lime-400" /> GaiaScale
      </span>
      <span className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-fg-muted" /> Bicubic baseline
      </span>
      <span className="flex items-center gap-2">
        <span className="h-3 w-0.5 rounded-full bg-fg" /> Target threshold
      </span>
      <span>A fuller ring is always better.</span>
    </div>
  </div>
);
