# GaiaScale · React Sovereign Satellite Super-Resolution Frontend

A clean, minimal, mission-critical React frontend for the **GaiaScale** Sovereign Satellite Super-Resolution Platform (**NTRO PS-26142**).

This dashboard enhances 4-band Sentinel-2 10 m multispectral imagery to 2.5 m (4× GSD) matching Airbus SPOT-6/7 commercial constellations, featuring physics consistency verification, real-time user GeoTIFF upload, interactive split-screen comparisons, and calibrated uncertainty heatmaps.

---

## 🛰️ Architecture & Tech Stack

- **Framework**: React 19 + TypeScript
- **Bundler / Dev Server**: Vite 8 with HMR & API Proxying
- **Styling**: Tailwind CSS with clean light theme panels, minimal typography
- **Backend**: FastAPI on port `7860`

---

## 🚀 Getting Started

### 1. Start the Python Backend
Ensure your Python environment is active and run:
```bash
python backend/main.py
```
The FastAPI backend will start at `http://127.0.0.1:7860` and automatically serve the built React application at `/`.

### 2. Run the React Development Server (Optional)
To develop with instant Hot Module Replacement (HMR):
```bash
cd frontend
npm run dev
```
Open `http://localhost:5173` in your browser. All `/api/*` calls are automatically proxied to `http://127.0.0.1:7860`.

### 3. Production Build
To create an optimized production bundle:
```bash
cd frontend
npm run build
```
Built assets are output to `frontend/dist/`. The FastAPI backend automatically mounts and serves these production assets.

---

## 🎨 Key Features & Components

### 1. Clean Minimal Design System
- Modern light-theme aerospace aesthetic with subtle panels and clear typography.
- High-contrast, color-coded badges for metrics and sensor fidelity.
- Live backend connection and GPU/CUDA device status pill.

### 2. User Upload Ingestion
- **User Upload Dropzone**: Drag-and-drop ingestion of 4-band `.tif`, `.tiff`, and `.npz` imagery.

### 3. Multi-Model AI Architectures
- **GaiaScale-HAT (Flagship SOTA)**: Hybrid Attention Transformer with channel attention blocks.
- **Bicubic Baseline**: 0-parameter mathematical interpolation baseline.

### 4. Spectral Modalities
- **Natural Color (RGB)**: Sentinel-2 B04 (Red), B03 (Green), B02 (Blue) composite.
- **False-Color NIR (CIR)**: B08 (NIR), B04 (Red), B03 (Green) highlighting vegetation vigor.
- **ΔNDVI**: Normalized Difference Vegetation Index with sub-pixel canopy boundaries.
- **ΔNDWI**: Normalized Difference Water Index for canals, reservoirs, and coastlines.
- **Calibrated Uncertainty**: Magma spatial heatmap displaying model log-variance confidence.

### 5. Interactive Inspection Viewers
- **Split Slider**: Smooth draggable comparison handle with percentage readout and synchronous viewport clipping.
- **Side-by-Side Mode**: Synchronous dual-panel view for thorough inspection.
- **Airbus SPOT 2.5 m Ground Truth Toggle**: Direct comparison with peer-reviewed WorldStrat reference scenes.
- **Sensor Re-Observation Check**: Computes downsampled $2.5\text{ m} \to 10\text{ m}$ residual error to mathematically certify zero synthetic drift.
- **Export 2.5 m GeoTIFF**: Downloads Cloud-Optimized GeoTIFF with intact original CRS projection and affine matrix.

### 6. Telemetry & Scientific Metrics Grid
- Peak SNR (PSNR in dB)
- Structural Similarity Index (SSIM)
- Spectral Angle Mapper (SAM in degrees)
- ΔNDVI Biomass Preservation Error
- Sensor Consistency MAE / RMSE
- Calibrated Uncertainty Spearman Rank Correlation ($r_s = +0.363$, NTRO Req #8)
- Inference Latency (ms)

### 7. Interactive Modals
- **Benchmark Matrix Modal**: Complete cross-model comparative table and operational insights.
- **System Specifications Modal**: Full breakdown of NTRO PS-26142 mission specs, 4-band pipeline, 2D Hann-window cosine alpha blending, and Iterative Back-Projection formulas.
