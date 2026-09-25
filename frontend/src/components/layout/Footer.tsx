import type { FC } from 'react';
import { Logo } from '../Logo';
import type { NavTab } from './Header';
import { STUDIO_URL } from '../../lib/studio';

export const Footer: FC<{ onTabChange: (tab: NavTab) => void }> = ({ onTabChange }) => (
  <footer className="relative border-t border-white/[0.06]">
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-5 py-14 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-4">
        <Logo size="md" />
        <p className="max-w-xs text-sm leading-relaxed text-fg-dim">
          Sovereign satellite super-resolution. Sentinel-2 10&nbsp;m in, 2.5&nbsp;m out.
        </p>
      </div>

      <div className="flex flex-col gap-6 sm:items-end">
        <div className="flex gap-6 text-sm text-fg-muted">
          <button type="button" onClick={() => onTabChange('overview')} className="hover:text-fg transition-colors">
            Overview
          </button>
          <button type="button" onClick={() => onTabChange('metrics')} className="hover:text-fg transition-colors">
            Metrics
          </button>
          <a href={STUDIO_URL} target="_blank" rel="noopener noreferrer" className="hover:text-fg transition-colors">
            Studio
          </a>
        </div>
        <p className="text-[12px] text-fg-dim">Built for NTRO problem statement PS-26142.</p>
      </div>
    </div>
  </footer>
);
