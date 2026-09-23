import {
  useRef,
  useState,
  useEffect,
  type FC,
  type DragEvent,
  type ChangeEvent,
} from 'react';
import {
  UploadSimple,
  SealCheck,
  Sparkle,
  Lock,
  LockOpen,
  GridFour,
  Columns,
  SplitVertical,
  ShieldCheck,
  X,
  CheckCircle,
  CaretDown,
  Check,
  Aperture,
  Broadcast,
  Plant,
  Drop,
  Fire,
  DownloadSimple,
  MapTrifold,
  Image as ImageIcon,
  Package,
  type Icon,
} from '@phosphor-icons/react';
import type { ModalityType, ViewMode } from '../types/api';

interface ControlPanelProps {
  uploadedFile: File | null;
  onFileUpload: (file: File) => void;
  onClearFile: () => void;
  isLoading: boolean;
  onRunInference: () => void;
  // Spectral Modality moved to sidebar
  modality: ModalityType;
  onModalityChange: (modality: ModalityType) => void;
  // Export Options moved to sidebar
  onExportGeoTiff: () => void;
  onExportPNG: () => void;
  onExportNPZ: () => void;
  // Display & Viewport Settings
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  isSyncLocked: boolean;
  onToggleSyncLocked: () => void;
  is10mPixelated: boolean;
  onToggle10mPixelated: () => void;
  is25mPixelated: boolean;
  onToggle25mPixelated: () => void;
  showReobsDiff: boolean;
  onToggleReobsDiff: () => void;
  hasImageLoaded: boolean;
}

export const ControlPanel: FC<ControlPanelProps> = ({
  uploadedFile,
  onFileUpload,
  onClearFile,
  isLoading,
  onRunInference,
  modality,
  onModalityChange,
  onExportGeoTiff,
  onExportPNG,
  onExportNPZ,
  viewMode,
  onViewModeChange,
  isSyncLocked,
  onToggleSyncLocked,
  is10mPixelated,
  onToggle10mPixelated,
  is25mPixelated,
  onToggle25mPixelated,
  showReobsDiff,
  onToggleReobsDiff,
  hasImageLoaded,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dropdown popover states
  const [isModalityOpen, setIsModalityOpen] = useState<boolean>(false);
  const modalityRef = useRef<HTMLDivElement>(null);

  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalityRef.current && !modalityRef.current.contains(e.target as Node)) {
        setIsModalityOpen(false);
      }
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setIsExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const modalityOptions: { id: ModalityType; label: string; desc: string; icon: Icon }[] = [
    {
      id: 'rgb',
      label: 'True Color (RGB)',
      desc: 'Bands 4 (Red), 3 (Green), 2 (Blue)',
      icon: Aperture,
    },
    {
      id: 'cir',
      label: 'Color Infrared (CIR)',
      desc: 'Bands 8 (NIR), 4 (Red), 3 (Green)',
      icon: Broadcast,
    },
    {
      id: 'ndvi',
      label: 'NDVI (Vegetation Index)',
      desc: '(NIR - Red) / (NIR + Red) Canopy Health',
      icon: Plant,
    },
    {
      id: 'ndwi',
      label: 'NDWI (Water Index)',
      desc: '(Green - NIR) / (Green + NIR) Water Index',
      icon: Drop,
    },
    {
      id: 'uncertainty',
      label: 'Calibrated Uncertainty',
      desc: 'Laplace Magma Spatial Heatmap (NTRO #8)',
      icon: Fire,
    },
  ];

  const currentModality = modalityOptions.find((m) => m.id === modality) || modalityOptions[0];

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClearFile();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <aside className="h-full flex flex-col min-h-0 space-y-2.5 overflow-y-auto pr-0.5">
      {/* 1. Shrunk & Redesigned Input (I/P) Section - No Presets */}
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold tracking-wider text-slate-500 uppercase flex items-center gap-1.5">
            <span>Input Imagery</span>
          </label>
          <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
            Sentinel-2 10m
          </span>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".tif,.tiff,.npz,.png,.jpg,.jpeg,.webp"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Compact Drop Box / File Status */}
        {!uploadedFile ? (
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="group flex flex-col items-center justify-center gap-1.5 py-3 px-3 rounded-md border border-dashed border-slate-300 hover:border-brand-500 bg-slate-50/70 hover:bg-white cursor-pointer transition-all text-center"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 group-hover:bg-brand-50 text-slate-400 group-hover:text-brand-600 transition-colors">
              <UploadSimple className="h-4 w-4" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-slate-700 group-hover:text-brand-700 transition-colors">
                Drop GeoTIFF or image
              </p>
              <p className="text-[10px] text-slate-400">
                Click to browse (.tif, .npz, .png)
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 p-2 rounded-md bg-brand-50/70 border border-brand-200">
            <div className="flex items-center gap-2 min-w-0">
              <SealCheck className="h-4 w-4 text-brand-600 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-brand-950 truncate max-w-[150px]">
                  {uploadedFile.name}
                </p>
                <p className="text-[10px] font-mono text-brand-700">
                  {(uploadedFile.size / 1024).toFixed(0)} KB &bull; Staged
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClear}
              disabled={isLoading}
              className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Remove image"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Enhance Button - Processes image only when clicked */}
        <button
          type="button"
          onClick={onRunInference}
          disabled={!uploadedFile || isLoading}
          className={`w-full flex items-center justify-center gap-1.5 rounded-md font-semibold text-xs py-2 px-3 transition-all ${
            uploadedFile && !isLoading
              ? 'bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white shadow-xs shadow-brand-600/20 cursor-pointer ring-2 ring-brand-400/30'
              : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
          }`}
          title={uploadedFile ? 'Click to process and enhance image' : 'Upload an image first'}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5 text-brand-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-slate-700">Processing Scene...</span>
            </>
          ) : (
            <>
              <Sparkle className={`h-3.5 w-3.5 ${uploadedFile ? 'text-white' : 'text-slate-400'}`} />
              <span>Enhance Image (4×)</span>
            </>
          )}
        </button>

        {hasImageLoaded && !uploadedFile && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-medium">
            <CheckCircle className="h-3 w-3 text-emerald-600 shrink-0" />
            <span className="truncate">Scene active in canvas</span>
          </div>
        )}
      </div>

      {/* 2. Spectral Modality (Moved to Sidebar) */}
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs space-y-1.5 shrink-0" ref={modalityRef}>
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
            Spectral Modality
          </label>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsModalityOpen((prev) => !prev)}
            className="w-full flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2.5 py-2 text-xs font-semibold text-slate-800 transition-all shadow-2xs"
          >
            <div className="flex items-center gap-2 truncate">
              <currentModality.icon className="h-3.5 w-3.5 text-brand-600 shrink-0" />
              <span className="truncate">{currentModality.label}</span>
            </div>
            <CaretDown
              className={`h-3 w-3 text-slate-400 shrink-0 transition-transform ${
                isModalityOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isModalityOpen && (
            <div className="absolute top-full left-0 mt-1 w-full rounded-lg border border-slate-200 bg-white p-1 shadow-xl z-50 space-y-0.5 animate-fade-in">
              {modalityOptions.map((opt) => {
                const isSelected = modality === opt.id && !showReobsDiff;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      if (showReobsDiff) onToggleReobsDiff();
                      onModalityChange(opt.id);
                      setIsModalityOpen(false);
                    }}
                    className={`w-full flex items-start gap-2 px-2.5 py-1.5 rounded-md text-left text-xs transition-all ${
                      isSelected
                        ? 'bg-brand-50 text-brand-950 font-semibold border border-brand-200/80'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <opt.icon
                      className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${
                        isSelected ? 'text-brand-600' : 'text-slate-400'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs leading-tight">{opt.label}</span>
                        {isSelected && <Check className="h-3 w-3 text-brand-600 shrink-0" />}
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {opt.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 3. Display & Viewport Settings */}
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs space-y-2.5 shrink-0">
        <label className="text-[11px] font-bold tracking-wider text-slate-500 uppercase block">
          Display &amp; Viewport Settings
        </label>

        {/* View Mode Toggle */}
        <div className="space-y-1">
          <span className="text-[11px] text-slate-600 font-medium">View Mode</span>
          <div className="flex rounded-md bg-slate-100 p-0.5 border border-slate-200">
            <button
              type="button"
              onClick={() => onViewModeChange('split')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 text-xs font-semibold rounded transition-all ${
                viewMode === 'split'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <SplitVertical className="h-3.5 w-3.5 text-brand-600" />
              <span>Split Slider</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('side-by-side')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 text-xs font-semibold rounded transition-all ${
                viewMode === 'side-by-side'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Columns className="h-3.5 w-3.5 text-brand-600" />
              <span>Dual View</span>
            </button>
          </div>
        </div>

        {/* Sync Viewports Toggle */}
        <div className="pt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={onToggleSyncLocked}
            className={`w-full flex items-center justify-between p-2 rounded-md border text-left text-xs transition-all ${
              isSyncLocked
                ? 'bg-brand-50/80 border-brand-200 text-brand-900 font-semibold'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white'
            }`}
          >
            <div className="flex items-center gap-2">
              {isSyncLocked ? (
                <Lock className="h-4 w-4 text-brand-600 shrink-0" />
              ) : (
                <LockOpen className="h-4 w-4 text-slate-400 shrink-0" />
              )}
              <div>
                <span className="block leading-tight">Sync Viewports</span>
                <span className="text-[10px] font-normal text-slate-500">
                  {isSyncLocked ? 'Locked pan & zoom' : 'Independent viewports'}
                </span>
              </div>
            </div>
            <span
              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                isSyncLocked ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {isSyncLocked ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>

        {/* Pixel Grids Toggles */}
        <div className="space-y-1.5 pt-1 border-t border-slate-100">
          <span className="text-[11px] text-slate-600 font-medium block">
            Pixel Grid Overlays
          </span>

          {/* 10m Pixel Grid */}
          <button
            type="button"
            onClick={onToggle10mPixelated}
            className={`w-full flex items-center justify-between p-2 rounded-md border text-left text-xs transition-all ${
              is10mPixelated
                ? 'bg-slate-900 border-slate-900 text-white font-semibold shadow-2xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white'
            }`}
            title="Toggle pixelated rendering for raw 10m Sentinel-2 input"
          >
            <div className="flex items-center gap-2">
              <GridFour className={`h-4 w-4 ${is10mPixelated ? 'text-white' : 'text-slate-500'}`} />
              <div>
                <span className="block leading-tight">10m Pixel Grid</span>
                <span className={`text-[10px] font-normal ${is10mPixelated ? 'text-slate-300' : 'text-slate-500'}`}>
                  Raw Sentinel-2 pixels
                </span>
              </div>
            </div>
            <span
              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                is10mPixelated ? 'bg-white text-slate-900' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {is10mPixelated ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* 2.5m Pixel Grid */}
          <button
            type="button"
            onClick={onToggle25mPixelated}
            className={`w-full flex items-center justify-between p-2 rounded-md border text-left text-xs transition-all ${
              is25mPixelated
                ? 'bg-brand-600 border-brand-600 text-white font-semibold shadow-2xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white'
            }`}
            title="Toggle pixelated rendering for sharp 2.5m super-resolved output"
          >
            <div className="flex items-center gap-2">
              <GridFour className={`h-4 w-4 ${is25mPixelated ? 'text-white' : 'text-slate-500'}`} />
              <div>
                <span className="block leading-tight">2.5m Pixel Grid</span>
                <span className={`text-[10px] font-normal ${is25mPixelated ? 'text-brand-100' : 'text-slate-500'}`}>
                  GaiaScale 2.5m structure
                </span>
              </div>
            </div>
            <span
              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                is25mPixelated ? 'bg-white text-brand-800' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {is25mPixelated ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>

        {/* Sensor Drift Residue Map */}
        <div className="pt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={onToggleReobsDiff}
            className={`w-full flex items-center justify-between p-2 rounded-md border text-left text-xs transition-all ${
              showReobsDiff
                ? 'bg-earth-600 border-earth-600 text-white font-semibold shadow-2xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white'
            }`}
            title="Downsample 2.5m output to 10m to test sensor consistency"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className={`h-4 w-4 ${showReobsDiff ? 'text-white' : 'text-slate-500'}`} />
              <div>
                <span className="block leading-tight">Sensor Drift Residue</span>
                <span className={`text-[10px] font-normal ${showReobsDiff ? 'text-earth-100' : 'text-slate-500'}`}>
                  Downsample 2.5m - 10m diff
                </span>
              </div>
            </div>
            <span
              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                showReobsDiff ? 'bg-white text-earth-800' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {showReobsDiff ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>
      </div>

      {/* 4. Export Options (Moved to Sidebar) */}
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs space-y-1.5 shrink-0" ref={exportRef}>
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
            Export Options
          </label>
        </div>

        <div className="relative">
          <button
            type="button"
            disabled={!hasImageLoaded}
            onClick={() => setIsExportOpen((prev) => !prev)}
            className="w-full flex items-center justify-between gap-2 rounded-md bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white px-2.5 py-2 text-xs font-semibold transition-all shadow-xs"
          >
            <div className="flex items-center gap-2">
              <DownloadSimple className="h-4 w-4" />
              <span>Export Output</span>
            </div>
            <CaretDown className={`h-3 w-3 text-slate-400 transition-transform ${isExportOpen ? 'rotate-180' : ''}`} />
          </button>

          {isExportOpen && hasImageLoaded && (
            <div className="absolute bottom-full left-0 mb-1 w-full rounded-lg border border-slate-200 bg-white p-1 shadow-xl z-50 space-y-1 animate-fade-in">
              {/* 1. GeoTIFF */}
              <button
                type="button"
                onClick={() => {
                  onExportGeoTiff();
                  setIsExportOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left text-xs text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded bg-brand-50 text-brand-600 border border-brand-200 shrink-0">
                  <MapTrifold className="h-3 w-3" />
                </span>
                <div className="min-w-0">
                  <span className="font-semibold block text-slate-900 text-xs">GeoTIFF (.tif)</span>
                  <span className="text-[9px] text-slate-400 block truncate">2.5m EPSG CRS</span>
                </div>
              </button>

              {/* 2. Visual PNG */}
              <button
                type="button"
                onClick={() => {
                  onExportPNG();
                  setIsExportOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left text-xs text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded bg-earth-50 text-earth-600 border border-earth-200 shrink-0">
                  <ImageIcon className="h-3 w-3" />
                </span>
                <div className="min-w-0">
                  <span className="font-semibold block text-slate-900 text-xs">Rendered Image (.png)</span>
                  <span className="text-[9px] text-slate-400 block truncate">Active {modality.toUpperCase()} visual</span>
                </div>
              </button>

              {/* 3. Raw NPZ */}
              <button
                type="button"
                onClick={() => {
                  onExportNPZ();
                  setIsExportOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left text-xs text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded bg-amber-50 text-amber-600 border border-amber-200 shrink-0">
                  <Package className="h-3 w-3" />
                </span>
                <div className="min-w-0">
                  <span className="font-semibold block text-slate-900 text-xs">NumPy Tensor (.npz)</span>
                  <span className="text-[9px] text-slate-400 block truncate">Float32 4-band array</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
