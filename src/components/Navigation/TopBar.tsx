import React from 'react';
import { motion } from 'motion/react';
import { Logo } from '../Logo';
import { LanguageSelector } from './LanguageSelector';
import { useApp } from '../../context/AppContext';

export const TopBar: React.FC = () => {
  const { returnToLanding } = useApp();

  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-md bg-[#EFF4F2]/80 border-b border-[#DDEBE5]/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Left: Logo (mobile & tablet) */}
        <div className="flex items-center gap-3">
          <button
            onClick={returnToLanding}
            aria-label="Return to Sylva home page"
            className="flex items-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#34796E] rounded-lg p-0.5"
          >
            <Logo size="sm" />
          </button>
        </div>

        {/* Right: About link and Language Selector */}
        <div className="flex items-center gap-3 sm:gap-5">
          <motion.button
            onClick={returnToLanding}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.95 }}
            className="text-sm font-medium text-[#648078] hover:text-[#203A37] transition-colors cursor-pointer px-2.5 py-1.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#34796E]/30"
          >
            About
          </motion.button>

          <LanguageSelector compact />
        </div>
      </div>
    </header>
  );
};
