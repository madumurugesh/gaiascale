import { useState, type FC } from 'react';
import { motion } from 'motion/react';
import { Medal } from '@phosphor-icons/react';
import {
  BENCHMARK,
  BENCHMARK_AXES,
  formatNum,
  normalizedScore,
  type BenchmarkKey,
} from '../../data/metrics';

const SIZE = 420;
const CENTER = SIZE / 2;
const RADIUS = 150;

const point = (axis: number, r: number) => {
  const angle = (Math.PI * 2 * axis) / BENCHMARK_AXES.length - Math.PI / 2;
  return [CENTER + Math.cos(angle) * r * RADIUS, CENTER + Math.sin(angle) * r * RADIUS] as const;
};

/** Radar of min-max normalised scores (outer edge = best model on that axis). */
const Radar: FC<{ focus: string | null; onFocus: (id: string | null) => void }> = ({ focus, onFocus }) => {
  const [hoverAxis, setHoverAxis] = useState<number | null>(null);

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[460px] overflow-visible">
      {[0.25, 0.5, 0.75, 1].map((r) => (
        <polygon
          key={r}
          points={BENCHMARK_AXES.map((_, i) => point(i, r).join(',')).join(' ')}
          fill={r === 1 ? 'rgba(255,255,255,0.015)' : 'none'}
          stroke="rgba(255,255,255,0.07)"
        />
      ))}
      {BENCHMARK_AXES.map((a, i) => {
        const [x, y] = point(i, 1);
        const [lx, ly] = point(i, 1.2);
        return (
          <g key={a.key} onMouseEnter={() => setHoverAxis(i)} onMouseLeave={() => setHoverAxis(null)}>
            <line x1={CENTER} y1={CENTER} x2={x} y2={y} stroke={hoverAxis === i ? 'rgba(62,224,232,0.6)' : 'rgba(255,255,255,0.07)'} />
            <text
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              className={`cursor-default text-[12px] transition-colors ${hoverAxis === i ? 'fill-fg' : 'fill-fg-dim'}`}
            >
              {a.label} {a.direction === 'higher' ? '↑' : '↓'}
            </text>
          </g>
        );
      })}

      {[...BENCHMARK].reverse().map((m, idx) => {
        const pts = BENCHMARK_AXES.map((a, i) => point(i, normalizedScore(a.key, m[a.key], a.direction)));
        const dimmed = focus !== null && focus !== m.id;
        return (
          <motion.g
            key={m.id}
            initial={{ opacity: 0, scale: 0.2 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 1, delay: 0.15 * idx, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
            onMouseEnter={() => onFocus(m.id)}
            onMouseLeave={() => onFocus(null)}
          >
            <polygon
              points={pts.map((p) => p.join(',')).join(' ')}
              fill={m.color}
              fillOpacity={dimmed ? 0.02 : m.flagship ? 0.2 : 0.08}
              stroke={m.color}
              strokeOpacity={dimmed ? 0.15 : 1}
              strokeWidth={m.flagship ? 2.5 : 1.5}
              strokeLinejoin="round"
              className="cursor-pointer transition-all duration-300"
            />
            {pts.map(([x, y], i) => (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={focus === m.id || (focus === null && m.flagship) ? 4 : 2.5}
                fill={m.color}
                opacity={dimmed ? 0.15 : 1}
                className="transition-all duration-300"
              />
            ))}
          </motion.g>
        );
      })}

      {hoverAxis !== null && (
        <g pointerEvents="none">
          {BENCHMARK.map((m) => {
            const a = BENCHMARK_AXES[hoverAxis];
            const [x, y] = point(hoverAxis, normalizedScore(a.key, m[a.key], a.direction));
            return (
              <text key={m.id} x={x + 8} y={y - 8} className="fill-fg font-mono text-[10px]" style={{ fill: m.color }}>
                {formatNum(m[a.key], a.digits)}
              </text>
            );
          })}
        </g>
      )}
    </svg>
  );
};

const Leaderboard: FC<{ focus: string | null; onFocus: (id: string | null) => void }> = ({ focus, onFocus }) => {
  const [metric, setMetric] = useState<BenchmarkKey>('sam');
  const axis = BENCHMARK_AXES.find((a) => a.key === metric)!;
  const ranked = [...BENCHMARK].sort((a, b) =>
    axis.direction === 'higher' ? b[metric] - a[metric] : a[metric] - b[metric]
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap gap-1.5">
        {BENCHMARK_AXES.map((a) => (
          <button
            key={a.key}
            type="button"
            onClick={() => setMetric(a.key)}
            className={`relative rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
              metric === a.key ? 'text-ink-950' : 'text-fg-muted hover:text-fg bg-white/[0.04]'
            }`}
          >
            {metric === a.key && (
              <motion.span
                layoutId="lb-metric"
                className="absolute inset-0 rounded-full bg-fg"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative">
              {a.label} {a.direction === 'higher' ? '↑' : '↓'}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-2.5">
        {ranked.map((m, rank) => {
          const score = normalizedScore(metric, m[metric], axis.direction);
          const dimmed = focus !== null && focus !== m.id;
          return (
            <motion.div
              layout
              key={m.id}
              transition={{ type: 'spring', stiffness: 380, damping: 34 }}
              onMouseEnter={() => onFocus(m.id)}
              onMouseLeave={() => onFocus(null)}
              className={`group rounded-2xl border px-4 py-3 transition-all duration-300 ${
                m.flagship ? 'border-lime-400/25 bg-lime-400/[0.04]' : 'border-white/[0.06] bg-white/[0.02]'
              } ${dimmed ? 'opacity-40' : ''}`}
            >
              <div className="flex items-center gap-3">
                <span className="w-4 font-mono text-[12px] text-fg-dim">{rank + 1}</span>
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: m.color }} />
                <span className="flex-1 truncate text-[14px] font-medium text-fg">
                  {m.name}
                  <span className="ml-2 hidden text-[11px] font-normal text-fg-dim sm:inline">{m.role}</span>
                </span>
                {rank === 0 && <Medal weight="fill" className="h-4 w-4 text-amber-300" />}
                <span className="font-mono text-[13px] text-fg">
                  {formatNum(m[metric], axis.digits)}
                  {axis.suffix ?? ''}
                </span>
              </div>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: m.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${score * 100}%` }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
      <p className="mt-auto pt-5 text-[11px] text-fg-dim">
        Bar length is relative to the best and worst model on this metric.
      </p>
    </div>
  );
};

export const ModelComparison: FC = () => {
  const [focus, setFocus] = useState<string | null>(null);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <div className="flex flex-col items-center rounded-[20px] border border-white/[0.07] bg-ink-900/70 p-6 sm:p-8">
        <Radar focus={focus} onFocus={setFocus} />
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {BENCHMARK.map((m) => (
            <button
              key={m.id}
              type="button"
              onMouseEnter={() => setFocus(m.id)}
              onMouseLeave={() => setFocus(null)}
              onFocus={() => setFocus(m.id)}
              onBlur={() => setFocus(null)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] transition-all ${
                focus === m.id ? 'border-white/25 bg-white/[0.06] text-fg' : 'border-white/[0.07] text-fg-muted'
              }`}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: m.color }} />
              {m.name}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-[20px] border border-white/[0.07] bg-ink-900/70 p-6 sm:p-8">
        <Leaderboard focus={focus} onFocus={setFocus} />
      </div>
    </div>
  );
};
