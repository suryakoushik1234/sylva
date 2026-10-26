import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Share2,
  Check,
  AlertCircle,
  Clock,
  CalendarDays,
  ShieldCheck,
  CloudSun,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { DiagnosisRecord, ScanHistoryItem } from '../../types';
import { useApp } from '../../context/AppContext';
import { getUrgencyStyle } from '../../utils/storage';
import { downloadCalendarEvent, shareDiagnosisResult } from '../../utils/diagnosis';
import { BOUNCY_SPRING } from '../../theme';

interface ActionPlanCardProps {
  diagnosis: DiagnosisRecord | ScanHistoryItem;
  onNavigateToWeather?: () => void;
}

export const ActionPlanCard: React.FC<ActionPlanCardProps> = ({
  diagnosis,
  onNavigateToWeather,
}) => {
  const { language, toggleStepCompletion, getCompletedSteps, setActiveTab, openChatWithPrompt } =
    useApp();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const completed = getCompletedSteps(diagnosis.id);

  const urgency = diagnosis.urgency || (diagnosis.severity === 'high' ? 'act_today' : 'act_this_week');
  const urgencyStyle = getUrgencyStyle(urgency);

  const todaySteps =
    diagnosis.today_steps && diagnosis.today_steps.length > 0
      ? diagnosis.today_steps
      : ['Prune and isolate visibly infected foliage away from the field.', 'Avoid overhead sprinkler watering to reduce humidity.'];

  const thisWeekSteps =
    diagnosis.this_week_steps && diagnosis.this_week_steps.length > 0
      ? diagnosis.this_week_steps
      : [
          'Apply bio-fungicide or horticultural organic spray in early morning.',
          'If rapid lesion expansion persists, apply approved protectant fungicide as last resort.',
        ];

  const preventSeasonSteps =
    diagnosis.prevent_next_season && diagnosis.prevent_next_season.length > 0
      ? diagnosis.prevent_next_season
      : [
          'Rotate with non-host crop families for the upcoming planting cycle.',
          'Ensure adequate furrow drainage and optimize seedling spacing for canopy airflow.',
        ];

  const handleShare = async () => {
    const outcome = await shareDiagnosisResult(
      {
        cropName: diagnosis.cropName,
        conditionName: diagnosis.conditionName,
        severity: diagnosis.severity,
        today_steps: todaySteps,
      },
      language
    );

    if (outcome === 'shared' || outcome === 'opened_whatsapp') {
      showToast('Ready to share');
    } else {
      showToast('Copied summary');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleDownloadCalendar = () => {
    downloadCalendarEvent(diagnosis.cropName);
    showToast('Calendar event downloaded');
  };

  const handleGoToWeather = () => {
    if (onNavigateToWeather) {
      onNavigateToWeather();
    } else {
      setActiveTab('weather');
    }
  };

  return (
    <div className="sylva-card p-5 sm:p-7 space-y-6 relative overflow-hidden">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={BOUNCY_SPRING}
            className="absolute top-4 right-4 z-50 px-4 py-2 rounded-xl bg-[#203A37] text-[#EFF4F2] text-xs font-semibold shadow-lg flex items-center gap-2"
          >
            <Check className="w-3.5 h-3.5 text-[#A5C9BC]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & Urgency Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#34796E]">
              Action Plan
            </span>
            <span className="text-xs text-[#648078]">•</span>
            <span className="text-xs text-[#648078]">Integrated Pest Management</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-[#203A37]">
            Treatment &amp; Recovery Strategy
          </h3>
        </div>

        {/* Urgency Banner */}
        <div
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold self-start sm:self-auto uppercase tracking-wide border shadow-2xs"
          style={{
            color: urgencyStyle.color,
            backgroundColor: urgencyStyle.bg,
            borderColor: urgencyStyle.border,
          }}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{urgencyStyle.label}</span>
        </div>
      </div>

      {/* Treatment Sequence Note (Cultural/Organic first -> Biological -> Chemical last) */}
      <div className="p-3 rounded-xl bg-[#EFF4F2]/70 border border-white/80 text-xs text-[#648078] flex items-center gap-2.5">
        <Sparkles className="w-4 h-4 text-[#34796E] shrink-0" />
        <span>
          Ordered <strong className="text-[#203A37]">cultural &amp; organic first</strong>,{' '}
          <strong className="text-[#203A37]">biological second</strong>, and{' '}
          <strong className="text-[#203A37]">chemical as a last resort</strong> using general product types.
        </span>
      </div>

      {/* Checklists Sections */}
      <div className="space-y-5">
        {/* Section 1: Today */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#203A37]">
            <Clock className="w-3.5 h-3.5 text-[#34796E]" />
            <span>Today's Actions</span>
            <span className="text-[10px] font-normal text-[#648078] lowercase">
              ({todaySteps.filter((_, i) => completed[`today-${i}`]).length}/{todaySteps.length} done)
            </span>
          </div>

          <div className="space-y-2">
            {todaySteps.map((step, idx) => {
              const key = `today-${idx}`;
              const isDone = Boolean(completed[key]);
              return (
                <div
                  key={key}
                  onClick={() => toggleStepCompletion(diagnosis.id, key)}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-150 cursor-pointer select-none ${
                    isDone
                      ? 'bg-[#DDEBE5]/40 border-[#A5C9BC]/40 text-[#648078]'
                      : 'bg-[#EFF4F2]/80 border-white/90 hover:border-[#34796E]/40 text-[#203A37]'
                  }`}
                >
                  <div
                    className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                      isDone
                        ? 'bg-[#34796E] border-[#34796E] text-white'
                        : 'border-[#648078]/50 bg-white'
                    }`}
                  >
                    {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className={`text-xs sm:text-sm leading-relaxed ${isDone ? 'line-through text-[#648078]' : ''}`}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: This Week */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#203A37]">
            <CalendarDays className="w-3.5 h-3.5 text-[#34796E]" />
            <span>This Week's Plan</span>
            <span className="text-[10px] font-normal text-[#648078] lowercase">
              ({thisWeekSteps.filter((_, i) => completed[`week-${i}`]).length}/{thisWeekSteps.length} done)
            </span>
          </div>

          <div className="space-y-2">
            {thisWeekSteps.map((step, idx) => {
              const key = `week-${idx}`;
              const isDone = Boolean(completed[key]);
              return (
                <div
                  key={key}
                  onClick={() => toggleStepCompletion(diagnosis.id, key)}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-150 cursor-pointer select-none ${
                    isDone
                      ? 'bg-[#DDEBE5]/40 border-[#A5C9BC]/40 text-[#648078]'
                      : 'bg-[#EFF4F2]/80 border-white/90 hover:border-[#34796E]/40 text-[#203A37]'
                  }`}
                >
                  <div
                    className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                      isDone
                        ? 'bg-[#34796E] border-[#34796E] text-white'
                        : 'border-[#648078]/50 bg-white'
                    }`}
                  >
                    {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className={`text-xs sm:text-sm leading-relaxed ${isDone ? 'line-through text-[#648078]' : ''}`}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Prevent Next Season */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#203A37]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#34796E]" />
            <span>Prevent Next Season</span>
            <span className="text-[10px] font-normal text-[#648078] lowercase">
              ({preventSeasonSteps.filter((_, i) => completed[`prevent-${i}`]).length}/{preventSeasonSteps.length} done)
            </span>
          </div>

          <div className="space-y-2">
            {preventSeasonSteps.map((step, idx) => {
              const key = `prevent-${idx}`;
              const isDone = Boolean(completed[key]);
              return (
                <div
                  key={key}
                  onClick={() => toggleStepCompletion(diagnosis.id, key)}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-150 cursor-pointer select-none ${
                    isDone
                      ? 'bg-[#DDEBE5]/40 border-[#A5C9BC]/40 text-[#648078]'
                      : 'bg-[#EFF4F2]/80 border-white/90 hover:border-[#34796E]/40 text-[#203A37]'
                  }`}
                >
                  <div
                    className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                      isDone
                        ? 'bg-[#34796E] border-[#34796E] text-white'
                        : 'border-[#648078]/50 bg-white'
                    }`}
                  >
                    {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className={`text-xs sm:text-sm leading-relaxed ${isDone ? 'line-through text-[#648078]' : ''}`}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* When to call an expert line (Shown only when call_expert is true) */}
      {diagnosis.call_expert && (
        <div className="p-3.5 rounded-2xl bg-[#A8423F]/10 border border-[#A8423F]/30 flex items-start gap-3 text-xs sm:text-sm text-[#A8423F]">
          <UserCheck className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold">When to call an expert: </span>
            <span>
              High infection severity or foliar wilting detected. Contact your local agricultural extension
              officer or Krishi Vigyan Kendra (KVK) immediately for physical field confirmation before widespread treatment.
            </span>
          </div>
        </div>
      )}

      {/* Linked Best Spray Window Banner */}
      <div className="p-4 rounded-2xl bg-[#DDEBE5]/70 border border-white/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#34796E]/12 border border-[#34796E]/20 flex items-center justify-center text-[#34796E] shrink-0">
            <CloudSun className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#203A37]">
              Best window to treat {diagnosis.conditionName}
            </div>
            <div className="text-[11px] text-[#648078]">
              Calibrated with 48h hourly wind and rain probability
            </div>
          </div>
        </div>

        <motion.button
          onClick={handleGoToWeather}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.96 }}
          transition={BOUNCY_SPRING}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-[#34796E] text-[#EFF4F2] text-xs font-semibold hover:bg-[#2c655c] cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <span>View spray window</span>
        </motion.button>
      </div>

      {/* Utility Actions Bar: Remind me, Share, Chat with Agronomist */}
      <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-[#A5C9BC]/30">
        {/* Remind me to re-check */}
        <motion.button
          onClick={handleDownloadCalendar}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.96 }}
          transition={BOUNCY_SPRING}
          className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-white/90 bg-[#EFF4F2]/80 text-[#203A37] text-xs font-semibold hover:border-[#34796E]/50 cursor-pointer shadow-2xs"
          title="Download calendar event to inspect crop in 5 days"
        >
          <Calendar className="w-3.5 h-3.5 text-[#34796E]" />
          <span>Remind me to re-check</span>
        </motion.button>

        {/* Share Button */}
        <motion.button
          onClick={handleShare}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.96 }}
          transition={BOUNCY_SPRING}
          className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-white/90 bg-[#EFF4F2]/80 text-[#203A37] text-xs font-semibold hover:border-[#34796E]/50 cursor-pointer shadow-2xs"
          title="Share diagnosis summary via Web Share or WhatsApp"
        >
          <Share2 className="w-3.5 h-3.5 text-[#34796E]" />
          <span>Share</span>
        </motion.button>

        {/* Ask Sylva live chat button */}
        <motion.button
          onClick={() =>
            openChatWithPrompt(`What should I prioritize first for ${diagnosis.conditionName} on my ${diagnosis.cropName}?`)
          }
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.96 }}
          transition={BOUNCY_SPRING}
          className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-white/90 bg-[#EFF4F2]/80 text-[#34796E] text-xs font-semibold hover:bg-[#DDEBE5] cursor-pointer shadow-2xs ml-auto"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ask Sylva Voice / Chat</span>
        </motion.button>
      </div>

      {/* Compulsory Safety Disclaimer Line */}
      <div className="pt-1 text-[11px] text-[#648078] flex items-center gap-1.5 border-t border-white/60">
        <AlertCircle className="w-3 h-3 text-[#C0772C] shrink-0" />
        <span>Follow the product label and confirm with your local agri officer / KVK.</span>
      </div>
    </div>
  );
};
