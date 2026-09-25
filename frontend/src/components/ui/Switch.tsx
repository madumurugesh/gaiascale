import type { FC, ReactNode } from 'react';
import { motion } from 'motion/react';

interface SwitchRowProps {
  checked: boolean;
  onChange: () => void;
  label: string;
  hint?: string;
  icon?: ReactNode;
  accent?: 'lime' | 'cyan' | 'sky' | 'amber';
  disabled?: boolean;
}

const ACCENTS = {
  lime: 'bg-lime-400',
  cyan: 'bg-cyan-400',
  sky: 'bg-sky-400',
  amber: 'bg-amber-400',
};

/** Full-width toggle row: icon, label + hint, and a springy switch. */
export const SwitchRow: FC<SwitchRowProps> = ({
  checked,
  onChange,
  label,
  hint,
  icon,
  accent = 'lime',
  disabled,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={onChange}
    className="group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-white/[0.04] disabled:opacity-40"
  >
    {icon && (
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
          checked ? 'border-white/15 bg-white/[0.08] text-fg' : 'border-white/[0.06] text-fg-dim'
        }`}
      >
        {icon}
      </span>
    )}
    <span className="min-w-0 flex-1">
      <span className="block text-[13px] font-medium text-fg leading-tight">{label}</span>
      {hint && <span className="block truncate text-[11px] text-fg-dim mt-0.5">{hint}</span>}
    </span>
    <span
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-300 ${
        checked ? ACCENTS[accent] : 'bg-white/10'
      }`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 600, damping: 32 }}
        className={`absolute top-0.5 h-4 w-4 rounded-full shadow-md ${
          checked ? 'right-0.5 bg-ink-950' : 'left-0.5 bg-fg-muted'
        }`}
      />
    </span>
  </button>
);
