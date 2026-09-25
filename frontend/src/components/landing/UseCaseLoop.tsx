import type { FC } from 'react';
import {
  Buildings,
  Drop,
  FireSimple,
  Plant,
  Tree,
  Waves,
  ShieldChevron,
  Path,
  Mountains,
  Boat,
  type Icon,
} from '@phosphor-icons/react';
import LogoLoop, { type LogoItem } from '../reactbits/LogoLoop';

const pill = (IconCmp: Icon, label: string, tone: string): LogoItem => ({
  node: (
    <span className="flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/[0.03] py-2.5 pl-3 pr-5 text-[15px] text-fg-muted transition-colors hover:border-white/20 hover:text-fg">
      <IconCmp weight="duotone" className={`h-5 w-5 ${tone}`} />
      {label}
    </span>
  ),
  title: label,
});

const ROW_A: LogoItem[] = [
  pill(Plant, 'Precision agriculture', 'text-lime-400'),
  pill(Drop, 'Flood inundation mapping', 'text-sky-400'),
  pill(Buildings, 'Urban growth tracking', 'text-cyan-400'),
  pill(Tree, 'Forest & carbon audits', 'text-lime-400'),
  pill(Waves, 'Coastal monitoring', 'text-sky-400'),
];

const ROW_B: LogoItem[] = [
  pill(ShieldChevron, 'Defence ISR', 'text-cyan-400'),
  pill(FireSimple, 'Disaster response', 'text-amber-400'),
  pill(Path, 'Road & canal networks', 'text-lime-400'),
  pill(Mountains, 'Terrain & mining', 'text-amber-300'),
  pill(Boat, 'Water resources', 'text-sky-400'),
];

export const UseCaseLoop: FC = () => (
  <section className="relative py-16" aria-label="Use cases">
    <h2 className="mb-10 px-5 text-center text-2xl font-bold tracking-[-0.02em] text-gradient-silver sm:text-3xl">
      Where the extra detail matters
    </h2>
    <div className="space-y-4">
      <LogoLoop logos={ROW_A} speed={40} direction="left" logoHeight={44} gap={14} pauseOnHover fadeOut fadeOutColor="#03060c" ariaLabel="Use cases" />
      <LogoLoop logos={ROW_B} speed={32} direction="right" logoHeight={44} gap={14} pauseOnHover fadeOut fadeOutColor="#03060c" ariaLabel="More use cases" />
    </div>
  </section>
);
