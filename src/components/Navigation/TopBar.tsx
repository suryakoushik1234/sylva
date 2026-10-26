import React from 'react';
import { motion } from 'motion/react';
import { Sun, Moon } from 'lucide-react';
import { Logo } from '../Logo';
import { LanguageSelector } from './LanguageSelector';
import { useApp } from '../../context/AppContext';

export const TopBar: React.FC = () => {
  const { returnToLanding, theme, toggleTheme } = useApp();

  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-xl bg-[var(--surface-glass)] border-b border-[var(--glass-border)] transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={returnToLanding}
            aria-label="Return to Sylva home page"
            className="flex items-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-accent)] rounded-xl p-1"
          >
            <Logo size="sm" />
          </button>
        </div>

        {/* Right: Theme Toggle, About link, Language Selector */}
        <div className="flex items-center gap-2.5 sm:gap-4">
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

          <motion.button
            onClick={returnToLanding}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.95 }}
            className="text-xs sm:text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer px-2.5 py-1.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-accent)]/30"
          >
            About
          </motion.button>

          <LanguageSelector compact />
        </div>
      </div>
    </header>
  );
};
