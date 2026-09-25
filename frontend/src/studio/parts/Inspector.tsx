import type { FC } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { DownloadSimple, FileImage, Info, MapTrifold, Package } from '@phosphor-icons/react';
import { KeyValue, Section } from '../ui/primitives';
import type { StudioState } from '../state/useStudio';

const time = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

export const Inspector: FC<{ s: StudioState }> = ({ s }) => {
  const d = s.active;

  if (!d) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
        <Info className="h-5 w-5 text-app-faint" />
        <p className="text-[13px] text-app-muted">Scene details, quality checks and exports appear here after a run.</p>
      </div>
    );
  }

  const m = d.metrics;
  const hasTruth = m.ergas !== undefined;
  const [, inH, inW] = d.input_shape;
  const [, outH, outW] = d.output_shape;

  const exports = [
    { label: 'GeoTIFF', desc: '4-band, georeferenced', ext: '.tif', icon: MapTrifold, onClick: s.exportGeoTiff },
    { label: 'Current view', desc: 'Rendered layer', ext: '.png', icon: FileImage, onClick: s.exportPng },
    { label: 'Tensor', desc: 'float32 array', ext: '.npz', icon: Package, onClick: s.exportNpz },
  ];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={s.activeRunId}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="flex h-full flex-col overflow-y-auto"
      >
        <Section title="Scene">
          <KeyValue k="File" v={d.meta.filename ?? 'Untitled'} mono={false} />
          <KeyValue k="Source" v={d.meta.is_geotiff ? 'GeoTIFF' : 'Image'} mono={false} />
          <KeyValue k="CRS" v={d.meta.crs ?? 'None'} />
          <KeyValue k="Input" v={`${inW} × ${inH} px · 10 m`} />
          <KeyValue k="Output" v={`${outW} × ${outH} px · 2.5 m`} />
          <KeyValue k="Model" v="Gaia-HAT" mono={false} />
        </Section>

        <Section title="Quality">
          <KeyValue k="Latency" v={`${(d.latency_ms / 1000).toFixed(2)} s`} />
          <KeyValue k="Drift MAE" v={m.cons_mae.toFixed(6)} />
          <KeyValue k="Drift RMSE" v={m.cons_rmse.toFixed(6)} />
          {hasTruth ? (
            <>
              <KeyValue k="PSNR" v={`${m.psnr.toFixed(2)} dB`} tone="text-accent" />
              <KeyValue k="SSIM" v={m.ssim.toFixed(4)} />
              <KeyValue k="SAM" v={`${m.sam_deg.toFixed(2)}°`} />
              <KeyValue k="ERGAS" v={m.ergas?.toFixed(2)} />
            </>
          ) : (
            <p className="mt-1.5 text-[11px] leading-relaxed text-app-faint">
              PSNR, SSIM and SAM need a 2.5 m reference. Upload an NPZ with an <span className="font-mono">hr</span> array to score a
              scene.
            </p>
          )}
        </Section>

        <Section title="Export">
          <div className="-mx-1 flex flex-col">
            {exports.map((e) => (
              <button
                key={e.ext}
                type="button"
                onClick={e.onClick}
                className="group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-app-hover"
              >
                <e.icon className="h-4 w-4 text-app-muted" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] text-app-text">{e.label}</span>
                  <span className="block text-[11px] text-app-faint">{e.desc}</span>
                </span>
                <span className="font-mono text-[11px] text-app-faint">{e.ext}</span>
                <DownloadSimple className="h-3.5 w-3.5 text-app-faint transition-colors group-hover:text-app-text" />
              </button>
            ))}
          </div>
        </Section>

        <Section title="History" aside={<span className="text-[11px] text-app-faint">{s.runs.length}</span>}>
          <div className="-mx-1 flex flex-col">
            {s.runs.map((r) => {
              const active = r.id === s.activeRunId;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => s.selectRun(r.id)}
                  className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors ${
                    active ? 'bg-app-active' : 'hover:bg-app-hover'
                  }`}
                >
                  <img src={r.data.images.sr_rgb} alt="" className="h-7 w-7 rounded-[4px] object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] text-app-text">{r.data.meta.filename ?? 'Untitled'}</span>
                    <span className="block text-[11px] text-app-faint">{time(r.finishedAt)}</span>
                  </span>
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                </button>
              );
            })}
          </div>
        </Section>
      </motion.div>
    </AnimatePresence>
  );
};
