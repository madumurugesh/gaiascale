import type { FC, ReactNode } from 'react';
import { motion } from 'motion/react';

interface SectionHeadingProps {
  title: ReactNode;
  body?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
}

export const SectionHeading: FC<SectionHeadingProps> = ({ title, body, align = 'left', className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.6 }}
    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    className={`${align === 'center' ? 'mx-auto text-center items-center' : ''} flex max-w-2xl flex-col gap-4 ${className}`}
  >
    <h2 className="text-balance pb-[0.06em] text-4xl font-bold leading-[1.06] tracking-[-0.025em] text-gradient-silver sm:text-5xl">
      {title}
    </h2>
    {body && <p className="text-pretty max-w-xl text-base leading-relaxed text-fg-muted">{body}</p>}
  </motion.div>
);
