import type { FC } from 'react';
import { openStudio } from '../../lib/studio';
import { Hero } from './Hero';
import { ResolutionLens } from './ResolutionLens';
import { ResolveStory } from './ResolveStory';
import { CapabilityBento } from './CapabilityBento';
import { ProofNumbers } from './ProofNumbers';
import { UseCaseLoop } from './UseCaseLoop';
import { ClosingCta } from './ClosingCta';

interface LandingPageProps {
  onNavigateToMetrics: () => void;
}

export const LandingPage: FC<LandingPageProps> = ({ onNavigateToMetrics }) => (
  <>
    <Hero onLaunch={openStudio} onMetrics={onNavigateToMetrics} />
    <ResolutionLens />
    <ResolveStory />
    <CapabilityBento />
    <ProofNumbers onMetrics={onNavigateToMetrics} />
    <UseCaseLoop />
    <ClosingCta onLaunch={openStudio} />
  </>
);
