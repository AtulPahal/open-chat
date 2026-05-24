/**
 * Provider configuration and API streaming.
 * API keys come from .env (VITE_ prefix) or can be overridden at runtime.
 */

const PROVIDERS = {
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    link: 'https://openrouter.ai/keys',
    models: [
      { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', isFree: false },
      { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', isFree: false },
      { id: 'openai/gpt-4o', name: 'GPT-4o', isFree: false },
      { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', isFree: false },
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', isFree: false },
      { id: 'deepseek/deepseek-v4-flash:free', name: 'DeepSeek V4 Flash ⚡ Free', isFree: true },
      { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', isFree: false },
      { id: 'meta-llama/llama-3-8b-instruct:free', name: 'Llama 3 8B ⚡ Free', isFree: true },
      { id: 'mistralai/mistral-large-2411', name: 'Mistral Large', isFree: false },
    ],
    getHeaders(apiKey) {
      return {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'OpenChat'
      };
    }
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    link: 'https://platform.openai.com/api-keys',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', isFree: false },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', isFree: false },
      { id: 'o1-preview', name: 'o1 Preview', isFree: false },
      { id: 'o1-mini', name: 'o1 Mini', isFree: false },
    ],
    getHeaders(apiKey) {
      return { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
    }
  },
  google: {
    id: 'google',
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    link: 'https://aistudio.google.com/app/apikey',
    models: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', isFree: false },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', isFree: false },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', isFree: false },
    ],
    getHeaders(apiKey) {
      return { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
    }
  },
  nvidia: {
    id: 'nvidia',
    name: 'NVIDIA NIM',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    link: 'https://build.nvidia.com/',
    models: [
      { id: 'meta/llama-3.3-70b-instruct', name: 'Llama 3.3 70B (NIM)', isFree: false },
      { id: 'nvidia/llama-3.1-nemotron-70b-instruct', name: 'Nemotron 70B', isFree: false },
    ],
    getHeaders(apiKey) {
      return { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
    }
  },
  groq: {
    id: 'groq',
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    link: 'https://console.groq.com/keys',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Groq)', isFree: false },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Groq)', isFree: false },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B (Groq)', isFree: false },
    ],
    getHeaders(apiKey) {
      return { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
    }
  },
  opencode: {
    id: 'opencode',
    name: 'OpenCode',
    baseUrl: 'https://opencode.ai/api/v1',
    link: 'https://opencode.ai/zen',
    models: [
      { id: 'opencode-default', name: 'OpenCode Default Model', isFree: false }
    ],
    getHeaders(apiKey) {
      return { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
    }
  }
};

/** Read API keys from env + any runtime overrides */
export function getApiKeys(overrides = {}) {
  return {
    openrouter: overrides.openrouter || import.meta.env.VITE_OPENROUTER_API_KEY || '',
    openai: overrides.openai || import.meta.env.VITE_OPENAI_API_KEY || '',
    google: overrides.google || import.meta.env.VITE_GOOGLE_API_KEY || '',
    nvidia: overrides.nvidia || import.meta.env.VITE_NVIDIA_API_KEY || '',
    groq: overrides.groq || import.meta.env.VITE_GROQ_API_KEY || '',
    anthropic: overrides.anthropic || import.meta.env.VITE_ANTHROPIC_API_KEY || '',
    opencode: overrides.opencode || import.meta.env.VITE_OPENCODE_API_KEY || '',
  };
}

export function getProviders() {
  return PROVIDERS;
}

/** Get available models — only from providers with an API key set */
export function getAvailableModels(apiKeys, dynamicModels = [], pricingMode = 'all') {
  const models = [];
  for (const [providerId, provider] of Object.entries(PROVIDERS)) {
    if (!apiKeys[providerId]) continue;

    const sourceModels = (providerId === 'openrouter' && dynamicModels.length > 0)
      ? dynamicModels
      : provider.models;

    for (const model of sourceModels) {
      if (pricingMode === 'free' && !model.isFree) continue;
      if (pricingMode === 'paid' && model.isFree) continue;
      models.push({ ...model, provider: provider.name, providerId });
    }
  }
  return models;
}

/** Get model display name */
export function getModelName(modelId, providerId) {
  const provider = PROVIDERS[providerId];
  if (!provider) return modelId || 'Select Model';
  const model = provider.models.find(m => m.id === modelId);
  return model?.name || modelId;
}

/** Test API key connection */
export async function testConnection(providerId, apiKeys) {
  const provider = PROVIDERS[providerId];
  if (!provider) return { success: false, error: 'Unknown provider' };

  const apiKey = apiKeys[providerId];
  if (!apiKey) return { success: false, error: 'No API key set' };

  const baseUrl = provider.baseUrl;
  const testModel = provider.models[0]?.id;

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: provider.getHeaders(apiKey),
      body: JSON.stringify({ model: testModel, messages: [{ role: 'user', content: 'Hi' }], max_tokens: 1, stream: false })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.error?.message || `HTTP ${res.status}` };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/** Stream a chat completion. Returns an AbortController. */
export function streamChat({ providerId, modelId, messages, apiKeys, onChunk, onDone, onError }) {
  const provider = PROVIDERS[providerId];
  if (!provider) { onError(new Error('Unknown provider. Select a model first.')); return null; }

  const apiKey = apiKeys[providerId];
  if (!apiKey) { onError(new Error('API key not configured. Add it in Settings or .env.')); return null; }

  const baseUrl = provider.baseUrl;
  const controller = new AbortController();

  (async () => {
    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: provider.getHeaders(apiKey),
        body: JSON.stringify({ model: modelId, messages, stream: true, max_tokens: 4096, temperature: 0.7 }),
        signal: controller.signal
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message || data.detail || `API error: ${res.status} ${res.statusText}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') { onDone(); return; }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) onChunk(content);
          } catch { /* skip malformed */ }
        }
      }
      onDone();
    } catch (err) {
      if (err.name === 'AbortError') { onDone(); return; }
      onError(err);
    }
  })();

  return controller;
}
