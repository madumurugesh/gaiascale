import type { FC } from 'react';
import logoImage from '/logo.webp';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const SIZES: Record<NonNullable<LogoProps['size']>, number> = {
  sm: 26,
  md: 36,
  lg: 56,
};

export const Logo: FC<LogoProps> = ({ size = 'md', showText = true, className }) => {
  const iconSize = SIZES[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className ?? ''}`}>
      <img
        src={logoImage}
        alt="GaiaScale"
        className="shrink-0 object-contain"
        style={{ width: iconSize, height: iconSize }}
      />

      {showText && (
        <div className="flex items-center leading-none">
          <span className="text-lg font-extrabold tracking-tight text-slate-900">
            Gaia<span className="text-brand-600">Scale</span>
          </span>
        </div>
      )}
    </div>
  );
};
