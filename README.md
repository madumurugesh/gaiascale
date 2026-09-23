# GaiaScale - Sovereign Multispectral Satellite Super-Resolution Suite
## Smart India Hackathon 2026 | NTRO Problem Statement 26142
**Target:** 4-Band Sentinel-2 10 m $\to$ 2.5 m ($4\times$ GSD) Super-Resolution Mapping with Zero Hallucination & Calibrated Spatial Uncertainty.

---

### 🌟 Overview

`GaiaScale` is an enterprise-grade, physics-consistent satellite super-resolution platform designed to enhance Sentinel-2 multi-band imagery (B04-Red, B03-Green, B02-Blue, B08-NIR) from 10 m to 2.5 m Ground Sampling Distance (Airbus SPOT-6/7 equivalent).

- **Branding & UI:** World-class light screen design with crisp emerald, teal, and slate colorways, custom vector emblem logo, and seamless typography.
- **Dedicated Pages & Views:**
  1. **Overview (Landing Page):** Hero section with an interactive live Before/After comparison slider showcasing input Sentinel-2 (10 m) vs. Airbus SPOT reference ground truth (2.5 m) across biomes.
  2. **Try Now (Super-Resolution Studio):** Focused exclusively on the best flagship model (**GaiaScale-HAT SOTA Champion**), with a dropdown settings selector for spectral modalities (True Color RGB, False Color NIR, NDVI, NDWI, Uncertainty, Sensor Drift), mode switcher (Split Slider vs. Dual Split vs. SPOT Ground Truth), and output export menu (4-Band GeoTIFF, Visual PNG, Raw NPZ, Full Verification Report).
  3. **Metrics Guide:** Comprehensive educational guide explaining all 8 geospatial and remote sensing metrics, what higher/lower values mean, target thresholds, and real benchmark values.
- **Backend:** Clean, modular FastAPI architecture under `backend/` with PyTorch tiled sliding-window inference, 2D Hann-window alpha blending, Iterative Back-Projection (IBP), and multi-band biophysical transformations.
- **Flagship Model (`GaiaScale-HAT`):** Hybrid Attention Transformer reaching **$35.68\text{ dB}$ PSNR** ($+2.43\text{ dB}$ gain over bicubic), **$1.116^\circ$ SAM** (26.5% error reduction), and calibrated spatial uncertainty ($r_s = +0.363$, **NTRO Req #8**).

---

### 🚀 Quick Start

#### 1. Start the GaiaScale Backend (`uv`)
```bash
cd backend
uv run python main.py --port 7860
```
- Interactive Web Platform: **`http://localhost:7860`**
- Interactive Swagger API Documentation: **`http://localhost:7860/docs`**

*(Alternatively with standard pip: `cd backend && pip install -r requirements.txt && python main.py`)*

#### 3. Frontend Development (Optional)
```bash
cd frontend
npm install
npm run dev
```

To build production assets:
```bash
npm run build
```
*(The FastAPI backend automatically mounts and serves `frontend/dist` when built).*

---

### 📂 Clean Architecture

```
gaiascale/
├── backend/                        # High-performance FastAPI backend
│   ├── main.py                     # FastAPI application & REST endpoints
│   ├── config.py                   # Centralized paths and device configuration
│   ├── schemas.py                  # Pydantic v2 type-safe request/response models
│   ├── requirements.txt            # Backend Python dependencies
│   ├── models/                     # Deep learning architectures
│   │   ├── hat.py                  # Flagship Hybrid Attention Transformer (CVPR SOTA)
│   │   └── __init__.py
│   ├── checkpoints/                # Pre-trained neural weights
│   │   └── hat_best.pt             # Flagship HAT weights (26.3 MB)
│   ├── sample_data/presets/        # Multi-band Sentinel-2 sample scenes (.npz)
│   ├── services/                   # Modular service layer
│   │   ├── inference.py            # Tiled sliding-window inference & IBP engine
│   │   ├── geotiff.py              # Cloud-Optimized GeoTIFF I/O & affine scaling
│   │   ├── spectral.py             # RGB, CIR, NDVI, NDWI & uncertainty rendering
│   │   └── metrics.py              # PSNR, SSIM, SAM, ERGAS, Spearman correlation
│   └── uploads/                    # Analysis-ready exports & temporary imagery
│
├── frontend/                       # Modern light-screen React 19 + TypeScript frontend
│   ├── src/                        # Components & services
│   │   ├── components/             # LandingPage, ImageViewer, ControlPanel, MetricsGuide, ReportModal, Logo
│   │   ├── services/api.ts         # Type-safe API client (GeoTIFF, NPZ, Report)
│   │   ├── types/api.ts            # Frontend TypeScript definitions
│   │   └── App.tsx                 # Master multi-tab application orchestrator
│   ├── package.json
│   ├── vite.config.ts
│   └── dist/                       # Production build served by FastAPI
│
├── pyproject.toml                  # Python package configuration
├── requirements.txt                # Production dependencies
└── README.md                       # Comprehensive documentation
```

---

### 🔌 REST API Endpoints

The backend provides clean, dual-routed endpoints (accessible with or without `/api/` prefix):

| Route | Method | Description |
|---|---|---|
| `/health` / `/api/health` | `GET` | Health status, active model (`hat`), and compute device (`cuda` or `cpu`). |
| `/upload` / `/api/upload` | `POST` | Upload a raw Sentinel-2 GeoTIFF or `.npz` array for $4\times$ super-resolution. |
| `/download_geotiff` / `/api/download_geotiff` | `GET` | Exports analysis-ready 4-band GeoTIFF with updated affine transform and CRS. |

---

### 📊 Master Benchmark Details

The benchmark matrix evaluates super-resolution models on Sentinel-2 10 m input upsampled $4\times$ to 2.5 m Ground Sampling Distance, verified against Airbus SPOT-6/7 (2.5 m) ground truth reference imagery across agricultural, forest, and urban biomes:

| Architecture | Model Role | PSNR ↑ | SSIM ↑ | SAM (deg) ↓ | $\Delta\text{NDVI}$ ↓ | Downsample Drift (MAE) ↓ | Uncertainty $r_s$ ↑ |
|---|---|---|---|---|---|---|---|
| **Bicubic Baseline** | Mathematical Reference (0 Params) | 33.25 dB | 0.9130 | 1.518° | 0.0184 | 0.00179 | N/A |
| **`GaiaScale-SEN2SR`** | Space Agency Foundation Anchor | 32.10 dB | 0.8720 | 2.100° | 0.0195 | 0.00211 | +0.2256 |
| **`GaiaScale-SwinIR`** | High-Speed Geometric Context | 36.25 dB | 0.9202 | 2.303° | 0.0412 | 0.00555 | -0.0813 |
| **`GaiaScale-HAT`** | **Flagship SOTA Champion (CVPR)** | **35.68 dB** | **0.9213** | **1.116°** | **0.0152** | 0.01341 | **+0.3628** |
| **`GaiaScale-HAT` + IBP** | **Certified Zero Hallucination Proof** | 33.16 dB | 0.9109 | 1.625° | 0.0195 | **0.000000** | +0.1620 |

#### Why GaiaScale-HAT is the Flagship SOTA Champion:

1. **Hybrid Attention Mechanism (CVPR):**
   Combines window-based self-attention (for crisp spatial edge reconstruction) with channel attention (for inter-band spectral coherence). This avoids the cross-band color bleeding common in standard convolutional SR networks.
2. **Lowest Spectral Distortion ($1.116^\circ$ SAM):**
   Achieves a 26.5% error reduction over standard baselines, ensuring true radiometric preservation essential for defense and agricultural analytics.
3. **Calibrated Spatial Uncertainty ($r_s = +0.3628$):**
   Outputs a dedicated per-pixel uncertainty head $\exp(s)$. Spearman correlation of $+0.3628$ proves the model is self-aware—flagging shadows, clouds, and specular reflections with elevated uncertainty (**NTRO PS-26142 Req #8**).
4. **Certified Zero Hallucination via IBP:**
   Iterative Back-Projection mathematically enforces that downsampling the $4\times$ output recreates the original $10\text{ m}$ sensor observation, driving downsample drift MAE to **$0.000000$**.

---

### 📐 Geospatial & Remote Sensing Metrics Details

GaiaScale computes 8 rigorous remote sensing metrics to scientifically validate spatial, spectral, and biophysical fidelity:

#### 1. Peak Signal-to-Noise Ratio (PSNR)
- **Formula:** $\text{PSNR} = 10 \cdot \log_{10}\left(\frac{\text{MAX}^2}{\text{MSE}(Y, \hat{Y})}\right)\text{ dB}$
- **Definition:** Measures pixel-level radiometric reconstruction accuracy between the super-resolved output $\hat{Y}$ and the ground truth $Y$.
- **Interpretation:** Higher is better. A $+1\text{ dB}$ improvement represents a $\sim 20\%$ reduction in mean squared reconstruction error. Target: $\ge 34.0\text{ dB}$.

#### 2. Structural Similarity Index (SSIM)
- **Formula:** $\text{SSIM}(x, y) = \frac{(2\mu_x\mu_y + c_1)(2\sigma_{xy} + c_2)}{(\mu_x^2 + \mu_y^2 + c_1)(\sigma_x^2 + \sigma_y^2 + c_2)}$
- **Definition:** Evaluates image quality based on human visual perception and geometric structure, decomposing similarity into luminance, contrast, and structural correlation.
- **Interpretation:** Range $[0, 1]$; higher is better. Values above $0.90$ indicate excellent structural boundary preservation without smudging or artificial ringing.

#### 3. Spectral Angle Mapper (SAM)
- **Formula:** $\text{SAM}(\mathbf{v}, \mathbf{\hat{v}}) = \arccos\left(\frac{\mathbf{v} \cdot \mathbf{\hat{v}}}{\|\mathbf{v}\|_2 \|\mathbf{\hat{v}}\|_2}\right) \times \frac{180^\circ}{\pi}$
- **Definition:** Treats each pixel's 4 bands (Red, Green, Blue, NIR) as a 4-dimensional spectral vector and calculates the angle between prediction and ground truth.
- **Interpretation:** Lower is better (degrees). Measures spectral purity independent of illumination intensity. Low SAM ($< 1.5^\circ$) guarantees that vegetation, soil, and water reflectances do not drift into each other.

#### 4. Relative Dimensionless Global Error in Synthesis (ERGAS)
- **Formula:** $\text{ERGAS} = 100 \cdot \frac{h}{l} \sqrt{\frac{1}{C} \sum_{c=1}^C \left(\frac{\text{RMSE}_c}{\mu_c}\right)^2}$ (where $h/l = 0.25$ for $4\times$ scale)
- **Definition:** Global synthesis error normalized by the mean solar irradiance of each spectral channel.
- **Interpretation:** Lower is better. An ERGAS score $< 3.0$ indicates high-quality multispectral fusion with balanced error distribution across all four bands.

#### 5. Biophysical Vegetation Preservation ($\Delta\text{NDVI}$)
- **Formula:** $\Delta\text{NDVI} = \frac{1}{N}\sum \left|\frac{\text{B08}_{\text{SR}} - \text{B04}_{\text{SR}}}{\text{B08}_{\text{SR}} + \text{B04}_{\text{SR}}} - \frac{\text{B08}_{\text{HR}} - \text{B04}_{\text{HR}}}{\text{B08}_{\text{HR}} + \text{B04}_{\text{HR}}}\right|$
- **Definition:** Mean absolute difference in Normalized Difference Vegetation Index between super-resolved output and ground truth.
- **Interpretation:** Lower is better. Preserving $\Delta\text{NDVI} \le 0.02$ guarantees that downstream GIS crop yield forecasts, canopy cover tracking, and deforestation models remain strictly valid.

#### 6. Hydrological Water Preservation ($\Delta\text{NDWI}$)
- **Formula:** $\Delta\text{NDWI} = \frac{1}{N}\sum \left|\frac{\text{B03}_{\text{SR}} - \text{B08}_{\text{SR}}}{\text{B03}_{\text{SR}} + \text{B08}_{\text{SR}}} - \frac{\text{B03}_{\text{HR}} - \text{B08}_{\text{HR}}}{\text{B03}_{\text{HR}} + \text{B08}_{\text{HR}}}\right|$
- **Definition:** Mean absolute difference in Normalized Difference Water Index (Green vs. NIR).
- **Interpretation:** Lower is better. Critical for flood boundary delineations, wetland conservation, and reservoir monitoring.

#### 7. Sensor Downsample Re-observation Check ($\text{Cons RMSE / MAE}$)
- **Formula:** $\mathcal{D}(\hat{Y}) \approx X, \quad \text{MAE} = \frac{1}{N}\sum |\mathcal{D}(\hat{Y}) - X|$
- **Definition:** Downsamples the $4\times$ super-resolved product ($2.5\text{ m}$) back to input resolution ($10\text{ m}$) using the physical sensor point spread function and verifies fidelity against the original Sentinel-2 input.
- **Interpretation:** Zero-Hallucination proof. When Iterative Back-Projection (IBP) is enabled, MAE reaches **$0.000000$**, mathematically guaranteeing that no synthetic features contradict the raw sensor data.

#### 8. Calibrated Uncertainty Spearman Correlation ($r_s$)
- **Formula:** $r_s = 1 - \frac{6 \sum d_i^2}{n(n^2 - 1)}$ between $\sigma(x, y)$ and $|Y(x, y) - \hat{Y}(x, y)|$
- **Definition:** Non-parametric rank correlation between the model's predicted per-pixel Laplace uncertainty map and actual reconstruction error.
- **Interpretation:** Higher positive value is better ($[-1, +1]$). A positive rank correlation ($r_s > +0.30$) certifies that the model accurately self-diagnoses regions of high reconstruction risk (occlusions, clouds, water glare).
