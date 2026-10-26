# Sylva — Midnight Gradient Liquid Glass Refinement & Field Log Fix

Refine the Midnight Sylva dark theme into an atmospheric, premium liquid-glass experience with layered midnight-indigo, muted purple, diffused teal, and subtle plum gradients, while keeping Eucalyptus Haze light mode completely untouched and fixing the Field Log record clearing interaction.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> - **Field Log Clear Bug Root Cause**: `FieldLogTab.tsx` currently calls `window.confirm('Clear all historical field records?')`. In modern browser sandbox iFrames, synchronous modal dialogs (`window.confirm`/`window.alert`) are blocked or fail silently, preventing records from ever being cleared.
> - **The Fix**: Replace `window.confirm` with an accessible inline liquid-glass two-step confirmation toggle (`"Clear All"` -> `"Confirm Clear?"` with a 3-second auto-reset), guaranteeing 100% reliable clearing without browser dialog blocks.
> - **Eucalyptus Haze Light Mode**: Preserved 100% intact as requested.

---

## 1. Overview & Core Concept

- **Atmospheric Dark Backdrop**: A fixed, non-interactive background layer combining a dark linear gradient base (`#151622` to `#142B35`) with three large, soft CSS radial glows:
  - Upper-left faint purple glow (`#35304D`)
  - Lower-center diffused teal glow (`#155A63`)
  - Right-side restrained plum tint (`#493047`)
- **Translucent Charcoal & Indigo Glass**:
  - Standard glass: `rgba(35, 37, 54, 0.56)`
  - Elevated glass: `rgba(43, 46, 65, 0.76)`
  - Glass borders: `rgba(218, 230, 235, 0.13)`
  - Highlight borders: `rgba(226, 236, 240, 0.21)`
  - Soft diffused shadows: `rgba(0, 0, 0, 0.22)`
  - Backdrop blur: 20–24px
- **Accents & Status Tokens**:
  - Primary text: `#E6F0EB`
  - Secondary text: `#A0B8AD`
  - Muted text: `#879BA0`
  - Primary mint accent: `#9AD5C1` (used selectively on buttons, active indicators, and FAB)
  - Secondary teal: `#70B9A3`
  - Accessible muted amber for caution (`#D89B56`) and muted coral-red for high risk (`#D96964`).

---

## 2. Component & Architecture Updates

### A. Field Log Clear Fix (`src/components/Tabs/FieldLogTab.tsx`)
- Eliminate `window.confirm`.
- Implement an inline stateful confirmation button:
  - Click 1: Button turns into `"Confirm Clear?"` with a subtle amber highlight.
  - Click 2: Invokes `clearScans()` immediately and shows the `"Cleared all historical records"` toast.
  - Auto-cancel: If the user doesn't confirm within 4 seconds, the button gracefully returns to `"Clear"`.

### B. Dark Theme Tokens (`src/index.css` & `src/theme.ts`)
- Update `html.dark` in `src/index.css` with the exact specified color and opacity tokens.
- Add `--glass-border-highlight: rgba(226, 236, 240, 0.21)` and `--text-muted: #879BA0`.
- Update `DARK_THEME` in `src/theme.ts` so JavaScript-driven animations and canvas mirrors remain in sync.

### C. Atmospheric Midnight Gradient Layer (`src/components/Background/LivingBackground.tsx`)
- In `LivingBackground.tsx`, render a dedicated fixed background layer for dark mode:
  - Base gradient: `linear-gradient(160deg, #151622 0%, #24273C 55%, #142B35 100%)`.
  - Non-interactive CSS radial glow layers with `pointer-events: none` and deep blur (`blur-[100px]`), placed behind all application content without affecting scrolling or layout math.
  - Light mode retains the natural Eucalyptus Haze botanical gradient and floating leaves.

---

## 3. Technical Architecture & Component Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Dedicated Background Layer                      │
│   Light: Eucalyptus Haze organic gradient & leaf canvas                │
│   Dark:  Atmospheric Midnight Indigo (#151622) with                   │
│          • Upper-Left Purple Glow (#35304D)                            │
│          • Lower-Center Teal Glow (#155A63)                            │
│          • Right Plum Tint (#493047)                                   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (pointer-events: none, z-0)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Liquid Glass Surface Layer (z-10)                    │
│   Standard: rgba(35, 37, 54, 0.56) • Elevated: rgba(43, 46, 65, 0.76)  │
│   Border: rgba(218, 230, 235, 0.13) • Highlight: rgba(226, 236, 240, 0.21)
│   Blur: 20-24px • Shadows: rgba(0, 0, 0, 0.22)                         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌───────────────────────────────────────┐ ┌──────────────────────────────┐
│ FieldLogTab.tsx                       │ │ TopBar, Scan, Weather & FAB  │
│ • Inline 2-step Clear confirmation    │ │ • Mint #9AD5C1 accents       │
│ • Eliminates blocked window.confirm   │ │ • High contrast #E6F0EB text │
└───────────────────────────────────────┘ └──────────────────────────────┘
```

---

## 4. Verification Plan

1. **Bug Verification (Field Log Clear)**:
   - Navigate to Field Log, load sample records, click "Clear", confirm that the 2-step inline confirmation triggers and clears the logs completely.
2. **Design System Verification**:
   - Verify that Eucalyptus Haze light mode is identical to its previous pristine state.
   - Verify Midnight Sylva dark mode has smooth, non-banded atmospheric radial glows, readable text contrast (WCAG AA), and restrained mint accents.
3. **Automated Unit Tests**:
   - Run `npx --yes tsx --test src/utils/weather.test.ts src/utils/storage.test.ts src/utils/diagnosis.test.ts src/utils/pathology.test.ts` (17 tests).
4. **TypeScript & Production Compilation**:
   - `lint_applet` (`tsc --noEmit`) passes with 0 errors.
   - `compile_applet` succeeds cleanly.
