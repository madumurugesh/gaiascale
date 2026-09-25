import { useState, type ButtonHTMLAttributes, type FC, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CaretDown } from '@phosphor-icons/react';

type Variant = 'primary' | 'secondary' | 'ghost';

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md';
  icon?: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-app-bg hover:bg-accent-hover font-semibold',
  secondary: 'border border-app-border bg-app-raised text-app-text hover:bg-app-hover hover:border-app-border-strong',
  ghost: 'text-app-muted hover:bg-app-hover hover:text-app-text',
};

export const Btn: FC<BtnProps> = ({ variant = 'secondary', size = 'md', icon, className = '', children, type = 'button', ...rest }) => (
  <button
    type={type}
    className={`inline-flex items-center justify-center gap-1.5 rounded-md text-[13px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:pointer-events-none disabled:opacity-40 ${
      size === 'sm' ? 'h-7 px-2.5' : 'h-8 px-3'
    } ${VARIANTS[variant]} ${className}`}
    {...rest}
  >
    {icon}
    {children}
  </button>
);

export const IconBtn: FC<ButtonHTMLAttributes<HTMLButtonElement> & { label: string; active?: boolean }> = ({
  label,
  active,
  className = '',
  children,
  ...rest
}) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    className={`inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:pointer-events-none disabled:opacity-35 ${
      active ? 'bg-app-active text-app-text' : 'text-app-muted hover:bg-app-hover hover:text-app-text'
    } ${className}`}
    {...rest}
  >
    {children}
  </button>
);

export const Kbd: FC<{ children: ReactNode }> = ({ children }) => (
  <kbd className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded border border-app-border-strong bg-app-raised px-1 font-mono text-[10px] text-app-muted">
    {children}
  </kbd>
);

/** Compact tab-style segmented control. */
export function Tabs<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: ReactNode; hint?: string }[];
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex items-center rounded-md border border-app-border bg-app-bg p-0.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            title={o.hint}
            onClick={() => onChange(o.value)}
            className={`relative flex h-6 items-center gap-1.5 rounded-[5px] px-2.5 text-[12px] font-medium transition-colors ${
              active ? 'text-app-text' : 'text-app-muted hover:text-app-text'
            }`}
          >
            {active && (
              <motion.span
                layoutId={`tab-${label}`}
                className="absolute inset-0 rounded-[5px] bg-app-active"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            )}
            {o.icon && <span className="relative flex">{o.icon}</span>}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Small switch used for boolean settings. */
export const Toggle: FC<{ checked: boolean; onChange: () => void; label: string; hint?: string; disabled?: boolean }> = ({
  checked,
  onChange,
  label,
  hint,
  disabled,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={onChange}
    className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-app-hover disabled:pointer-events-none disabled:opacity-40"
  >
    <span className="min-w-0 flex-1">
      <span className="block text-[13px] text-app-text">{label}</span>
      {hint && <span className="block truncate text-[11px] text-app-faint">{hint}</span>}
    </span>
    <span
      className={`relative h-4 w-7 shrink-0 rounded-full transition-colors duration-200 ${checked ? 'bg-accent' : 'bg-app-border-strong'}`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 700, damping: 35 }}
        className={`absolute top-0.5 h-3 w-3 rounded-full ${checked ? 'right-0.5 bg-app-bg' : 'left-0.5 bg-app-muted'}`}
      />
    </span>
  </button>
);

/** Collapsible panel section with a plain title row. */
export const Section: FC<{ title: string; aside?: ReactNode; children: ReactNode; defaultOpen?: boolean }> = ({
  title,
  aside,
  children,
  defaultOpen = true,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-app-border">
      <div className="flex h-9 items-center gap-2 px-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex flex-1 items-center gap-1.5 text-left text-[12px] font-semibold text-app-text"
        >
          <CaretDown
            weight="bold"
            className={`h-3 w-3 text-app-faint transition-transform duration-200 ${open ? '' : '-rotate-90'}`}
          />
          {title}
        </button>
        {aside}
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export const KeyValue: FC<{ k: string; v: ReactNode; mono?: boolean; tone?: string }> = ({ k, v, mono = true, tone }) => (
  <div className="flex items-baseline justify-between gap-3 py-1">
    <span className="shrink-0 text-[12px] text-app-muted">{k}</span>
    <span className={`min-w-0 truncate text-right text-[12px] ${mono ? 'font-mono' : ''} ${tone ?? 'text-app-text'}`}>{v}</span>
  </div>
);
