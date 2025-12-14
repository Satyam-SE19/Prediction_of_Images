// The front-end should not call the Google GenAI SDK directly (it requires a secret API key
// and is intended to run on a server). Instead, call our backend API which performs
// the classification server-side and returns a safe JSON result.
export const classifyAnimalImage = async (base64Image, mimeType = 'image/jpeg') => {
  try {
    const res = await fetch('/api/classify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ base64Image, mimeType })
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 500 && /api[_ ]?key/i.test(text)) {
        throw new Error('Server misconfigured: API key missing or invalid. Set API_KEY in .env.local');
      }
      throw new Error(text || 'Server error while classifying image');
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Client classify error:', err);
    throw err;
  }
};

/**
 * Chat with the AI using gemini-3-pro-preview for deep reasoning
 */
export const chatWithExpert = async (history, newMessage) => {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history, newMessage })
    });

    if (!res.ok) {
      const t = await res.text();
      console.error('Chat server error:', t);
      return "Sorry, I'm having trouble connecting to the expert system right now.";
    }

    const { text } = await res.json();
    return text || "I couldn't generate a response.";
  } catch (err) {
    console.error('Client chat error:', err);
    return "Sorry, I'm having trouble connecting to the expert system right now.";
  }
};

/**
 * Search the web using gemini-2.5-flash with googleSearch tool
 */
export const searchLivestockNews = async (query) => {
  try {
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error(t || 'Search failed');
    }

    return await res.json();
  } catch (err) {
    console.error('Client search error:', err);
    throw err;
  }
};