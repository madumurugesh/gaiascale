import { useEffect, useState, useCallback } from 'react';
import {
  fetchHealth,
  getGeoTiffDownloadUrl,
  getNpzDownloadUrl,
  runUploadInference,
} from './services/api';
import type {
  InferenceData,
  ModalityType,
  ViewMode,
} from './types/api';
import { Header, type NavTab } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { ControlPanel } from './components/ControlPanel';
import { MetadataBanner } from './components/MetadataBanner';
import { ImageViewer } from './components/ImageViewer';
import { MetricsGuide } from './components/MetricsGuide';
import { ReobservationToast } from './components/ReobservationToast';
import { WarningCircle, ArrowClockwise} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';

export function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');

  // Try Now input state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Best model is locked to 'hat' (Flagship SOTA Champion)
  const model = 'hat';
  const [modality, setModality] = useState<ModalityType>('rgb');

  // Display & Inspection Settings moved to sidebar & synchronized
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [isSyncLocked, setIsSyncLocked] = useState<boolean>(true);
  const [is10mPixelated, setIs10mPixelated] = useState<boolean>(true);
  const [is25mPixelated, setIs25mPixelated] = useState<boolean>(true);
  const [showReobsDiff, setShowReobsDiff] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [inferenceData, setInferenceData] = useState<InferenceData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isReobsToastOpen, setIsReobsToastOpen] = useState<boolean>(false);

  // Execute Upload Inference
  const executeUpload = useCallback(
    async (file: File) => {
      if (!file) return;
      setIsLoading(true);
      setError(null);
      try {
        const res = await runUploadInference(file, model, false);
        if (res.status === 'success') {
          setInferenceData(res.data);
          // Once image is processed, remove from I/P box
          setUploadedFile(null);
        } else {
          setError('Failed to process uploaded file.');
        }
      } catch (err: any) {
        setError(err.message || 'Error processing uploaded file');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Initial load
  useEffect(() => {
    fetchHealth().catch((e) => console.warn('Backend offline or starting up:', e));
  }, []);

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    setError(null);
  };

  const handleClearFile = () => {
    setUploadedFile(null);
    setError(null);
  };

  const handleRunInference = () => {
    if (uploadedFile) {
      executeUpload(uploadedFile);
    }
  };

  const handleExportGeoTiff = () => {
    if (!inferenceData?.token) return;
    const downloadUrl = getGeoTiffDownloadUrl(inferenceData.token);
    window.location.href = downloadUrl;
  };

  const handleExportNPZ = () => {
    if (!inferenceData?.token) return;
    const downloadUrl = getNpzDownloadUrl(inferenceData.token);
    window.location.href = downloadUrl;
  };

  const handleExportPNG = () => {
    if (!inferenceData) return;
    let activeUrl = '';
    if (showReobsDiff) {
      activeUrl = inferenceData.images.consistency_diff;
    } else if (modality === 'rgb') {
      activeUrl = inferenceData.images.hr_rgb || inferenceData.images.sr_rgb;
    } else if (modality === 'cir') {
      activeUrl = inferenceData.images.sr_cir;
    } else if (modality === 'ndvi') {
      activeUrl = inferenceData.images.sr_ndvi;
    } else if (modality === 'ndwi') {
      activeUrl = inferenceData.images.sr_ndwi;
    } else if (modality === 'uncertainty') {
      activeUrl = inferenceData.images.uncertainty_heat;
    }
    if (!activeUrl) return;
    const a = document.createElement('a');
    a.href = activeUrl;
    a.download = `GaiaScale_${modality.toUpperCase()}_2.5m_${inferenceData.token || 'view'}.png`;
    a.click();
  };

  const handleToggleReobsDiff = () => {
    setShowReobsDiff((prev) => {
      const next = !prev;
      if (next) {
        setIsReobsToastOpen(true);
      }
      return next;
    });
  };

  const isStaticStudio = currentTab === 'try-now';

  return (
    <div
      className={
        isStaticStudio
          ? 'h-screen max-h-screen overflow-hidden bg-[#f8fafc] text-slate-900 flex flex-col selection:bg-brand-500/20 selection:text-brand-900'
          : 'min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col selection:bg-brand-500/20 selection:text-brand-900'
      }
    >
      {/* Universal Header */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
      />

      {/* Main Content Body */}
      <main
        className={
          isStaticStudio
            ? 'flex-1 min-h-0 overflow-hidden w-full max-w-[1800px] mx-auto px-3 sm:px-4 py-2.5 flex flex-col'
            : 'flex-1 mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6'
        }
      >
        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.2 }}
              className="shrink-0 mb-2 flex items-center justify-between rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 shadow-2xs overflow-hidden"
            >
              <div className="flex items-center gap-2">
                <WarningCircle className="h-4 w-4 text-red-500 shrink-0" />
                <span>{error}</span>
              </div>
              {uploadedFile && (
                <button
                  type="button"
                  onClick={handleRunInference}
                  className="flex items-center gap-1 text-red-700 hover:text-red-900 font-semibold underline text-[11px]"
                >
                  <ArrowClockwise className="h-3 w-3" />
                  <span>Retry</span>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab 1: Landing Page (Overview) */}
        {currentTab === 'overview' && (
          <LandingPage
            onNavigateToStudio={() => setCurrentTab('try-now')}
            onNavigateToMetrics={() => setCurrentTab('metrics-guide')}
          />
        )}

        {/* Tab 2: "Try Now" Super-Resolution - Static Window Layout */}
        {currentTab === 'try-now' && (
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[300px_1fr] gap-3 h-full overflow-hidden animate-fade-in">
            {/* Sidebar: Redesigned Shrunk I/P box + Spectral Modality + Viewport Settings + Export Options */}
            <ControlPanel
              uploadedFile={uploadedFile}
              onFileUpload={handleFileUpload}
              onClearFile={handleClearFile}
              isLoading={isLoading}
              onRunInference={handleRunInference}
              modality={modality}
              onModalityChange={setModality}
              onExportGeoTiff={handleExportGeoTiff}
              onExportPNG={handleExportPNG}
              onExportNPZ={handleExportNPZ}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              isSyncLocked={isSyncLocked}
              onToggleSyncLocked={() => setIsSyncLocked((prev) => !prev)}
              is10mPixelated={is10mPixelated}
              onToggle10mPixelated={() => setIs10mPixelated((prev) => !prev)}
              is25mPixelated={is25mPixelated}
              onToggle25mPixelated={() => setIs25mPixelated((prev) => !prev)}
              showReobsDiff={showReobsDiff}
              onToggleReobsDiff={handleToggleReobsDiff}
              hasImageLoaded={inferenceData !== null}
            />

            {/* Main canvas: metadata, viewer (Takes full remaining static height with zero duplicate settings) */}
            <div className="flex-1 min-h-0 flex flex-col h-full overflow-hidden space-y-2">
              {inferenceData && (
                <MetadataBanner
                  meta={inferenceData.meta}
                  inputShape={inferenceData.input_shape}
                  outputShape={inferenceData.output_shape}
                  modelName={inferenceData.model_name}
                />
              )}

              <ImageViewer
                images={inferenceData?.images || null}
                modality={modality}
                modelName={model}
                isLoading={isLoading}
                viewMode={viewMode}
                isSyncLocked={isSyncLocked}
                is10mPixelated={is10mPixelated}
                is25mPixelated={is25mPixelated}
                showReobsDiff={showReobsDiff}
              />
            </div>
          </div>
        )}

        {/* Tab 3: Metrics Guide */}
        {currentTab === 'metrics-guide' && <MetricsGuide />}
      </main>


      {/* Modals */}
      <ReobservationToast
        isOpen={isReobsToastOpen}
        onClose={() => setIsReobsToastOpen(false)}
        consMae={inferenceData?.metrics.cons_mae}
        consRmse={inferenceData?.metrics.cons_rmse}
      />
    </div>
  );
}

export default App;
