import type { FC } from 'react';

/**
 * Decorative animated backdrop for the landing hero: a faint dot-grid (fading
 * out via mask toward the edges) with two slow-drifting brand-colored aurora
 * blobs. Pure CSS animation (transform/opacity only) so it stays cheap to
 * render; purely decorative, so it's aria-hidden and never intercepts clicks.
 */
export const HeroBackground: FC = () => {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(ellipse 60% 55% at 50% 35%, black 0%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 55% at 50% 35%, black 0%, transparent 75%)',
        }}
      />

      <div
        className="animate-aurora-a absolute -top-20 left-[6%] h-[28rem] w-[28rem] rounded-full blur-2xl opacity-45"
        style={{ background: 'radial-gradient(circle, #3aa0fa 0%, transparent 70%)' }}
      />
      <div
        className="animate-aurora-b absolute top-16 right-[4%] h-[24rem] w-[24rem] rounded-full blur-2xl opacity-40"
        style={{ background: 'radial-gradient(circle, #66bb6a 0%, transparent 70%)' }}
      />
    </div>
  );
};
