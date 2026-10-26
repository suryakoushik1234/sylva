import React from 'react';
import { motion } from 'motion/react';
import { Sun, Moon, ScanLine, CloudSun, BookOpenCheck, Award, Sparkles } from 'lucide-react';
import { Logo } from '../Logo';
import { LanguageSelector } from './LanguageSelector';
import { useApp } from '../../context/AppContext';
import { BOUNCY_SPRING, TABS, TabType } from '../../theme';

interface TopBarProps {
  onOpenDemoDeck?: () => void;
}

const TAB_ICONS: Record<TabType, React.ElementType> = {
  scan: ScanLine,
  weather: CloudSun,
  'field-log': BookOpenCheck,
};

export const TopBar: React.FC<TopBarProps> = ({ onOpenDemoDeck }) => {
  const { returnToLanding, theme, toggleTheme, activeTab, setActiveTab, language } = useApp();

  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-xl bg-[var(--surface-glass)] border-b border-[var(--glass-border)] transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 md:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={returnToLanding}
            aria-label="Return to Sylva home page"
            className="flex items-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-accent)] rounded-xl p-1"
          >
            <Logo size="sm" />
          </button>
        </div>

        {/* Zone 2: Navigation Links (Clean Single-Line Tabs) */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-1.5 p-1 rounded-2xl bg-[var(--surface-glass-elevated)] border border-[var(--glass-border)] shadow-2xs"
        >
          {TABS.map((tab) => {
            const Icon = TAB_ICONS[tab.id];
            const isActive = activeTab === tab.id;
            const label = tab.label[language] || tab.label.en;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-accent)] ${
                  isActive
                    ? 'text-[var(--text-on-accent)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-border-subtle)]'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="topBarActivePill"
                    transition={BOUNCY_SPRING}
                    className="absolute inset-0 bg-[var(--primary-accent)] rounded-xl shadow-xs -z-10"
                  />
                )}
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Actions & Presets */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Hackathon Demo Preset Pill (Triggers quick judge scenario) */}
          <motion.button
            onClick={() => {
              setActiveTab('scan');
              if (onOpenDemoDeck) onOpenDemoDeck();
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            transition={BOUNCY_SPRING}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--glass-border)] bg-[var(--surface-glass-elevated)] text-xs font-semibold text-[var(--primary-accent)] hover:border-[var(--primary-accent)] cursor-pointer shadow-2xs transition-all"
            title="Open 1-Click Judge Demo Scenarios"
          >
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span className="whitespace-nowrap">Judge Presets</span>
          </motion.button>

          {/* Theme Toggle Button */}
          <motion.button
            onClick={toggleTheme}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            className="p-2 rounded-xl border border-[var(--glass-border)] bg-[var(--surface-glass-elevated)] text-[var(--text-primary)] hover:text-[var(--primary-accent)] cursor-pointer shadow-2xs transition-colors flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-accent)]"
            title={theme === 'dark' ? 'Switch to Eucalyptus Haze (Light)' : 'Switch to Midnight Sylva (Dark)'}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-[#9AD5C1]" />
            ) : (
              <Moon className="w-4 h-4 text-[#34796E]" />
            )}
          </motion.button>

          <LanguageSelector compact />

          <motion.button
            onClick={() => setActiveTab('scan')}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
            transition={BOUNCY_SPRING}
            className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[var(--primary-accent)] text-[var(--text-on-accent)] text-xs font-semibold shadow-xs cursor-pointer hover:opacity-90 whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Quick Scan</span>
          </motion.button>
        </div>
      </div>
    </header>
  );
};
