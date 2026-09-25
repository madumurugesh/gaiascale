import type { ImageCollection, ModalityType } from '../../types/api';

/** Spectral layers offered in the Studio, with their keyboard shortcut. */
export const LAYERS: { id: ModalityType; label: string; hint: string; swatch: string; key: string }[] = [
  { id: 'rgb', label: 'True colour', hint: 'B4 B3 B2', swatch: 'linear-gradient(90deg,#3d5a2c,#8c7a52,#5f8fb3,#c9b98f)', key: '1' },
  { id: 'cir', label: 'Colour infrared', hint: 'B8 B4 B3', swatch: 'linear-gradient(90deg,#4a0d12,#b3262f,#e8747c,#7aa0b8)', key: '2' },
  { id: 'ndvi', label: 'NDVI', hint: 'Vegetation', swatch: 'linear-gradient(90deg,#8b5a2b,#d9c27a,#9ccc65,#1b5e20)', key: '3' },
  { id: 'ndwi', label: 'NDWI', hint: 'Water', swatch: 'linear-gradient(90deg,#c8b48a,#e8eef2,#64b5f6,#0d47a1)', key: '4' },
  { id: 'uncertainty', label: 'Uncertainty', hint: 'Laplace σ', swatch: 'linear-gradient(90deg,#0d0829,#8c2981,#fe9f6d,#fcfdbf)', key: '5' },
];


export interface LayerPair {
  left: string;
  right: string;
  leftLabel: string;
  leftTag: string;
  rightLabel: string;
  rightTag: string;
}

/** Which two renderings to compare for the active spectral view. */
export function resolveLayers(
  images: ImageCollection | null,
  modality: ModalityType,
  showReobsDiff: boolean
): LayerPair | null {
  if (!images) return null;

  if (showReobsDiff) {
    return {
      left: images.lr_rgb,
      right: images.consistency_diff,
      leftLabel: 'Sentinel-2 input',
      leftTag: '10 m',
      rightLabel: 'Drift residue',
      rightTag: 'Δ',
    };
  }

  switch (modality) {
    case 'cir':
      return {
        left: images.lr_cir,
        right: images.sr_cir,
        leftLabel: 'Colour infrared',
        leftTag: '10 m',
        rightLabel: 'Colour infrared',
        rightTag: '2.5 m',
      };
    case 'ndvi':
      return {
        left: images.lr_ndvi,
        right: images.sr_ndvi,
        leftLabel: 'NDVI',
        leftTag: '10 m',
        rightLabel: 'NDVI · sub-pixel',
        rightTag: '2.5 m',
      };
    case 'ndwi':
      return {
        left: images.lr_ndwi,
        right: images.sr_ndwi,
        leftLabel: 'NDWI',
        leftTag: '10 m',
        rightLabel: 'NDWI · water edges',
        rightTag: '2.5 m',
      };
    case 'uncertainty':
      return {
        left: images.sr_rgb,
        right: images.uncertainty_heat,
        leftLabel: 'GaiaScale output',
        leftTag: '2.5 m',
        rightLabel: 'Calibrated uncertainty',
        rightTag: 'σ',
      };
    default:
      return {
        left: images.lr_rgb,
        right: images.hr_rgb || images.sr_rgb,
        leftLabel: 'Sentinel-2 input',
        leftTag: '10 m',
        rightLabel: images.hr_rgb ? 'SPOT-6/7 reference' : 'GaiaScale output',
        rightTag: '2.5 m',
      };
  }
}
