import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TopBar } from './Navigation/TopBar';
import { Sidebar } from './Navigation/Sidebar';
import { BottomTabBar } from './Navigation/BottomTabBar';
import { ScanTab } from './Tabs/ScanTab';
import { WeatherTab } from './Tabs/WeatherTab';
import { FieldLogTab } from './Tabs/FieldLogTab';
import { useApp } from '../context/AppContext';
import { BOUNCY_SPRING } from '../theme';

export const AppShell: React.FC = () => {
  const { activeTab, tabDirection } = useApp();

  const tabVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 36 : direction < 0 ? -36 : 0,
      opacity: 0,
      scale: 0.985,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: BOUNCY_SPRING,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -36 : direction < 0 ? 36 : 0,
      opacity: 0,
      scale: 0.985,
      transition: { duration: 0.18, ease: 'easeOut' as const },
    }),
  };

  return (
    <div className="relative min-h-screen flex flex-col z-10">
      {/* Slim Top Bar */}
      <TopBar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Left Sidebar on desktop (>=768px) */}
        <Sidebar />

        {/* Dynamic Tab Content Area */}
        <main
          id="main-tab-content"
          className="flex-1 p-4 sm:p-6 md:p-8 pb-28 md:pb-8 overflow-x-hidden min-w-0"
        >
          <AnimatePresence mode="wait" custom={tabDirection}>
            <motion.div
              key={activeTab}
              custom={tabDirection}
              variants={tabVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full"
            >
              {activeTab === 'scan' && <ScanTab />}
              {activeTab === 'weather' && <WeatherTab />}
              {activeTab === 'field-log' && <FieldLogTab />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Floating Bottom Tab Bar on mobile (<768px) */}
      <BottomTabBar />
    </div>
  );
};
