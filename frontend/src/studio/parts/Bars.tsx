import { useEffect, useRef, useState, type FC } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowsIn,
  CaretRight,
  Columns,
  Keyboard,
  LinkSimple,
  LinkBreak,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  SidebarSimple,
  SplitHorizontal,
} from '@phosphor-icons/react';
import logo from '/logo.webp';
import { IconBtn, Kbd, Tabs } from '../ui/primitives';
import { MAX_ZOOM } from '../state/usePanZoom';
import type { StudioState } from '../state/useStudio';
import type { ViewMode } from '../../types/api';
import type { Cursor } from './Compare';

const SHORTCUTS: [string[], string][] = [
  [['Ctrl', 'O'], 'Open file'],
  [['Ctrl', 'Enter'], 'Run super-resolution'],
  [['1-5'], 'Switch layer'],
  [['S'], 'Swipe view'],
  [['D'], 'Side-by-side view'],
  [['+', '−'], 'Zoom in / out'],
  [['0'], 'Fit to view'],
  [['Double-click'], 'Zoom to point'],
];

const Shortcuts: FC = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <IconBtn label="Keyboard shortcuts" active={open} onClick={() => setOpen((v) => !v)}>
        <Keyboard className="h-4 w-4" />
      </IconBtn>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-9 z-50 w-64 rounded-lg border border-app-border bg-app-panel p-2 shadow-2xl"
          >
            <div className="px-1.5 pb-1.5 text-[12px] font-semibold text-app-text">Keyboard shortcuts</div>
            {SHORTCUTS.map(([keys, desc]) => (
              <div key={desc} className="flex items-center justify-between rounded px-1.5 py-1 text-[12px] text-app-muted">
                {desc}
                <span className="flex gap-1">
                  {keys.map((k) => (
                    <Kbd key={k}>{k}</Kbd>
                  ))}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface TopBarProps {
  s: StudioState;
  zoom: number;
  canFit: boolean;
  onZoom: (factor: number) => void;
  onFit: () => void;
  inspectorOpen: boolean;
  onToggleInspector: () => void;
}

export const TopBar: FC<TopBarProps> = ({ s, zoom, canFit, onZoom, onFit, inspectorOpen, onToggleInspector }) => {
  const has = !!s.active;
  return (
    <header className="flex h-11 shrink-0 items-center gap-3 border-b border-app-border bg-app-panel px-3">
      <a href="/" className="flex items-center gap-2 rounded-md pr-1 text-[13px] font-semibold text-app-text" title="GaiaScale website">
        <img src={logo} alt="" className="h-5 w-5" />
        GaiaScale
      </a>
      <span className="text-app-faint">/</span>
      <span className="text-[13px] text-app-muted">Studio</span>
      {has && (
        <>
          <CaretRight className="h-3 w-3 text-app-faint" />
          <span className="max-w-[220px] truncate text-[13px] text-app-text">{s.active?.meta.filename}</span>
        </>
      )}

      <div className="ml-auto flex items-center gap-2">
        <Tabs<ViewMode>
          label="View"
          value={s.viewMode}
          onChange={s.setViewMode}
          options={[
            { value: 'split', label: 'Swipe', icon: <SplitHorizontal className="h-3.5 w-3.5" />, hint: 'Swipe (S)' },
            { value: 'side-by-side', label: 'Side by side', icon: <Columns className="h-3.5 w-3.5" />, hint: 'Side by side (D)' },
          ]}
        />
        <IconBtn
          label={s.linked ? 'Viewports linked' : 'Viewports independent'}
          active={s.linked && s.viewMode === 'side-by-side'}
          disabled={s.viewMode !== 'side-by-side'}
          onClick={s.toggleLinked}
        >
          {s.linked ? <LinkSimple className="h-4 w-4" /> : <LinkBreak className="h-4 w-4" />}
        </IconBtn>

        <div className="mx-1 h-5 w-px bg-app-border" />

        <IconBtn label="Zoom out (−)" disabled={!has || zoom <= 1} onClick={() => onZoom(0.8)}>
          <MagnifyingGlassMinus className="h-4 w-4" />
        </IconBtn>
        <span className="w-11 text-center font-mono text-[12px] tabular-nums text-app-muted">{Math.round(zoom * 100)}%</span>
        <IconBtn label="Zoom in (+)" disabled={!has || zoom >= MAX_ZOOM} onClick={() => onZoom(1.25)}>
          <MagnifyingGlassPlus className="h-4 w-4" />
        </IconBtn>
        <IconBtn label="Fit to view (0)" disabled={!canFit} onClick={onFit}>
          <ArrowsIn className="h-4 w-4" />
        </IconBtn>

        <div className="mx-1 h-5 w-px bg-app-border" />
        <Shortcuts />
        <IconBtn label={inspectorOpen ? 'Hide details panel' : 'Show details panel'} active={inspectorOpen} onClick={onToggleInspector}>
          <SidebarSimple className="h-4 w-4 -scale-x-100" />
        </IconBtn>
      </div>
    </header>
  );
};

export const StatusBar: FC<{ s: StudioState; zoom: number; cursor: Cursor }> = ({ s, zoom, cursor }) => {
  const h = s.health;
  const d = s.active;
  return (
    <footer className="flex h-7 shrink-0 items-center gap-4 border-t border-app-border bg-app-panel px-3 font-mono text-[11px] text-app-faint">
      <span className="flex items-center gap-1.5">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            h.state === 'online' ? 'bg-accent' : h.state === 'offline' ? 'bg-red-400' : 'bg-amber-400 animate-pulse'
          }`}
        />
        {h.state === 'online' ? `Backend online · ${h.device}` : h.state === 'offline' ? 'Backend offline' : 'Connecting'}
      </span>
      {s.running && <span className="text-app-muted">Processing</span>}
      <span className="ml-auto flex items-center gap-4">
        {cursor && d && (
          <span className="text-app-muted">
            x {cursor.x}, y {cursor.y}
            <span className="text-app-faint"> · input {Math.floor(cursor.x / 4)}, {Math.floor(cursor.y / 4)}</span>
          </span>
        )}
        {d && <span>{`${d.output_shape[2]} × ${d.output_shape[1]} px`}</span>}
        {d?.meta.crs && <span className="hidden md:inline">{d.meta.crs}</span>}
        <span>{Math.round(zoom * 100)}%</span>
      </span>
    </footer>
  );
};
