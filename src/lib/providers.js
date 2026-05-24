/**
 * Provider configuration and API streaming.
 * API keys come from .env (VITE_ prefix) or can be overridden at runtime.
 */

const PROVIDERS = {
  nvidia: {
    id: 'nvidia',
    name: 'NVIDIA NIM',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    models: [
      { id: 'meta/llama-3.3-70b-instruct', name: 'Llama 3.3 70B' },
      { id: 'meta/llama-3.1-70b-instruct', name: 'Llama 3.1 70B' },
      { id: 'meta/llama-3.1-8b-instruct', name: 'Llama 3.1 8B' },
      { id: 'meta/llama-4-maverick-17b-128e-instruct', name: 'Llama 4 Maverick' },
      { id: 'meta/llama-3.2-3b-instruct', name: 'Llama 3.2 3B' },
      { id: 'nvidia/llama-3.1-nemotron-70b-instruct', name: 'Nemotron 70B' },
      { id: 'nvidia/llama-3.1-nemotron-ultra-253b-v1', name: 'Nemotron Ultra 253B' },
      { id: 'nvidia/llama-3.3-nemotron-super-49b-v1', name: 'Nemotron Super 49B' },
      { id: 'nvidia/llama-3.1-nemotron-51b-instruct', name: 'Nemotron 51B' },
      { id: 'deepseek-ai/deepseek-v4-flash', name: 'DeepSeek V4 Flash' },
      { id: 'deepseek-ai/deepseek-v4-pro', name: 'DeepSeek V4 Pro' },
      { id: 'google/gemma-4-31b-it', name: 'Gemma 4 31B' },
      { id: 'google/gemma-3-12b-it', name: 'Gemma 3 12B' },
      { id: 'google/gemma-3n-e4b-it', name: 'Gemma 3n E4B' },
      { id: 'mistralai/mistral-large-3-675b-instruct-2512', name: 'Mistral Large 3 675B' },
      { id: 'mistralai/mistral-large-2-instruct', name: 'Mistral Large 2' },
      { id: 'mistralai/mistral-medium-3.5-128b', name: 'Mistral Medium 3.5' },
      { id: 'mistralai/mistral-small-4-119b-2603', name: 'Mistral Small 4' },
      { id: 'moonshotai/kimi-k2.6', name: 'Kimi K2.6' },
      { id: 'qwen/qwen3-coder-480b-a35b-instruct', name: 'Qwen3 Coder 480B' },
      { id: 'qwen/qwen3-next-80b-a3b-instruct', name: 'Qwen3 Next 80B' },
      { id: 'microsoft/phi-4-mini-instruct', name: 'Phi-4 Mini' },
      { id: 'minimaxai/minimax-m2.7', name: 'MiniMax M2.7' },
      { id: 'stepfun-ai/step-3.5-flash', name: 'Step 3.5 Flash' },
      { id: 'nv-mistralai/mistral-nemo-12b-instruct', name: 'Mistral Nemo 12B' },
      { id: 'bytedance/seed-oss-36b-instruct', name: 'Seed OSS 36B' },
    ],
    getHeaders(apiKey) {
      return { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
    }
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: [
      { id: 'deepseek/deepseek-v4-flash:free', name: 'DeepSeek V4 Flash ⚡ Free' },
      { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1 ⚡ Free' },
      { id: 'google/gemini-2.5-flash-preview', name: 'Gemini 2.5 Flash' },
      { id: 'google/gemini-2.5-pro-preview', name: 'Gemini 2.5 Pro' },
      { id: 'openai/gpt-4o', name: 'GPT-4o' },
      { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4' },
      { id: 'anthropic/claude-3.5-haiku', name: 'Claude 3.5 Haiku' },
      { id: 'meta-llama/llama-4-maverick', name: 'Llama 4 Maverick' },
      { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1' },
      { id: 'mistralai/mistral-medium-3', name: 'Mistral Medium 3' },
    ],
    getHeaders(apiKey) {
      return {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'NexusChat'
      };
    }
  },
  custom: {
    id: 'custom',
    name: 'OpenAI-Compatible',
    baseUrl: 'https://api.openai.com/v1',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    ],
    getHeaders(apiKey) {
      return { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
    }
  }
};

/** Read API keys from env + any runtime overrides */
export function getApiKeys(overrides = {}) {
  return {
    nvidia: overrides.nvidia || import.meta.env.VITE_NVIDIA_API_KEY || '',
    openrouter: overrides.openrouter || import.meta.env.VITE_OPENROUTER_API_KEY || '',
    custom: overrides.custom || import.meta.env.VITE_CUSTOM_API_KEY || '',
  };
}

/** Get the custom base URL */
export function getCustomBaseUrl(override) {
  return override || import.meta.env.VITE_CUSTOM_BASE_URL || 'https://api.openai.com/v1';
}

/** Get all providers config */
export function getProviders() {
  return PROVIDERS;
}

/** Get available models — only from providers with an API key set */
export function getAvailableModels(apiKeys) {
  const models = [];
  for (const [providerId, provider] of Object.entries(PROVIDERS)) {
    if (!apiKeys[providerId]) continue;
    for (const model of provider.models) {
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
export async function testConnection(providerId, apiKeys, customBaseUrl) {
  const provider = PROVIDERS[providerId];
  if (!provider) return { success: false, error: 'Unknown provider' };

  const apiKey = apiKeys[providerId];
  if (!apiKey) return { success: false, error: 'No API key set' };

  const baseUrl = providerId === 'custom' ? (customBaseUrl || provider.baseUrl) : provider.baseUrl;
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
export function streamChat({ providerId, modelId, messages, apiKeys, customBaseUrl, onChunk, onDone, onError }) {
  const provider = PROVIDERS[providerId];
  if (!provider) { onError(new Error('Unknown provider. Select a model first.')); return null; }

  const apiKey = apiKeys[providerId];
  if (!apiKey) { onError(new Error('API key not configured. Add it in Settings or .env.')); return null; }

  const baseUrl = providerId === 'custom' ? (customBaseUrl || provider.baseUrl) : provider.baseUrl;
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
