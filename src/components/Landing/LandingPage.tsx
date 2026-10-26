import React from 'react';
import { motion } from 'motion/react';
import { Camera, Search, Stethoscope, ArrowRight, Sun, Moon } from 'lucide-react';
import { Logo } from '../Logo';
import { BOUNCY_SPRING } from '../../theme';
import { useApp } from '../../context/AppContext';

export const LandingPage: React.FC = () => {
  const { enterApp, theme, toggleTheme } = useApp();

  return (
    <main className="relative min-h-screen w-full flex flex-col justify-between px-4 sm:px-6 py-8 sm:py-12 max-w-4xl mx-auto z-10">
      {/* Top Header */}
      <header className="flex items-center justify-between">
        <Logo size="md" />

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl border border-[var(--glass-border)] bg-[var(--surface-glass-elevated)] text-[var(--text-primary)] hover:text-[var(--primary-accent)] cursor-pointer shadow-2xs transition-colors"
          title={theme === 'dark' ? 'Switch to Eucalyptus Haze' : 'Switch to Midnight Sylva'}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-[#9AD5C1]" />
          ) : (
            <Moon className="w-4 h-4 text-[#34796E]" />
          )}
        </button>
      </header>

      {/* Hero Section */}
      <section className="my-auto py-12 sm:py-16 text-center flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 0.999, y: 0 }}
          transition={BOUNCY_SPRING}
          className="space-y-4 max-w-2xl"
        >
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[var(--text-primary)] leading-[1.12]"
            style={{ letterSpacing: '-0.03em' }}
          >
            Know your crop.
            <br />
            Save your harvest.
          </h1>

          <p className="text-base sm:text-lg text-[var(--text-secondary)] max-w-xl mx-auto">
            Instant AI diagnostics and field-proven treatment plans to protect your crop yield.
          </p>

          <div className="pt-4 flex justify-center">
            <motion.button
              onClick={enterApp}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.96 }}
              transition={BOUNCY_SPRING}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-[var(--primary-accent)] text-[var(--text-on-accent)] font-semibold text-base shadow-[var(--glass-shadow-elevated)] hover:opacity-90 cursor-pointer transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-accent)]"
            >
              <span>Get started</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>

        {/* "What is Sylva?" Section */}
        <div className="w-full mt-20 sm:mt-24 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 0.999, y: 0 }}
            transition={{ ...BOUNCY_SPRING, delay: 0.12 }}
            className="text-center"
          >
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              What is Sylva?
            </h2>
          </motion.div>

          {/* Three cards: Snap, Identify, Treat */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 text-left">
            {/* Snap Card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 0.999, y: 0 }}
              transition={{ ...BOUNCY_SPRING, delay: 0.18 }}
              className="sylva-card p-6 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--primary-accent)]/15 border border-[var(--primary-accent)]/30 flex items-center justify-center text-[var(--primary-accent)]">
                  <Camera className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">Snap</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  Photograph an affected leaf in natural sunlight with your phone or camera.
                </p>
              </div>
            </motion.div>

            {/* Identify Card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 0.999, y: 0 }}
              transition={{ ...BOUNCY_SPRING, delay: 0.24 }}
              className="sylva-card p-6 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--primary-accent)]/15 border border-[var(--primary-accent)]/30 flex items-center justify-center text-[var(--primary-accent)]">
                  <Search className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">Identify</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  Find the disease or pest damaging your foliage in seconds.
                </p>
              </div>
            </motion.div>

            {/* Treat Card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 0.999, y: 0 }}
              transition={{ ...BOUNCY_SPRING, delay: 0.3 }}
              className="sylva-card p-6 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--primary-accent)]/15 border border-[var(--primary-accent)]/30 flex items-center justify-center text-[var(--primary-accent)]">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">Treat</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  Get clear next steps with organic and targeted remedies.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Final "Get started" button */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 0.999, y: 0 }}
            transition={{ ...BOUNCY_SPRING, delay: 0.36 }}
            className="pt-6 flex justify-center"
          >
            <motion.button
              onClick={enterApp}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.96 }}
              transition={BOUNCY_SPRING}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-[var(--primary-accent)] text-[var(--text-on-accent)] font-semibold text-base shadow-[var(--glass-shadow-elevated)] hover:opacity-90 cursor-pointer transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-accent)]"
            >
              <span>Get started</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Clean footer */}
      <footer className="text-center text-xs text-[var(--text-secondary)] py-4">
        Sylva Crop Diagnostic Engine
      </footer>
    </main>
  );
};
