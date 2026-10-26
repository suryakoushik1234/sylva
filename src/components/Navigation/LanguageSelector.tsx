import React from 'react';
import { Globe } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LANGUAGES, SupportedLanguage } from '../../theme';

export const LanguageSelector: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { language, setLanguage } = useApp();

  return (
    <div className="relative inline-flex items-center">
      <label htmlFor="sylva-language-select" className="sr-only">
        Language
      </label>
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--glass-border)] bg-[var(--surface-glass-elevated)] backdrop-blur-md shadow-2xs text-[var(--text-primary)] text-xs sm:text-sm font-medium transition-colors hover:border-[var(--primary-accent)]/40 focus-within:ring-2 focus-within:ring-[var(--primary-accent)]/30">
        <Globe className="w-3.5 h-3.5 text-[var(--primary-accent)] shrink-0" aria-hidden="true" />
        <select
          id="sylva-language-select"
          value={language}
          onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
          className="bg-transparent text-[var(--text-primary)] text-xs sm:text-sm font-medium focus:outline-none cursor-pointer pr-1"
          aria-label="Language selection"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code} className="bg-[var(--bg-app)] text-[var(--text-primary)]">
              {compact ? lang.nativeName : `${lang.name} (${lang.nativeName})`}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
