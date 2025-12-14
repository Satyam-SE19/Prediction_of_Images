import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { fileURLToPath } from 'url';
import * as esbuild from 'esbuild';
import { parseJsonTolerant, extractJsonString } from './lib/jsonHelper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local (server-only secrets)
dotenv.config({ path: path.join(__dirname, '.env.local') });

// Resolve API key from several possible env vars for convenience.
const RESOLVED_API_KEY_NAME = process.env.API_KEY ? 'API_KEY' :
  process.env.GEMINI_API_KEY ? 'GEMINI_API_KEY' :
  process.env.GOOGLE_API_KEY ? 'GOOGLE_API_KEY' : null;
const RESOLVED_API_KEY = process.env.API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;

// Allow overriding the Gemini API base URL (useful for testing or if the API
// version path needs to be adjusted). Common env names supported:
// GEMINI_NEXT_GEN_API_BASE_URL, GEMINI_API_URL, GEMINI_BASE_URL
const RESOLVED_BASE_URL = process.env.GEMINI_NEXT_GEN_API_BASE_URL || process.env.GEMINI_API_URL || process.env.GEMINI_BASE_URL || process.env.GEMINI_URL || null;

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to transpile JSX/TSX/JS/TS on the fly
app.use(async (req, res, next) => {
  const filePath = path.join(__dirname, req.path);
  
  // Intercept requests for script files
  if (/\.(jsx|tsx|ts|js)$/.test(req.path)) {
    try {
      if (fs.existsSync(filePath)) {
        const content = await fs.promises.readFile(filePath, 'utf8');
        
        // Use esbuild to transform (transpile JSX). Do NOT inject secret API keys
        // into client-side bundles; always keep secrets server-side.
        const result = await esbuild.transform(content, {
          loader: req.path.endsWith('.ts') ? 'ts' : 'jsx', // Treat .js as jsx to handle imports safely
          sourcefile: req.path,
          format: 'esm'
        });
        
        res.setHeader('Content-Type', 'application/javascript');
        return res.send(result.code);
      } else {
        
        return res.status(404).send('Not found');
      }
    } catch (err) {
      console.error('Transpilation error:', err);
      return res.status(500).send(err.message);
    }
  }
  next();
});

// Helper to normalize model response text
const getResponseText = async (response) => {
  if (typeof response?.text === 'function') {
    const t = await response.text();
    if (t) return t;
  }
  return (
    response?.response?.candidates?.[0]?.content?.parts?.[0]?.text ||
    response?.candidates?.[0]?.content?.parts?.[0]?.text ||
    response?.text ||
    null
  );
};


// Default models (can be overridden via env vars)
const IMAGE_MODEL = process.env.IMAGE_MODEL || 'models/gemini-flash-latest';
const TEXT_MODEL = process.env.TEXT_MODEL || 'models/gemini-pro-latest';

// Server-side image classification endpoint that uses the GenAI SDK.
app.post('/api/classify', express.json({ limit: '15mb' }), async (req, res) => {
  const apiKey = RESOLVED_API_KEY;
  if (!apiKey) {
    return res.status(500).send('Server is not configured with API key. Set API_KEY or GEMINI_API_KEY in .env.local');
  }

  const { base64Image, mimeType } = req.body || {};
  if (!base64Image) {
    return res.status(400).send('Missing base64Image in request body');
  }

  const ai = new GoogleGenAI({ apiKey, ...(RESOLVED_BASE_URL ? { baseURL: RESOLVED_BASE_URL } : {}) });

  const prompt = `Analyze this image of a farm animal (specifically looking for cattle or buffalo). Provide a detailed analysis in JSON with keys: classification (Cattle|Buffalo|Unknown), breed, confidence (0-100), healthStatus, estimatedAge, careTips (array), dietaryRecommendations (array), marketValueEstimate.`;

  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType: mimeType || 'image/jpeg', data: base64Image } },
            { text: prompt }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            classification: { type: Type.STRING, enum: ['Cattle', 'Buffalo', 'Unknown'] },
            breed: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            healthStatus: { type: Type.STRING },
            estimatedAge: { type: Type.STRING },
            careTips: { type: Type.ARRAY, items: { type: Type.STRING } },
            dietaryRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            marketValueEstimate: { type: Type.STRING }
          }
        }
      }
    });

    const text = await getResponseText(response);
    if (!text) return res.status(502).send('No content returned from model');

    // Response may already be JSON or a JSON string. Be tolerant of
    // markdown code-fences (```json ...) or extra text around the JSON.
    let parsed;
    if (typeof text === 'string') {
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        const candidate = extractJsonString(text);
        if (candidate) {
          try {
            parsed = JSON.parse(candidate);
          } catch (e2) {
            console.error('Failed to parse extracted JSON from model response:', e2);
            return res.status(502).send('Model returned invalid JSON');
          }
        } else {
          console.error('Model returned non-JSON response:', text.slice(0, 500));
          return res.status(502).send('Model returned non-JSON response');
        }
      }
    } else {
      parsed = text;
    }
    return res.json(parsed);
  } catch (err) {
    console.error('Server classify error:', err);
    if (isQuotaError(err)) return res.status(429).send('Server quota exhausted: check billing/quotas and retry later');
    // Detect common API key or model-not-found errors and return helpful messages
    try {
      const message = err?.message || '';
      if (/API key not valid|API_KEY_INVALID|API key invalid/i.test(message)) {
        return res.status(500).send('Server misconfigured: API key missing or invalid. Set API_KEY in .env.local');
      }
      if (/is not found for API version|not found for API version/i.test(message)) {
        // Attempt a best-effort fallback: list models and pick a 'flash' image-capable model to retry once
        try {
          const pager = await ai.models.list();
          const available = [];
          for await (const m of pager) available.push(m.name || m.model || m.id);
          const fallback = available.find((m) => /flash|image/i.test(m)) || available[0];
          if (fallback && fallback !== IMAGE_MODEL) {
            console.log('Attempting fallback image model:', fallback);
            try {
              const retryResp = await ai.models.generateContent({
                model: fallback,
                contents: [
                  { role: 'user', parts: [ { inlineData: { mimeType: mimeType || 'image/jpeg', data: base64Image } }, { text: prompt } ] }
                ],
                generationConfig: { responseMimeType: 'application/json' }
              });
              const text2 = await getResponseText(retryResp);
              if (text2) {
                let parsed2;
                if (typeof text2 === 'string') {
                  try {
                    parsed2 = JSON.parse(text2);
                  } catch (e) {
                    const candidate2 = extractJsonString(text2);
                    if (candidate2) {
                      try {
                        parsed2 = JSON.parse(candidate2);
                      } catch (e2) {
                        console.error('Failed to parse extracted JSON from fallback model response:', e2);
                        // fall through to try other fallbacks or error out below
                      }
                    }
                  }
                } else {
                  parsed2 = text2;
                }
                if (parsed2) return res.json(parsed2);
              }
            } catch (retryErr) {
              console.error('Fallback attempt failed:', retryErr);
            }
          }
        } catch (listErr) {
          console.error('Error listing models for fallback:', listErr);
        }

        return res.status(400).send(
          `Model ${IMAGE_MODEL} not available for this API/version. Run 'node scripts/list_models.js' to see available models and set IMAGE_MODEL in .env.local.`
        );
      }
    } catch (e) {
      // ignore
    }

    return res.status(500).send(err.message || 'Classification failed');
  }
});

// Basic search wrapper - uses model tools if available
app.post('/api/search', express.json({ limit: '64kb' }), async (req, res) => {
  const apiKey = RESOLVED_API_KEY;
  if (!apiKey) return res.status(500).send('Server missing API key. Set API_KEY or GEMINI_API_KEY in .env.local');

  const { query } = req.body || {};
  if (!query) return res.status(400).send('Missing query');

  try {
    const ai = new GoogleGenAI({ apiKey: RESOLVED_API_KEY, ...(RESOLVED_BASE_URL ? { baseURL: RESOLVED_BASE_URL } : {}) });
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: [{ role: 'user', parts: [{ text: query }] }],
      tools: [{ googleSearch: {} }]
    });

    const text = await getResponseText(response);
    const chunks = response.response?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = chunks.filter(c => c.web?.uri).map(c => ({ title: c.web.title, uri: c.web.uri }));
    return res.json({ text: text || '', sources });
  } catch (err) {
    console.error('Search endpoint error:', err);
    if (isQuotaError(err)) return res.status(429).send('Server quota exhausted: check billing/quotas and retry later');
    const message = err?.message || '';
    if (/API key not valid|API_KEY_INVALID|API key invalid/i.test(message)) {
      return res.status(500).send('Server misconfigured: API key missing or invalid. Set API_KEY in .env.local');
    }
    if (/is not found for API version|not found for API version/i.test(message)) {
      // Try to find a 'pro' or 'pro-latest' model and retry once
      try {
        const pager = await ai.models.list();
        const available = [];
        for await (const m of pager) available.push(m.name || m.model || m.id);
        const fallback = available.find((m) => /pro|latest|3-pro/i.test(m)) || available[0];
        if (fallback && fallback !== TEXT_MODEL) {
          console.log('Attempting fallback text model:', fallback);
          try {
            const retryResp = await ai.models.generateContent({
              model: fallback,
              contents: [{ role: 'user', parts: [{ text: query }] }]
            });
            const text2 = await getResponseText(retryResp);
            return res.json({ text: text2 || '' });
          } catch (retryErr) {
            console.error('Fallback chat attempt failed:', retryErr);
          }
        }
      } catch (listErr) {
        console.error('Error listing models for fallback:', listErr);
      }
      return res.status(400).send(`Model ${TEXT_MODEL} not available for this API/version. Run 'node scripts/list_models.js' to see available models and set TEXT_MODEL in .env.local.`);
    }
    return res.status(500).send(err.message || 'Search failed');
  }
});

// Chat endpoint: accepts conversation `history` (array of {role,text}) and `newMessage` string
app.post('/api/chat', express.json({ limit: '64kb' }), async (req, res) => {
  const apiKey = RESOLVED_API_KEY;
  if (!apiKey) return res.status(500).send('Server missing API key. Set API_KEY or GEMINI_API_KEY in .env.local');

  const { history = [], newMessage } = req.body || {};
  if (!newMessage || typeof newMessage !== 'string') return res.status(400).send('Missing newMessage');

  try {
    const ai = new GoogleGenAI({ apiKey: RESOLVED_API_KEY, ...(RESOLVED_BASE_URL ? { baseURL: RESOLVED_BASE_URL } : {}) });

    // Build contents from history and the new message. The SDK expects an array of contents
    const contents = [];
    for (const m of history) {
      contents.push({ role: m.role === 'user' ? 'user' : 'assistant', parts: [{ text: m.text || '' }] });
    }
    contents.push({ role: 'user', parts: [{ text: newMessage }] });

    const response = await ai.models.generateContent({ model: TEXT_MODEL, contents });
    const text = await getResponseText(response);
    return res.json({ text: text || '' });
  } catch (err) {
    console.error('Chat endpoint error:', err);
    if (isQuotaError(err)) return res.status(429).send('Server quota exhausted: check billing/quotas and retry later');
    const message = err?.message || '';
    if (/API key not valid|API_KEY_INVALID|API key invalid/i.test(message)) {
      return res.status(500).send('Server misconfigured: API key missing or invalid. Set API_KEY in .env.local');
    }
    if (/is not found for API version|not found for API version/i.test(message)) {
      try {
        const pager = await ai.models.list();
        const available = [];
        for await (const m of pager) available.push(m.name || m.model || m.id);
        const fallback = available.find((m) => /pro|latest|3-pro/i.test(m)) || available[0];
        if (fallback && fallback !== TEXT_MODEL) {
          console.log('Attempting fallback chat model:', fallback);
          try {
            const retryResp = await ai.models.generateContent({ model: fallback, contents });
            const text2 = await getResponseText(retryResp);
            return res.json({ text: text2 || '' });
          } catch (retryErr) {
            console.error('Fallback chat attempt failed:', retryErr);
          }
        }
      } catch (listErr) {
        console.error('Error listing models for fallback:', listErr);
      }
      return res.status(400).send(`Model ${TEXT_MODEL} not available for this API/version. Run 'node scripts/list_models.js' to see available models and set TEXT_MODEL in .env.local.`);
    }
    return res.status(500).send(err.message || 'Chat failed');
  }
});

// Simple health endpoint to check whether API key is configured
app.get('/api/health', (req, res) => {
  return res.json({
    apiKeyConfigured: !!RESOLVED_API_KEY,
    apiKeyEnvVar: RESOLVED_API_KEY_NAME,
    apiBaseUrl: RESOLVED_BASE_URL || null
  });
});

const isQuotaError = (err) => {
  const m = err?.message || '';
  return /quota|RESOURCE_EXHAUSTED|rate limit|limit/i.test(m) || err?.status === 429;
};

// Serve static files
app.use(express.static(__dirname));

// Handle SPA routing - send index.html for all other requests
app.get('*', (req, res) => {
  // Ignore requests for missing source files to prevent confusing HTML responses
  if (req.path.includes('.')) {
    return res.status(404).send('Not found');
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Keep the server resilient to unexpected promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('API_KEY configured:', !!process.env.API_KEY ? 'yes' : 'no (set API_KEY in .env.local)');
});