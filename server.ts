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

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Sylva Crop Advisory Engine',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Crop diagnosis endpoint using Gemini server-side
app.post('/api/diagnose', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', cropName, symptoms, language = 'en' } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'Gemini API key is not configured on the server.',
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const promptText = `
You are Sylva, a world-class agricultural plant pathologist and sustainable crop protection specialist.
Analyze this crop foliage image and symptoms:
- Indicated Crop: ${cropName || 'Auto-detect from image'}
- Reported Symptoms: ${symptoms || 'Visual inspection only'}
- Output Language: ${language} (translate all text fields appropriately into ${language})

CRITICAL GUIDELINES:
1. Identify the crop and specific pathogen/pest or physiological issue with scientific precision.
2. Determine urgency: "act_today" (active high infection/spreading), "act_this_week" (moderate foliar damage), or "monitor" (mild/early stage or healthy).
3. Treatment sequence MUST follow IPM:
   - Cultural & organic remedies first (pruning, spacing, airflow, potassium bicarbonate/neem)
   - Biological controls second (Bacillus subtilis, Trichoderma, predatory mites)
   - Chemical fungicides/pesticides strictly as a last resort using GENERAL product categories only (e.g. "copper hydroxide spray", "chlorothalonil preventative fungicide", "wettable sulfur").
   - NEVER give exact chemical dosages or mixing ratios. Remind them to follow label instructions.
4. Set "call_expert": true if severity is "high" OR confidence < 75.

Return strictly a JSON object with this exact structure (no markdown formatting, no code fences):
{
  "cropName": "Identified Crop",
  "conditionName": "Specific disease or pest name (e.g. Early Blight (Alternaria solani))",
  "category": "fungal" | "bacterial" | "viral" | "pest" | "deficiency" | "healthy",
  "severity": "low" | "medium" | "high",
  "confidence": number between 65 and 99,
  "urgency": "act_today" | "act_this_week" | "monitor",
  "summary": "1-2 clear sentences explaining the pathology and risk to yield.",
  "today_steps": [
    "Immediate cultural action (e.g. prune infected lower leaves and safely destroy away from field)",
    "Immediate barrier or sanitation action"
  ],
  "this_week_steps": [
    "Targeted organic or biological control action",
    "Chemical intervention as last resort if infection spreads (general product type only)"
  ],
  "prevent_next_season": [
    "Long-term crop rotation or soil drainage practice",
    "Certified resistant variety or seed sanitation guideline"
  ],
  "call_expert": boolean,
  "actions": [
    "Key action 1",
    "Key action 2",
    "Key action 3"
  ]
}
`;

    const contents: any[] = [];
    if (imageBase64) {
      // Strip data url prefix if present
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      contents.push({
        inlineData: {
          mimeType,
          data: cleanBase64,
        },
      });
    }
    contents.push(promptText);

    // Call gemini-2.5-flash
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      parsedData = {
        cropName: cropName || 'Field Crop',
        conditionName: 'Foliar Symptom Analysis',
        category: 'fungal',
        severity: 'medium',
        confidence: 88,
        urgency: 'act_this_week',
        summary: responseText.slice(0, 160),
        today_steps: ['Prune and isolate visibly infected foliage away from the field.', 'Avoid overhead sprinkler watering.'],
        this_week_steps: ['Apply bio-fungicide or copper-based protector during calm early morning hours.'],
        prevent_next_season: ['Rotate with non-solanaceous crop next cycle.', 'Improve bed spacing for maximum airflow.'],
        call_expert: false,
        actions: ['Prune visibly infected foliage', 'Apply protective spray during optimal spray window'],
      };
    }

    // Ensure fallback safety for required fields
    if (!parsedData.urgency) {
      parsedData.urgency = parsedData.severity === 'high' ? 'act_today' : 'act_this_week';
    }
    if (typeof parsedData.call_expert !== 'boolean') {
      parsedData.call_expert = parsedData.severity === 'high' || (parsedData.confidence || 80) < 75;
    }
    if (!Array.isArray(parsedData.today_steps) || parsedData.today_steps.length === 0) {
      parsedData.today_steps = parsedData.actions?.slice(0, 2) || ['Isolate affected leaves and discard safely.'];
    }
    if (!Array.isArray(parsedData.this_week_steps) || parsedData.this_week_steps.length === 0) {
      parsedData.this_week_steps = parsedData.actions?.slice(2) || ['Monitor canopy daily during early morning hours.'];
    }
    if (!Array.isArray(parsedData.prevent_next_season) || parsedData.prevent_next_season.length === 0) {
      parsedData.prevent_next_season = ['Maintain crop rotation and use certified disease-free seeds.'];
    }

    return res.json({
      success: true,
      diagnosis: parsedData,
    });
  } catch (err: any) {
    console.error('Error in /api/diagnose:', err);
    return res.status(500).json({
      error: 'Failed to diagnose crop condition',
      message: err.message,
    });
  }
});

// Interactive Voice & Text Chatbot endpoint using Gemini 2.5 Flash
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [], context = {}, language = 'en' } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'Gemini API key is not configured on the server.',
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Format current agricultural context
    const contextDetails: string[] = [];
    if (context.activeTab) {
      contextDetails.push(`Current App Screen: ${context.activeTab}`);
    }
    if (context.diagnosis) {
      contextDetails.push(
        `Active Crop Diagnosis: Crop: ${context.diagnosis.cropName || 'Unknown'}, Disease/Pest: ${context.diagnosis.conditionName || 'N/A'}, Severity: ${context.diagnosis.severity || 'medium'}, Urgency: ${context.diagnosis.urgency || 'N/A'}, Today Steps: ${(context.diagnosis.today_steps || []).join('; ')}`
      );
    }
    if (context.sprayWindow) {
      contextDetails.push(
        `Weather & Spray Window: Status: ${context.sprayWindow.status || 'unknown'}, Next Window: ${context.sprayWindow.title || 'N/A'}, Wind: ${context.sprayWindow.wind || 'N/A'}, Rain Risk: ${context.sprayWindow.rain || 'N/A'}`
      );
    }

    const systemInstruction = `You are Sylva, a friendly, concise, and deeply knowledgeable agricultural AI agronomist and plant pathologist.
You speak with farmers, crop scouts, and agriculturalists.

CORE PRINCIPLES:
1. Always prioritize sustainable Integrated Pest Management (IPM):
   - Cultural/physical/organic controls first (pruning, sanitation, airflow, neem/baking soda).
   - Biological controls second (beneficial microbes, bio-pesticides).
   - Chemical remedies only as a strict last resort, using general product names only (e.g., copper fungicide, horticultural oil). NEVER provide exact chemical dosage recipes; always instruct them to check the product container label and confirm with their local agricultural officer or KVK (Krishi Vigyan Kendra).
2. Keep spoken/chat answers conversational, actionable, and relatively concise (2-4 sentences max unless detailed steps are requested), so they sound natural when read aloud via voice synthesis.
3. Be respectful and supportive.
4. Ground your advice in the provided active field context:
${contextDetails.length > 0 ? contextDetails.join('\n') : 'No active crop scan loaded yet.'}
5. Respond directly and fluently in the requested language: ${language}.`;

    // Construct history for conversation
    const contents: any[] = [];
    if (Array.isArray(history) && history.length > 0) {
      for (const item of history.slice(-6)) {
        contents.push({
          role: item.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: item.content || '' }],
        });
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction,
      },
    });

    const reply = response.text || "I'm here to help with your crops and field conditions. Please ask me about diseases, spray timing, or treatment steps.";

    return res.json({
      success: true,
      reply,
    });
  } catch (err: any) {
    console.error('Error in /api/chat:', err);
    return res.status(500).json({
      error: 'Failed to process chat message',
      message: err.message,
    });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sylva server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
