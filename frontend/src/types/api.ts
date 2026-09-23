export interface Metrics {
  psnr: number;
  ssim: number;
  sam_deg: number;
  ergas?: number;
  rmse?: number;
  d_ndvi: number;
  d_ndwi: number;
  unc_spearman: number;
  cons_mae: number;
  cons_rmse: number;
}

export interface ImageCollection {
  lr_rgb: string;
  sr_rgb: string;
  lr_cir: string;
  sr_cir: string;
  lr_ndvi: string;
  sr_ndvi: string;
  lr_ndwi: string;
  sr_ndwi: string;
  uncertainty_heat: string;
  consistency_diff: string;
  hr_rgb?: string;
}

export interface SceneMetadata {
  filename?: string;
  crs?: string;
  is_geotiff?: boolean;
}

export interface InferenceData {
  token: string;
  model_name: string;
  use_ibp: boolean;
  latency_ms: number;
  input_shape: number[];
  output_shape: number[];
  meta: SceneMetadata;
  metrics: Metrics;
  images: ImageCollection;
}

export interface InferenceResponse {
  status: string;
  data: InferenceData;
}

export interface BenchmarkRow {
  model: string;
  role: string;
  psnr: number;
  ssim: number;
  sam_deg: number;
  d_ndvi: number;
  cons_rmse: number;
  spearman: number;
}

export interface BenchmarkResponse {
  status: string;
  benchmark: BenchmarkRow[];
}

export interface HealthResponse {
  status: string;
  models: string[];
  device: string;
}

export type ModelType = 'hat' | 'swinir' | 'sen2sr' | 'bicubic';
export type ModalityType = 'rgb' | 'cir' | 'ndvi' | 'ndwi' | 'uncertainty';
export type ViewMode = 'split' | 'side-by-side' | 'single';
