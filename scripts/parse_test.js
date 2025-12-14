import { extractJsonString, parseJsonTolerant } from '../lib/jsonHelper.js';

const samples = [
  '```json\n{ "classification": "Buffalo", "confidence": 95 }\n```',
  'Some text before \n```json\n{\n "classification": "Cattle",\n "confidence": 80\n}\n```\nTrailing notes',
  '{"classification":"Cattle","confidence":90}',
  'Output:\n{ "classification": "Unknown", "confidence": 50 }\nMore text',
  'No json here at all',
  '[{"a":1},{"b":2}]'
];

for (const s of samples) {
  console.log('INPUT:', s.slice(0, 80).replace(/\n/g, '\\n'));
  const extracted = extractJsonString(s);
  console.log('EXTRACTED:', extracted && extracted.slice(0, 80).replace(/\n/g, '\\n'));
  try {
    const parsed = parseJsonTolerant(s);
    console.log('PARSED:', parsed);
  } catch (e) {
    console.log('PARSE ERROR:', e.message);
  }
  console.log('---');
}
