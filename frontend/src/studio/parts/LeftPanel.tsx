import { useState, type FC } from 'react';
import { motion } from 'motion/react';
import { FileArrowUp, Play, UploadSimple, X } from '@phosphor-icons/react';
import { Btn, Kbd, Section, Toggle } from '../ui/primitives';
import { BIOMES } from '../../data/biomes';
import { LAYERS } from '../state/layers';
import type { StudioState } from '../state/useStudio';


const kb = (b: number) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

export const LeftPanel: FC<{ s: StudioState; onOpen: () => void }> = ({ s, onOpen }) => {
  const [over, setOver] = useState(false);

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <Section title="Input">
        {s.stagedFile ? (
          <div className="flex items-center gap-2.5 rounded-md border border-app-border bg-app-raised px-2.5 py-2">
            <FileArrowUp className="h-4 w-4 shrink-0 text-app-muted" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] text-app-text">{s.stagedFile.name}</div>
              <div className="text-[11px] text-app-faint">{kb(s.stagedFile.size)}</div>
            </div>
            <button
              type="button"
              aria-label="Remove file"
              onClick={s.clearStaged}
              disabled={s.running}
              className="rounded p-1 text-app-faint hover:bg-app-hover hover:text-app-text disabled:opacity-40"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpen}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) s.stageFile(f);
            }}
            className={`flex w-full flex-col items-center gap-1 rounded-md border border-dashed px-3 py-4 text-center transition-colors ${
              over ? 'border-accent bg-accent/[0.06]' : 'border-app-border-strong hover:border-app-muted hover:bg-app-hover'
            }`}
          >
            <UploadSimple className="h-4 w-4 text-app-muted" />
            <span className="text-[13px] text-app-text">Choose or drop a file</span>
            <span className="text-[11px] text-app-faint">GeoTIFF, NPZ, PNG, JPG</span>
          </button>
        )}

        <Btn
          variant="primary"
          className="mt-2.5 w-full"
          onClick={s.runStaged}
          disabled={!s.stagedFile || s.running}
          icon={<Play weight="fill" className="h-3.5 w-3.5" />}
        >
          {s.running ? 'Processing…' : 'Run super-resolution'}
        </Btn>
        <div className="mt-1.5 flex items-center justify-center gap-1 text-[11px] text-app-faint">
          <Kbd>Ctrl</Kbd>
          <Kbd>Enter</Kbd>
        </div>
      </Section>

      <Section title="Samples" aside={<span className="text-[11px] text-app-faint">RGB, NIR estimated</span>}>
        <div className="-mx-1 flex flex-col">
          {BIOMES.slice(0, 5).map((b) => (
            <button
              key={b.id}
              type="button"
              disabled={s.running}
              onClick={() => s.runSample(b.lr, b.id)}
              className="group flex items-center gap-2.5 rounded-md px-1 py-1 text-left transition-colors hover:bg-app-hover disabled:opacity-40"
            >
              <img src={b.lr} alt="" className="h-7 w-7 rounded-[4px] object-cover pixelated" />
              <span className="flex-1 text-[13px] text-app-text">{b.label}</span>
              <Play weight="fill" className="h-3 w-3 text-app-faint opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          ))}
        </div>
      </Section>

      <Section title="Layer">
        <div role="radiogroup" aria-label="Spectral layer" className="-mx-1 flex flex-col">
          {LAYERS.map((l) => {
            const active = s.modality === l.id && !s.showDrift;
            return (
              <button
                key={l.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => s.setModality(l.id)}
                className={`relative flex items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors ${
                  active ? 'text-app-text' : 'text-app-muted hover:bg-app-hover hover:text-app-text'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="layer-active"
                    className="absolute inset-0 rounded-md bg-app-active"
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                  />
                )}
                <span className="relative h-2.5 w-5 shrink-0 rounded-[3px]" style={{ background: l.swatch }} />
                <span className="relative flex-1 text-[13px]">{l.label}</span>
                <span className="relative text-[11px] text-app-faint">{l.hint}</span>
                <span className="relative ml-1 hidden xl:inline">
                  <Kbd>{l.key}</Kbd>
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-2 border-t border-app-border pt-2">
          <Toggle
            checked={s.showDrift}
            onChange={s.toggleDrift}
            label="Drift residue"
            hint="Output downsampled 4× minus input"
          />
        </div>
      </Section>

      <Section title="Rendering">
        <div className="-mx-1">
          <Toggle checked={s.nearestInput} onChange={s.toggleNearestInput} label="Show 10 m pixels" hint="Nearest-neighbour input" />
          <Toggle checked={s.nearestOutput} onChange={s.toggleNearestOutput} label="Show 2.5 m pixels" hint="Nearest-neighbour output" />
        </div>
      </Section>
    </div>
  );
};
