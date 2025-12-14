// Utility functions to extract/parse JSON from model responses
export const extractJsonString = (text) => {
  if (!text || typeof text !== 'string') return null;
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) return codeBlockMatch[1].trim();

  const firstObj = text.indexOf('{');
  if (firstObj !== -1) {
    let depth = 0;
    for (let i = firstObj; i < text.length; i++) {
      const ch = text[i];
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          const candidate = text.substring(firstObj, i + 1);
          try {
            JSON.parse(candidate);
            return candidate;
          } catch (e) {
            // keep searching
          }
        }
      }
    }
  }

  const firstArr = text.indexOf('[');
  if (firstArr !== -1) {
    let depth = 0;
    for (let i = firstArr; i < text.length; i++) {
      const ch = text[i];
      if (ch === '[') depth++;
      else if (ch === ']') {
        depth--;
        if (depth === 0) {
          const candidate = text.substring(firstArr, i + 1);
          try {
            JSON.parse(candidate);
            return candidate;
          } catch (e) {
            // keep searching
          }
        }
      }
    }
  }

  return null;
};

export const parseJsonTolerant = (text) => {
  if (!text) return null;
  if (typeof text !== 'string') return text;
  try {
    return JSON.parse(text);
  } catch (e) {
    const candidate = extractJsonString(text);
    if (candidate) return JSON.parse(candidate);
    throw new Error('No JSON found in text');
  }
};
