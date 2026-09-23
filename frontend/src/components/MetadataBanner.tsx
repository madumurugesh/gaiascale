import type { FC } from 'react';
import { Compass, FileText, ArrowsOut } from '@phosphor-icons/react';
import type { SceneMetadata } from '../types/api';

interface MetadataBannerProps {
  meta: SceneMetadata | null;
  inputShape: number[];
  outputShape: number[];
  modelName?: string;
}

export const MetadataBanner: FC<MetadataBannerProps> = ({
  meta,
  inputShape,
  outputShape,
}) => {
  const inH = inputShape.length === 3 ? inputShape[1] : 64;
  const inW = inputShape.length === 3 ? inputShape[2] : 64;
  const outH = outputShape.length === 3 ? outputShape[1] : inH * 4;
  const outW = outputShape.length === 3 ? outputShape[2] : inW * 4;
  const crs = meta?.crs || 'EPSG:32643 (UTM Zone 43N)';
  const filename = meta?.filename || 'Sentinel-2 Scene';

  return (
    <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs shadow-2xs">
      <div className="flex flex-wrap items-center gap-3 text-slate-600">
        {/* Filename */}
        <div className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-brand-600" />
          <span className="text-slate-500 font-medium">Scene:</span>
          <span className="font-mono font-semibold text-slate-900 truncate max-w-[160px] sm:max-w-xs">{filename}</span>
        </div>

        {/* Resolution Scale */}
        <div className="flex items-center gap-1.5">
          <ArrowsOut className="h-3.5 w-3.5 text-brand-600" />
          <span className="text-slate-500 font-medium">Scale:</span>
          <span className="font-mono text-slate-800">
            {inH}×{inW} (10m) &rarr;{' '}
            <span className="text-brand-700 font-bold">{outH}×{outW} (2.5m)</span>
          </span>
        </div>

        {/* Projection */}
        <div className="hidden md:flex items-center gap-1.5">
          <Compass className="h-3.5 w-3.5 text-brand-600" />
          <span className="text-slate-500 font-medium">CRS:</span>
          <span className="font-mono text-slate-800 truncate max-w-[140px]">{crs}</span>
        </div>
      </div>
    </div>
  );
};
