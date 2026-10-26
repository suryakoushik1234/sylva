import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TopBar } from './Navigation/TopBar';
import { BottomTabBar } from './Navigation/BottomTabBar';
import { ChatbotBar } from './Chat/ChatbotBar';
import { ScanTab } from './Tabs/ScanTab';
import { WeatherTab } from './Tabs/WeatherTab';
import { FieldLogTab } from './Tabs/FieldLogTab';
import { useApp } from '../context/AppContext';
import { BOUNCY_SPRING } from '../theme';

export const AppShell: React.FC = () => {
  const { activeTab, tabDirection } = useApp();
  const [showDemoModal, setShowDemoModal] = useState<boolean>(false);

  const tabVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 28 : direction < 0 ? -28 : 0,
      opacity: 0,
      scale: 0.99,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: BOUNCY_SPRING,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -28 : direction < 0 ? 28 : 0,
      opacity: 0,
      scale: 0.99,
      transition: { duration: 0.16, ease: 'easeOut' as const },
    }),
  };

  return (
    <div className="relative min-h-screen flex flex-col z-10">
      {/* Top Glass Navigation Bar (Replaces left sidebar with modern dashboard header) */}
      <TopBar onOpenDemoDeck={() => setShowDemoModal(true)} />

      {/* Main Full-Width Dashboard Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 md:px-8 py-5 sm:py-7">
        <main
          id="main-tab-content"
          className="w-full pb-32 md:pb-24 overflow-x-hidden min-w-0"
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
              {activeTab === 'scan' && (
                <ScanTab
                  showDemoPresetsModal={showDemoModal}
                  onCloseDemoPresetsModal={() => setShowDemoModal(false)}
                />
              )}
              {activeTab === 'weather' && <WeatherTab />}
              {activeTab === 'field-log' && <FieldLogTab />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Floating Bottom Tab Bar on mobile (<768px) */}
      <BottomTabBar />

      {/* Floating Sylva Agronomist Voice & Chatbot Bar */}
      <ChatbotBar />
    </div>
  );
};
