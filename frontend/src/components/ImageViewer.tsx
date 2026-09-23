import type { FC } from 'react';
import type { ImageCollection, ModalityType, ViewMode } from '../types/api';
import { SplitSlider } from './SplitSlider';
import { SideBySideViewer } from './SideBySideViewer';

interface ImageViewerProps {
  images: ImageCollection | null;
  modality: ModalityType;
  modelName: string;
  isLoading: boolean;
  viewMode: ViewMode;
  isSyncLocked: boolean;
  is10mPixelated: boolean;
  is25mPixelated: boolean;
  showReobsDiff: boolean;
}

export const ImageViewer: FC<ImageViewerProps> = ({
  images,
  modality,
  modelName,
  isLoading,
  viewMode,
  isSyncLocked,
  is10mPixelated,
  is25mPixelated,
  showReobsDiff,
}) => {
  // Compute left and right images and labels based on active modality and reobsDiff
  let leftImg = '';
  let rightImg = '';
  let leftLabel = 'Input (10 m)';
  let rightLabel = `GaiaScale Enhanced (2.5 m)`;

  if (images) {
    if (showReobsDiff) {
      leftImg = images.lr_rgb;
      rightImg = images.consistency_diff;
      leftLabel = 'Input: Sentinel-2 10 m (Natural Color)';
      rightLabel = 'Sensor Drift Map: Downsampled 2.5m - 10m (Zero Residue)';
    } else if (modality === 'rgb') {
      leftImg = images.lr_rgb;
      rightImg = images.hr_rgb || images.sr_rgb;
      leftLabel = 'Input: Sentinel-2 10 m (Coarse)';
      rightLabel = images.hr_rgb
        ? 'Ground Truth: Airbus SPOT-6/7 2.5 m Reference'
        : `Output: GaiaScale 2.5 m (Gaia-${modelName.toUpperCase()} Flagship)`;
    } else if (modality === 'cir') {
      leftImg = images.lr_cir;
      rightImg = images.sr_cir;
      leftLabel = 'Input: Color Infrared 10 m (CIR)';
      rightLabel = 'Output: Color Infrared 2.5 m (Canopy & Structure)';
    } else if (modality === 'ndvi') {
      leftImg = images.lr_ndvi;
      rightImg = images.sr_ndvi;
      leftLabel = 'Input: Sentinel-2 10 m NDVI';
      rightLabel = 'Output: GaiaScale 2.5 m NDVI (Sub-Pixel Precision)';
    } else if (modality === 'ndwi') {
      leftImg = images.lr_ndwi;
      rightImg = images.sr_ndwi;
      leftLabel = 'Input: Sentinel-2 10 m NDWI';
      rightLabel = 'Output: GaiaScale 2.5 m NDWI (Water Boundaries)';
    } else if (modality === 'uncertainty') {
      leftImg = images.sr_rgb;
      rightImg = images.uncertainty_heat;
      leftLabel = 'GaiaScale Super-Resolved 2.5 m';
      rightLabel = 'Calibrated Laplace Spatial Uncertainty Heatmap';
    }
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white p-2 sm:p-2.5 shadow-2xs h-full">
      {viewMode === 'split' ? (
        <SplitSlider
          leftImage={leftImg}
          rightImage={rightImg}
          leftLabel={leftLabel}
          rightLabel={rightLabel}
          isLoading={isLoading}
          is10mPixelated={is10mPixelated}
          is25mPixelated={is25mPixelated}
        />
      ) : (
        <SideBySideViewer
          leftImage={leftImg}
          rightImage={rightImg}
          leftLabel={leftLabel}
          rightLabel={rightLabel}
          isLoading={isLoading}
          is10mPixelated={is10mPixelated}
          is25mPixelated={is25mPixelated}
          isSyncLocked={isSyncLocked}
        />
      )}
    </div>
  );
};
