# Sylva: Voice Chatbot, Real Specimen Pipeline, Action Plan & Best Spray Window

Comprehensive architectural and design plan to integrate a persistent live voice-enabled agronomist chatbot bar, replace sample cards with real leaf imagery processed through the Gemini diagnostic pipeline, introduce an interactive Action Plan with tickable checklists and export tools, and add an algorithmic 48-hour Best Spray Window engine to the Weather tab.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were aligned via clarifying answers:
> - **Voice Interaction Mechanism**: Native Web Speech API for voice recognition and live spoken audio feedback (`speechSynthesis`) combined with a floating expandable Chatbot Bar, backed by server-side Gemini 2.5 Flash for agricultural intelligence.
> - **Weather & Location Strategy**: Browser Geolocation API (`navigator.geolocation`) with automatic fallback to a representative agricultural coordinates preset (Pune, Maharashtra: `18.5204° N, 73.8567° E`) querying live Open-Meteo hourly forecast data.

- **Confirmed Decision 1**: Real leaf photos (`/public/samples/`) will be fetched as Blobs and converted to base64 to execute through the identical `/api/diagnose` route with zero mock/hardcoded responses.
- **Confirmed Decision 2**: Action Plan ticks are persisted directly into `scans` history in `localStorage` so farmers can track remediation progress over time in the Field Log.
- **Confirmed Decision 3**: The Best Spray Window 48-hour evaluator uses strict named constants at top-of-file, and injects its selected window into the chatbot context and Action Plan jump link.

---

## 1. Overview & Core Concept

- **What It Does**: Transforms Sylva into an end-to-end crop protection companion. Farmers can photograph crops, run real diagnostic leaf samples, receive prioritized **Action Plans** (Today, This Week, Next Season), track checklist completion, schedule 5-day re-check calendar events, share diagnoses via WhatsApp/WebShare, inspect microclimate-calibrated **Best Spray Windows**, and speak directly with a multilingual AI agronomist assistant.
- **Target Audience**: Smallholder and commercial farmers, agronomists, extension workers, and crop managers needing instant, actionable, and scientifically sound treatments without pesticide overdose.
- **Key Value**: Replaces generic disease labels with time-critical remedial roadmaps, weather-safe application timing, and accessible voice advisory in local languages (English, Hindi, Telugu, Kannada).

---

## 2. User Experience & Visual Design

### A. Persistent Floating Voice Chatbot Bar
- **Placement & Presence**: Sleek floating bottom bar positioned above mobile bottom tabs and anchored cleanly at desktop bottom right/center (`z-40`).
- **Aesthetic**: Frosted Eucalyptus Mist glass with soft teal borders (`border border-white/70 bg-[#DDEBE5]/90 backdrop-blur-md shadow-lg rounded-2xl`).
- **Interactive Controls**:
  - Live Voice Mic button with pulsing audio-activity wave indicator.
  - Quick action chips: *"Why this treatment?"*, *"When should I spray?"*, *"Can I use neem oil?"*.
  - Text input with instant send button.
  - Spoken response toggle (mute / unmute voice read-out).
  - Expandable conversational drawer displaying chat history, crop diagnosis badges, and weather context.

### B. "Try a Sample" Row in Scan Tab
- Replaces the synthetic specimen icons with a curated row of 3 real leaf photos stored in `/public/samples/`:
  - `tomato_early_blight.jpg` (Tomato: Early Blight)
  - `potato_late_blight.jpg` (Potato: Late Blight)
  - `corn_common_rust.jpg` (Corn: Common Rust)
- Clean card thumbnails with real leaf photography, crop name, condition preview, and a prominent *"Run sample scan"* action that streams through `/api/diagnose`.

### C. Action Plan Card (Replaces Plain Treatment Lists)
- **Urgency Banner**: Full-width top banner with high-contrast text and theme severity tones:
  - *Act today* (`#A8423F` background tint & border)
  - *Act this week* (`#C0772C` background tint & border)
  - *Monitor* (`#34796E` background tint & border)
- **Three Tickable Checklists**:
  1. **Today**: Immediate containment, infected foliage pruning, isolation.
  2. **This Week**: Cultural/organic biopesticides (neem, copper soap, trichoderma) followed by targeted biologicals and chemical controls strictly as last resort.
  3. **Prevent Next Season**: Soil rotation, drip line spacing, resistant cultivar planning.
- **Tick Persistence**: Each checkbox state updates `activeDiagnosis.completedSteps` and synchronizes to `scans` in `localStorage` for Field Log tracking.
- **Call-to-Action Utilities**:
  - *"When to call an expert"*: Highlighted amber box when `call_expert` is true.
  - *"Best time to treat"*: Context link that switches directly to the Weather tab with the highlighted spray window.
  - *"Remind me to re-check"*: Triggers an `.ics` calendar file download for 5 days later with title `Re-check [crop] - Sylva`.
  - *"Share"*: Native Web Share or WhatsApp web link (`https://wa.me/?text=...`) with summary text and toast feedback.
  - Mandatory safety line: *"Follow the product label and confirm with your local agri officer / KVK."*

### D. "Best Spray Window" Card (Weather Tab)
- **Header**: Dynamically titled *"Best window to treat [Problem Name]"* when a diagnosis exists (otherwise *"Best spray window"*).
- **Recommendation Summary**: Large, bold headline (e.g., *"Tomorrow, 6:00 – 9:00 AM"*) with a plain-English explanation of why conditions are ideal or which rule is missed.
- **24-Hour Hourly Timeline Bar**:
  - Thin segmented bar representing the next 24 hours.
  - Each segment colored: Eucalyptus Teal (optimal), Muted Amber (acceptable), Muted Brick Red (unfavorable).
  - Highlighted boundary pill over the recommended 3-hour window.
  - Interactive tooltip on hover/tap showing hour, wind speed, rain probability, and temperature.

---

## 3. Key Product Decisions & Trade-Offs

- **Real Image Sample Execution vs Mock**:
  - *Approach*: The sample images in `/public/samples/` are fetched via standard `fetch()`, converted to Base64, and sent to `/api/diagnose`.
  - *Why*: Guarantees that sample runs exercise the exact same Gemini path, schemas, and timing as live user uploads.
- **Web Speech API vs Server-Side Live WebSockets**:
  - *Approach*: Client-side Web Speech Recognition (`webkitSpeechRecognition`) + SpeechSynthesis for voice I/O, coupled with server-side Gemini 2.5 Flash for reasoning and response generation.
  - *Why*: Eliminates complex binary PCM audio streaming overhead and latency while providing native device speech recognition in Indian and international dialects.
- **Local Storage Checklist Sync**:
  - *Approach*: Ticked items mutate the diagnosis item inside `AppContext` state and save directly to `sylva_scans_history_v1`.
  - *Why*: Farmers can leave the app and return to their Field Log days later to verify completed treatments.

---

## 4. Technical Architecture & Data Strategy

### System Component Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                               Sylva UI                                 │
├──────────────────┬──────────────────────┬──────────────────────────────┤
│    Scan Tab      │     Weather Tab      │          Field Log           │
│ ┌──────────────┐ │ ┌──────────────────┐ │ ┌──────────────────────────┐ │
│ │Camera/Upload │ │ │Best Spray Window │ │ │Historical Scan Logs      │ │
│ │Real Samples  │ │ │Hourly Timeline   │ │ │Checklist Progress        │ │
│ │Action Plan   │ │ │Weather Forecast  │ │ │Share Report              │ │
│ └──────┬───────┘ │ └────────┬─────────┘ │ └────────────┬─────────────┘ │
└────────┼────────────────────┼──────────────────────────┼───────────────┘
         │                    │                          │
         ▼                    ▼                          ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   AppContext (React Shared State)                      │
│ - language: 'en' | 'hi' | 'te' | 'kn'                                  │
│ - activeTab: 'scan' | 'weather' | 'field-log'                          │
│ - latestDiagnosis: ExtendedDiagnosisRecord                             │
│ - bestSprayWindow: EvaluatedSprayWindow                                │
│ - scans: ScanHistoryItem[] (persisted to localStorage)                 │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
              ┌────────────────────┴────────────────────┐
              ▼                                         ▼
┌──────────────────────────┐              ┌──────────────────────────┐
│   Floating Chatbot Bar   │              │     Open-Meteo API       │
│ - Voice Speech-to-Text   │              │ - 48h Hourly Wind        │
│ - Voice Text-to-Speech   │              │ - 48h Rain Probability   │
│ - Injected App Context   │              │ - 48h Temperature        │
└─────────────┬────────────┘              └──────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 Node / Express Server (server.ts)                      │
│ ┌─────────────────────────────┐      ┌───────────────────────────────┐ │
│ │ POST /api/diagnose          │      │ POST /api/chat                │ │
│ │ - Gemini 2.5 Flash Vision   │      │ - Gemini 2.5 Flash Reasoning  │ │
│ │ - Extended Action Plan JSON │      │ - Multimodal Crop Context     │ │
│ │ - Language Localization     │      │ - Multilingual Responses      │ │
│ └──────────────┬──────────────┘      └───────────────┬───────────────┘ │
└────────────────┼─────────────────────────────────────┼─────────────────┘
                 │                                     │
                 ▼                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 Google Gemini API (GEMINI_API_KEY)                     │
└────────────────────────────────────────────────────────────────────────┘
```

### Extended Data Model

```ts
export type UrgencyLevel = 'act_today' | 'act_this_week' | 'monitor';

export interface ActionPlan {
  urgency: UrgencyLevel;
  today_steps: string[];
  this_week_steps: string[];
  prevent_next_season: string[];
  call_expert: boolean;
  expert_reason?: string;
  completed_steps?: Record<string, boolean>; // key: "today-0", "week-1", etc.
}

export interface DiagnosisRecord {
  id: string;
  cropName: string;
  conditionName: string;
  category: 'fungal' | 'bacterial' | 'viral' | 'pest' | 'deficiency' | 'healthy';
  severity: SeverityLevel;
  confidence: number;
  summary: string;
  actionPlan: ActionPlan;
  imageUrl?: string;
  createdAt: string;
}

export interface EvaluatedSprayWindow {
  startTime: string; // ISO or formatted
  endTime: string;
  label: string; // e.g. "Tomorrow, 6:00 - 9:00 AM"
  qualifies: boolean;
  score: number;
  reason: string;
  avgWind: number;
  avgTemp: number;
  maxRainProb: number;
  missedRule?: string;
}
```

### Best Spray Window Evaluator Constants

```ts
export const SPRAY_RULES = {
  MAX_WIND_SPEED_KMH: 15,
  MAX_RAIN_PROBABILITY_PCT: 20,
  RAIN_LOOKAHEAD_HOURS: 6,
  MAX_TEMPERATURE_C: 30,
  PREFERRED_HOURS: [5, 6, 7, 8, 9, 16, 17, 18, 19],
  WINDOW_DURATION_HOURS: 3,
};
```

---

## 5. Execution Sequence

1. **Server API Extensions**:
   - Update `POST /api/diagnose` to return the new JSON schema with urgency, today_steps, this_week_steps, prevent_next_season, call_expert, and multilingual support.
   - Implement `POST /api/chat` with Gemini 2.5 Flash, feeding current scan, latest diagnosis, and weather spray window context.
2. **Sample Specimen Asset Generation & Pipeline**:
   - Generate and place 3 realistic leaf photos in `/public/samples/`: `tomato_early_blight.jpg`, `potato_late_blight.jpg`, `corn_common_rust.jpg`.
   - Update `ScanTab` to display the "Try a sample" row and feed selected samples directly through `/api/diagnose`.
3. **Action Plan UI & Interactive Tools**:
   - Create `ActionPlanCard` with urgency banner, 3 tickable checklists with `localStorage` persistence, `.ics` calendar file generator, and WhatsApp/WebShare sharing.
4. **Open-Meteo Spray Window Engine**:
   - Create weather utility to fetch 48-hour forecast with geolocation fallback, evaluate 3-hour spray windows against rules, render the 24-hour hourly timeline bar with tooltips, and sync the chosen window to `AppContext`.
5. **Floating Voice Chatbot Bar**:
   - Build `ChatbotBar` with speech recognition, speech synthesis, conversational message history, and quick agricultural prompts.
6. **Verification & Testing**:
   - Add unit tests for spray window scoring and calendar `.ics` generation.
   - Verify compilation, linting, and full interactive browser testing via Playwright.
