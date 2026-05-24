import { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Settings from './components/Settings';
import ModelSelector from './components/ModelSelector';
import Message, { StreamingMessage } from './components/Message';
import { getModelName, getAvailableModels, streamChat } from './lib/providers';
import { showToast } from './lib/toast';

const genId = () => crypto.randomUUID?.() || Math.random().toString(36).slice(2, 10);

function loadChats() {
  try { return JSON.parse(localStorage.getItem('nexuschat_chats') || '[]'); } catch { return []; }
}
function saveChatsToLS(chats) { localStorage.setItem('nexuschat_chats', JSON.stringify(chats)); }
function loadSettings() {
  try { return JSON.parse(localStorage.getItem('nexuschat_settings') || '{}'); } catch { return {}; }
}
function saveSettingsToLS(s) { localStorage.setItem('nexuschat_settings', JSON.stringify(s)); }

export default function App() {
  const [chats, setChats] = useState(() => loadChats());
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [apiKeys, setApiKeys] = useState(() => {
    const saved = loadSettings();
    return {
      openrouter: saved.apiKeys?.openrouter || import.meta.env.OPENROUTER_API_KEY || '',
    };
  });
  const [systemPrompt, setSystemPrompt] = useState(() => loadSettings().systemPrompt || '');
  const [currentProvider, setCurrentProvider] = useState(() => loadSettings().currentProvider || '');
  const [currentModel, setCurrentModel] = useState(() => loadSettings().currentModel || '');
  const [modelPricingMode, setModelPricingMode] = useState(() => loadSettings().modelPricingMode || 'all');
  const [openRouterModels, setOpenRouterModels] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  // === REFS — always up-to-date values for async callbacks ===
  const abortRef = useRef(null);
  const chatContainerRef = useRef(null);
  const messagesRef = useRef(messages);
  const activeChatIdRef = useRef(activeChatId);
  const apiKeysRef = useRef(apiKeys);
  const currentModelRef = useRef(currentModel);
  const currentProviderRef = useRef(currentProvider);
  const systemPromptRef = useRef(systemPrompt);
  const isGeneratingRef = useRef(isGenerating);

  // Keep refs in sync
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { activeChatIdRef.current = activeChatId; }, [activeChatId]);
  useEffect(() => { apiKeysRef.current = apiKeys; }, [apiKeys]);
  useEffect(() => { currentModelRef.current = currentModel; }, [currentModel]);
  useEffect(() => { currentProviderRef.current = currentProvider; }, [currentProvider]);
  useEffect(() => { systemPromptRef.current = systemPrompt; }, [systemPrompt]);
  useEffect(() => { isGeneratingRef.current = isGenerating; }, [isGenerating]);

  // Auto-select first model if none selected
  useEffect(() => {
    const models = getAvailableModels(apiKeys, openRouterModels, modelPricingMode);
    if (models.length > 0 && (!currentModel || !models.find(m => m.id === currentModel && m.providerId === currentProvider))) {
      setCurrentProvider(models[0].providerId);
      setCurrentModel(models[0].id);
    }
  }, [apiKeys, openRouterModels, modelPricingMode]);

  // Fetch OpenRouter models dynamically
  useEffect(() => {
    fetch('https://openrouter.ai/api/v1/models')
      .then(res => res.json())
      .then(data => {
        if (data && data.data) {
          const models = data.data.map(m => ({
            id: m.id,
            name: m.name,
            isFree: m.pricing?.prompt === "0" && m.pricing?.completion === "0"
          }));
          setOpenRouterModels(models);
        }
      })
      .catch(err => console.error('Failed to fetch OpenRouter models:', err));
  }, []);

  // Persist
  useEffect(() => { saveChatsToLS(chats); }, [chats]);
  useEffect(() => {
    saveSettingsToLS({ apiKeys, systemPrompt, currentModel, currentProvider, modelPricingMode });
  }, [apiKeys, systemPrompt, currentModel, currentProvider, modelPricingMode]);

  // Load messages on chat switch
  useEffect(() => {
    if (activeChatId) {
      const chat = chats.find(c => c.id === activeChatId);
      setMessages(chat?.messages || []);
    }
  }, [activeChatId]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') { e.preventDefault(); setSidebarCollapsed(s => !s); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault(); setActiveChatId(null); setMessages([]); setStreamingContent('');
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleNewChat = useCallback(() => {
    setActiveChatId(null); setMessages([]); setStreamingContent('');
  }, []);

  const handleSelectChat = useCallback((chatId) => setActiveChatId(chatId), []);

  const handleDeleteChat = useCallback((chatId) => {
    setChats(prev => prev.filter(c => c.id !== chatId));
    if (activeChatIdRef.current === chatId) { setActiveChatId(null); setMessages([]); }
    showToast('Chat deleted', 'success');
  }, []);

  const handleRenameChat = useCallback((chatId, newTitle) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, title: newTitle } : c));
  }, []);

  const handleSelectModel = useCallback((modelId, providerId) => {
    setCurrentModel(modelId);
    setCurrentProvider(providerId);
  }, []);

  // =============================================
  // THE CORE SEND — uses REFS to avoid stale data
  // =============================================
  const doSend = useCallback((userText) => {
    if (!userText.trim()) return;
    if (isGeneratingRef.current) return;

    const provider = currentProviderRef.current;
    const model = currentModelRef.current;
    const keys = apiKeysRef.current;
    const sysPrompt = systemPromptRef.current || 'You are a helpful assistant.';

    if (!model || !provider) {
      showToast('Please select a model first.', 'error');
      return;
    }

    if (!keys[provider]) {
      showToast(`No API key for ${provider}. Add it in Settings or .env.`, 'error');
      return;
    }

    const now = new Date().toISOString();
    const userMsg = { role: 'user', content: userText.trim(), timestamp: now };

    let chatId = activeChatIdRef.current;
    let updatedMessages;

    if (!chatId) {
      chatId = genId();
      updatedMessages = [userMsg];
      const newChat = {
        id: chatId, title: userText.slice(0, 60).trim(),
        messages: updatedMessages, createdAt: now, updatedAt: now,
        model, provider
      };
      setChats(prev => [newChat, ...prev]);
      setActiveChatId(chatId);
    } else {
      updatedMessages = [...messagesRef.current, userMsg];
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: updatedMessages, updatedAt: now } : c));
    }

    setMessages(updatedMessages);
    setIsGenerating(true);
    setStreamingContent('');
    setTimeout(scrollToBottom, 50);

    const apiMessages = [
      { role: 'system', content: sysPrompt },
      ...updatedMessages.slice(-20).map(m => ({ role: m.role, content: m.content }))
    ];

    console.log('[NexusChat] Sending to', provider, model, 'messages:', apiMessages.length);

    let accumulated = '';
    const controller = streamChat({
      providerId: provider,
      modelId: model,
      messages: apiMessages,
      apiKeys: keys,
      onChunk: (text) => {
        accumulated += text;
        setStreamingContent(accumulated);
        scrollToBottom();
      },
      onDone: () => {
        console.log('[NexusChat] Stream done, accumulated length:', accumulated.length);
        const assistantMsg = { role: 'assistant', content: accumulated || '(empty response)', timestamp: new Date().toISOString() };
        const finalMessages = [...updatedMessages, assistantMsg];
        setMessages(finalMessages);
        setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: finalMessages, updatedAt: new Date().toISOString() } : c));
        setIsGenerating(false);
        setStreamingContent('');
        scrollToBottom();
      },
      onError: (err) => {
        console.error('[NexusChat] Stream error:', err);
        showToast(err.message, 'error');
        setIsGenerating(false);
        setStreamingContent('');
      }
    });

    abortRef.current = controller;
  }, [scrollToBottom]);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsGenerating(false);
    setStreamingContent('');
  }, []);

  const handleRegenerate = useCallback(() => {
    if (isGeneratingRef.current) return;
    const msgs = messagesRef.current;
    if (msgs.length === 0) return;

    let lastUserIdx = -1;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'user') { lastUserIdx = i; break; }
    }
    if (lastUserIdx < 0) return;

    const userText = msgs[lastUserIdx].content;
    const trimmed = msgs.slice(0, lastUserIdx);
    setMessages(trimmed);
    if (activeChatIdRef.current) {
      setChats(prev => prev.map(c => c.id === activeChatIdRef.current ? { ...c, messages: trimmed } : c));
    }
    // Short delay to let state settle, then re-send
    setTimeout(() => doSend(userText), 50);
  }, [doSend]);

  const handleCopy = useCallback((text) => {
    navigator.clipboard.writeText(text).then(() => showToast('Copied', 'success')).catch(() => {});
  }, []);

  const handleExportChats = () => {
    const blob = new Blob([JSON.stringify({ chats }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `nexuschat-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); URL.revokeObjectURL(a.href);
    showToast('Exported!', 'success');
  };

  const handleImportChats = async (file) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.chats) { setChats(prev => [...data.chats, ...prev]); showToast('Imported!', 'success'); }
    } catch { showToast('Import failed', 'error'); }
  };

  const handleClearChats = () => {
    if (confirm('Delete all chats?')) {
      setChats([]); setActiveChatId(null); setMessages([]);
      showToast('All chats deleted', 'success');
    }
  };

  const modelName = getModelName(currentModel, currentProvider);
  const showWelcome = !activeChatId && messages.length === 0;

  const suggestions = [
    { title: 'Explain quantum computing', desc: 'in simple terms', prompt: 'Explain quantum computing in simple terms' },
    { title: 'Write a coding solution', desc: 'longest common subsequence in Python', prompt: 'Write a Python function to find the longest common subsequence' },
    { title: 'Best practices for REST APIs', desc: 'design patterns and security', prompt: 'What are the best practices for building REST APIs?' },
  ];

  return (
    <div className={`app${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      <Sidebar
        chats={chats} activeChatId={activeChatId} sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(s => !s)}
        onNewChat={handleNewChat} onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat} onRenameChat={handleRenameChat}
        onOpenSettings={() => setSettingsOpen(true)}
        searchQuery={searchQuery} onSearchChange={setSearchQuery}
      />

      <main className="main-area">
        <div className="topbar">
          <div className="topbar-left">
            <button className="topbar-toggle-btn" onClick={() => setSidebarCollapsed(s => !s)} title="Toggle sidebar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/>
              </svg>
            </button>
            <ModelSelector
            apiKeys={apiKeys}
            currentModel={currentModel}
            currentProvider={currentProvider}
            onSelectModel={handleSelectModel}
            dynamicModels={openRouterModels}
            pricingMode={modelPricingMode}
          /></div>
          <div className="topbar-right">
            <button className="topbar-btn" onClick={handleNewChat} title="New chat">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="chat-container" ref={chatContainerRef}>
          {showWelcome ? (
            <div className="welcome-screen">
              <div className="welcome-logo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)' }}>
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </div>
              <h1 className="welcome-model-name">{modelName || 'NexusChat'}</h1>
              <div className="welcome-suggestions">
                <div className="welcome-suggestion-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  <span>Suggested</span>
                </div>
                {suggestions.map(s => (
                  <button key={s.prompt} className="welcome-suggestion" onClick={() => doSend(s.prompt)}>
                    <span className="welcome-suggestion-title">{s.title}</span>
                    <span className="welcome-suggestion-desc">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="chat-messages">
              {messages.map((msg, i) => (
                <Message key={`${activeChatId}-${i}`} role={msg.role} content={msg.content} timestamp={msg.timestamp}
                  modelName={modelName} onCopy={handleCopy}
                  onRegenerate={msg.role === 'assistant' && i === messages.length - 1 ? handleRegenerate : undefined} />
              ))}
              {isGenerating && <StreamingMessage content={streamingContent} modelName={modelName} />}
            </div>
          )}
        </div>

        <InputBar onSend={doSend} onStop={handleStop} isGenerating={isGenerating} />
      </main>

      <Settings
        isOpen={settingsOpen} onClose={() => setSettingsOpen(false)}
        apiKeys={apiKeys} onApiKeysChange={setApiKeys}
        systemPrompt={systemPrompt} onSystemPromptChange={setSystemPrompt}
        dynamicModels={openRouterModels}
        pricingMode={modelPricingMode} onPricingModeChange={setModelPricingMode}
        currentModel={currentModel} currentProvider={currentProvider} onSelectModel={handleSelectModel}
        onExportChats={handleExportChats}
        onImportChats={handleImportChats}
        onClearChats={handleClearChats}
      />
    </div>
  );
}

function InputBar({ onSend, onStop, isGenerating }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  const handleInput = (e) => {
    setText(e.target.value);
    const ta = textareaRef.current;
    if (ta) { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 200) + 'px'; }
  };

  const send = () => {
    if (text.trim() && !isGenerating) {
      onSend(text);
      setText('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="input-area">
      <div className="input-bar">
        <div className="input-row">
          <textarea ref={textareaRef} className="input-textarea" placeholder="How can I help you today?"
            rows={1} value={text} onChange={handleInput}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            autoFocus />
          <div className="input-actions">
            {isGenerating ? (
              <button className="input-stop-btn" onClick={onStop} title="Stop generating">
                <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
              </button>
            ) : (
              <button className="input-send-btn" onClick={send} disabled={!text.trim()} title="Send (Enter)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
