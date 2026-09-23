import { useState, useEffect, useRef, type FC } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  ChartBar,
  Plant,
  Tree,
  Grains,
  Mountains,
  Sun,
  Cactus,
  Leaf,
  Waves,
  CaretDown,
  Check,
  UploadSimple,
  Lightning,
  DownloadSimple,
  Medal,
  WarningCircle,
  type Icon,
} from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { SplitSlider } from './SplitSlider';
import { HeroBackground } from './HeroBackground';
import type { BenchmarkRow } from '../types/api';
import { fetchBenchmark } from '../services/api';
import starlinkIllustration from '../assets/illustrations/starlink.svg';
import uploadIllustration from '../assets/illustrations/upload-dropzone.svg';

import agricultureLr from '../assets/presets/Landcover-785992_10m.png';
import agricultureSr from '../assets/presets/Landcover-785992_enhanced_2.5m.png';
import farmlandLr from '../assets/presets/Landcover-1339025_10m.png';
import farmlandSr from '../assets/presets/Landcover-1339025_enhanced_2.5m.png';
import savannaLr from '../assets/presets/Landcover-111570_10m.png';
import savannaSr from '../assets/presets/Landcover-111570_enhanced_2.5m.png';
import woodlandLr from '../assets/presets/Landcover-536622_10m.png';
import woodlandSr from '../assets/presets/Landcover-536622_enhanced_2.5m.png';
import highlandsLr from '../assets/presets/Landcover-613267_10m.png';
import highlandsSr from '../assets/presets/Landcover-613267_enhanced_2.5m.png';
import shrublandLr from '../assets/presets/Landcover-755082_10m.png';
import shrublandSr from '../assets/presets/Landcover-755082_enhanced_2.5m.png';
import desertLr from '../assets/presets/Landcover-817664_10m.png';
import desertSr from '../assets/presets/Landcover-817664_enhanced_2.5m.png';
import coastalLr from '../assets/presets/Landcover-1105538_10m.png';
import coastalSr from '../assets/presets/Landcover-1105538_enhanced_2.5m.png';

interface LandingPageProps {
  onNavigateToStudio: () => void;
  onNavigateToMetrics: () => void;
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

interface BiomePreset {
  id: string;
  label: string;
  icon: Icon;
  lrImage: string;
  srImage: string;
}

const BIOMES: BiomePreset[] = [
  { id: 'Landcover-785992', label: 'Agriculture', icon: Plant, lrImage: agricultureLr, srImage: agricultureSr },
  { id: 'Landcover-1339025', label: 'Farmland', icon: Grains, lrImage: farmlandLr, srImage: farmlandSr },
  { id: 'Landcover-111570', label: 'Savanna', icon: Sun, lrImage: savannaLr, srImage: savannaSr },
  { id: 'Landcover-536622', label: 'Woodland', icon: Tree, lrImage: woodlandLr, srImage: woodlandSr },
  { id: 'Landcover-613267', label: 'Highlands', icon: Mountains, lrImage: highlandsLr, srImage: highlandsSr },
  { id: 'Landcover-755082', label: 'Shrubland', icon: Leaf, lrImage: shrublandLr, srImage: shrublandSr },
  { id: 'Landcover-817664', label: 'Desert', icon: Cactus, lrImage: desertLr, srImage: desertSr },
  { id: 'Landcover-1105538', label: 'Coastal Waters', icon: Waves, lrImage: coastalLr, srImage: coastalSr },
];

export const LandingPage: FC<LandingPageProps> = ({
  onNavigateToStudio,
  onNavigateToMetrics,
}) => {
  const [selectedBiomeId, setSelectedBiomeId] = useState<string>(BIOMES[0].id);
  const [isBiomeOpen, setIsBiomeOpen] = useState<boolean>(false);
  const biomeRef = useRef<HTMLDivElement>(null);

  const selectedBiome = BIOMES.find((b) => b.id === selectedBiomeId) || BIOMES[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (biomeRef.current && !biomeRef.current.contains(e.target as Node)) {
        setIsBiomeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [benchmark, setBenchmark] = useState<BenchmarkRow[]>([]);
  const [benchmarkLoading, setBenchmarkLoading] = useState<boolean>(false);
  const [benchmarkError, setBenchmarkError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    const loadBenchmark = async () => {
      setBenchmarkLoading(true);
      try {
        const res = await fetchBenchmark();
        if (!ignore) {
          setBenchmark(res.benchmark);
          setBenchmarkError(null);
        }
      } catch (err: any) {
        if (!ignore) setBenchmarkError(err.message || 'Failed to fetch benchmark');
      } finally {
        if (!ignore) setBenchmarkLoading(false);
      }
    };
    loadBenchmark();
    return () => {
      ignore = true;
    };
  }, []);

  const leftImage = selectedBiome.lrImage;
  const rightImage = selectedBiome.srImage;

  const flagshipRow =
    benchmark.find((r) => r.model.includes('HAT') && r.model.includes('IBP')) ||
    benchmark.find((r) => r.model.includes('HAT')) ||
    null;

  const highlightStats = flagshipRow
    ? [
        { label: 'Peak fidelity (PSNR)', value: `${flagshipRow.psnr.toFixed(2)} dB` },
        { label: 'Structural similarity (SSIM)', value: flagshipRow.ssim.toFixed(4) },
        { label: 'Spectral angle (SAM)', value: `${flagshipRow.sam_deg.toFixed(2)}°` },
        { label: 'Downsample drift (MAE)', value: flagshipRow.cons_rmse.toFixed(6) },
      ]
    : [];

  const steps = [
    { icon: UploadSimple, title: 'Upload', body: 'Drop a GeoTIFF scene or pick a preset.' },
    { icon: Lightning, title: 'Enhance', body: 'Gaia-HAT runs 4× super-resolution.' },
    { icon: DownloadSimple, title: 'Export', body: 'Download a georeferenced 2.5 m GeoTIFF.' },
  ];

  return (
    <div className="pb-20">
      {/* Hero - asymmetric split, the preview IS half the layout */}
      <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <HeroBackground />
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 pt-10 sm:pt-14 pb-14 items-center max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="lg:col-span-5 space-y-6 px-4 lg:px-0"
        >

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.08]">
            Pixels, resolved into clarity.
          </h1>

          <p className="text-base text-slate-600 leading-relaxed max-w-md">
            GaiaScale satellite super-resolution that transforms freely available Sentinel-2 10&nbsp;m imagery into 2.5&nbsp;m clarity, with physics-backed spectral fidelity.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onNavigateToStudio}
              className="flex items-center gap-2 rounded-md bg-brand-600 hover:bg-brand-500 text-white px-5 py-2.5 text-sm font-semibold transition-colors"
            >
              <span>Try Now</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onNavigateToMetrics}
              className="flex items-center gap-2 rounded-md border border-slate-300 hover:border-slate-400 text-slate-700 px-5 py-2.5 text-sm font-semibold transition-colors"
            >
              <ChartBar className="h-4 w-4" />
              <span>Metrics guide</span>
            </button>
          </div>
        </motion.div>

        {/* The scanner, front and center in the hero itself */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
          className="lg:col-span-7 px-4 lg:px-0"
        >
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-4 py-3 border-b border-slate-200 bg-slate-50">
              <span className="text-xs font-semibold text-slate-700">
                Preview - Sentinel-2 input vs. GaiaScale-HAT enhanced output
              </span>
              <div className="relative self-start sm:self-auto" ref={biomeRef}>
                <button
                  type="button"
                  onClick={() => setIsBiomeOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-md border border-slate-200 bg-white pl-2.5 pr-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <selectedBiome.icon className="h-3.5 w-3.5 text-brand-600" />
                  <span>{selectedBiome.label}</span>
                  <CaretDown
                    className={`h-3 w-3 text-slate-400 transition-transform ${
                      isBiomeOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isBiomeOpen && (
                  <div className="absolute top-full right-0 mt-1 w-48 rounded-lg border border-slate-200 bg-white p-1 shadow-xl z-50 space-y-0.5 animate-fade-in">
                    {BIOMES.map((b) => {
                      const isActive = selectedBiomeId === b.id;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            setSelectedBiomeId(b.id);
                            setIsBiomeOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left text-xs transition-colors ${
                            isActive
                              ? 'bg-brand-50 text-brand-950 font-semibold border border-brand-200/80'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <b.icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                          <span className="flex-1 truncate">{b.label}</span>
                          {isActive && <Check className="h-3 w-3 text-brand-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="p-3 sm:p-4 h-[360px] sm:h-[420px] lg:h-[460px]">
              <SplitSlider
                leftImage={leftImage}
                rightImage={rightImage}
                leftLabel="INPUT: Sentinel-2 (10 m)"
                rightLabel="ENHANCED: GaiaScale-HAT (2.5 m)"
              />
            </div>
          </div>
        </motion.div>
        </section>
      </div>

      {/* Mission - illustrated */}
      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        variants={fadeUp}
        className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center max-w-6xl mx-auto px-4 py-16"
      >
        <div className="lg:col-span-5 lg:order-2">
          <img src={starlinkIllustration} alt="" className="w-full max-w-sm mx-auto" />
        </div>
        <div className="lg:col-span-7 lg:order-1 space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Sovereign imagery, without the resolution tax
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed max-w-lg">
            Commercial 2.5&nbsp;m imagery is expensive and slow to procure. GaiaScale takes
            freely available Sentinel-2 data and reconstructs it to matching resolution on
            demand - no tasking, no licensing delay, no compromise on trust.
          </p>
        </div>
      </motion.section>

      {/* Benchmarks - flagship snapshot plus the full comparison matrix, always visible */}
      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
        variants={stagger}
        className="border-t border-slate-200"
      >
        <div className="max-w-5xl mx-auto px-4 py-16">
          <motion.div variants={fadeUp} className="max-w-2xl">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-brand-700">
              Benchmarks
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 mt-2">
              Measured, not claimed
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed mt-2">
              Gaia-HAT pairs channel attention with overlapping-window self-attention to capture long-range
              geometric context - roads, runways, field boundaries - while keeping spectral purity across all
              4 bands. Scores below are evaluated across thousands of real Sentinel-2 (10&nbsp;m) scenes
              against Airbus SPOT-6/7 (2.5&nbsp;m) ground truth.
            </p>
          </motion.div>

          {benchmarkLoading ? (
            <motion.div variants={fadeUp} className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-brand-500 border-t-transparent"></div>
              <p className="text-xs text-slate-500">Loading master benchmark telemetry...</p>
            </motion.div>
          ) : benchmarkError ? (
            <motion.div variants={fadeUp} className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-xs text-red-700 flex items-center gap-2">
              <WarningCircle className="h-4 w-4 shrink-0" />
              <span>{benchmarkError}</span>
            </motion.div>
          ) : (
            <>
              {/* Flagship snapshot */}
              <motion.div variants={fadeUp} className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {highlightStats.map((s) => (
                  <div key={s.label} className="rounded-md border border-slate-200 p-4">
                    <div className="text-xl font-bold font-mono text-slate-900">{s.value}</div>
                    <div className="text-xs text-slate-600 mt-1">{s.label}</div>
                  </div>
                ))}
              </motion.div>


              {/* Full comparison matrix */}
              <motion.div variants={fadeUp} className="mt-10">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">
                  Full model comparison &mdash; {benchmark.length} architectures
                </h3>
                <div className="overflow-x-auto rounded-md border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-3.5">Architecture</th>
                        <th className="py-3 px-3.5">PSNR (dB) ↑</th>
                        <th className="py-3 px-3.5">SSIM ↑</th>
                        <th className="py-3 px-3.5">SAM (deg) ↓</th>
                        <th className="py-3 px-3.5">ΔNDVI ↓</th>
                        <th className="py-3 px-3.5">Downsample MAE ↓</th>
                        <th className="py-3 px-3.5">Uncertainty r_s ↑</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                      {benchmark.map((row, idx) => {
                        const isFlagship = row.model.includes('HAT');
                        const isIbp = row.model.includes('IBP');
                        return (
                          <tr
                            key={idx}
                            className={`transition-colors ${
                              isIbp
                                ? 'bg-earth-100/60 font-semibold'
                                : isFlagship
                                ? 'bg-brand-50/70 font-semibold'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="py-3 px-3.5 font-sans font-medium text-slate-900 flex items-center gap-1.5">
                              {isFlagship && <Medal className="h-3.5 w-3.5 text-brand-600 shrink-0" />}
                              {isIbp && <ShieldCheck className="h-3.5 w-3.5 text-earth-700 shrink-0" />}
                              <span>{row.model}</span>
                            </td>
                            <td className={`py-3 px-3.5 ${isFlagship ? 'text-brand-800 font-bold' : ''}`}>
                              {row.psnr.toFixed(2)}
                            </td>
                            <td className={`py-3 px-3.5 ${isFlagship ? 'text-brand-800 font-bold' : ''}`}>
                              {row.ssim.toFixed(4)}
                            </td>
                            <td className={`py-3 px-3.5 ${isFlagship ? 'text-earth-800 font-bold' : ''}`}>
                              {row.sam_deg.toFixed(2)}&deg;
                            </td>
                            <td className={`py-3 px-3.5 ${isFlagship ? 'text-brand-800 font-bold' : ''}`}>
                              {row.d_ndvi.toFixed(4)}
                            </td>
                            <td className={`py-3 px-3.5 ${isIbp ? 'text-earth-900 font-bold underline' : ''}`}>
                              {row.cons_rmse.toFixed(6)}
                            </td>
                            <td className={`py-3 px-3.5 ${row.spearman > 0 ? 'text-amber-800 font-bold' : 'text-slate-400'}`}>
                              {row.spearman > 0 ? `+${row.spearman.toFixed(3)}` : row.spearman.toFixed(3)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </motion.section>

      {/* How it works - illustrated */}
      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        variants={fadeUp}
        className="border-t border-slate-200"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center max-w-6xl mx-auto px-4 py-16">
          <div className="lg:col-span-5">
            <img src={uploadIllustration} alt="" className="w-full max-w-sm mx-auto" />
          </div>
          <div className="lg:col-span-7">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-8">
              Three steps to a sharper scene
            </h2>
            <div className="space-y-6">
              {steps.map((s, i) => (
                <div key={s.title} className="flex items-start gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 text-brand-600">
                    <s.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {i + 1}. {s.title}
                    </h3>
                    <p className="text-sm text-slate-600 mt-0.5">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Closing CTA - plain, integrated, not a boxed banner */}
      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.5 }}
        variants={fadeUp}
        className="border-t border-slate-200"
      >
        <div className="max-w-3xl mx-auto px-4 py-14 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <h3 className="text-xl font-bold tracking-tight text-slate-900">
            Ready to resolve your own imagery?
          </h3>
          <button
            type="button"
            onClick={onNavigateToStudio}
            className="flex items-center gap-2 rounded-md bg-brand-600 hover:bg-brand-500 text-white px-5 py-2.5 text-sm font-semibold transition-colors shrink-0"
          >
            <span>Try Now</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </motion.section>
    </div>
  );
};
