import type { FC } from 'react';
import { BookOpen, CheckCircle, Cpu, Stack, ShieldCheck, Sparkle, X } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: FC<ArchitectureModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ type: 'spring', stiffness: 340, damping: 30 }}
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-6"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-50 border border-brand-200 text-brand-600">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                GaiaScale Architecture & System Specifications
              </h2>
              <p className="text-xs text-slate-500">
                NTRO PS-26142 &bull; Physics-Consistent Sovereign Satellite Super-Resolution
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content sections */}
        <div className="space-y-4 text-xs text-slate-700">
          {/* 1. Problem Statement */}
          <div className="rounded-md border border-brand-200 bg-brand-50/40 p-4 space-y-2">
            <h3 className="text-sm font-bold text-brand-950 flex items-center gap-1.5">
              <Sparkle className="h-4 w-4 text-brand-600" />
              <span>Mission Objective (NTRO PS-26142)</span>
            </h3>
            <p className="leading-relaxed text-slate-700">
              Super-resolve Sentinel-2 MSI 10 m multispectral imagery by 4&times; to 2.5 m Ground Sample Distance (GSD), while preserving spectral signatures and radiometric fidelity for defense intelligence, agriculture, and land-use mapping.
            </p>
          </div>

          {/* 2. Multispectral Band Processing */}
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4 space-y-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Stack className="h-4 w-4 text-brand-600" />
              <span>4-Band Multispectral Pipeline</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
              <div className="rounded-lg bg-white p-2.5 border border-slate-200">
                <span className="font-bold text-red-600 block">Band 4 (Red)</span>
                <span className="text-slate-500">665 nm &bull; 10m &rarr; 2.5m</span>
              </div>
              <div className="rounded-lg bg-white p-2.5 border border-slate-200">
                <span className="font-bold text-earth-600 block">Band 3 (Green)</span>
                <span className="text-slate-500">560 nm &bull; 10m &rarr; 2.5m</span>
              </div>
              <div className="rounded-lg bg-white p-2.5 border border-slate-200">
                <span className="font-bold text-blue-600 block">Band 2 (Blue)</span>
                <span className="text-slate-500">490 nm &bull; 10m &rarr; 2.5m</span>
              </div>
              <div className="rounded-lg bg-white p-2.5 border border-slate-200">
                <span className="font-bold text-purple-600 block">Band 8 (NIR)</span>
                <span className="text-slate-500">842 nm &bull; 10m &rarr; 2.5m</span>
              </div>
            </div>
          </div>

          {/* 3. Flagship Model Architecture */}
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4 space-y-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Cpu className="h-4 w-4 text-brand-600" />
              <span>Flagship Architecture: Gaia-HAT</span>
            </h3>
            <p className="leading-relaxed text-slate-600">
              The Hybrid Attention Transformer (HAT) integrates overlapping cross-attention blocks with channel attention.
              By activating both local and non-local transformer receptive fields, it reconstructs continuous features such as road networks, airstrips, and parcel boundaries without boundary seam artifacts.
            </p>
            <div className="flex flex-wrap gap-2 pt-1 font-mono text-[11px]">
              <span className="rounded bg-white px-2 py-0.5 border border-slate-200 text-slate-700">Embedding Dim: 96</span>
              <span className="rounded bg-white px-2 py-0.5 border border-slate-200 text-slate-700">Depths: (4, 4, 4, 4)</span>
              <span className="rounded bg-white px-2 py-0.5 border border-slate-200 text-slate-700">Heads: (6, 6, 6, 6)</span>
              <span className="rounded bg-white px-2 py-0.5 border border-slate-200 text-slate-700">Params: 9.6M</span>
            </div>
          </div>

          {/* 4. Physical Consistency */}
          <div className="rounded-md border border-earth-200 bg-earth-50/40 p-4 space-y-2">
            <h3 className="text-sm font-bold text-earth-950 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-earth-600" />
              <span>Iterative Back-Projection (Physical Consistency Constraint)</span>
            </h3>
            <p className="leading-relaxed text-slate-600">
              Mathematically enforces sensor consistency by projecting residual errors back onto the super-resolved tensor:
              <code className="mx-1 px-1 py-0.5 rounded bg-white text-earth-900 font-mono text-[10px] border border-earth-200">
                downsample_4x(SR) == LR
              </code>.
              Enforces measurable sensor consistency between the super-resolved output and the original observation.
            </p>
          </div>

          {/* 5. Geospatial Output Pipeline */}
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4 space-y-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-brand-600" />
              <span>Fullstack GeoTIFF & Telemetry Export</span>
            </h3>
            <p className="leading-relaxed text-slate-600">
              Exports Cloud-Optimized GeoTIFFs (COG) with native UTM/EPSG projection metadata and affine matrix coordinates divided by 4, directly ready for ArcGIS, QGIS, and tactical geospatial pipelines.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
          <span>GaiaScale &bull; Sovereign Geospatial Architecture</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 font-semibold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
