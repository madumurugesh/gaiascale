"""
Pydantic Schemas for GaiaScale Backend API
Type-safe request and response validation for /health, /upload, and /download_geotiff.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class MetricsData(BaseModel):
    psnr: float
    ssim: float
    sam_deg: float
    ergas: Optional[float] = None
    rmse: Optional[float] = None
    d_ndvi: float
    d_ndwi: float
    unc_spearman: float
    cons_mae: float
    cons_rmse: float


class ImageCollection(BaseModel):
    lr_rgb: str
    sr_rgb: str
    lr_cir: str
    sr_cir: str
    lr_ndvi: str
    sr_ndvi: str
    lr_ndwi: str
    sr_ndwi: str
    uncertainty_heat: str
    consistency_diff: str
    hr_rgb: Optional[str] = None


class SceneMetadata(BaseModel):
    filename: Optional[str] = None
    crs: Optional[str] = None
    is_geotiff: Optional[bool] = False
    bands_count: Optional[int] = 4
    gsd_input: Optional[float] = 10.0
    gsd_target: Optional[float] = 2.5


class InferenceResult(BaseModel):
    token: str
    model_name: str
    use_ibp: Optional[bool] = None
    latency_ms: float
    input_shape: List[int]
    output_shape: List[int]
    meta: Dict[str, Any]
    metrics: Dict[str, Any]
    images: Dict[str, str]


class InferenceResponse(BaseModel):
    status: str = "success"
    data: InferenceResult


class HealthResponse(BaseModel):
    status: str = "healthy"
    models: List[str]
    device: str
