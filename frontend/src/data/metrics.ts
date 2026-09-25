export type Direction = 'higher' | 'lower';

export interface MetricDef {
  id: string;
  short: string;
  name: string;
  unit: string;
  direction: Direction;
  /** Tag shown next to the direction, e.g. an NTRO requirement reference */
  tag?: string;
  gaia: number;
  baseline: number;
  /** Formatting precision for display */
  digits: number;
  suffix?: string;
  gain: string;
  target: { op: '>' | '<'; value: number };
  /** Axis range used for the visual scale */
  domain: [number, number];
  formula: string;
  meaning: string;
  higherMeans: string;
  lowerMeans: string;
  impact: string;
}

export const METRICS: MetricDef[] = [
  {
    id: 'psnr',
    short: 'PSNR',
    name: 'Peak Signal-to-Noise Ratio',
    unit: 'dB',
    direction: 'higher',
    gaia: 35.68,
    baseline: 33.25,
    digits: 2,
    suffix: ' dB',
    gain: '+2.43 dB',
    target: { op: '>', value: 32 },
    domain: [30, 38],
    formula: '10 · log10(MAX² / MSE)',
    meaning:
      'Ratio of peak reflectance energy to mean squared reconstruction noise.',
    higherMeans:
      'Sharper reconstruction with minimal noise: crisp building contours, roads and runways.',
    lowerMeans:
      'Blur, pixelated textures and noisy edges; high-frequency detail is lost.',
    impact:
      'A +2.4 dB gain over bicubic turns 10 m mixed pixels into sharp 2.5 m detail.',
  },
  {
    id: 'ssim',
    short: 'SSIM',
    name: 'Structural Similarity Index',
    unit: '0 to 1',
    direction: 'higher',
    gaia: 0.9213,
    baseline: 0.913,
    digits: 4,
    gain: '+0.0083',
    target: { op: '>', value: 0.9 },
    domain: [0.85, 0.95],
    formula: '(2μₓμᵧ + c₁)(2σₓᵧ + c₂) / (μₓ² + μᵧ² + c₁)(σₓ² + σᵧ² + c₂)',
    meaning:
      'Perceptual and structural fidelity from luminance, contrast and local edge covariance.',
    higherMeans:
      'Field boundaries, transport networks and structures keep their true geometry.',
    lowerMeans:
      'Smudged edges and false geometry that confuse downstream GIS segmentation.',
    impact:
      'Road detection, footprint extraction and parcel mapping work out of the box.',
  },
  {
    id: 'sam',
    short: 'SAM',
    name: 'Spectral Angle Mapper',
    unit: 'degrees',
    direction: 'lower',
    gaia: 1.116,
    baseline: 1.518,
    digits: 3,
    suffix: '°',
    gain: '−26.5% distortion',
    target: { op: '<', value: 2 },
    domain: [0, 3],
    formula: 'arccos[(v_SR · v_HR) / (‖v_SR‖ · ‖v_HR‖)]',
    meaning:
      'Angle between predicted and true reflectance vectors across R, G, B and NIR.',
    higherMeans:
      'Colour distortion and false spectral hues that break crop, soil and water classification.',
    lowerMeans:
      'Spectral signatures faithfully match the real ground material.',
    impact:
      'Outputs stay comparable with the Sentinel-2 archive without recalibration.',
  },
  {
    id: 'ergas',
    short: 'ERGAS',
    name: 'Relative Global Synthesis Error',
    unit: 'dimensionless',
    direction: 'lower',
    gaia: 2.554,
    baseline: 3.263,
    digits: 3,
    gain: '−21.7% error',
    target: { op: '<', value: 3 },
    domain: [0, 5],
    formula: '100 · (d_h / d_l) · √[1/N · Σ (RMSE_i² / μ_i²)]',
    meaning:
      'CNES multispectral synthesis error, normalised by mean band reflectance.',
    higherMeans:
      'One or more bands carry disproportionate error: unstable multi-band fusion.',
    lowerMeans:
      'Balanced, high-fidelity reconstruction across all four bands at once.',
    impact:
      'Meets international space-agency standards for sensor data products.',
  },
  {
    id: 'd_ndvi',
    short: 'ΔNDVI',
    name: 'Vegetation Index Drift',
    unit: 'index units',
    direction: 'lower',
    gaia: 0.0152,
    baseline: 0.0412,
    digits: 4,
    gain: '2.7× more precise',
    target: { op: '<', value: 0.02 },
    domain: [0, 0.05],
    formula: '|NDVI_SR − NDVI_HR|,  NDVI = (NIR − Red) / (NIR + Red)',
    meaning:
      'How well chlorophyll absorption and vegetation vigour survive upscaling.',
    higherMeans:
      'Crop-health signatures shift, raising false alerts in yield and deforestation tracking.',
    lowerMeans:
      'Vegetation physics preserved, enabling precision agriculture at 2.5 m.',
    impact:
      'Critical for agriculture ministries, forest surveys and carbon-credit audits.',
  },
  {
    id: 'd_ndwi',
    short: 'ΔNDWI',
    name: 'Water Index Drift',
    unit: 'index units',
    direction: 'lower',
    gaia: 0.0148,
    baseline: 0.0262,
    digits: 4,
    gain: '1.8× more accurate',
    target: { op: '<', value: 0.02 },
    domain: [0, 0.04],
    formula: '|NDWI_SR − NDWI_HR|,  NDWI = (Green − NIR) / (Green + NIR)',
    meaning:
      'Precision of open-water delineation and soil moisture from Green and NIR.',
    higherMeans:
      'Water signatures bleed into shorelines, canals and fields.',
    lowerMeans:
      'Accurate boundaries for rivers, reservoirs, canals and flood extents.',
    impact:
      'Essential for flood monitoring, coastal tracking and water management.',
  },
  {
    id: 'cons_mae',
    short: 'Sensor MAE',
    name: 'Sensor Downsample Drift',
    unit: 'reflectance',
    direction: 'lower',
    gaia: 0,
    baseline: 0.00179,
    digits: 6,
    gain: 'Zero drift',
    target: { op: '<', value: 0.001 },
    domain: [0, 0.0025],
    formula: 'mean(|downsample₄ₓ(I_SR) − I_LR|)',
    meaning:
      'Downsample the 2.5 m output 4× and compare it with the original 10 m capture.',
    higherMeans:
      'Hallucinated structures that contradict what the sensor actually recorded.',
    lowerMeans:
      'Downsampling reproduces the original observation: nothing is fabricated.',
    impact:
      'Output intelligence that analysts can trust against the source capture.',
  },
  {
    id: 'spearman',
    short: 'rₛ',
    name: 'Uncertainty Rank Correlation',
    unit: '−1 to +1',
    direction: 'higher',
    tag: 'NTRO #8',
    gaia: 0.3628,
    baseline: 0,
    digits: 4,
    gain: 'Calibrated',
    target: { op: '>', value: 0.2 },
    domain: [-0.2, 0.5],
    formula: '1 − 6Σdᵢ² / n(n² − 1)   between exp(s) and |SR − HR|',
    meaning:
      'Whether the per-pixel uncertainty map exp(s) tracks the real reconstruction error.',
    higherMeans:
      'The model knows where it struggles: cloud shadow, glare and steep terrain get flagged.',
    lowerMeans:
      'Overconfident predictions that hide reconstruction errors without warning.',
    impact:
      'Fulfils NTRO requirement #8 with automatic flags on uncertain regions.',
  },
];

export interface BenchmarkModel {
  id: string;
  name: string;
  role: string;
  color: string;
  flagship?: boolean;
  psnr: number;
  ssim: number;
  sam: number;
  d_ndvi: number;
  cons_rmse: number;
  spearman: number;
}

export const BENCHMARK: BenchmarkModel[] = [
  {
    id: 'hat',
    name: 'Gaia-HAT',
    role: 'GaiaScale flagship',
    color: '#8dfc5f',
    flagship: true,
    psnr: 35.68,
    ssim: 0.9213,
    sam: 1.116,
    d_ndvi: 0.0152,
    cons_rmse: 0.01341,
    spearman: 0.3628,
  },
  {
    // Measured: training/results/hat_summary.csv, row "hat_bp" (iterative back-projection enabled)
    id: 'hat_ibp',
    name: 'Gaia-HAT + IBP',
    role: 'Back-projection mode',
    color: '#3ee0e8',
    psnr: 33.16,
    ssim: 0.9109,
    sam: 1.625,
    d_ndvi: 0.0195,
    cons_rmse: 0.000213,
    spearman: 0.162,
  },
  {
    id: 'swinir',
    name: 'SwinIR',
    role: 'Transformer context',
    color: '#3aa8ff',
    psnr: 36.25,
    ssim: 0.9202,
    sam: 2.303,
    d_ndvi: 0.0412,
    cons_rmse: 0.00555,
    spearman: -0.081,
  },
  {
    id: 'bicubic',
    name: 'Bicubic',
    role: 'Mathematical reference',
    color: '#93a0b4',
    psnr: 33.25,
    ssim: 0.913,
    sam: 1.518,
    d_ndvi: 0.0184,
    cons_rmse: 0.00179,
    spearman: 0,
  },
  {
    id: 'sen2sr',
    name: 'SEN2SR',
    role: 'ESA anchor + head',
    color: '#f5b942',
    psnr: 32.1,
    ssim: 0.872,
    sam: 2.1,
    d_ndvi: 0.0195,
    cons_rmse: 0.00211,
    spearman: 0.2256,
  },
];

export type BenchmarkKey = 'psnr' | 'ssim' | 'sam' | 'd_ndvi' | 'cons_rmse' | 'spearman';

export const BENCHMARK_AXES: {
  key: BenchmarkKey;
  label: string;
  direction: Direction;
  digits: number;
  suffix?: string;
}[] = [
  { key: 'psnr', label: 'PSNR', direction: 'higher', digits: 2, suffix: ' dB' },
  { key: 'ssim', label: 'SSIM', direction: 'higher', digits: 4 },
  { key: 'sam', label: 'SAM', direction: 'lower', digits: 3, suffix: '°' },
  { key: 'd_ndvi', label: 'ΔNDVI', direction: 'lower', digits: 4 },
  { key: 'cons_rmse', label: 'Downsample', direction: 'lower', digits: 6 },
  { key: 'spearman', label: 'Uncertainty rₛ', direction: 'higher', digits: 3 },
];

/** Min-max normalise a benchmark column into [0.18, 1] where 1 is always "best". */
export function normalizedScore(key: BenchmarkKey, value: number, direction: Direction): number {
  const values = BENCHMARK.map((m) => m[key]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return 1;
  const t = (value - min) / (max - min);
  return 0.18 + 0.82 * (direction === 'higher' ? t : 1 - t);
}

/** Position of a value along a metric's domain, where 1 is always the "better" end. */
export const goodness = (m: MetricDef, v: number) => {
  const [a, b] = m.domain;
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return m.direction === 'higher' ? t : 1 - t;
};

export const formatNum = (v: number, digits: number) =>
  v.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
