import { useEffect, useState, type FC } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowClockwise, FileArrowUp, FolderOpen, ShieldCheck, WarningCircle, X } from '@phosphor-icons/react';
import { Btn, Kbd } from '../ui/primitives';
import type { StudioState } from '../state/useStudio';

const STAGES = ['Reading bands', 'Tiling the scene', 'Running Gaia-HAT', 'Blending tiles', 'Re-observation check'];

/** Processing overlay: indeterminate bar, current stage and real elapsed time. */
export const Processing: FC<{ startedAt: number | null; fileName?: string }> = ({ startedAt, fileName }) => {
  const [now, setNow] = useState(() => performance.now());
  useEffect(() => {
    const t = setInterval(() => setNow(performance.now()), 100);
    return () => clearInterval(t);
  }, []);
  const elapsed = startedAt ? (now - startedAt) / 1000 : 0;
  const stage = STAGES[Math.min(STAGES.length - 1, Math.floor(elapsed / 1.4))];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="absolute inset-0 z-30 flex items-center justify-center bg-app-canvas/85 backdrop-blur-[2px]"
    >
      <div className="w-72 rounded-lg border border-app-border bg-app-panel p-4 shadow-2xl">
        <div className="flex items-center justify-between text-[13px]">
          <span className="font-semibold text-app-text">Processing</span>
          <span className="font-mono text-[12px] tabular-nums text-app-muted">{elapsed.toFixed(1)} s</span>
        </div>
        {fileName && <div className="mt-0.5 truncate text-[12px] text-app-faint">{fileName}</div>}
        <div className="relative mt-3 h-1 overflow-hidden rounded-full bg-app-raised">
          <motion.div
            className="absolute inset-y-0 w-1/3 rounded-full bg-accent"
            animate={{ left: ['-35%', '100%'] }}
            transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="mt-2.5 text-[12px] text-app-muted"
          >
            {stage}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export const EmptyCanvas: FC<{ staged: File | null; onOpen: () => void; onRun: () => void; running: boolean }> = ({
  staged,
  onOpen,
  onRun,
  running,
}) => (
  <div className="absolute inset-0 flex items-center justify-center p-6">
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex max-w-sm flex-col items-center text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-app-border bg-app-panel text-app-muted">
        <FileArrowUp className="h-6 w-6" />
      </div>
      {staged ? (
        <>
          <h2 className="mt-4 text-[15px] font-semibold text-app-text">Ready to process</h2>
          <p className="mt-1 max-w-xs truncate text-[13px] text-app-muted">{staged.name}</p>
          <Btn variant="primary" className="mt-5" onClick={onRun} disabled={running}>
            Run super-resolution
          </Btn>
          <span className="mt-2 flex items-center gap-1 text-[11px] text-app-faint">
            <Kbd>Ctrl</Kbd>
            <Kbd>Enter</Kbd>
          </span>
        </>
      ) : (
        <>
          <h2 className="mt-4 text-[15px] font-semibold text-app-text">No scene loaded</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-app-muted">
            Drop a GeoTIFF, NPZ or image anywhere on the canvas, or pick a sample from the left panel.
          </p>
          <Btn className="mt-5" onClick={onOpen} icon={<FolderOpen className="h-4 w-4" />}>
            Open file
          </Btn>
          <span className="mt-2 flex items-center gap-1 text-[11px] text-app-faint">
            <Kbd>Ctrl</Kbd>
            <Kbd>O</Kbd>
          </span>
        </>
      )}
    </motion.div>
  </div>
);

export const DropOverlay: FC = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.12 }}
    className="pointer-events-none absolute inset-3 z-40 flex items-center justify-center rounded-lg border-2 border-dashed border-accent bg-accent/[0.06]"
  >
    <span className="rounded-md bg-app-panel px-3 py-1.5 text-[13px] font-medium text-app-text shadow-lg">Drop to load</span>
  </motion.div>
);

export const ErrorBanner: FC<{ s: StudioState }> = ({ s }) => (
  <AnimatePresence>
    {s.error && (
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        className="absolute inset-x-3 top-3 z-40 flex items-center gap-2.5 rounded-md border border-red-500/30 bg-[#1d1113] px-3 py-2 text-[13px] text-red-200 shadow-lg"
      >
        <WarningCircle weight="fill" className="h-4 w-4 shrink-0 text-red-400" />
        <span className="min-w-0 flex-1 truncate">{s.error}</span>
        {s.stagedFile && (
          <Btn size="sm" variant="ghost" onClick={s.runStaged} icon={<ArrowClockwise className="h-3.5 w-3.5" />}>
            Retry
          </Btn>
        )}
        <button type="button" aria-label="Dismiss" onClick={s.dismissError} className="rounded p-1 text-red-300 hover:bg-white/5">
          <X className="h-3.5 w-3.5" />
        </button>
      </motion.div>
    )}
  </AnimatePresence>
);

export const DriftNotice: FC<{ s: StudioState }> = ({ s }) => {
  const { driftNotice, closeDriftNotice } = s;
  useEffect(() => {
    if (!driftNotice) return;
    const t = setTimeout(closeDriftNotice, 6000);
    return () => clearTimeout(t);
  }, [driftNotice, closeDriftNotice]);

  const m = s.active?.metrics;
  return (
    <AnimatePresence>
      {driftNotice && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-3 right-3 z-40 w-80 overflow-hidden rounded-lg border border-app-border bg-app-panel shadow-2xl"
        >
          <div className="flex gap-3 p-3">
            <ShieldCheck weight="fill" className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-app-text">Showing drift residue</span>
                <button type="button" aria-label="Dismiss" onClick={closeDriftNotice} className="rounded p-0.5 text-app-faint hover:text-app-text">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="mt-0.5 text-[12px] leading-relaxed text-app-muted">
                The output was downsampled 4× and subtracted from the input. Darker means closer agreement.
              </p>
              {m && (
                <div className="mt-2 flex gap-4 font-mono text-[11px] text-app-muted">
                  <span>
                    MAE <span className="text-app-text">{m.cons_mae.toFixed(6)}</span>
                  </span>
                  <span>
                    RMSE <span className="text-app-text">{m.cons_rmse.toFixed(6)}</span>
                  </span>
                </div>
              )}
            </div>
          </div>
          <motion.div
            className="h-0.5 origin-left bg-accent/70"
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: 6, ease: 'linear' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
