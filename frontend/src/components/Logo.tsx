import type { FC } from 'react';
import logoImage from '/logo.webp';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const SIZES: Record<NonNullable<LogoProps['size']>, number> = {
  sm: 26,
  md: 32,
  lg: 48,
};

export const Logo: FC<LogoProps> = ({ size = 'md', showText = true, className }) => {
  const iconSize = SIZES[size];

  return (
    <div className={`flex items-center gap-2 select-none ${className ?? ''}`}>
      <img
        src={logoImage}
        alt="GaiaScale"
        className="shrink-0 object-contain drop-shadow-[0_0_12px_rgba(62,224,232,0.35)]"
        style={{ width: iconSize, height: iconSize }}
      />

      {showText && (
        <span className="text-[17px] font-semibold tracking-tight text-fg leading-none">
          Gaia<span className="text-gradient">Scale</span>
        </span>
      )}
    </div>
  );
};
