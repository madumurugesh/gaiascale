import type { FC } from 'react';

interface PixelLoaderProps {
  label: string;
}

const TILE_COLORS = ['#1e88e5', '#64b7fd', '#7cb342', '#0d47a1', '#ffa726', '#2196f3'];

/**
 * Loading indicator built from the brand's pixel-dissolve motif: a tile grid that
 * pulses in and out like scattered pixels resolving into a clean image, replacing
 * a generic spinner wherever an inference/render result is pending.
 */
export const PixelLoader: FC<PixelLoaderProps> = ({ label }) => {
  const tiles = Array.from({ length: 16 });

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-lg bg-slate-900/40 backdrop-blur-xs">
      <div className="grid grid-cols-4 gap-1 h-12 w-12 rounded-md overflow-hidden bg-white p-1.5 border border-slate-200 shadow-lg">
        {tiles.map((_, i) => (
          <span
            key={i}
            className="rounded-[2px] animate-pixel-resolve"
            style={{
              backgroundColor: TILE_COLORS[i % TILE_COLORS.length],
              animationDelay: `${(i % 4) * 0.08 + Math.floor(i / 4) * 0.05}s`,
            }}
          />
        ))}
      </div>
      <p className="mt-3 text-xs font-semibold text-white drop-shadow-sm">{label}</p>
    </div>
  );
};
