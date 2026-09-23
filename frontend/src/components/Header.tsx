import type { FC } from 'react';
import { Logo } from './Logo';

export type NavTab = 'overview' | 'try-now' | 'metrics-guide';

interface HeaderProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

const NAV_ITEMS: { id: NavTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'metrics-guide', label: 'Metrics Guide' },
  { id: 'try-now', label: 'Try Now' },
];

export const Header: FC<HeaderProps> = ({
  currentTab,
  onTabChange,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand only */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => onTabChange('overview')}
            className="focus:outline-none cursor-pointer text-left"
          >
            <Logo size="md" />
          </button>
        </div>

        {/* Right: Nav tabs */}
        <div className="flex items-center gap-1 sm:gap-2">
          <nav className="hidden md:flex items-center gap-1 h-16">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`relative h-16 flex items-center px-3 text-sm font-medium transition-colors ${
                  currentTab === item.id ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {item.label}
                {currentTab === item.id && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-brand-600" />
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile nav strip */}
      <div className="md:hidden flex items-center border-t border-slate-100 text-xs font-medium">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onTabChange(item.id)}
            className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
              currentTab === item.id
                ? 'border-brand-600 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
