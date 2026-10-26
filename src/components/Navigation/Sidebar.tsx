import React from 'react';
import { motion } from 'motion/react';
import { ScanLine, CloudSun, BookOpenCheck, LucideIcon, Sun, Moon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BOUNCY_SPRING, TABS, TabType } from '../../theme';

const TAB_ICONS: Record<TabType, LucideIcon> = {
  scan: ScanLine,
  weather: CloudSun,
  'field-log': BookOpenCheck,
};

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, language, theme, toggleTheme } = useApp();

  return (
    <aside
      aria-label="Sidebar Navigation"
      className="hidden md:flex flex-col w-64 shrink-0 h-[calc(100vh-3.5rem)] sticky top-14 p-4 border-r border-[var(--glass-border)] bg-[var(--surface-glass)] backdrop-blur-md z-20"
    >
      <div className="flex-1 space-y-2 pt-2">
        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
          Workspace
        </div>

        {TABS.map((tab) => {
          const Icon = TAB_ICONS[tab.id];
          const isActive = activeTab === tab.id;
          const label = tab.label[language] || tab.label.en;

          return (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileTap={{ scale: 0.96 }}
              transition={BOUNCY_SPRING}
              className={`relative w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-left cursor-pointer transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-accent)] ${
                isActive
                  ? 'text-[var(--text-primary)] font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-border-subtle)]'
              }`}
            >
              {/* Frosted pill indicator behind active tab */}
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicatorSidebar"
                  transition={BOUNCY_SPRING}
                  className="absolute inset-0 bg-[var(--surface-glass-elevated)] border border-[var(--glass-border)] shadow-[var(--glass-shadow)] rounded-2xl backdrop-blur-md -z-10"
                />
              )}

              {/* Icon */}
              <motion.div
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={BOUNCY_SPRING}
                className={`p-1.5 rounded-xl transition-colors ${
                  isActive
                    ? 'text-[var(--primary-accent)] bg-[var(--primary-accent)]/15'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                <Icon className="w-5 h-5" />
              </motion.div>

              <span className="text-sm font-medium tracking-tight truncate">
                {label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Theme toggle & version */}
      <div className="pt-3 border-t border-[var(--glass-border-subtle)] px-2 space-y-3">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border border-[var(--glass-border)] bg-[var(--surface-glass-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-all shadow-2xs"
          title="Toggle between Eucalyptus Haze and Midnight Sylva"
        >
          <span className="flex items-center gap-2">
            {theme === 'dark' ? <Moon className="w-3.5 h-3.5 text-[#9AD5C1]" /> : <Sun className="w-3.5 h-3.5 text-[#34796E]" />}
            <span>{theme === 'dark' ? 'Midnight Sylva' : 'Eucalyptus Haze'}</span>
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-[var(--primary-accent)]/15 text-[var(--primary-accent)]">
            {theme === 'dark' ? 'Dark' : 'Light'}
          </span>
        </button>

        <div className="text-[11px] text-[var(--text-secondary)] opacity-75">
          Sylva Agro-Pathology v1.0
        </div>
      </div>
    </aside>
  );
};
