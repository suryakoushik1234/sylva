# Sylva — Developer & AI Handover Guide

Welcome to **Sylva**, an AI-powered agricultural crop disease & pest detection system with microclimate spray window forecasting and an interactive agronomist assistant.

---

## 1. Quick Architecture Overview

- **Framework**: React 19 + TypeScript (Vite 6 build system, Tailwind CSS v4 `@tailwindcss/vite`).
- **Server**: Express fullstack server in `/server.ts` with Gemini API (`gemini-2.5-flash`) for `/api/diagnose` and `/api/chat`.
- **State Management**: `src/context/AppContext.tsx` (manages active tab, diagnosis records, weather/spray state, selected language, and theme).
- **Core Tabs & Standout Features**:
  1. **Scan (`src/components/Tabs/ScanTab.tsx`)**: Wide 12-column desktop stage featuring:
     - **Interactive Leaf Pathology Heatmap (`src/components/Cards/PathologyHeatmapCanvas.tsx`)**: Toggle between *Pathology Heatmap*, *Lesion Contours*, and *Natural Photo*, with opacity slider, foliar necrosis percentage meter (e.g. `42.6% Surface Necrosis`), and interactive hover probe tooltips for localized spore density.
     - **Action Plan Console (`src/components/Cards/ActionPlanCard.tsx`)**: Cultural & organic remedies first, biological controls second, chemical category restrictions last, with calendar ICS reminders.
  2. **Hackathon Judge Demo Deck (`src/components/Cards/HackathonDemoDeck.tsx`)**: 1-click live demo presets (*Tomato Late Blight*, *Potato Foliar Blight*, *Maize Common Rust*) for instant 5-second evaluations during live judging.
  3. **Top Glass Navigation Bar (`src/components/Navigation/TopBar.tsx`)**: Full top glass header adhering to the 3-zone Top Bar Contract, freeing full 1440px viewport width for the multi-column dashboard.
  4. **Weather (`src/components/Tabs/WeatherTab.tsx`)**: Minimalist decision-first microclimate engine powered by Open-Meteo API. Computes 48h future-only optimal spraying windows, 24h suitability strip, and disease risks.
  5. **Field Log (`src/components/Tabs/FieldLogTab.tsx`)**: Chronological timeline of scanned crops, treatment statuses, and calendar reminders.
  6. **Floating Assistant (`src/components/Chat/ChatbotBar.tsx`)**: 56×56px floating action button (FAB) that expands with Framer Motion spring physics into an agronomist chat panel with voice speech-to-text dictation.

---

## 2. Dual-Theme System: Where and How to Change Colors

Sylva uses a single unified token system configured across two files:
1. `src/index.css` — Central CSS Custom Properties & Tailwind `@theme` directives (Used by HTML/Tailwind classes).
2. `src/theme.ts` — TypeScript token constants & spring physics (Used in JS/TS logic, Framer Motion, and canvas).

### A. CSS Tokens (`src/index.css`)

To change any color in the app, edit the CSS variables inside `:root` (Light Theme) and `html.dark` (Dark Theme) in `src/index.css`:

```css
:root {
  /* ========================================================
     1. LIGHT PALETTE (Eucalyptus Haze)
     ======================================================== */
  --bg-app: #EFF4F2;                /* Overall app backdrop */
  --bg-secondary: #DDEBE5;          /* Contrast panels / input background */
  --surface-highlight: #A5C9BC;     /* Subtle borders & scrollbar thumb */
  --primary-teal: #34796E;          /* Primary brand teal, action buttons */
  --primary-accent: #34796E;        /* Active icons, FAB button */
  --secondary-accent: #34796E;      /* Highlights */
  --text-primary: #203A37;          /* High-contrast headings and body */
  --text-secondary: #648078;        /* Subtitles and secondary labels */
  --text-on-accent: #EFF4F2;        /* Label color inside primary buttons */

  /* ========================================================
     2. LIQUID GLASS MATERIAL (Light Mode)
     ======================================================== */
  --surface-glass: rgba(221, 235, 229, 0.72);          /* Card background */
  --surface-glass-elevated: rgba(239, 244, 242, 0.88); /* Floating assistant */
  --glass-border: rgba(255, 255, 255, 0.75);          /* Crisp white top edge */
  --glass-border-subtle: rgba(165, 201, 188, 0.35);   /* Internal dividers */
  --glass-shadow: 0 10px 28px -4px rgba(52, 121, 110, 0.08); /* Botanical shadow */
  --glass-shadow-elevated: 0 16px 36px -6px rgba(52, 121, 110, 0.12);

  /* ========================================================
     3. STATUS & SEVERITY INDICATORS
     ======================================================== */
  --status-good: #34796E;           /* Optimal spray window / Healthy */
  --status-marginal: #C0772C;       /* Caution / Moderate rain/wind */
  --status-poor: #A8423F;           /* Unsuitable window / High severity */
}

html.dark {
  /* ========================================================
     1. DARK PALETTE (Midnight Sylva)
     ======================================================== */
  --bg-app: #151622;                /* Base midnight indigo */
  --bg-secondary: #24273C;          /* Deep slate-indigo container */
  --surface-highlight: #9AD5C1;     /* Mint accent highlight */
  --primary-teal: #9AD5C1;          /* Mint brand accent */
  --primary-accent: #9AD5C1;        /* Active tabs, checkmarks, icons */
  --secondary-accent: #70B9A3;      /* Secondary teal tone */
  --text-primary: #E6F0EB;          /* Primary light text */
  --text-secondary: #A0B8AD;        /* Muted sage secondary text */
  --text-muted: #879BA0;            /* Subdued tertiary metadata text */
  --text-on-accent: #142823;        /* Dark text for contrast on mint buttons */

  /* ========================================================
     2. LIQUID GLASS MATERIAL (Dark Mode: Translucent Charcoal & Indigo)
     ======================================================== */
  --surface-glass: rgba(35, 37, 54, 0.56);          /* Translucent charcoal glass */
  --surface-glass-elevated: rgba(43, 46, 65, 0.76); /* Elevated assistant & dialogs */
  --glass-border: rgba(218, 230, 235, 0.13);        /* Fine subtle border */
  --glass-border-subtle: rgba(218, 230, 235, 0.08); /* Inner hairline divider */
  --glass-border-highlight: rgba(226, 236, 240, 0.21); /* Highlight top edge */
  --glass-shadow: 0 12px 30px -4px rgba(0, 0, 0, 0.22);
  --glass-shadow-elevated: 0 18px 40px -6px rgba(0, 0, 0, 0.25);

  /* ========================================================
     3. STATUS COLORS (Dark Mode Accessible)
     ======================================================== */
  --status-good: #9AD5C1;           /* Accessible mint on dark glass */
  --status-marginal: #D89B56;       /* Readable muted amber */
  --status-poor: #D96964;           /* Readable muted coral-red */
}
```

### B. Tailwind CSS Mapping (`src/index.css`)

Tailwind v4 theme variables map 1:1 to CSS variables via `@theme`:
```css
@theme {
  --color-bg-app: var(--bg-app);
  --color-bg-secondary: var(--bg-secondary);
  --color-surface-glass: var(--surface-glass);
  --color-surface-glass-elevated: var(--surface-glass-elevated);
  --color-surface-highlight: var(--surface-highlight);
  --color-primary-teal: var(--primary-teal);
  --color-primary-accent: var(--primary-accent);
  --color-secondary-accent: var(--secondary-accent);
  --color-text-primary: var(--text-primary);
  --color-text-secondary: var(--text-secondary);
  --color-text-on-accent: var(--text-on-accent);
  --color-glass-border: var(--glass-border);
  --color-status-good: var(--status-good);
  --color-status-marginal: var(--status-marginal);
  --color-status-poor: var(--status-poor);
}
```
**Tailwind Class Usage**:
- `bg-bg-app`, `bg-bg-secondary`, `bg-surface-glass`, `bg-primary-teal`
- `text-text-primary`, `text-text-secondary`, `text-text-on-accent`, `text-primary-accent`
- `border-glass-border`, `border-surface-highlight`

### C. TypeScript Token File (`src/theme.ts`)

Keep `src/theme.ts` synced if you update the hex values:
- `LIGHT_THEME`: background, secondarySurface, highlight, primaryTeal, mainText, secondaryText.
- `DARK_THEME`: background, secondaryBackground, primaryGlassSurface, elevatedGlassSurface, mainText, secondaryText, primaryAccent, secondaryAccent, buttonTextOnMint, glassBorders, shadows.

---

## 3. Liquid Glass Styling Classes

Available utility classes in `src/index.css`:
- `.sylva-card`: 20px backdrop blur, 1px translucent glass border, soft botanical shadow, `border-radius: 1.25rem`.
- `.sylva-card-elevated`: 22px backdrop blur, elevated shadow, `border-radius: 1.5rem` (used for modals and floating assistant).
- `.sylva-card-interactive`: subtle `translateY(-2px)` on hover with elevated shadow.
- `.sylva-fab-pulse`: 4s gentle breathing glow for the floating action button. Automatically switches between teal glow in light mode and mint glow in dark mode.

---

## 4. Theme Switching & Zero-Flash Engine

- **Persistence**: Saved under localStorage key `'sylva_theme_v1'`.
- **System Preference**: If no localStorage entry exists, it defaults to `window.matchMedia('(prefers-color-scheme: dark)')`.
- **Zero-Flash Execution**: An inline script in `/index.html` runs in `<head>` before DOM render, preventing any white/dark screen flash on page refresh.
- **Toggle Mechanism**: Managed via `useAppContext()` hook (`theme`, `toggleTheme()`). A sun/moon toggle button is mounted in both the desktop header (`src/components/Navigation/Navbar.tsx`) and mobile sidebar.
- **Transitions**: 250ms smooth CSS transitions on all structural elements. Automatically disabled when `prefers-reduced-motion` is detected.

---

## 5. Critical Environment & Development Constraints

1. **AI Studio Dev Container HMR**:
   - `server.ts` has `server: { middlewareMode: true, hmr: false }` configured.
   - `index.html` contains capture-phase exception handlers to cleanly suppress sandbox WebSocket transport messages (`createWebSocketModuleRunnerTransport`).
   - Do **NOT** remove `hmr: false` or the suppression block in `index.html`.
2. **Text-To-Speech (TTS)**:
   - Voice audio output (TTS) was intentionally removed per user request. Do not add Web Speech synthesis or audio playback.
   - Keep Web Speech API Speech-to-Text (STT) inside `ChatbotBar.tsx` for microphone voice dictation input.
3. **Future-Only Spray Windows**:
   - `src/utils/weather.ts` strictly scans future hours (`currentHourEpoch`) to ensure the user is never recommended a past time window.
4. **Verifications**:
   - Build test: `compile_applet`
   - Lint check: `lint_applet` (`tsc --noEmit`)
   - Automated test suite: `npx --yes tsx --test src/utils/weather.test.ts src/utils/storage.test.ts src/utils/diagnosis.test.ts`
