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
    name: 'NVIDIA',
    baseUrl: typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV ? '/proxy/nvidia/v1' : 'https://integrate.api.nvidia.com/v1',
    link: 'https://build.nvidia.com/',
    models: [
      { id: "meta/llama-3.3-70b-instruct", name: "Llama 3.3 70B", isFree: false },
      { id: "meta/llama-3.2-3b-instruct", name: "Llama 3.2 3B ⚡ Free", isFree: true },
      { id: "meta/llama-3.2-1b-instruct", name: "Llama 3.2 1B ⚡ Free", isFree: true },
      { id: "meta/llama-3.1-405b-instruct", name: "Llama 3.1 405B", isFree: false },
      { id: "meta/llama-3.1-70b-instruct", name: "Llama 3.1 70B", isFree: false },
      { id: "meta/llama-3.1-8b-instruct", name: "Llama 3.1 8B ⚡ Free", isFree: true },
      { id: "mistralai/mistral-large-2-instruct", name: "Mistral Large 2", isFree: false },
      { id: "mistralai/mixtral-8x22b-v0.1", name: "Mixtral 8x22B", isFree: false },
      { id: "mistralai/mistral-7b-instruct-v0.3", name: "Mistral 7B ⚡ Free", isFree: true },
      { id: "google/gemma-2-27b-it", name: "Gemma 2 27B", isFree: false },
      { id: "google/gemma-2-9b-it", name: "Gemma 2 9B ⚡ Free", isFree: true },
      { id: "deepseek-ai/deepseek-v4-flash", name: "DeepSeek V4 Flash ⚡ Free", isFree: true },
      { id: "deepseek-ai/deepseek-coder-6.7b-instruct", name: "DeepSeek Coder 6.7B", isFree: false },
      { id: "qwen/qwen3.5-122b-a10b", name: "Qwen 3.5 122B", isFree: false },
      { id: "nvidia/llama-3.1-nemotron-70b-instruct", name: "Nemotron 70B", isFree: false },
      { id: "nvidia/nemotron-4-340b-instruct", name: "Nemotron 340B", isFree: false },
      { id: "microsoft/phi-3.5-moe-instruct", name: "Phi-3.5 MoE", isFree: false }
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
    baseUrl: typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV ? '/proxy/opencode/zen/v1' : 'https://opencode.ai/zen/v1',
    link: 'https://opencode.ai/zen',
    models: [
      { id: 'gpt-5.5', name: 'GPT 5.5', isFree: false },
      { id: 'gpt-5.5-pro', name: 'GPT 5.5 Pro', isFree: false },
      { id: 'gpt-5.4', name: 'GPT 5.4', isFree: false },
      { id: 'gpt-5.4-pro', name: 'GPT 5.4 Pro', isFree: false },
      { id: 'gpt-5.4-mini', name: 'GPT 5.4 Mini', isFree: false },
      { id: 'gpt-5.4-nano', name: 'GPT 5.4 Nano', isFree: false },
      { id: 'gpt-5.3-codex-spark', name: 'GPT 5.3 Codex Spark', isFree: false },
      { id: 'gpt-5.3-codex', name: 'GPT 5.3 Codex', isFree: false },
      { id: 'gpt-5.2', name: 'GPT 5.2', isFree: false },
      { id: 'gpt-5.2-codex', name: 'GPT 5.2 Codex', isFree: false },
      { id: 'gpt-5.1', name: 'GPT 5.1', isFree: false },
      { id: 'gpt-5.1-codex-max', name: 'GPT 5.1 Codex Max', isFree: false },
      { id: 'gpt-5.1-codex', name: 'GPT 5.1 Codex', isFree: false },
      { id: 'gpt-5.1-codex-mini', name: 'GPT 5.1 Codex Mini', isFree: false },
      { id: 'gpt-5', name: 'GPT 5', isFree: false },
      { id: 'gpt-5-codex', name: 'GPT 5 Codex', isFree: false },
      { id: 'gpt-5-nano', name: 'GPT 5 Nano', isFree: false },
      { id: 'grok-build-0.1', name: 'Grok Build 0.1', isFree: false },
      { id: 'glm-5.1', name: 'GLM 5.1', isFree: false },
      { id: 'glm-5', name: 'GLM 5', isFree: false },
      { id: 'minimax-m2.7', name: 'MiniMax M2.7', isFree: false },
      { id: 'minimax-m2.5', name: 'MiniMax M2.5', isFree: false },
      { id: 'kimi-k2.6', name: 'Kimi K2.6', isFree: false },
      { id: 'kimi-k2.5', name: 'Kimi K2.5', isFree: false },
      { id: 'qwen3.6-plus', name: 'Qwen 3.6 Plus', isFree: false },
      { id: 'qwen3.5-plus', name: 'Qwen 3.5 Plus', isFree: false },
      { id: 'big-pickle', name: 'Big Pickle', isFree: false },
      { id: 'deepseek-v4-flash-free', name: 'DeepSeek V4 Flash ⚡ Free', isFree: true },
      { id: 'qwen3.6-plus-free', name: 'Qwen 3.6 Plus ⚡ Free', isFree: true },
      { id: 'minimax-m2.5-free', name: 'MiniMax M2.5 ⚡ Free', isFree: true },
      { id: 'nemotron-3-super-free', name: 'Nemotron 3 Super ⚡ Free', isFree: true }
    ],
    getHeaders(apiKey) {
      return { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
    }
  }
};

/** Read API keys from env + any runtime overrides */
export function getApiKeys(overrides = {}) {
  return {
    openrouter: overrides.openrouter || '',
    openai: overrides.openai || '',
    google: overrides.google || '',
    nvidia: overrides.nvidia || '',
    groq: overrides.groq || '',
    anthropic: overrides.anthropic || '',
    opencode: overrides.opencode || '',
  };
}

export function getProviders() {
  return PROVIDERS;
}

/** Get available models — merge static with dynamic */
export function getAvailableModels(apiKeys, fetchedModels = {}, pricingMode = 'all') {
  const models = [];
  for (const [providerId, provider] of Object.entries(PROVIDERS)) {
    if (!apiKeys[providerId]) continue;

    const staticModels = provider.models || [];
    let sourceModels = staticModels;

    if (fetchedModels[providerId]) {
      const dynamicList = fetchedModels[providerId];
      const dynamicIds = new Set(dynamicList.map(m => m.id));
      const staticIds = new Set(staticModels.map(m => m.id));
      
      const keptModels = staticModels.filter(m => dynamicIds.has(m.id));
      const newModels = dynamicList.filter(m => !staticIds.has(m.id));
      
      sourceModels = [...keptModels, ...newModels];
    }

    for (const model of sourceModels) {
      if (pricingMode === 'free' && !model.isFree) continue;
      if (pricingMode === 'paid' && model.isFree) continue;
      models.push({ ...model, provider: provider.name, providerId });
    }
  }
  return models;
}

/** Get model display name */
export function getModelName(modelId, providerId, fetchedModels = {}) {
  const provider = PROVIDERS[providerId];
  if (!provider) return modelId || 'Select Model';
  
  let model = provider.models.find(m => m.id === modelId);
  if (!model && fetchedModels[providerId]) {
    model = fetchedModels[providerId].find(m => m.id === modelId);
  }
  return model?.name || modelId;
}

/** Fetch models dynamically from provider */
export async function fetchProviderModels(providerId, apiKey) {
  const provider = PROVIDERS[providerId];
  if (!provider) return null;
  
  if (!apiKey) return null;

  let headers = provider.getHeaders(apiKey || '');
  if (!apiKey) {
    delete headers['Authorization'];
  }

  try {
    const res = await fetch(`${provider.baseUrl}/models`, {
      method: 'GET',
      headers
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.data && Array.isArray(data.data)) {
      return data.data.map(m => ({
        id: m.id,
        name: m.name || m.id,
        isFree: m.pricing ? (m.pricing.prompt === "0" || m.pricing.prompt === 0) && (m.pricing.completion === "0" || m.pricing.completion === 0) : false
      }));
    }
    return null;
  } catch (err) {
    console.error(`Failed to fetch models for ${providerId}:`, err);
    return null;
  }
}

/** Test API key connection */
export async function testConnection(providerId, apiKeys) {
  const provider = PROVIDERS[providerId];
  if (!provider) return { success: false, error: 'Unknown provider' };

  const apiKey = apiKeys[providerId];
  if (!apiKey) return { success: false, error: 'No API key set' };

  const baseUrl = provider.baseUrl;

  try {
    const res = await fetch(`${baseUrl}/models`, {
      method: 'GET',
      headers: provider.getHeaders(apiKey)
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.error?.message || data.error?.details?.[0]?.message || data.detail || `HTTP ${res.status}` };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/** Stream a chat completion. Accepts an AbortSignal. */
export async function streamChat({ providerId, modelId, messages, apiKeys, onChunk, onDone, onError, signal }) {
  const provider = PROVIDERS[providerId];
  if (!provider) { onError(new Error('Unknown provider. Select a model first.')); return; }

  const apiKey = apiKeys[providerId];
  if (!apiKey) { onError(new Error('API key not configured. Add it in Settings or .env.')); return; }

  const baseUrl = provider.baseUrl;
  
  let retries = 3;
  let delay = 1000;

  while (retries >= 0) {
    try {
      if (signal?.aborted) {
        onDone();
        return;
      }

      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: provider.getHeaders(apiKey),
        body: JSON.stringify({ model: modelId, messages, stream: true, max_tokens: 4096, temperature: 0.7 }),
        signal
      });

      if (!res.ok) {
        if (res.status === 429 && retries > 0) {
          // Rate limited, retry with backoff
          await new Promise(r => setTimeout(r, delay));
          delay *= 2;
          retries--;
          continue;
        }
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
          if (!trimmed.startsWith("data:")) continue;
          const dataStr = trimmed.replace(/^data:\s*/, "");
          if (!dataStr) continue;
          if (dataStr === "[DONE]") { onDone(); return; }
          try {
            const parsed = JSON.parse(dataStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) onChunk(content);
          } catch { /* skip malformed */ }
        }
      }
      onDone();
      return; // Success
    } catch (err) {
      if (err.name === 'AbortError' || signal?.aborted) {
        onDone();
        return;
      }
      if (retries > 0 && err.message !== 'AbortError' && !err.message.includes('API key')) {
        await new Promise(r => setTimeout(r, delay));
        delay *= 2;
        retries--;
        continue;
      }
      onError(err);
      return;
    }
  }
}

/** Generate a complete text response (non-streaming). Accepts an AbortSignal. */
export async function generateText({ providerId, modelId, messages, apiKeys, signal }) {
  const provider = PROVIDERS[providerId];
  if (!provider) throw new Error('Unknown provider. Select a model first.');

  const apiKey = apiKeys[providerId];
  if (!apiKey) throw new Error('API key not configured. Add it in Settings or .env.');

  const baseUrl = provider.baseUrl;
  let retries = 3;
  let delay = 1000;

  while (retries >= 0) {
    try {
      if (signal?.aborted) throw new Error('AbortError');

      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: provider.getHeaders(apiKey),
        body: JSON.stringify({ model: modelId, messages, stream: false, max_tokens: 4096, temperature: 0.7 }),
        signal
      });

      if (!res.ok) {
        if (res.status === 429 && retries > 0) {
          await new Promise(r => setTimeout(r, delay));
          delay *= 2;
          retries--;
          continue;
        }
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message || data.detail || `API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
    } catch (err) {
      if (err.name === 'AbortError' || signal?.aborted) throw err;
      if (retries > 0 && !err.message.includes('API key')) {
        await new Promise(r => setTimeout(r, delay));
        delay *= 2;
        retries--;
        continue;
      }
      throw err;
    }
  }
}
