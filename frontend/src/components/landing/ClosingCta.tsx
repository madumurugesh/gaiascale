import type { FC } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight } from '@phosphor-icons/react';
import Topography from '../reactbits/Topography';
import BlurText from '../reactbits/BlurText';
import Magnet from '../reactbits/Magnet';
import { Button } from '../ui/Button';

export const ClosingCta: FC<{ onLaunch: () => void }> = ({ onLaunch }) => (
  <section className="mx-auto max-w-6xl px-5 pb-28 pt-8">
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className="relative isolate overflow-hidden rounded-[24px] border border-white/10 bg-ink-900"
    >
      {/* Contour-map field (React Bits Topography), reacts to the cursor */}
      <div className="absolute inset-0 -z-10 opacity-70">
        <Topography
          lowColor="#0b3b66"
          midColor="#1cc3cc"
          highColor="#8dfc5f"
          bands={7}
          thickness={0.025}
          speed={0.3}
          glow={0.35}
          scale={1.1}
          mouseRadius={0.35}
          mouseStrength={0.6}
          grain={false}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_55%_60%_at_50%_50%,rgba(3,6,12,0.8),rgba(3,6,12,0.15))]" />

      <div className="pointer-events-none flex flex-col items-center px-6 py-24 text-center sm:py-32">
        <BlurText
          text="Try it on your own imagery"
          animateBy="words"
          delay={90}
          direction="bottom"
          className="justify-center text-balance text-4xl font-bold tracking-[-0.03em] text-fg sm:text-6xl"
          segmentClassName="text-gradient-silver pb-[0.08em]"
        />
        <p className="mt-6 max-w-md text-fg-muted">
          Load a Sentinel-2 GeoTIFF in the studio, compare it side by side, and export a 2.5&nbsp;m GeoTIFF.
        </p>
        <div className="pointer-events-auto mt-10">
          <Magnet padding={24} magnetStrength={12}>
            <Button size="lg" onClick={onLaunch} trailingIcon={<ArrowUpRight weight="bold" className="h-4 w-4" />}>
              Open the studio
            </Button>
          </Magnet>
        </div>
      </div>
    </motion.div>
  </section>
);
