import type {
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

export function getGeoTiffDownloadUrl(token: string): string {
  return `${API_BASE}/api/download_geotiff?token=${encodeURIComponent(token)}`;
}

export function getNpzDownloadUrl(token: string): string {
  return `${API_BASE}/api/download_npz?token=${encodeURIComponent(token)}`;
}
