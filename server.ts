import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Body parsing with support for image payload
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Serve static assets from public
app.use('/samples', express.static(path.resolve(__dirname, 'public', 'samples')));
app.use(express.static(path.resolve(__dirname, 'public')));

/* ------------------------------------------------------------------ */
/* Model selection                                                     */
/* gemini-2.5-flash was shut down on the Gemini API (Oct 2026).        */
/* Override with GEMINI_MODEL in .env if you want a different model.   */
/* ------------------------------------------------------------------ */
const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const MODEL_CHAIN = [PRIMARY_MODEL, 'gemini-3.8-flash'].filter(
  (m, i, arr) => arr.indexOf(m) === i,
);
let activeModel = MODEL_CHAIN[0];

function isModelUnavailable(err: any): boolean {
  const msg = String(err?.message || '').toLowerCase();
  return (
    err?.status === 404 ||
    err?.code === 404 ||
    msg.includes('not found') ||
    msg.includes('no longer available')
  );
}

// Try the active model first, then the others, only when a model is missing.
async function generate(ai: GoogleGenAI, params: { contents: any; config?: any }) {
  const order = [activeModel, ...MODEL_CHAIN.filter((m) => m !== activeModel)];
  let lastErr: any;
  for (const model of order) {
    try {
      const response = await ai.models.generateContent({ model, ...params } as any);
      activeModel = model;
      return response;
    } catch (err: any) {
      lastErr = err;
      if (!isModelUnavailable(err)) throw err;
      console.warn(`Model ${model} is unavailable, trying the next one...`);
    }
  }
  throw lastErr;
}

function upstreamStatus(err: any): number {
  return err?.status === 429 ? 429 : 502;
}

function friendlyError(err: any): string {
  if (err?.status === 429) {
    return 'The AI is busy right now. Please wait a moment and try again.';
  }
  return "Couldn't reach the AI. Please try again.";
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  hi: 'Hindi',
  te: 'Telugu',
  kn: 'Kannada',
};
function languageName(code: string): string {
  return LANGUAGE_NAMES[code] || code;
}

function extractJson(text: string): any | null {
  const cleaned = text.replace(/```json|```/gi, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    /* fall through */
  }
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      /* fall through */
    }
  }
  return null;
}

function asStringArray(value: any): string[] {
  return Array.isArray(value)
    ? value.filter((v) => typeof v === 'string' && v.trim()).map((v) => v.trim())
    : [];
}

const CATEGORIES = ['fungal', 'bacterial', 'viral', 'pest', 'deficiency', 'healthy'];
const SEVERITIES = ['low', 'medium', 'high'];
const URGENCIES = ['act_today', 'act_this_week', 'monitor'];

// Validates the model's answer. Returns null if it is not usable (never invents data).
function normalizeDiagnosis(p: any): any | null {
  if (!p || typeof p !== 'object') return null;

  const cropName = typeof p.cropName === 'string' ? p.cropName.trim() : '';
  const conditionName = typeof p.conditionName === 'string' ? p.conditionName.trim() : '';
  const category = String(p.category || '').toLowerCase().trim();
  const severity = String(p.severity || '').toLowerCase().trim();
  const confidenceRaw = Number(p.confidence);

  if (!cropName || !conditionName) return null;
  if (!CATEGORIES.includes(category)) return null;
  if (!SEVERITIES.includes(severity)) return null;
  if (!Number.isFinite(confidenceRaw)) return null;

  const confidence = Math.max(0, Math.min(100, Math.round(confidenceRaw)));
  const today_steps = asStringArray(p.today_steps);
  const this_week_steps = asStringArray(p.this_week_steps);
  const prevent_next_season = asStringArray(p.prevent_next_season);

  // A real finding must come with a plan.
  if (category !== 'healthy' && today_steps.length === 0 && this_week_steps.length === 0) {
    return null;
  }

  const urgencyRaw = String(p.urgency || '').toLowerCase().trim();
  const urgency = URGENCIES.includes(urgencyRaw)
    ? urgencyRaw
    : severity === 'high'
      ? 'act_today'
      : category === 'healthy'
        ? 'monitor'
        : 'act_this_week';

  const call_expert =
    typeof p.call_expert === 'boolean' ? p.call_expert : severity === 'high' || confidence < 75;

  let actions = asStringArray(p.actions);
  if (actions.length === 0) {
    actions = [today_steps[0], this_week_steps[0], prevent_next_season[0]].filter(Boolean) as string[];
  }

  return {
    cropName,
    conditionName,
    category,
    severity,
    confidence,
    urgency,
    summary: typeof p.summary === 'string' ? p.summary.trim() : '',
    today_steps,
    this_week_steps,
    prevent_next_season,
    call_expert,
    actions,
  };
}

// Health check endpoint. Add ?deep=1 to make a real test call to the model.
app.get('/api/health', async (req, res) => {
  const configured = Boolean(process.env.GEMINI_API_KEY);
  const result: any = {
    status: 'ok',
    service: 'Sylva Crop Advisory Engine',
    geminiConfigured: configured,
    model: activeModel,
    timestamp: new Date().toISOString(),
  };

  if (req.query.deep === '1' && configured) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      const r = await generate(ai, { contents: 'Reply with the single word: ok' });
      result.modelWorks = true;
      result.model = activeModel;
      result.sample = (r.text || '').slice(0, 20);
    } catch (err: any) {
      result.modelWorks = false;
      result.error = err?.message || 'Unknown error';
    }
  }

  res.json(result);
});

// Crop diagnosis endpoint using Gemini server-side
app.post('/api/diagnose', async (req, res) => {
  try {
    const { imageBase64, mimeType, cropName, symptoms, language = 'en' } = req.body || {};

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'no_api_key',
        message: 'Gemini API key is not configured on the server.',
      });
    }

    // A diagnosis without a photo would just be invented, so require one.
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({
        error: 'image_required',
        message: 'Please add a leaf photo first.',
      });
    }

    const dataUrl = imageBase64.match(/^data:([^;]+);base64,([\s\S]*)$/);
    const mime = dataUrl ? dataUrl[1] : mimeType || 'image/jpeg';
    const data = dataUrl ? dataUrl[2] : imageBase64;
    const langName = languageName(language);

    const promptText = `
You are Sylva, an expert agricultural plant pathologist and entomologist focused on sustainable crop protection.
Analyze the attached crop photo.
- Indicated crop: ${cropName || 'Auto-detect from the image'}
- Reported symptoms: ${symptoms || 'Visual inspection only'}
- Output language: ${langName}

STEP 0, VALIDITY: If the photo does not clearly show a crop plant, leaf, fruit or a pest on a plant (for example a person, an object, a screenshot, or an unreadable blur), set "isPlant" to false, explain briefly in "summary", and leave every other field empty. Do not guess.

GUIDELINES:
1. Identify the crop and the specific disease, pest (insects, mites) or deficiency. If the symptoms could have several causes, pick the most likely one and lower the confidence.
2. "confidence" is your honest certainty from 0 to 100. Lower it when the photo is unclear, the leaf is partial, or several causes fit.
3. Urgency: "act_today" (active, spreading or severe), "act_this_week" (moderate damage), or "monitor" (mild, early stage or healthy).
4. Treatment sequence MUST follow IPM:
   - Cultural and organic remedies first (pruning, spacing, airflow, neem, potassium bicarbonate)
   - Biological controls second (Bacillus subtilis, Trichoderma, predatory mites)
   - Chemical products strictly as a last resort, using GENERAL product categories only (for example "copper-based fungicide", "wettable sulfur")
   - NEVER give exact chemical dosages or mixing ratios. Remind the farmer to follow the product label.
5. Translate only the human-readable text fields into ${langName}. Keep every JSON key, and the values of "category", "severity" and "urgency", in English exactly as listed below.
6. "call_expert" is true if severity is "high" or confidence is below 75.

Return ONLY a JSON object (no markdown, no code fences) with this structure:
{
  "isPlant": true,
  "cropName": "Identified crop",
  "conditionName": "Specific disease, pest or deficiency (for example Early Blight (Alternaria solani))",
  "category": "fungal" | "bacterial" | "viral" | "pest" | "deficiency" | "healthy",
  "severity": "low" | "medium" | "high",
  "confidence": number from 0 to 100,
  "urgency": "act_today" | "act_this_week" | "monitor",
  "summary": "1-2 clear sentences about the problem and the risk to yield.",
  "today_steps": ["Immediate cultural or sanitation action", "..."],
  "this_week_steps": ["Targeted organic or biological action", "Chemical action only as a last resort (general product type)"],
  "prevent_next_season": ["Long-term prevention practice", "..."],
  "call_expert": boolean,
  "actions": ["Key action 1", "Key action 2", "Key action 3"]
}
`;

    const ai = new GoogleGenAI({ apiKey });
    const contents = [
      {
        role: 'user',
        parts: [{ inlineData: { mimeType: mime, data } }, { text: promptText }],
      },
    ];

    let lastReason = 'The AI returned an unreadable answer.';
    for (let attempt = 1; attempt <= 2; attempt++) {
      const response = await generate(ai, {
        contents,
        config: { responseMimeType: 'application/json', temperature: 0.2 },
      });

      const parsed = extractJson(response.text || '');
      if (!parsed) {
        lastReason = 'The AI answer was not valid JSON.';
        console.warn(`/api/diagnose attempt ${attempt}: not valid JSON`);
        continue;
      }

      if (parsed.isPlant === false) {
        return res.status(422).json({
          error: 'not_a_plant',
          message:
            (typeof parsed.summary === 'string' && parsed.summary.trim()) ||
            "That doesn't look like a crop leaf. Try a close, steady photo in natural light.",
        });
      }

      const diagnosis = normalizeDiagnosis(parsed);
      if (diagnosis) {
        return res.json({ success: true, diagnosis });
      }
      lastReason = 'The AI answer was missing required fields.';
      console.warn(`/api/diagnose attempt ${attempt}: invalid fields`, JSON.stringify(parsed).slice(0, 300));
    }

    console.error('Error in /api/diagnose:', lastReason);
    return res.status(502).json({
      error: 'ai_bad_response',
      message: "The AI couldn't read this photo clearly. Please try again.",
    });
  } catch (err: any) {
    console.error('Error in /api/diagnose:', err);
    return res.status(upstreamStatus(err)).json({
      error: 'ai_unavailable',
      message: friendlyError(err),
    });
  }
});

// Interactive text chatbot endpoint using Gemini
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [], context = {}, language = 'en' } = req.body || {};

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message_required', message: 'Message is required.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'no_api_key',
        message: 'Gemini API key is not configured on the server.',
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const langName = languageName(language);

    // Format current agricultural context
    const contextDetails: string[] = [];
    if (context.activeTab) {
      contextDetails.push(`Current App Screen: ${context.activeTab}`);
    }
    if (context.diagnosis) {
      contextDetails.push(
        `Active Crop Diagnosis: Crop: ${context.diagnosis.cropName || 'Unknown'}, Disease/Pest: ${context.diagnosis.conditionName || 'N/A'}, Severity: ${context.diagnosis.severity || 'medium'}, Urgency: ${context.diagnosis.urgency || 'N/A'}, Today Steps: ${(context.diagnosis.today_steps || []).join('; ')}`,
      );
    }
    if (context.sprayWindow) {
      contextDetails.push(
        `Weather & Spray Window: Status: ${context.sprayWindow.status || 'unknown'}, Next Window: ${context.sprayWindow.title || 'N/A'}, Wind: ${context.sprayWindow.wind || 'N/A'}, Rain Risk: ${context.sprayWindow.rain || 'N/A'}`,
      );
    }

    const systemInstruction = `You are Sylva, an expert agricultural AI agronomist and plant pathologist specializing in crop protection, IPM (Integrated Pest Management), and sustainable farming.
You converse with farmers, crop advisors, and field scouts.

CROP & AGRONOMIC CONTEXT:
- Knowledge of major commercial and staple crops: Rice, Wheat, Cotton, Tomato, Mustard, Maize, Potato, Chilli, Sugarcane, Soybean, and Pulses.
- Promote Integrated Pest Management (IPM):
  1. Cultural and organic remedies first (sanitation, lower leaf pruning, neem extract, yellow sticky traps, water drainage management, Trichoderma).
  2. Biological controls second (Bacillus subtilis, Trichoderma viride/harzianum, beneficial predators).
  3. Chemical remedies as strict last resort using GENERAL product categories only (e.g. "copper hydroxide protective fungicide", "wettable sulfur").
  4. NEVER provide exact chemical dosage or mix formulas. Always remind farmers to inspect the product container label and confirm with their local agriculture extension officer or qualified agronomy specialist.
- Keep responses concise, clear, and actionable (2-4 short paragraphs or bullet points).
- If you are not sure, say so plainly instead of guessing.
- Ground your advice in the active crop and weather context provided:
${contextDetails.length > 0 ? contextDetails.join('\n') : 'No active crop scan loaded yet.'}
- Respond fluently in the requested language: ${langName}.`;

    // Construct history for conversation
    const contents: any[] = [];
    if (Array.isArray(history)) {
      for (const item of history.slice(-6)) {
        const text = String(item?.content ?? item?.text ?? '').trim();
        if (!text) continue;
        contents.push({
          role: item.role === 'assistant' || item.role === 'model' ? 'model' : 'user',
          parts: [{ text }],
        });
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: message.slice(0, 2000) }],
    });

    const response = await generate(ai, {
      contents,
      config: { systemInstruction, temperature: 0.4 },
    });

    const reply = (response.text || '').trim();
    if (!reply) {
      return res.status(502).json({
        error: 'empty_reply',
        message: "The AI didn't answer. Please try again.",
      });
    }

    return res.json({
      success: true,
      reply,
    });
  } catch (err: any) {
    console.error('Error in /api/chat:', err);
    return res.status(upstreamStatus(err)).json({
      error: 'ai_unavailable',
      message: friendlyError(err),
    });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    // Fallback to the SPA entry. Works on both Express 4 and 5 (a '*' route crashes on 5).
    app.use((req, res) => {
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'not_found', message: 'Unknown API route.' });
      }
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sylva server running on http://0.0.0.0:${PORT} (model: ${activeModel})`);
  });
}

startServer();
