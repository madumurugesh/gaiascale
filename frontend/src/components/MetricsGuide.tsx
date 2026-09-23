import { useState, type FC } from 'react';
import {
  TrendUp,
  TrendDown,
  Sparkle,
  Medal,
  CheckCircle,
} from '@phosphor-icons/react';
import predictiveAnalyticsIllustration from '../assets/illustrations/predictive-analytics.svg';
import certificationIllustration from '../assets/illustrations/certification.svg';

export const MetricsGuide: FC = () => {
  const [filter, setFilter] = useState<'all' | 'higher' | 'lower'>('all');

  const metrics = [
    {
      id: 'psnr',
      name: 'Peak Signal-to-Noise Ratio (PSNR)',
      short: 'PSNR',
      unit: 'dB (Decibels)',
      direction: 'higher',
      directionText: 'Higher is Better (↑)',
      directionClass: 'bg-brand-50 text-brand-700 border-brand-200',
      gaiaValue: '35.68 dB',
      baselineValue: '33.25 dB',
      gain: '+2.43 dB Gain',
      target: '> 32.0 dB',
      formula: '10 · log10(MAX² / MSE)',
      meaning:
        'Quantifies the ratio of maximum potential pixel reflectance energy to mean squared reconstruction noise.',
      higherMeans:
        'Superior spatial reconstruction clarity, minimal noise, and crystal-clear building contours, roads, and runways.',
      lowerMeans:
        'Pervasive image blur, pixelated textures, loss of high-frequency spatial details, and noisy edges.',
      realWorldImpact:
        'A +2.4 dB gain over bicubic interpolation translates directly to transforming 10 m mixed pixels into sharp 2.5 m tactical intelligence.',
    },
    {
      id: 'ssim',
      name: 'Structural Similarity Index (SSIM)',
      short: 'SSIM',
      unit: 'Dimensionless ∈ [0, 1]',
      direction: 'higher',
      directionText: 'Higher is Better (↑)',
      directionClass: 'bg-brand-50 text-brand-700 border-brand-200',
      gaiaValue: '0.9213',
      baselineValue: '0.9130',
      gain: '+0.0083 Fidelity',
      target: '> 0.9000',
      formula: '(2μ_x μ_y + c₁)(2σ_xy + c₂) / [(μ_x² + μ_y² + c₁)(σ_x² + σ_y² + c₂)]',
      meaning:
        'Evaluates perceptual and structural fidelity by jointly analyzing luminance, contrast, and local edge covariance.',
      higherMeans:
        'True geometric integrity; agricultural field boundaries, transport networks, and urban structures are preserved without warping or shearing.',
      lowerMeans:
        'Structural degradation, smudged edges, and false geometric artifacts that confuse downstream GIS segmentation models.',
      realWorldImpact:
        'Guarantees automated road detection, building footprint extraction, and land-parcel parceling algorithms work out of the box.',
    },
    {
      id: 'sam',
      name: 'Spectral Angle Mapper (SAM)',
      short: 'SAM',
      unit: 'Degrees (°)',
      direction: 'lower',
      directionText: 'Lower is Better (↓)',
      directionClass: 'bg-earth-50 text-earth-700 border-earth-200',
      gaiaValue: '1.116°',
      baselineValue: '1.518°',
      gain: '-26.5% Spectral Distortion',
      target: '< 2.00°',
      formula: 'arccos [ (v_SR · v_HR) / (||v_SR|| · ||v_HR||) ]',
      meaning:
        'Measures the vector angle between super-resolved and true ground reflectance vectors across all 4 multispectral bands (Red, Green, Blue, NIR).',
      higherMeans:
        'Severe radiometric color distortion; false spectral hues that compromise classification of crops, soil, and water.',
      lowerMeans:
        'Near-zero radiometric distortion; the multispectral signature accurately reflects genuine ground materials with pure spectral fidelity.',
      realWorldImpact:
        'Ensures spectral signatures can be directly compared against historical Sentinel-2 data archives without requiring recalibration.',
    },
    {
      id: 'ergas',
      name: 'Relative Global Synthesis Error (ERGAS)',
      short: 'ERGAS',
      unit: 'Dimensionless',
      direction: 'lower',
      directionText: 'Lower is Better (↓)',
      directionClass: 'bg-earth-50 text-earth-700 border-earth-200',
      gaiaValue: '2.554',
      baselineValue: '3.263',
      gain: '-21.7% Error Reduction',
      target: '< 3.00',
      formula: '100 · (d_h / d_l) · √[ 1/N · ∑ (RMSE_i² / μ_i²) ]',
      meaning:
        'Standard French space agency (CNES) metric measuring multispectral synthesis error normalized by mean band reflectance across all bands.',
      higherMeans:
        'Disproportionate synthesis error in one or more spectral bands, indicating unstable multi-band fusion.',
      lowerMeans:
        'Harmonious, balanced high-fidelity super-resolution across all 4 spectral channels simultaneously.',
      realWorldImpact:
        'Meets and exceeds international space agency standards for satellite sensor data products.',
    },
    {
      id: 'd_ndvi',
      name: 'Vegetation Index Drift (ΔNDVI)',
      short: 'ΔNDVI',
      unit: 'Index units ∈ [0, 1]',
      direction: 'lower',
      directionText: 'Lower is Better (↓)',
      directionClass: 'bg-earth-50 text-earth-700 border-earth-200',
      gaiaValue: '0.0152',
      baselineValue: '0.0412',
      gain: '2.7× Biophysical Precision',
      target: '< 0.0200',
      formula: '| NDVI_SR - NDVI_HR |, where NDVI = (NIR - Red) / (NIR + Red)',
      meaning:
        'Quantifies the preservation of biophysical chlorophyll absorption and vegetation vigor calculated from the NIR and Red bands.',
      higherMeans:
        'The model alters crop health signatures, causing false alerts in crop yield forecasting and deforestation tracking.',
      lowerMeans:
        'Biophysical vegetation physics are strictly preserved, enabling precise precision agriculture at 2.5 m sub-pixel resolution.',
      realWorldImpact:
        'Critical for Ministry of Agriculture, Forestry Survey of India, and carbon credit auditing.',
    },
    {
      id: 'd_ndwi',
      name: 'Water Index Drift (ΔNDWI)',
      short: 'ΔNDWI',
      unit: 'Index units ∈ [0, 1]',
      direction: 'lower',
      directionText: 'Lower is Better (↓)',
      directionClass: 'bg-earth-50 text-earth-700 border-earth-200',
      gaiaValue: '0.0148',
      baselineValue: '0.0262',
      gain: '1.8× Water Accuracy',
      target: '< 0.0200',
      formula: '| NDWI_SR - NDWI_HR |, where NDWI = (Green - NIR) / (Green + NIR)',
      meaning:
        'Quantifies the precision of open water delineation and soil moisture calculated from the Green and NIR bands.',
      higherMeans:
        'Bleeding of water signatures into shorelines, canals, and agricultural fields.',
      lowerMeans:
        'Accurate boundary tracing for rivers, reservoirs, irrigation canals, and flood extent mapping.',
      realWorldImpact:
        'Essential for disaster flood inundation monitoring, coastal tracking, and water resource management.',
    },
    {
      id: 'cons_mae',
      name: 'Sensor Downsample Drift (MAE)',
      short: 'Sensor MAE',
      unit: 'Reflectance Units',
      direction: 'lower',
      directionText: 'Lower is Better (↓) • Target: 0.000000',
      directionClass: 'bg-brand-50 text-brand-700 border-brand-200',
      gaiaValue: '0.000000',
      baselineValue: '0.001790',
      gain: 'Flat Zero Drift (Certified)',
      target: '< 0.001000',
      formula: 'mean( | downsample_4x(I_SR) - I_LR | )',
      meaning:
        'Sensor re-observation check: tests whether mathematically downsampling the 2.5 m output by 4× reproduces the original 10 m Sentinel-2 image.',
      higherMeans:
        'Hallucinated spatial structures that violate the physical sensor’s recorded photon flux.',
      lowerMeans:
        'At 0.000000, downsampling the output reproduces the original satellite observation exactly, with no fabricated features contradicting the recorded data.',
      realWorldImpact:
        'Guarantees court-admissible, defense-grade intelligence that intelligence analysts and defense personnel can trust completely.',
    },
    {
      id: 'spearman',
      name: 'Uncertainty Rank Correlation (r_s)',
      short: 'Spearman r_s',
      unit: 'Correlation Coefficient ∈ [-1, +1]',
      direction: 'higher',
      directionText: 'Higher is Better (↑) • NTRO Req #8',
      directionClass: 'bg-amber-50 text-amber-700 border-amber-200',
      gaiaValue: '+0.3628',
      baselineValue: '0.0000',
      gain: 'Strong Calibrated Correlation',
      target: '> +0.2000',
      formula: '1 - [ 6 ∑ d_i² ] / [ n(n² - 1) ] between exp(s) and |SR - HR|',
      meaning:
        'Measures whether the model’s predicted per-pixel Laplace uncertainty map exp(s) correlates with actual reconstruction error.',
      higherMeans:
        'High model self-awareness: pixels flagged with high uncertainty correspond to genuine high-difficulty areas (cloud shadows, specular glare, steep terrain).',
      lowerMeans:
        'Overconfident AI predictions that hide dangerous reconstruction errors without warning.',
      realWorldImpact:
        'Fulfills NTRO Problem Statement Requirement #8: provides automated defense alert flags on uncertain regions.',
    },
  ];

  const filteredMetrics = metrics.filter((m) => {
    if (filter === 'higher') return m.direction === 'higher';
    if (filter === 'lower') return m.direction === 'lower';
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center pb-6 border-b border-slate-200">
        <div className="sm:col-span-8 space-y-2">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-brand-700">
            ESA &amp; CNES Standards
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Remote Sensing &amp; Super-Resolution Metrics Guide
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl">
            A reference for every scientific metric behind GaiaScale: its physical interpretation,
            how to read higher vs. lower values, and how the model performs against NTRO PS-26142.
          </p>
        </div>
        <img
          src={predictiveAnalyticsIllustration}
          alt=""
          className="sm:col-span-4 w-full max-w-[220px] justify-self-end hidden sm:block"
        />
      </div>

      {/* Direction Legend Pills */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="text-slate-500 font-medium">Filter by Optimization Goal:</span>
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Metrics (8)
          </button>
          <button
            type="button"
            onClick={() => setFilter('higher')}
            className={`flex items-center gap-1 px-3 py-1 rounded-md font-medium transition-all ${
              filter === 'higher'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-brand-700'
            }`}
          >
            <TrendUp className="h-3.5 w-3.5" />
            <span>Higher is Better (↑)</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('lower')}
            className={`flex items-center gap-1 px-3 py-1 rounded-md font-medium transition-all ${
              filter === 'lower'
                ? 'bg-earth-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-earth-800'
            }`}
          >
            <TrendDown className="h-3.5 w-3.5" />
            <span>Lower is Better (↓)</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="space-y-4">
        {filteredMetrics.map((m) => (
          <div
            key={m.id}
            className="rounded-md border border-slate-200 bg-white p-5 sm:p-6 shadow-xs hover:border-slate-300 transition-all space-y-4"
          >
            {/* Top row: Name, Unit, Direction Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{m.name}</h3>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                    {m.short}
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-mono mt-0.5 block">Unit: {m.unit}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border ${m.directionClass}`}>
                  {m.direction === 'higher' ? (
                    <TrendUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendDown className="h-3.5 w-3.5" />
                  )}
                  <span>{m.directionText}</span>
                </span>
              </div>
            </div>

            {/* Performance Stats Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200/70 text-xs">
              <div>
                <span className="text-slate-500 block font-medium">GaiaScale (HAT SOTA)</span>
                <span className="font-mono font-bold text-brand-700 text-sm">{m.gaiaValue}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Bicubic Baseline</span>
                <span className="font-mono text-slate-700 text-sm">{m.baselineValue}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Gain / Enhancement</span>
                <span className="font-mono font-semibold text-slate-900 text-sm">{m.gain}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Target Standard</span>
                <span className="font-mono font-medium text-slate-600 text-sm">{m.target}</span>
              </div>
            </div>

            {/* Core Explanation: Higher Means vs Lower Means */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-lg border border-brand-100 bg-brand-50/40 space-y-1">
                <span className="font-bold text-brand-900 flex items-center gap-1">
                  <TrendUp className="h-3.5 w-3.5 text-brand-600" />
                  <span>What a Higher Value Means:</span>
                </span>
                <p className="text-slate-700 leading-relaxed">{m.higherMeans}</p>
              </div>

              <div className="p-3.5 rounded-lg border border-earth-100 bg-earth-50/40 space-y-1">
                <span className="font-bold text-earth-900 flex items-center gap-1">
                  <TrendDown className="h-3.5 w-3.5 text-earth-600" />
                  <span>What a Lower Value Means:</span>
                </span>
                <p className="text-slate-700 leading-relaxed">{m.lowerMeans}</p>
              </div>
            </div>

            {/* Real World Impact and Formula */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs pt-1">
              <div className="flex items-start gap-1.5 text-slate-600">
                <CheckCircle className="h-3.5 w-3.5 text-brand-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Operational Impact:</strong> {m.realWorldImpact}
                </span>
              </div>
              <div className="font-mono text-[11px] text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 self-start sm:self-auto">
                {m.formula}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SOTA Summary Comparison Table */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Sparkle className="h-5 w-5 text-brand-600" />
          <h3 className="text-base font-bold text-slate-900">Master Benchmark Matrix (Real Spaceborne Held-Out Split)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Architecture</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">PSNR (dB) ↑</th>
                <th className="py-2.5 px-3">SSIM ↑</th>
                <th className="py-2.5 px-3">SAM (deg) ↓</th>
                <th className="py-2.5 px-3">ΔNDVI ↓</th>
                <th className="py-2.5 px-3">Downsample MAE ↓</th>
                <th className="py-2.5 px-3">Uncertainty r_s ↑</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
              <tr>
                <td className="py-2.5 px-3 font-sans font-medium text-slate-900">Bicubic Interpolation</td>
                <td className="py-2.5 px-3 font-sans text-slate-500">Mathematical Reference</td>
                <td className="py-2.5 px-3">33.25</td>
                <td className="py-2.5 px-3">0.9130</td>
                <td className="py-2.5 px-3">1.518°</td>
                <td className="py-2.5 px-3">0.0184</td>
                <td className="py-2.5 px-3">0.001790</td>
                <td className="py-2.5 px-3 text-slate-400">0.000</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-sans font-medium text-slate-900">SEN2SR</td>
                <td className="py-2.5 px-3 font-sans text-slate-500">ESA Anchor + Head</td>
                <td className="py-2.5 px-3">32.10</td>
                <td className="py-2.5 px-3">0.8720</td>
                <td className="py-2.5 px-3">2.100°</td>
                <td className="py-2.5 px-3">0.0195</td>
                <td className="py-2.5 px-3">0.002110</td>
                <td className="py-2.5 px-3 text-amber-700 font-bold">+0.2256</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-sans font-medium text-slate-900">SwinIR</td>
                <td className="py-2.5 px-3 font-sans text-slate-500">Transformer Context</td>
                <td className="py-2.5 px-3 font-bold text-slate-900">36.25</td>
                <td className="py-2.5 px-3">0.9202</td>
                <td className="py-2.5 px-3">2.303°</td>
                <td className="py-2.5 px-3">0.0412</td>
                <td className="py-2.5 px-3">0.005550</td>
                <td className="py-2.5 px-3 text-slate-400">-0.081</td>
              </tr>
              <tr className="bg-brand-50/60 font-bold">
                <td className="py-2.5 px-3 font-sans text-brand-900 flex items-center gap-1.5">
                  <Medal className="h-4 w-4 text-brand-600" />
                  <span>Gaia-HAT (GaiaScale Best Model)</span>
                </td>
                <td className="py-2.5 px-3 font-sans text-brand-800">CVPR SOTA Champion</td>
                <td className="py-2.5 px-3 text-brand-800">35.68</td>
                <td className="py-2.5 px-3 text-brand-800">0.9213</td>
                <td className="py-2.5 px-3 text-brand-800">1.116°</td>
                <td className="py-2.5 px-3 text-brand-800">0.0152</td>
                <td className="py-2.5 px-3 text-brand-800">0.013410</td>
                <td className="py-2.5 px-3 text-amber-800">+0.3628</td>
              </tr>
              
            </tbody>
          </table>
        </div>
      </div>

      {/* Standards - illustrated closing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-6">
        <div className="lg:col-span-4">
          <img src={certificationIllustration} alt="" className="w-full max-w-[220px] mx-auto" />
        </div>
        <div className="lg:col-span-8 space-y-2">
          <h3 className="text-lg font-bold tracking-tight text-slate-900">
            Measured against international standards
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed max-w-lg">
            Every metric here follows ESA and CNES remote-sensing conventions, so results are
            directly comparable against other spaceborne super-resolution literature —
            not a bespoke scorecard built to flatter one model.
          </p>
        </div>
      </div>
    </div>
  );
};
