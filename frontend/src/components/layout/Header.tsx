import { useState, type FC } from 'react';
import { motion, useMotionValueEvent, useScroll } from 'motion/react';
import { ArrowUpRight } from '@phosphor-icons/react';
import { Logo } from '../Logo';
import { STUDIO_URL } from '../../lib/studio';

export type NavTab = 'overview' | 'metrics';

interface HeaderProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

const NAV_ITEMS: { id: NavTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'metrics', label: 'Metrics' },
];

/** Floating glass pill navigation that densifies once the page scrolls. */
export const Header: FC<HeaderProps> = ({ currentTab, onTabChange }) => {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState<NavTab | null>(null);

  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 24));

  const solid = scrolled;

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      className="fixed inset-x-0 top-3 z-50 flex justify-center px-3"
    >
      <nav
        className={`flex h-14 w-full max-w-[860px] items-center justify-between rounded-full pl-3 pr-1.5 transition-all duration-500 ${
          solid
            ? 'glass-strong shadow-[0_12px_40px_-12px_rgba(0,0,0,0.8)]'
            : 'border border-white/[0.06] bg-white/[0.02] backdrop-blur-md'
        }`}
      >
        <button
          type="button"
          onClick={() => onTabChange('overview')}
          className="rounded-full pr-2 cursor-pointer"
          aria-label="GaiaScale home"
        >
          <Logo size="sm" className="[&>span]:hidden sm:[&>span]:inline" />
        </button>

        <div className="flex items-center gap-0.5" onMouseLeave={() => setHovered(null)}>
          {NAV_ITEMS.map((item) => {
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                onMouseEnter={() => setHovered(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`relative flex h-10 items-center gap-1.5 rounded-full px-3 sm:px-4 text-[13px] font-medium transition-colors duration-200 ${
                  active ? 'text-fg' : 'text-fg-muted hover:text-fg'
                }`}
              >
                {hovered === item.id && !active && (
                  <motion.span
                    layoutId="nav-hover"
                    className="absolute inset-0 rounded-full bg-white/[0.05]"
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                  />
                )}
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-full border border-white/10 bg-white/[0.09] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  >
                    <span className="absolute -bottom-px left-1/2 h-px w-8 -translate-x-1/2 bg-gradient-to-r from-transparent via-lime-400 to-transparent" />
                  </motion.span>
                )}
                <span className="relative">{item.label}</span>
              </button>
            );
          })}
        </div>

        <a
          href={STUDIO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex h-10 items-center gap-1.5 rounded-full bg-lime-400 pl-4 pr-3 text-[13px] font-semibold text-ink-950 transition-colors hover:bg-lime-300"
        >
          Open studio
          <ArrowUpRight weight="bold" className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </a>
      </nav>
    </motion.header>
  );
};
