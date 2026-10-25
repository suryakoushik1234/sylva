import React from 'react';
import { motion } from 'motion/react';
import { CloudSun, Droplets, Wind, AlertTriangle } from 'lucide-react';
import { BOUNCY_SPRING } from '../../theme';
import { useApp } from '../../context/AppContext';

export const WeatherTab: React.FC = () => {
  const { language } = useApp();

  const titles: Record<string, { title: string; subtitle: string }> = {
    en: {
      title: 'Weather',
      subtitle: 'Microclimate risk indicators and timely field spraying windows.',
    },
    hi: {
      title: 'मौसम',
      subtitle: 'सूक्ष्म जलवायु जोखिम संकेतक और समय पर खेत में छिड़काव खिड़कियां।',
    },
    te: {
      title: 'వాతావరణం',
      subtitle: 'సూక్ష్మ వాతావరణ ప్రమాద సూచికలు మరియు సకాలంలో పిచికారీ చేయడానికి అనువైన సమయం.',
    },
    kn: {
      title: 'ಹವಾಮಾನ',
      subtitle: 'ಸೂಕ್ಷ್ಮ ಹವಾಮಾನ ಅಪಾಯದ ಸೂಚಕಗಳು ಮತ್ತು ಸಕಾಲಿಕ ಸಿಂಪರಣೆ ಕಿಟಕಿಗಳು.',
    },
  };

  const copy = titles[language] || titles.en;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Title Header with spring animate-in */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 0.999, y: 0 }}
        transition={BOUNCY_SPRING}
        className="space-y-1.5"
      >
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#203A37]">
          {copy.title}
        </h1>
        <p className="text-sm sm:text-base text-[#648078]">
          {copy.subtitle}
        </p>
      </motion.div>

      {/* Weather Overview Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 0.999, y: 0 }}
        transition={{ ...BOUNCY_SPRING, delay: 0.08 }}
        className="sylva-card p-6 sm:p-8 space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#A5C9BC]/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#34796E]/12 border border-[#34796E]/20 flex items-center justify-center text-[#34796E]">
              <CloudSun className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#203A37]">Local Field Microclimate</div>
              <div className="text-xs text-[#648078]">Optimal fungal spore spore-monitoring</div>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#C0772C]/15 border border-[#C0772C]/30 text-[#C0772C]">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Fungal Risk: Medium</span>
          </div>
        </div>

        {/* Tabular metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#EFF4F2]/70 border border-white/60">
            <div className="text-xs font-medium text-[#648078] mb-1">Ambient Temperature</div>
            <div className="text-2xl font-bold text-[#203A37] tabular-nums">26.4°C</div>
            <div className="text-xs text-[#648078] mt-1">Normal canopy range</div>
          </div>

          <div className="p-4 rounded-xl bg-[#EFF4F2]/70 border border-white/60">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-[#648078]">Leaf Wetness / Humidity</span>
              <Droplets className="w-3.5 h-3.5 text-[#34796E]" />
            </div>
            <div className="text-2xl font-bold text-[#203A37] tabular-nums">78%</div>
            <div className="text-xs text-[#C0772C] mt-1">Elevated fungal incubation</div>
          </div>

          <div className="p-4 rounded-xl bg-[#EFF4F2]/70 border border-white/60">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-[#648078]">Wind Speed</span>
              <Wind className="w-3.5 h-3.5 text-[#34796E]" />
            </div>
            <div className="text-2xl font-bold text-[#203A37] tabular-nums">7.2 km/h</div>
            <div className="text-xs text-[#34796E] mt-1">Ideal for treatment spray</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
