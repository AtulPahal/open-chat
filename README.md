# ⚡ NexusChat — Multi-API AI Assistant

A premium, dark-themed AI chat interface built with **React + Vite** that connects to multiple LLM providers simultaneously. Switch between NVIDIA NIM, OpenRouter, and any OpenAI-compatible endpoint — all from one sleek UI.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Features

- **Multi-Provider Support** — Connect to NVIDIA NIM, OpenRouter, and any OpenAI-compatible API (OpenAI, Ollama, LM Studio, etc.)
- **26+ NVIDIA Models** — Llama 4 Maverick, Nemotron Ultra 253B, DeepSeek V4, Gemma 4, Mistral Large 3, Qwen3, and more
- **Free Models** — DeepSeek V4 Flash and DeepSeek R1 via OpenRouter at zero cost
- **Real-Time Streaming** — Responses stream in token-by-token via SSE
- **Markdown Rendering** — Full GFM support with syntax-highlighted code blocks and one-click copy
- **Chat History** — Persistent sidebar with search, rename, and delete
- **Model Selector** — Dynamic dropdown that only shows models for providers with active API keys
- **Settings Panel** — Tabbed UI for API keys, model browser, system prompt, and data management
- **Export / Import** — Backup and restore all chats as JSON
- **Keyboard Shortcuts** — `Ctrl+N` new chat, `Ctrl+/` toggle sidebar
- **Dark Mode** — Linear-inspired design with glassmorphism, smooth gradients, and micro-animations

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- At least one API key (NVIDIA NIM or OpenRouter)

### 1. Clone & Install

```bash
git clone https://github.com/your-username/nexuschat.git
cd nexuschat
npm install
```

### 2. Configure API Keys

Copy the example and add your keys:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# NVIDIA NIM — https://build.nvidia.com/
VITE_NVIDIA_API_KEY=nvapi-xxxxx

# OpenRouter — https://openrouter.ai/keys
VITE_OPENROUTER_API_KEY=sk-or-v1-xxxxx

# OpenAI-Compatible (optional)
VITE_CUSTOM_API_KEY=sk-xxxxx
VITE_CUSTOM_BASE_URL=https://api.openai.com/v1
```

> **Tip:** You can also add keys at runtime via **Settings → API Keys** in the app.

### 3. Run

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 🔑 Supported Providers

### NVIDIA NIM

Get a free key at [build.nvidia.com](https://build.nvidia.com/)

| Model | ID |
|-------|-----|
| Llama 3.3 70B | `meta/llama-3.3-70b-instruct` |
| Llama 4 Maverick | `meta/llama-4-maverick-17b-128e-instruct` |
| Nemotron Ultra 253B | `nvidia/llama-3.1-nemotron-ultra-253b-v1` |
| Nemotron Super 49B | `nvidia/llama-3.3-nemotron-super-49b-v1` |
| DeepSeek V4 Flash | `deepseek-ai/deepseek-v4-flash` |
| DeepSeek V4 Pro | `deepseek-ai/deepseek-v4-pro` |
| Gemma 4 31B | `google/gemma-4-31b-it` |
| Mistral Large 3 675B | `mistralai/mistral-large-3-675b-instruct-2512` |
| Qwen3 Coder 480B | `qwen/qwen3-coder-480b-a35b-instruct` |
| Kimi K2.6 | `moonshotai/kimi-k2.6` |
| *...and 16 more* | |

### OpenRouter

Get a free key at [openrouter.ai/keys](https://openrouter.ai/keys)

| Model | ID | Cost |
|-------|-----|------|
| DeepSeek V4 Flash ⚡ | `deepseek/deepseek-v4-flash:free` | **Free** |
| DeepSeek R1 ⚡ | `deepseek/deepseek-r1:free` | **Free** |
| GPT-4o | `openai/gpt-4o` | Paid |
| Claude Sonnet 4 | `anthropic/claude-sonnet-4` | Paid |
| Gemini 2.5 Pro | `google/gemini-2.5-pro-preview` | Paid |
| *...and more* | | |

### OpenAI-Compatible

Works with any endpoint that follows the OpenAI chat completions API:

- **OpenAI** — `https://api.openai.com/v1`
- **Ollama** — `http://localhost:11434/v1`
- **LM Studio** — `http://localhost:1234/v1`
- **vLLM** — `http://localhost:8000/v1`

---

## 📁 Project Structure

```
nexuschat/
├── .env                          # API keys (gitignored)
├── .env.example                  # Template for API keys
├── index.html                    # HTML entry point
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx                  # React mount
    ├── index.css                 # Full design system (CSS variables)
    ├── App.jsx                   # Main orchestrator + InputBar
    ├── lib/
    │   ├── providers.js          # Multi-provider config, streaming, testing
    │   └── toast.js              # Toast notification utility
    └── components/
        ├── Sidebar.jsx           # Chat history, search, rename/delete
        ├── ModelSelector.jsx     # Provider-grouped model dropdown
        ├── Settings.jsx          # API keys, models browser, data mgmt
        └── Message.jsx           # Markdown rendering + streaming variant
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Send message |
| `Shift + Enter` | New line |
| `Ctrl/⌘ + N` | New chat |
| `Ctrl/⌘ + /` | Toggle sidebar |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Build Tool | Vite 8 |
| Markdown | [marked](https://github.com/markedjs/marked) |
| Code Highlighting | [highlight.js](https://highlightjs.org/) |
| Styling | Vanilla CSS with custom properties |
| Persistence | localStorage |
| API Protocol | OpenAI-compatible chat completions (SSE streaming) |

---

## 📦 Build for Production

```bash
npm run build
```

Output goes to `dist/`. Serve with any static file server:

```bash
npx serve dist
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## 📄 License

MIT © NexusChat
