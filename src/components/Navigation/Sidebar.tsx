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

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, language } = useApp();

  return (
    <aside
      aria-label="Sidebar Navigation"
      className="hidden md:flex flex-col w-64 shrink-0 h-[calc(100vh-3.5rem)] sticky top-14 p-4 border-r border-[#DDEBE5]/80 bg-[#EFF4F2]/50 backdrop-blur-sm z-20"
    >
      <div className="flex-1 space-y-2 pt-2">
        <div className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-[#648078]">
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
              whileTap={{ scale: 0.94 }}
              transition={BOUNCY_SPRING}
              className={`relative w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-left cursor-pointer transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#34796E] ${
                isActive
                  ? 'text-[#203A37] font-semibold'
                  : 'text-[#648078] hover:text-[#203A37] hover:bg-[#DDEBE5]/30'
              }`}
            >
              {/* Frosted pill indicator behind active tab with spring overshoot */}
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicatorSidebar"
                  transition={BOUNCY_SPRING}
                  className="absolute inset-0 bg-[#DDEBE5]/90 border border-white/80 shadow-[0_4px_16px_rgba(52,121,110,0.08)] rounded-2xl backdrop-blur-md -z-10"
                />
              )}

              {/* Icon with spring bounce on active */}
              <motion.div
                animate={{ scale: isActive ? 1.12 : 1 }}
                transition={BOUNCY_SPRING}
                className={`p-1.5 rounded-xl transition-colors ${
                  isActive
                    ? 'text-[#34796E] bg-[#34796E]/10'
                    : 'text-[#648078]'
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

      <div className="pt-4 border-t border-[#DDEBE5]/80 px-2 text-xs text-[#648078]">
        Sylva Agro-Pathology v1.0
      </div>
    </aside>
  );
};
