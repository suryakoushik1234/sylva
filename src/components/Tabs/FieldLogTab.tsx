import React from 'react';
import { motion } from 'motion/react';
import { BookOpenCheck, Calendar, ShieldCheck } from 'lucide-react';
import { BOUNCY_SPRING } from '../../theme';
import { useApp } from '../../context/AppContext';
import { getSeverityStyle } from '../../utils/storage';

export const FieldLogTab: React.FC = () => {
  const { language, scans } = useApp();

  const titles: Record<string, { title: string; subtitle: string }> = {
    en: {
      title: 'Field Log',
      subtitle: 'Historical inspections and treatment action logs.',
    },
    hi: {
      title: 'खेत लॉग',
      subtitle: 'ऐतिहासिक निरीक्षण और उपचार कार्रवाई लॉग।',
    },
    te: {
      title: 'ఫీల్డ్ లాగ్',
      subtitle: 'మునుపటి తనిఖీలు మరియు చికిత్సా చర్యల లాగ్‌లు.',
    },
    kn: {
      title: 'ಫೀಲ್ಡ್ ಲಾಗ್',
      subtitle: 'ಹಿಂದಿನ ತಪಾಸಣೆಗಳು ಮತ್ತು ಚಿಕಿತ್ಸಾ ಕ್ರಿಯೆಯ ದಾಖಲೆಗಳು.',
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

      {/* Field Log Listing or Empty State */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 0.999, y: 0 }}
        transition={{ ...BOUNCY_SPRING, delay: 0.08 }}
        className="sylva-card p-6 sm:p-8"
      >
        {scans.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-10 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#34796E]/12 border border-[#34796E]/20 flex items-center justify-center text-[#34796E]">
              <BookOpenCheck className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-[#203A37]">No logs recorded yet</h2>
              <p className="text-sm text-[#648078] max-w-sm">
                Completed crop diagnostics and treatment regimens will automatically appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {scans.map((scan) => {
              const sev = getSeverityStyle(scan.severity);
              const dateStr = new Date(scan.timestamp).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              });

              return (
                <div
                  key={scan.id}
                  className="p-4 rounded-xl bg-[#EFF4F2]/70 border border-white/60 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#34796E]/10 flex items-center justify-center text-[#34796E]">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#203A37]">
                        {scan.cropName} — {scan.conditionName}
                      </div>
                      <div className="text-xs text-[#648078]">{scan.shortSummary}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-semibold capitalize tabular-nums"
                      style={{
                        color: sev.color,
                        backgroundColor: sev.bg,
                        border: `1px solid ${sev.border}`,
                      }}
                    >
                      {scan.severity} ({scan.confidence}%)
                    </span>
                    <span className="text-xs text-[#648078] flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {dateStr}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};
