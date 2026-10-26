import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpenCheck,
  Calendar,
  Share2,
  ChevronDown,
  ChevronUp,
  Trash2,
  Check,
  Leaf,
  RotateCcw,
} from 'lucide-react';
import { BOUNCY_SPRING } from '../../theme';
import { useApp } from '../../context/AppContext';
import { getSeverityStyle, DEFAULT_INDIAN_SCANS } from '../../utils/storage';
import { shareDiagnosisResult } from '../../utils/diagnosis';
import { ActionPlanCard } from '../Cards/ActionPlanCard';

export const FieldLogTab: React.FC = () => {
  const { language, scans, addScan, clearScans, setActiveTab } = useApp();
  const [expandedScanId, setExpandedScanId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const titles: Record<string, { title: string; subtitle: string }> = {
    en: {
      title: 'Field Log',
      subtitle: 'Historical inspections, checklists, and treatment action logs.',
    },
    hi: {
      title: 'खेत लॉग',
      subtitle: 'ऐतिहासिक निरीक्षण, चेकलिस्ट और उपचार कार्रवाई लॉग।',
    },
    te: {
      title: 'ఫీల్డ్ లాగ్',
      subtitle: 'మునుపటి తనిఖీలు, చెక్‌లిస్ట్‌లు మరియు చికిత్సా చర్యల లాగ్‌లు.',
    },
    kn: {
      title: 'ಫೀಲ್ಡ್ ಲಾಗ್',
      subtitle: 'ಹಿಂದಿನ ತಪಾಸಣೆಗಳು, ಪರಿಶೀಲನಾಪಟ್ಟಿಗಳು ಮತ್ತು ಚಿಕಿತ್ಸಾ ಕ್ರಿಯೆಯ ದಾಖಲೆಗಳು.',
    },
  };

  const copy = titles[language] || titles.en;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleShareScan = async (scan: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const outcome = await shareDiagnosisResult(
      {
        cropName: scan.cropName,
        conditionName: scan.conditionName,
        severity: scan.severity,
        today_steps: scan.today_steps,
      },
      language
    );

    if (outcome === 'shared' || outcome === 'opened_whatsapp') {
      showToast('Ready to share');
    } else {
      showToast('Copied summary');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={BOUNCY_SPRING}
            className="fixed top-5 right-5 z-50 px-4 py-2 rounded-xl bg-[var(--text-primary)] text-[var(--bg-app)] text-xs font-semibold shadow-lg flex items-center gap-2"
          >
            <Check className="w-3.5 h-3.5 text-[var(--primary-accent)]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Title Header with spring animate-in */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 0.999, y: 0 }}
        transition={BOUNCY_SPRING}
        className="flex items-center justify-between flex-wrap gap-3"
      >
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            {copy.title}
          </h1>
          <p className="text-sm sm:text-base text-[var(--text-secondary)]">{copy.subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              DEFAULT_INDIAN_SCANS.forEach((s) => {
                if (!scans.some((existing) => existing.id === s.id)) {
                  addScan(s);
                }
              });
              showToast('Loaded sample field records');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--glass-border)] bg-[var(--surface-glass-elevated)] text-[var(--primary-accent)] hover:opacity-90 text-xs font-semibold cursor-pointer shadow-2xs"
            title="Load realistic field inspection logs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Sample Records</span>
          </button>

          {scans.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Clear all historical field records?')) {
                  clearScans();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--glass-border)] bg-[var(--surface-glass-elevated)] text-[var(--text-secondary)] hover:text-[var(--status-poor)] text-xs font-semibold cursor-pointer shadow-2xs"
              title="Clear all logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </motion.div>

      {/* Field Log Listing or Empty State */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 0.999, y: 0 }}
        transition={{ ...BOUNCY_SPRING, delay: 0.08 }}
        className="sylva-card p-5 sm:p-7 space-y-4"
      >
        {scans.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-12 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[var(--primary-accent)]/15 border border-[var(--primary-accent)]/30 flex items-center justify-center text-[var(--primary-accent)]">
              <BookOpenCheck className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">No logs recorded yet</h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-sm">
                Complete a leaf scan or load authentic field inspections with IPM recovery plans.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  DEFAULT_INDIAN_SCANS.forEach((s) => addScan(s));
                  showToast('Loaded sample records');
                }}
                className="px-4 py-2 rounded-xl bg-[var(--primary-accent)] text-[var(--text-on-accent)] text-xs font-semibold hover:opacity-90 cursor-pointer shadow-xs"
              >
                Load Sample Records
              </button>

              <button
                onClick={() => setActiveTab('scan')}
                className="px-4 py-2 rounded-xl border border-[var(--glass-border)] bg-[var(--surface-glass-elevated)] text-[var(--text-primary)] text-xs font-semibold hover:opacity-90 cursor-pointer"
              >
                Go to Scan Tab
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {scans.map((scan) => {
              const sev = getSeverityStyle(scan.severity);
              const dateStr = new Date(scan.timestamp).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });
              const isExpanded = expandedScanId === scan.id;

              return (
                <div
                  key={scan.id}
                  className="rounded-2xl bg-[var(--surface-glass-elevated)] border border-[var(--glass-border)] overflow-hidden transition-all duration-200"
                >
                  <div
                    onClick={() => setExpandedScanId(isExpanded ? null : scan.id)}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-[var(--surface-glass)] select-none"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {scan.imageThumbnail ? (
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[var(--surface-glass)] shrink-0 border border-[var(--glass-border)] shadow-2xs">
                          <img
                            src={scan.imageThumbnail}
                            alt={scan.cropName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-[var(--primary-accent)]/15 flex items-center justify-center text-[var(--primary-accent)] shrink-0">
                          <Leaf className="w-6 h-6" />
                        </div>
                      )}

                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                            {scan.cropName}
                          </span>
                          <span className="text-[10px] font-semibold text-[var(--primary-accent)] bg-[var(--primary-accent)]/15 px-2 py-0.5 rounded-md">
                            Leaf Foliage
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-[var(--text-secondary)]">
                          {scan.conditionName}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)] truncate max-w-md">
                          {scan.shortSummary}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-semibold capitalize tabular-nums"
                        style={{
                          color: sev.color,
                          backgroundColor: sev.bg,
                          border: `1px solid ${sev.border}`,
                        }}
                      >
                        {scan.severity} ({Math.round(scan.confidence)}%)
                      </span>

                      <span className="text-[11px] text-[var(--text-secondary)] hidden sm:flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {dateStr}
                      </span>

                      {/* Share button */}
                      <button
                        onClick={(e) => handleShareScan(scan, e)}
                        className="p-1.5 rounded-lg border border-[var(--glass-border)] bg-[var(--surface-glass)] text-[var(--primary-accent)] hover:bg-[var(--surface-glass-elevated)] transition-colors cursor-pointer shadow-2xs"
                        title="Share report"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="p-1 text-[var(--text-secondary)]">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Action Plan Card View */}
                  {isExpanded && (
                    <div className="p-4 pt-0 border-t border-[var(--glass-border-subtle)]">
                      <ActionPlanCard
                        diagnosis={{
                          id: scan.id,
                          cropName: scan.cropName,
                          conditionName: scan.conditionName,
                          category: 'fungal',
                          severity: scan.severity,
                          confidence: scan.confidence,
                          summary: scan.shortSummary,
                          actions: scan.today_steps || ['Inspect foliage'],
                          urgency: scan.urgency || (scan.severity === 'high' ? 'act_today' : 'act_this_week'),
                          today_steps: scan.today_steps || [],
                          this_week_steps: scan.this_week_steps || [],
                          prevent_next_season: scan.prevent_next_season || [],
                          call_expert: Boolean(scan.call_expert),
                          createdAt: new Date(scan.timestamp).toISOString(),
                        }}
                        onNavigateToWeather={() => setActiveTab('weather')}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};
