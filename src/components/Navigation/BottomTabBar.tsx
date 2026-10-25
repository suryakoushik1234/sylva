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
      className="fixed bottom-4 left-4 right-4 z-40 md:hidden flex justify-center pointer-events-none"
    >
      <div className="pointer-events-auto w-full max-w-md bg-[#DDEBE5]/85 backdrop-blur-[16px] border border-white/70 shadow-[0_10px_28px_-4px_rgba(52,121,110,0.12)] rounded-3xl p-1.5 flex items-center justify-around">
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
              className={`relative flex-1 flex flex-col items-center justify-center py-2 px-3 rounded-2xl cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#34796E] ${
                isActive ? 'text-[#203A37] font-semibold' : 'text-[#648078]'
              }`}
            >
              {/* Frosted pill indicator behind active tab */}
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicatorMobile"
                  transition={BOUNCY_SPRING}
                  className="absolute inset-0 bg-[#EFF4F2]/90 border border-white/80 rounded-2xl shadow-xs -z-10"
                />
              )}

              {/* Icon with spring bounce on active */}
              <motion.div
                animate={{ scale: isActive ? 1.14 : 1 }}
                transition={BOUNCY_SPRING}
                className={isActive ? 'text-[#34796E]' : 'text-[#648078]'}
              >
                <Icon className="w-5 h-5" />
              </motion.div>

              <span className="text-[11px] font-medium tracking-tight mt-0.5">
                {label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};
