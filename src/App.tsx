import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppProvider, useApp } from './context/AppContext';
import { LivingBackground } from './components/Background/LivingBackground';
import { LandingPage } from './components/Landing/LandingPage';
import { AppShell } from './components/AppShell';
import { BOUNCY_SPRING } from './theme';

const MainNavigator: React.FC = () => {
  const { hasEnteredApp, leafMood } = useApp();

  return (
    <div className="relative min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] selection:bg-[var(--surface-highlight)] selection:text-[var(--text-primary)]">
      {/* Living Background (leaves and roots only on startup page, clean elsewhere) */}
      <LivingBackground leafMood={leafMood} showNatureElements={!hasEnteredApp} />

      {/* Screen Router with smooth fade-and-scale transition */}
      <AnimatePresence mode="wait">
        {!hasEnteredApp ? (
          <motion.div
            key="landing-screen"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={BOUNCY_SPRING}
            className="w-full min-h-screen"
          >
            <LandingPage />
          </motion.div>
        ) : (
          <motion.div
            key="app-shell-screen"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={BOUNCY_SPRING}
            className="w-full min-h-screen"
          >
            <AppShell />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainNavigator />
    </AppProvider>
  );
}
