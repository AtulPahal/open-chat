# ⚡ OpenChat — API AI Assistant

A premium, dark-themed AI chat interface built with **React + Vite** that connects to OpenRouter. Access top-tier models like GPT-4o, Claude 3.5 Sonnet, and DeepSeek all from one sleek UI.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Features

- **OpenRouter Support** — Connect to OpenRouter to access multiple LLMs via a single API key
- **Premium Models** — GPT-4o, Claude 3.5 Sonnet, Gemini 2.5, Llama 3.3, and DeepSeek V4
- **Free Models** — Llama 3 8B via OpenRouter at zero cost
- **Real-Time Streaming** — Responses stream in token-by-token via SSE
- **Markdown Rendering** — Full GFM support with syntax-highlighted code blocks and one-click copy
- **Chat History** — Persistent sidebar with search, rename, and delete
- **Model Selector** — Dynamic dropdown to switch between available models
- **Settings Panel** — Manage API keys and chat data
- **Keyboard Shortcuts** — `Ctrl+N` new chat, `Ctrl+/` toggle sidebar
- **Dark Mode** — Linear-inspired design with glassmorphism, smooth gradients, and micro-animations

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- An [OpenRouter](https://openrouter.ai/keys) API key

### 1. Clone & Install

```bash
git clone https://github.com/your-username/openchat.git
cd openchat
npm install
```

### 2. Configure API Keys

Copy the example and add your key:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# OpenRouter (https://openrouter.ai/keys)
OPENROUTER_API_KEY=sk-or-v1-xxxxx
```

> **Tip:** You can also add keys at runtime via **Settings → API Keys** in the app.

### 3. Run

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 🔑 Supported Models

Through OpenRouter, OpenChat supports top industry models out of the box:

| Model | Provider |
|-------|----------|
| GPT-4o | OpenAI |
| GPT-4o Mini | OpenAI |
| Claude 3.5 Sonnet | Anthropic |
| Gemini 2.5 Pro | Google |
| Gemini 2.5 Flash | Google |
| DeepSeek V4 Flash | DeepSeek |
| Llama 3.3 70B | Meta |
| Llama 3 8B ⚡ Free | Meta |
| Mistral Large | Mistral |

---

## 📁 Project Structure

```
openchat/
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
    │   ├── providers.js          # Provider config, streaming, testing
    │   └── toast.js              # Toast notification utility
    └── components/
        ├── Sidebar.jsx           # Chat history, search, rename/delete
        ├── ModelSelector.jsx     # Model dropdown
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
| Markdown | [marked](https://github.com/markedjs/marked) & react-markdown |
| Code Highlighting | [highlight.js](https://highlightjs.org/) |
| Styling | Vanilla CSS with custom properties |
| Persistence | localStorage |
| API Protocol | OpenAI-compatible chat completions (SSE streaming) via OpenRouter |

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

MIT © OpenChat
