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
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/70 bg-[#DDEBE5]/70 backdrop-blur-md shadow-xs text-[#203A37] text-sm font-medium transition-colors hover:border-[#34796E]/40 focus-within:ring-2 focus-within:ring-[#34796E]/30">
        <Globe className="w-3.5 h-3.5 text-[#34796E] shrink-0" aria-hidden="true" />
        <select
          id="sylva-language-select"
          value={language}
          onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
          className="bg-transparent text-[#203A37] text-sm font-medium focus:outline-none cursor-pointer pr-1"
          aria-label="Language selection"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code} className="bg-[#EFF4F2] text-[#203A37]">
              {compact ? lang.nativeName : `${lang.name} (${lang.nativeName})`}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
