import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const RESOLVED_API_KEY = process.env.API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;
const RESOLVED_BASE_URL = process.env.GEMINI_NEXT_GEN_API_BASE_URL || process.env.GEMINI_API_URL || process.env.GEMINI_BASE_URL || process.env.GEMINI_URL || null;

async function list() {
  if (!RESOLVED_API_KEY) {
    console.error('No API key found in env (API_KEY or GEMINI_API_KEY or GOOGLE_API_KEY)');
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey: RESOLVED_API_KEY, ...(RESOLVED_BASE_URL ? { baseURL: RESOLVED_BASE_URL } : {}) });

  try {
    const pager = await ai.models.list();
    const models = [];
    for await (const m of pager) {
      models.push({ id: m.name || m.id || m.model || m.modelId || m.displayName || m } );
    }
    console.log('Found models (first 200):', models.slice(0, 200));
  } catch (err) {
    console.error('Error listing models:', err);
    process.exit(1);
  }
}

list();
