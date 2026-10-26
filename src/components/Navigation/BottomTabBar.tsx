import React from 'react';
import { motion } from 'motion/react';
import { ScanLine, CloudSun, BookOpenCheck, LucideIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BOUNCY_SPRING, TABS, TabType } from '../../theme';

const TAB_ICONS: Record<TabType, LucideIcon> = {
  scan: ScanLine,
  weather: CloudSun,
  'field-log': BookOpenCheck,
};

export const BottomTabBar: React.FC = () => {
  const { activeTab, setActiveTab, language } = useApp();

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-3 left-3 right-3 z-30 md:hidden flex justify-center pointer-events-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="pointer-events-auto w-full max-w-md bg-[var(--surface-glass)] backdrop-blur-[20px] border border-[var(--glass-border)] shadow-[var(--glass-shadow-elevated)] rounded-3xl p-1.5 flex items-center justify-around">
        {TABS.map((tab) => {
          const Icon = TAB_ICONS[tab.id];
          const isActive = activeTab === tab.id;
          const label = tab.label[language] || tab.label.en;

          return (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileTap={{ scale: 0.94 }}
              transition={BOUNCY_SPRING}
              className={`relative flex-1 flex flex-col items-center justify-center py-2 px-3 rounded-2xl cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-accent)] ${
                isActive ? 'text-[var(--text-primary)] font-bold' : 'text-[var(--text-secondary)]'
              }`}
            >
              {/* Frosted pill indicator behind active tab */}
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicatorMobile"
                  transition={BOUNCY_SPRING}
                  className="absolute inset-0 bg-[var(--surface-glass-elevated)] border border-[var(--glass-border)] rounded-2xl shadow-xs -z-10"
                />
              )}

              {/* Icon with spring bounce on active */}
              <motion.div
                animate={{ scale: isActive ? 1.14 : 1 }}
                transition={BOUNCY_SPRING}
                className={isActive ? 'text-[var(--primary-accent)]' : 'text-[var(--text-secondary)]'}
              >
                <Icon className="w-5 h-5" />
              </motion.div>

              <span className="text-[11px] font-semibold tracking-tight mt-0.5">
                {label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};
