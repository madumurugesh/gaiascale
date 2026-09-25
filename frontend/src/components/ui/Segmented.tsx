import { useId, type ReactNode } from 'react';
import { motion } from 'motion/react';

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

interface SegmentedProps<T extends string> {
  value: T;
  options: SegmentOption<T>[];
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
  ariaLabel?: string;
}

/** Pill segmented control with a spring-animated active indicator. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  size = 'md',
  className = '',
  ariaLabel,
}: SegmentedProps<T>) {
  const layoutId = useId();
  const pad = size === 'sm' ? 'h-7 px-2.5 text-[12px]' : 'h-9 px-3.5 text-[13px]';

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`relative inline-flex items-center gap-0.5 rounded-full border border-white/[0.07] bg-white/[0.03] p-1 ${className}`}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={opt.disabled}
            onClick={() => onChange(opt.value)}
            className={`relative flex items-center gap-1.5 rounded-full font-medium transition-colors duration-200 disabled:opacity-35 ${pad} ${
              active ? 'text-ink-950' : 'text-fg-muted hover:text-fg'
            }`}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-full bg-fg shadow-[0_2px_14px_-2px_rgba(255,255,255,0.35)]"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            {opt.icon && <span className="relative flex">{opt.icon}</span>}
            <span className="relative whitespace-nowrap">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
