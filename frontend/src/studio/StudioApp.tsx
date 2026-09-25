import { useCallback, useEffect, useRef, useState, type FC } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useStudio } from './state/useStudio';
import { usePanZoom } from './state/usePanZoom';
import { LAYERS, resolveLayers } from './state/layers';
import { TopBar, StatusBar } from './parts/Bars';
import { LeftPanel } from './parts/LeftPanel';
import { Inspector } from './parts/Inspector';
import { SwipeCompare, SideBySideCompare, type Cursor } from './parts/Compare';
import { DriftNotice, DropOverlay, EmptyCanvas, ErrorBanner, Processing } from './parts/Canvas';

const ACCEPT = '.tif,.tiff,.npz,.png,.jpg,.jpeg,.webp';

/** GaiaScale Studio: the working application, separate from the marketing site. */
export const StudioApp: FC = () => {
  const s = useStudio();
  const pzA = usePanZoom();
  const pzB = usePanZoom();
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [cursor, setCursor] = useState<Cursor>(null);
  const [inspectorOpen, setInspectorOpen] = useState(true);

  const d = s.active;
  const layers = resolveLayers(d?.images ?? null, s.modality, s.showDrift);
  const size = { W: d?.output_shape[2] ?? 1, H: d?.output_shape[1] ?? 1 };
  const sideBySide = s.viewMode === 'side-by-side';
  const independent = sideBySide && !s.linked;

  const { reset: resetA } = pzA;
  const { reset: resetB } = pzB;
  useEffect(() => {
    resetA();
    resetB();
  }, [s.activeRunId, resetA, resetB]);

  const openFile = useCallback(() => fileRef.current?.click(), []);
  const zoomBy = (f: number) => {
    pzA.zoomAt(f, canvasRef.current);
    if (independent) pzB.zoomAt(f, canvasRef.current);
  };
  const fit = () => {
    pzA.reset();
    pzB.reset();
  };

  // Keyboard shortcuts (read through a ref so the listener is registered once).
  const keys = useRef({ zoomBy, fit, s, openFile });
  useEffect(() => {
    keys.current = { zoomBy, fit, s, openFile };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return;
      const k = keys.current;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        k.openFile();
      } else if (mod && e.key === 'Enter') {
        e.preventDefault();
        k.s.runStaged();
      } else if (mod || e.altKey) {
        return;
      } else if (e.key === '+' || e.key === '=') k.zoomBy(1.25);
      else if (e.key === '-' || e.key === '_') k.zoomBy(0.8);
      else if (e.key === '0') k.fit();
      else if (e.key.toLowerCase() === 's') k.s.setViewMode('split');
      else if (e.key.toLowerCase() === 'd') k.s.setViewMode('side-by-side');
      else {
        const layer = LAYERS.find((l) => l.key === e.key);
        if (layer) k.s.setModality(layer.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="flex h-[100svh] flex-col overflow-hidden bg-app-bg text-app-text">
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) s.stageFile(f);
          e.target.value = '';
        }}
      />

      <TopBar
        s={s}
        zoom={pzA.view.z}
        canFit={!!d && (pzA.view.z > 1 || pzB.view.z > 1)}
        onZoom={zoomBy}
        onFit={fit}
        inspectorOpen={inspectorOpen}
        onToggleInspector={() => setInspectorOpen((v) => !v)}
      />

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <aside className="order-2 max-h-[45svh] shrink-0 border-app-border bg-app-panel md:order-1 md:max-h-none md:w-64 md:border-r">
          <LeftPanel s={s} onOpen={openFile} />
        </aside>

        <main
          ref={canvasRef}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files?.[0];
            if (f) s.stageFile(f);
          }}
          className="relative order-1 min-h-[50svh] flex-1 overflow-hidden bg-app-canvas md:order-2 md:min-h-0"
        >
          {layers ? (
            sideBySide ? (
              <SideBySideCompare
                layers={layers}
                size={size}
                left={pzA}
                right={pzB}
                linked={s.linked}
                nearestInput={s.nearestInput}
                nearestOutput={s.nearestOutput}
                onCursor={setCursor}
              />
            ) : (
              <SwipeCompare
                layers={layers}
                size={size}
                pz={pzA}
                nearestInput={s.nearestInput}
                nearestOutput={s.nearestOutput}
                onCursor={setCursor}
              />
            )
          ) : (
            <EmptyCanvas staged={s.stagedFile} onOpen={openFile} onRun={s.runStaged} running={s.running} />
          )}

          {layers && s.stagedFile && !s.running && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-lg border border-app-border bg-app-panel py-1.5 pl-3 pr-1.5 shadow-2xl"
            >
              <span className="max-w-[200px] truncate text-[12px] text-app-muted">{s.stagedFile.name} is ready</span>
              <button
                type="button"
                onClick={s.runStaged}
                className="h-7 rounded-md bg-accent px-2.5 text-[12px] font-semibold text-app-bg hover:bg-accent-hover"
              >
                Run
              </button>
            </motion.div>
          )}

          <ErrorBanner s={s} />
          <AnimatePresence>{dragging && <DropOverlay />}</AnimatePresence>
          <AnimatePresence>{s.running && <Processing startedAt={s.runStartedAt} fileName={s.stagedFile?.name} />}</AnimatePresence>
          <DriftNotice s={s} />
        </main>

        <AnimatePresence initial={false}>
          {inspectorOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 288, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="order-3 hidden shrink-0 overflow-hidden border-l border-app-border bg-app-panel lg:block"
            >
              <div className="h-full w-72">
                <Inspector s={s} />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      <StatusBar s={s} zoom={pzA.view.z} cursor={cursor} />
    </div>
  );
};
