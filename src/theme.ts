/**
 * Sylva Design Tokens and Animation Constants
 */

export const THEME_COLORS = {
  mistWhite: '#EFF4F2',
  eucalyptusMist: '#DDEBE5',
  paleSage: '#A5C9BC',
  eucalyptusTeal: '#34796E',
  deepBotanical: '#203A37',
  mutedSage: '#648078',
  severityMedium: '#C0772C',
  severityHigh: '#A8423F',
} as const;

export type ThemeMode = 'light' | 'dark';

export const LIGHT_THEME = {
  background: '#EFF4F2',
  secondarySurface: '#DDEBE5',
  highlight: '#A5C9BC',
  primaryTeal: '#34796E',
  mainText: '#203A37',
  secondaryText: '#648078',
} as const;

export const DARK_THEME = {
  background: '#151622',
  secondaryBackground: '#24273C',
  primaryGlassSurface: 'rgba(35, 37, 54, 0.56)',
  elevatedGlassSurface: 'rgba(43, 46, 65, 0.76)',
  mainText: '#E6F0EB',
  secondaryText: '#A0B8AD',
  mutedText: '#879BA0',
  primaryAccent: '#9AD5C1',
  secondaryAccent: '#70B9A3',
  buttonTextOnMint: '#142823',
  glassBorders: 'rgba(218, 230, 235, 0.13)',
  glassBordersHighlight: 'rgba(226, 236, 240, 0.21)',
  shadows: 'rgba(0, 0, 0, 0.22)',
  glowPurple: '#35304D',
  glowTeal: '#155A63',
  glowPlum: '#493047',
  midnightBlue: '#142B35',
} as const;

// Framer Motion spring presets as specified in prompt:
// stiffness: ~380, damping: ~22
export const BOUNCY_SPRING = {
  type: 'spring',
  stiffness: 380,
  damping: 22,
  mass: 0.9,
} as const;

export const ASSISTANT_SPRING = {
  type: 'spring',
  stiffness: 380,
  damping: 26,
} as const;

export const GENTLE_SPRING = {
  type: 'spring',
  stiffness: 280,
  damping: 26,
} as const;

export type SupportedLanguage = 'en' | 'hi' | 'te' | 'kn';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
];

export type TabType = 'scan' | 'weather' | 'field-log';

export interface TabConfig {
  id: TabType;
  label: Record<SupportedLanguage, string>;
  subtitle: Record<SupportedLanguage, string>;
  iconName: string;
}

export const TABS: TabConfig[] = [
  {
    id: 'scan',
    label: {
      en: 'Scan',
      hi: 'स्कैन',
      te: 'స్కాన్',
      kn: 'ಸ್ಕ್ಯಾನ್',
    },
    subtitle: {
      en: 'Diagnose leaf symptoms & pests',
      hi: 'पत्ती के लक्षण और कीटों की पहचान करें',
      te: 'ఆకు తెగుళ్లు మరియు కీటకాలను గుర్తించండి',
      kn: 'ಎಲೆಯ ರೋಗಲಕ್ಷಣಗಳು ಮತ್ತು ಕೀಟಗಳನ್ನು ಗುರುತಿಸಿ',
    },
    iconName: 'ScanLine',
  },
  {
    id: 'weather',
    label: {
      en: 'Weather',
      hi: 'मौसम',
      te: 'వాతావరణం',
      kn: 'ಹವಾಮಾನ',
    },
    subtitle: {
      en: 'Microclimate risk & spraying alerts',
      hi: 'सूक्ष्म जलवायु जोखिम और छिड़काव अलर्ट',
      te: 'సూక్ష్మ వాతావరణ ప్రమాదాలు మరియు పిచికారీ హెచ్చరికలు',
      kn: 'ಸೂಕ್ಷ್ಮ ಹವಾಮಾನ ಅಪಾಯ ಮತ್ತು ಸಿಂಪಡಣೆ ಎಚ್ಚರಿಕೆಗಳು',
    },
    iconName: 'CloudSun',
  },
  {
    id: 'field-log',
    label: {
      en: 'Field Log',
      hi: 'खेत लॉग',
      te: 'ఫీల్డ్ లాగ్',
      kn: 'ಫೀಲ್ಡ್ ಲಾಗ್',
    },
    subtitle: {
      en: 'Timeline of crops and treatments',
      hi: 'फसलों और उपचारों की समयरेखा',
      te: 'పంటలు మరియు చికిత్సల చరిత్ర',
      kn: 'ಬೆಳೆಗಳು ಮತ್ತು ಚಿಕಿತ್ಸೆಗಳ ಟೈಮ್‌ಲೈನ್',
    },
    iconName: 'BookOpenCheck',
  },
];
