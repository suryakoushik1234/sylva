import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, ShieldAlert, CheckCircle2, Award } from 'lucide-react';
import { HACKATHON_DEMO_PRESETS, DemoPreset, createDiagnosisFromPreset } from '../../utils/pathology';
import { useApp } from '../../context/AppContext';
import { BOUNCY_SPRING } from '../../theme';
import { createScanRecordFromDiagnosis } from '../../utils/diagnosis';

interface HackathonDemoDeckProps {
  onPresetSelected?: (preset: DemoPreset) => void;
  compact?: boolean;
}

export const HackathonDemoDeck: React.FC<HackathonDemoDeckProps> = ({
  onPresetSelected,
  compact = false,
}) => {
  const { setLatestDiagnosis, addScan, setActiveTab } = useApp();

  const handleSelectPreset = (preset: DemoPreset) => {
    const diag = createDiagnosisFromPreset(preset);
    setLatestDiagnosis(diag);
    addScan(createScanRecordFromDiagnosis(diag, preset.imagePath));
    if (onPresetSelected) {
      onPresetSelected(preset);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--primary-accent)] flex items-center gap-1 shrink-0">
          <Award className="w-3.5 h-3.5" />
          <span>Demo Scenarios:</span>
        </span>
        {HACKATHON_DEMO_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handleSelectPreset(preset)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border border-[var(--glass-border)] bg-[var(--surface-glass-elevated)] hover:border-[var(--primary-accent)] hover:text-[var(--primary-accent)] text-[var(--text-primary)] transition-all cursor-pointer shadow-2xs shrink-0"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                preset.severity === 'high' ? 'bg-rose-500' : 'bg-amber-500'
              }`}
            />
            <span>{preset.label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="sylva-card p-5 sm:p-6 space-y-4">
      {/* Header with Pitch Kicker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--glass-border-subtle)]">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--primary-accent)]/15 text-[var(--primary-accent)]">
              <Award className="w-3 h-3" />
              <span>Hackathon Evaluation Deck</span>
            </span>
            <span className="text-xs text-[var(--text-secondary)]">· 1-Click Live Scenarios</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
            Instant Agronomic Field Scenarios for Judges
          </h3>
        </div>
        <div className="text-xs text-[var(--text-secondary)] sm:text-right">
          Test real foliage pathology & spray timing in seconds
        </div>
      </div>

      {/* Preset Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {HACKATHON_DEMO_PRESETS.map((preset) => (
          <motion.div
            key={preset.id}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.98 }}
            transition={BOUNCY_SPRING}
            onClick={() => handleSelectPreset(preset)}
            className="sylva-card-elevated p-4 cursor-pointer hover:border-[var(--primary-accent)] transition-all duration-200 flex flex-col justify-between space-y-3 group"
          >
            {/* Top row: Thumbnail & Badge */}
            <div className="flex items-start gap-3">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[var(--glass-border)] bg-[var(--surface-glass)] shrink-0 shadow-2xs">
                <img
                  src={preset.imagePath}
                  alt={preset.label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <span
                  className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full border-2 border-white ${
                    preset.severity === 'high' ? 'bg-rose-500' : 'bg-amber-500'
                  }`}
                />
              </div>

              <div className="space-y-1 min-w-0 flex-1">
                <span
                  className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    preset.severity === 'high'
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                      : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                  }`}
                >
                  {preset.badge}
                </span>
                <div className="text-sm font-bold text-[var(--text-primary)] truncate">
                  {preset.label}
                </div>
                <div className="text-[11px] text-[var(--text-secondary)] font-mono tabular-nums">
                  Damage: <strong className="text-[var(--text-primary)]">{preset.damagePct}%</strong> · Conf:{' '}
                  {preset.confidence}%
                </div>
              </div>
            </div>

            {/* Middle: Brief Pitch Note */}
            <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
              {preset.pitchKicker}
            </p>

            {/* Bottom CTA Button */}
            <div className="pt-2 border-t border-[var(--glass-border-subtle)] flex items-center justify-between text-xs font-semibold text-[var(--primary-accent)] group-hover:text-[var(--text-primary)] transition-colors">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Hydrate Full Analysis</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
