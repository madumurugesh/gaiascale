import { useMemo, useState, type FC } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowDown, ArrowUp, ArrowRight, Lightning, Function as FunctionIcon } from '@phosphor-icons/react';
import DecryptedText from '../reactbits/DecryptedText';
import { Segmented } from '../ui/Segmented';
import { METRICS, formatNum, goodness, type Direction, type MetricDef } from '../../data/metrics';

type Filter = 'all' | Direction;

const EASE = [0.22, 1, 0.36, 1] as const;

/** Horizontal "worse → better" scale with the target zone, baseline and GaiaScale markers. */
const ScaleBar: FC<{ m: MetricDef }> = ({ m }) => {
  const g = goodness(m, m.gaia);
  const b = goodness(m, m.baseline);
  const t = goodness(m, m.target.value);
  const [lo, hi] = m.direction === 'higher' ? m.domain : [m.domain[1], m.domain[0]];

  return (
    <div className="px-7 pt-10 pb-6">
      <div className="relative h-2.5 rounded-full bg-white/[0.06]">
        <motion.div
          className="absolute inset-y-0 right-0 rounded-r-full bg-lime-400/15 ring-1 ring-inset ring-lime-400/25"
          initial={{ left: '100%' }}
          animate={{ left: `${t * 100}%` }}
          transition={{ duration: 0.8, ease: EASE }}
        />
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-lime-500/25 via-lime-400/60 to-lime-300"
          initial={{ width: 0 }}
          animate={{ width: `${g * 100}%` }}
          transition={{ duration: 1, ease: EASE, delay: 0.1 }}
        />

        {/* baseline marker */}
        <motion.div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
          initial={{ left: '0%' }}
          animate={{ left: `${b * 100}%` }}
          transition={{ duration: 0.9, ease: EASE }}
        >
          <div className="h-4 w-4 rounded-full border-2 border-ink-950 bg-fg-muted" />
          <div className="absolute left-1/2 top-6 -translate-x-1/2 whitespace-nowrap text-center">
            <div className="text-[10px] text-fg-dim">Bicubic</div>
            <div className="font-mono text-[12px] text-fg-muted">{formatNum(m.baseline, m.digits)}</div>
          </div>
        </motion.div>

        {/* GaiaScale marker */}
        <motion.div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
          initial={{ left: '0%' }}
          animate={{ left: `${g * 100}%` }}
          transition={{ duration: 1, ease: EASE, delay: 0.1 }}
        >
          <div className="h-5 w-5 rounded-full border-[3px] border-ink-950 bg-lime-400 shadow-[0_0_18px_rgba(141,252,95,0.9)]" />
          <div className="absolute bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-lime-400 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-ink-950">
            {formatNum(m.gaia, m.digits)}
            {m.suffix ?? ''}
          </div>
        </motion.div>
      </div>
      <div className="mt-12 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] text-fg-dim">
        <span>{formatNum(lo, Math.min(m.digits, 4))} · worse</span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-lime-300/80">
            <span className="h-2 w-4 rounded-sm bg-lime-400/15 ring-1 ring-inset ring-lime-400/30" />
            target {m.target.op} {formatNum(m.target.value, Math.min(m.digits, 4))}
          </span>
          <span className="flex items-center gap-1">
            better · {formatNum(hi, Math.min(m.digits, 4))} <ArrowRight className="h-3 w-3" />
          </span>
        </span>
      </div>
    </div>
  );
};

const MetricDetail: FC<{ m: MetricDef }> = ({ m }) => {
  const [lens, setLens] = useState<Direction>(m.direction);
  const good = lens === m.direction;

  return (
    <motion.div
      key={m.id}
      initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -10, filter: 'blur(6px)' }}
      transition={{ duration: 0.45, ease: EASE }}
      className="flex h-full flex-col"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-4xl font-medium tracking-tight text-gradient-silver pb-[0.06em]">{m.short}</h3>
            <span
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                m.direction === 'higher' ? 'bg-sky-400/15 text-sky-300' : 'bg-lime-400/15 text-lime-300'
              }`}
            >
              {m.direction === 'higher' ? <ArrowUp weight="bold" className="h-3 w-3" /> : <ArrowDown weight="bold" className="h-3 w-3" />}
              {m.direction === 'higher' ? 'Higher is better' : 'Lower is better'}
            </span>
            {m.tag && (
              <span className="rounded-full bg-amber-400/15 px-2.5 py-1 text-[11px] font-medium text-amber-300">{m.tag}</span>
            )}
          </div>
          <p className="mt-1.5 text-sm text-fg-muted">
            {m.name} <span className="text-fg-dim">· {m.unit}</span>
          </p>
        </div>
        <div className="text-right">
          <div className="font-mono text-3xl font-medium text-gradient">
            {formatNum(m.gaia, m.digits)}
            <span className="text-lg">{m.suffix ?? ''}</span>
          </div>
          <div className="text-[11px] text-fg-dim">{m.gain}</div>
        </div>
      </div>

      <ScaleBar m={m} />

      <p className="text-pretty text-lg leading-snug text-fg">{m.meaning}</p>

      <div className="mt-5 flex items-center gap-2.5 overflow-x-auto rounded-2xl border border-white/[0.06] bg-ink-950/60 px-4 py-3">
        <FunctionIcon className="h-4 w-4 shrink-0 text-cyan-300" />
        <DecryptedText
          key={m.id}
          text={m.formula}
          animateOn="view"
          sequential
          speed={18}
          revealDirection="start"
          className="whitespace-nowrap font-mono text-[13px] text-fg-muted"
          encryptedClassName="whitespace-nowrap font-mono text-[13px] text-cyan-400/60"
          parentClassName="whitespace-nowrap"
        />
      </div>

      <div className="mt-5 rounded-2xl border border-white/[0.06] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[12px] text-fg-dim">What if the value goes…</span>
          <Segmented
            size="sm"
            value={lens}
            onChange={setLens}
            ariaLabel="Interpretation"
            options={[
              { value: 'higher', label: 'Up', icon: <ArrowUp weight="bold" className="h-3 w-3" /> },
              { value: 'lower', label: 'Down', icon: <ArrowDown weight="bold" className="h-3 w-3" /> },
            ]}
          />
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={lens}
            initial={{ opacity: 0, x: lens === 'higher' ? 12 : -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: lens === 'higher' ? -12 : 12 }}
            transition={{ duration: 0.25 }}
            className="mt-3 flex items-start gap-2.5 text-[15px] leading-relaxed text-fg-muted"
          >
            <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${good ? 'bg-lime-400' : 'bg-rose-400'}`} />
            {lens === 'higher' ? m.higherMeans : m.lowerMeans}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="mt-auto flex items-start gap-2.5 pt-6 text-[14px] text-fg-muted">
        <Lightning weight="fill" className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
        <span>{m.impact}</span>
      </div>
    </motion.div>
  );
};

export const MetricExplorer: FC = () => {
  const [filter, setFilter] = useState<Filter>('all');
  const [picked, setSelected] = useState(METRICS[0].id);

  const list = useMemo(() => METRICS.filter((m) => filter === 'all' || m.direction === filter), [filter]);
  // Fall back to the first visible metric when the filter hides the picked one.
  const selected = list.some((m) => m.id === picked) ? picked : list[0].id;

  const metric = METRICS.find((m) => m.id === selected) ?? METRICS[0];

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const idx = list.findIndex((m) => m.id === selected);
    const next = list[(idx + (e.key === 'ArrowDown' ? 1 : list.length - 1)) % list.length];
    setSelected(next.id);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
      <div className="flex flex-col gap-3 rounded-[20px] border border-white/[0.07] bg-ink-900/70 p-3">
        <Segmented
          size="sm"
          value={filter}
          onChange={setFilter}
          className="self-start"
          ariaLabel="Filter metrics"
          options={[
            { value: 'all', label: `All ${METRICS.length}` },
            { value: 'higher', label: 'Higher', icon: <ArrowUp weight="bold" className="h-3 w-3" /> },
            { value: 'lower', label: 'Lower', icon: <ArrowDown weight="bold" className="h-3 w-3" /> },
          ]}
        />
        <div role="listbox" aria-label="Metrics" tabIndex={0} onKeyDown={onKeyDown} className="flex flex-col gap-0.5 outline-none">
          <AnimatePresence initial={false}>
            {list.map((m) => {
              const active = m.id === selected;
              return (
                <motion.button
                  layout
                  key={m.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => setSelected(m.id)}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className="relative flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left"
                >
                  {active && (
                    <motion.span
                      layoutId="metric-active"
                      className="absolute inset-0 rounded-2xl bg-white/[0.07] ring-1 ring-white/10"
                      transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                    />
                  )}
                  <span
                    className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                      m.direction === 'higher' ? 'bg-sky-400/10 text-sky-300' : 'bg-lime-400/10 text-lime-300'
                    }`}
                  >
                    {m.direction === 'higher' ? <ArrowUp weight="bold" className="h-3.5 w-3.5" /> : <ArrowDown weight="bold" className="h-3.5 w-3.5" />}
                  </span>
                  <span className="relative min-w-0 flex-1">
                    <span className={`block text-[14px] font-medium ${active ? 'text-fg' : 'text-fg-muted'}`}>{m.short}</span>
                    <span className="block truncate text-[11px] text-fg-dim">{m.name}</span>
                  </span>
                  <span className={`relative font-mono text-[12px] ${active ? 'text-lime-300' : 'text-fg-dim'}`}>
                    {formatNum(m.gaia, Math.min(m.digits, 3))}
                  </span>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <div className="relative min-h-[560px] overflow-hidden rounded-[20px] border border-white/[0.07] bg-ink-900/70 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-lime-400/10 blur-3xl" />
        <AnimatePresence mode="wait">
          <MetricDetail key={metric.id} m={metric} />
        </AnimatePresence>
      </div>
    </div>
  );
};
