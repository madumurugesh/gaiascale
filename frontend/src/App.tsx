import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Header, type NavTab } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { STUDIO_URL } from './lib/studio';

// Pages are split so each WebGL background (three / ogl) only loads with its page.
const LandingPage = lazy(() => import('./components/landing/LandingPage').then((m) => ({ default: m.LandingPage })));
const MetricsPage = lazy(() => import('./components/metrics/MetricsPage').then((m) => ({ default: m.MetricsPage })));

const tabFromHash = (): NavTab => (window.location.hash.replace(/^#\/?/, '') === 'metrics' ? 'metrics' : 'overview');

/** Marketing site. The studio is a separate application served from /studio/. */
export function App() {
  const [tab, setTab] = useState<NavTab>(tabFromHash);

  useEffect(() => {
    // Old in-page studio links now point at the standalone app.
    if (window.location.hash.replace(/^#\/?/, '') === 'studio') window.location.replace(STUDIO_URL);
    const onHash = () => setTab(tabFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = useCallback((next: NavTab) => {
    const hash = next === 'overview' ? '#/' : `#/${next}`;
    if (window.location.hash !== hash) window.history.pushState(null, '', hash);
    setTab(next);
  }, []);

  return (
    <div className="min-h-[100svh]">
      <Header currentTab={tab} onTabChange={navigate} />

      <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo({ top: 0, behavior: 'instant' })}>
        <motion.main
          key={tab}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <Suspense fallback={<div className="min-h-[100svh]" />}>
            {tab === 'overview' && <LandingPage onNavigateToMetrics={() => navigate('metrics')} />}
            {tab === 'metrics' && <MetricsPage />}
            <Footer onTabChange={navigate} />
          </Suspense>
        </motion.main>
      </AnimatePresence>
    </div>
  );
}

export default App;
