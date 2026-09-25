import type { ButtonHTMLAttributes, FC, ReactNode } from 'react';

type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'subtle';
  size?: Size;
  icon?: ReactNode;
  trailingIcon?: ReactNode;
}

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[13px] gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-13 px-7 text-[15px] gap-2.5',
};

/**
 * Primary: signal-gradient pill with a sweeping sheen and soft glow.
 * Ghost: glass pill with a hairline border that brightens on hover.
 */
export const Button: FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  trailingIcon,
  className = '',
  children,
  type = 'button',
  ...rest
}) => {
  const base = `group relative inline-flex items-center justify-center rounded-full font-medium tracking-tight transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-40 ${SIZE_CLASSES[size]}`;

  if (variant === 'primary') {
    return (
      <button
        type={type}
        className={`${base} overflow-hidden bg-signal text-ink-950 shadow-[0_0_0_1px_rgba(141,252,95,0.35),0_8px_32px_-8px_rgba(62,224,232,0.55)] hover:shadow-[0_0_0_1px_rgba(141,252,95,0.6),0_10px_44px_-6px_rgba(62,224,232,0.8)] active:scale-[0.97] ${className}`}
        {...rest}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-white/45 blur-md transition-transform duration-700 ease-out group-hover:translate-x-[320%]"
        />
        {icon && <span className="relative flex">{icon}</span>}
        <span className="relative">{children}</span>
        {trailingIcon && (
          <span className="relative flex transition-transform duration-300 group-hover:translate-x-0.5">
            {trailingIcon}
          </span>
        )}
      </button>
    );
  }

  const tone =
    variant === 'ghost'
      ? 'glass text-fg hover:border-white/20 hover:bg-white/[0.06]'
      : 'bg-white/[0.04] text-fg-muted hover:text-fg hover:bg-white/[0.08] border border-white/[0.06]';

  return (
    <button type={type} className={`${base} ${tone} active:scale-[0.97] ${className}`} {...rest}>
      {icon && <span className="flex">{icon}</span>}
      <span>{children}</span>
      {trailingIcon && (
        <span className="flex transition-transform duration-300 group-hover:translate-x-0.5">
          {trailingIcon}
        </span>
      )}
    </button>
  );
};
