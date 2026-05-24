/**
 * Provider configuration and API streaming.
 * API keys come from .env (VITE_ prefix) or can be overridden at runtime.
 */

const PROVIDERS = {
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: [
      { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', isFree: false },
      { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', isFree: false },
      { id: 'openai/gpt-4o', name: 'GPT-4o', isFree: false },
      { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', isFree: false },
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', isFree: false },
      { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3', isFree: false },
      { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', isFree: false },
      { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', isFree: false },
      { id: 'meta-llama/llama-3-8b-instruct:free', name: 'Llama 3 8B ⚡ Free', isFree: true },
      { id: 'mistralai/mistral-large-2411', name: 'Mistral Large', isFree: false },
    ],
    getHeaders(apiKey) {
      return {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'NexusChat'
      };
    }
  }
};

/** Read API keys from env + any runtime overrides */
export function getApiKeys(overrides = {}) {
  return {
    openrouter: overrides.openrouter || import.meta.env.OPENROUTER_API_KEY || '',
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
