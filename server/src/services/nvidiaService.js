import { config } from '../config/env.js';

export const AIRUS_SYSTEM_PROMPT = `You are AiRus, a loyal, intelligent, and refined personal voice AI assistant. You serve your owner and boss, Surya.

Core Guidelines:
1. Personality: Natural, conversational, clear, direct, and genuinely helpful. Warm and confident.
2. Formality: Address the owner naturally as "Boss", "Sir", or "Surya" when suitable, but do not force it awkwardly into every single response.
3. Voice-Friendly Output: Your responses will often be read aloud by browser text-to-speech. Keep answers spoken-friendly, punchy, and clear. Avoid excessive markdown bullet lists, tables, or noisy formatting unless the user explicitly requests structured data or code.
4. Multilingual Intelligence: You are fluent in English, Telugu, Tenglish (Telugu transcribed in Latin script, e.g. "Ela unnavu boss?"), Hindi, and other languages. When spoken to or asked in Telugu, reply naturally in Telugu script or Tenglish as requested. Never translate forcefully into English if the user asked in their native language.
5. Accuracy & Humility: Explain technical and everyday concepts clearly. If you are uncertain or don't know something, admit it honestly rather than hallucinating facts.
6. Safety & Boundaries: You are a conversational personal assistant. Do not pretend to execute external terminal commands or bank transactions. Focus on conversation, planning, and advice.`;

/**
 * Sends a conversation prompt to the NVIDIA OpenAI-compatible API
 *
 * @param {Array<{role: string, content: string}>} history - Previous messages
 * @param {string} userMessage - Latest user message
 * @param {object} options - Optional override parameters
 * @returns {Promise<{content: string, model: string, usage: object}>}
 */
export async function generateChatResponse(history = [], userMessage, options = {}) {
  const apiKey = options.apiKey || config.nvidia.apiKey;
  const baseUrl = (options.baseUrl || config.nvidia.baseUrl).replace(/\/+$/, '');
  const model = options.model || config.nvidia.model;

  if (!apiKey) {
    const error = new Error('NVIDIA API key is not configured on the server. Please set NVIDIA_API_KEY in server environment.');
    error.statusCode = 503;
    error.isOperational = true;
    throw error;
  }

  // Bound context to the last 12 messages to prevent token overflow and excess latency
  const boundedHistory = history.slice(-12).map((msg) => ({
    role: msg.role === 'assistant' ? 'assistant' : 'user',
    content: String(msg.content || '')
  }));

  const messages = [
    { role: 'system', content: AIRUS_SYSTEM_PROMPT },
    ...boundedHistory,
    { role: 'user', content: String(userMessage) }
  ];

  const payload = {
    model,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 1024,
    top_p: options.top_p ?? 0.95
  };

  const controller = new AbortController();
  const timeoutMs = options.timeoutMs || 35000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorBody = {};
      try {
        errorBody = await response.json();
      } catch (_) {
        errorBody = { message: await response.text().catch(() => '') };
      }

      const errorMessage = errorBody?.error?.message || errorBody?.message || `Upstream NVIDIA API returned status ${response.status}`;
      const err = new Error(`AI Provider Error: ${errorMessage}`);
      err.statusCode = response.status === 401 ? 502 : (response.status === 429 ? 429 : 502);
      err.isOperational = true;
      throw err;
    }

    const data = await response.json();

    if (!data.choices || !data.choices.length || !data.choices[0].message) {
      throw new Error('Malformed response received from NVIDIA AI provider.');
    }

    const content = data.choices[0].message.content || '';

    return {
      content: content.trim(),
      model: data.model || model,
      usage: data.usage || null
    };
  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === 'AbortError') {
      const timeoutError = new Error('AI Provider request timed out after 35 seconds. Please try again.');
      timeoutError.statusCode = 504;
      timeoutError.isOperational = true;
      throw timeoutError;
    }

    throw err;
  }
}
