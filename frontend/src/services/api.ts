import type {
  BenchmarkResponse,
  HealthResponse,
  InferenceResponse,
  ModelType,
} from '../types/api';

const API_BASE = import.meta.env.VITE_API_BASE || '';

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/api/health`);
  if (!res.ok) {
    throw new Error(`Health check failed: ${res.statusText}`);
  }
  return res.json();
}

export async function runUploadInference(
  file: File,
  _modelName?: ModelType,
  _useIbp?: boolean
): Promise<InferenceResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Upload failed: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchBenchmark(): Promise<BenchmarkResponse> {
  return {
    status: 'success',
    benchmark: [
      {
        model: 'Bicubic Interpolation',
        role: 'Mathematical Baseline (0 Params)',
        psnr: 33.25,
        ssim: 0.913,
        sam_deg: 1.52,
        d_ndvi: 0.0184,
        cons_rmse: 0.00179,
        spearman: 0.0,
      },
      {
        model: 'SwinIR (Transformer)',
        role: 'High-Speed Geometric Context',
        psnr: 36.25,
        ssim: 0.92,
        sam_deg: 2.3,
        d_ndvi: 0.0412,
        cons_rmse: 0.00555,
        spearman: -0.081,
      },
      {
        model: 'Gaia-HAT (Flagship SOTA)',
        role: 'Flagship SOTA Champion (CVPR)',
        psnr: 35.68,
        ssim: 0.921,
        sam_deg: 1.12,
        d_ndvi: 0.0152,
        cons_rmse: 0.01341,
        spearman: 0.363,
      },
      {
        model: 'SEN2SR (ESA Anchor + Head)',
        role: 'Space Agency Peer Foundation Anchor',
        psnr: 32.1,
        ssim: 0.872,
        sam_deg: 2.1,
        d_ndvi: 0.0195,
        cons_rmse: 0.00211,
        spearman: 0.226,
      },
      
    ],
  };
}

export function getGeoTiffDownloadUrl(token: string): string {
  return `${API_BASE}/api/download_geotiff?token=${encodeURIComponent(token)}`;
}

export function getNpzDownloadUrl(token: string): string {
  return `${API_BASE}/api/download_npz?token=${encodeURIComponent(token)}`;
}
