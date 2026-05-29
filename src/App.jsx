import { useState, useEffect, useRef, useCallback } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { Send, Square, Menu, Plus, Compass, Paperclip, X, File, Image as ImageIcon } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Settings from './components/Settings';
import ModelSelector from './components/ModelSelector';
import Message, { StreamingMessage } from './components/Message';
import { getModelName, getAvailableModels, streamChat, generateText, getProviders, fetchProviderModels } from './lib/providers';
import { showToast } from './lib/toast';

const genId = () => crypto.randomUUID?.() || Math.random().toString(36).slice(2, 10);

function loadChats() {
  try { return JSON.parse(localStorage.getItem('openchat_chats') || '[]'); } catch { return []; }
}
function saveChatsToLS(chats) {
  try {
    localStorage.setItem('openchat_chats', JSON.stringify(chats));
  } catch (e) {
    console.error('Storage limit reached for chats');
  }
}
function loadSettings() {
  try { return JSON.parse(localStorage.getItem('openchat_settings') || '{}'); } catch { return {}; }
}
function saveSettingsToLS(s) {
  try {
    localStorage.setItem('openchat_settings', JSON.stringify(s));
  } catch (e) {
    console.error('Storage limit reached for settings');
  }
}

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
      openrouter: saved.apiKeys?.openrouter || '',
      openai: saved.apiKeys?.openai || '',
      google: saved.apiKeys?.google || '',
      nvidia: saved.apiKeys?.nvidia || '',
      groq: saved.apiKeys?.groq || '',
      anthropic: saved.apiKeys?.anthropic || '',
      opencode: saved.apiKeys?.opencode || '',
    };
  });
  const [systemPrompt, setSystemPrompt] = useState(() => loadSettings().systemPrompt || '');
  const [currentProvider, setCurrentProvider] = useState(() => loadSettings().currentProvider || '');
  const [currentModel, setCurrentModel] = useState(() => loadSettings().currentModel || '');
  const [modelPricingMode, setModelPricingMode] = useState(() => loadSettings().modelPricingMode || 'all');
  const [memory, setMemory] = useState(() => loadSettings().memory || '');
  const [fetchedModels, setFetchedModels] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDreaming, setIsDreaming] = useState(false);
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
  const memoryRef = useRef(memory);

  // Keep refs in sync
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { activeChatIdRef.current = activeChatId; }, [activeChatId]);
  useEffect(() => { apiKeysRef.current = apiKeys; }, [apiKeys]);
  useEffect(() => { currentModelRef.current = currentModel; }, [currentModel]);
  useEffect(() => { currentProviderRef.current = currentProvider; }, [currentProvider]);
  useEffect(() => { systemPromptRef.current = systemPrompt; }, [systemPrompt]);
  useEffect(() => { isGeneratingRef.current = isGenerating; }, [isGenerating]);
  useEffect(() => { memoryRef.current = memory; }, [memory]);

  // Auto-select first model if none selected
  useEffect(() => {
    const models = getAvailableModels(apiKeys, fetchedModels, modelPricingMode);
    if (models.length > 0 && (!currentModel || !models.find(m => m.id === currentModel && m.providerId === currentProvider))) {
      setCurrentProvider(models[0].providerId);
      setCurrentModel(models[0].id);
    }
  }, [apiKeys, fetchedModels, modelPricingMode]);

  // Fetch models dynamically for all configured providers
  useEffect(() => {
    const fetchAllModels = async () => {
      const newFetched = { ...fetchedModels };
      let updated = false;

      for (const [providerId] of Object.entries(getProviders())) {
        const apiKey = apiKeys[providerId];
        if (!apiKey) continue;

        const models = await fetchProviderModels(providerId, apiKey);
        if (models && models.length > 0) {
          newFetched[providerId] = models;
          updated = true;
        }
      }

      if (updated) {
        setFetchedModels(newFetched);
      }
    };

    fetchAllModels();
  }, [apiKeys]);

  // Persist
  useEffect(() => { saveChatsToLS(chats); }, [chats]);
  useEffect(() => {
    saveSettingsToLS({ apiKeys, systemPrompt, currentModel, currentProvider, modelPricingMode, memory });
  }, [apiKeys, systemPrompt, currentModel, currentProvider, modelPricingMode, memory]);

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
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
      setIsGenerating(false);
    }
  }, []);

  const handleSelectChat = useCallback((chatId) => setActiveChatId(chatId), []);

  const handleDeleteChat = useCallback((chatId) => {
    setChats(prev => prev.filter(c => c.id !== chatId));
    if (activeChatIdRef.current === chatId) { 
      setActiveChatId(null); 
      setMessages([]); 
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
        setIsGenerating(false);
        setStreamingContent('');
      }
    }
    showToast('Chat deleted', 'success');
  }, []);

  const handleRenameChat = useCallback((chatId, newTitle) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, title: newTitle } : c));
  }, []);

  const handleTogglePinChat = useCallback((chatId) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, isPinned: !c.isPinned } : c));
  }, []);

  const handleSelectModel = useCallback((modelId, providerId) => {
    setCurrentModel(modelId);
    setCurrentProvider(providerId);
  }, []);

  const handleSelectProvider = useCallback((providerId) => {
    setCurrentProvider(providerId);
    const available = getAvailableModels(apiKeysRef.current, fetchedModels, modelPricingMode).filter(m => m.providerId === providerId);
    if (available.length > 0) {
      setCurrentModel(available[0].id);
    } else {
      setCurrentModel('');
    }
  }, [fetchedModels, modelPricingMode]);

  const handleDreamConsolidation = async () => {
    if (isDreaming) return;
    
    const provider = currentProviderRef.current;
    const model = currentModelRef.current;
    const keys = apiKeysRef.current;
    
    if (!model || !provider) {
      showToast('Please select a model first for Dream memory consolidation.', 'error');
      return;
    }
    if (!keys[provider]) {
      showToast(`No API key for ${provider}.`, 'error');
      return;
    }

    setIsDreaming(true);
    showToast('Starting memory consolidation (Dream)...', 'info');
    
    try {
      const recentChats = chats.slice(0, 10);
      let transcript = '';
      recentChats.forEach(chat => {
        transcript += `Chat: ${chat.title}\n`;
        chat.messages.slice(-20).forEach(msg => {
          if (msg.role === 'user' || msg.role === 'assistant') {
            let textContent = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
            transcript += `${msg.role.toUpperCase()}: ${textContent}\n`;
          }
        });
        transcript += `\n`;
      });
      
      const prompt = `You are a memory consolidation assistant (like a "Dream" sequence). 
Below is a transcript of recent conversations with the user.
Your task is to analyze these conversations and extract key facts about the user, their preferences, important context, and decisions.
Merge this with the existing memory (if any). Do not duplicate information.
Keep it concise and factual.

Existing Memory:
${memoryRef.current || 'None'}

Recent Conversations:
${transcript.slice(0, 50000)}

Output ONLY the new consolidated memory as plain text, no markdown code blocks unless necessary.`;

      const result = await generateText({
        providerId: provider,
        modelId: model,
        messages: [{ role: 'user', content: prompt }],
        apiKeys: keys
      });
      
      if (result) {
        setMemory(result);
        showToast('Dream memory consolidation complete!', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Dream failed: ' + err.message, 'error');
    } finally {
      setIsDreaming(false);
    }
  };

  // =============================================
  // THE CORE SEND — uses REFS to avoid stale data
  // =============================================
  const doSend = useCallback((userText, attachments = []) => {
    if (!userText.trim() && attachments.length === 0) return;
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
    const userMsg = { role: 'user', content: userText.trim(), attachments, timestamp: now };

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

    let baseSysPrompt = systemPromptRef.current || 'You are a helpful assistant.';
    if (memoryRef.current) {
      baseSysPrompt += `\n\n=== USER MEMORY ===\n${memoryRef.current}\n===================\n`;
    }

    const apiMessages = [
      { role: 'system', content: baseSysPrompt },
      ...updatedMessages.slice(-20).map(m => {
        if (m.role === 'user' && m.attachments?.length > 0) {
           let finalContent = m.content;
           const texts = m.attachments.filter(a => a.type === 'text');
           const images = m.attachments.filter(a => a.type === 'image');
           if (texts.length > 0) {
             finalContent += (finalContent ? '\n\n' : '') + texts.map(t => `--- File: ${t.name} ---\n${t.content}`).join('\n\n');
           }
           if (images.length > 0) {
             return { role: 'user', content: [
               { type: 'text', text: finalContent || 'Image attached' },
               ...images.map(img => ({ type: 'image_url', image_url: { url: img.content } }))
             ]};
           }
           return { role: 'user', content: finalContent };
        }
        return { role: m.role, content: m.content };
      })
    ];

    console.log('[OpenChat] Sending to', provider, model, 'messages:', apiMessages.length);

    let accumulated = '';
    abortRef.current = new AbortController();
    
    streamChat({
      providerId: provider,
      modelId: model,
      messages: apiMessages,
      apiKeys: keys,
      signal: abortRef.current.signal,
      onChunk: (text) => {
        accumulated += text;
        setStreamingContent(accumulated);
        scrollToBottom();
      },
      onDone: () => {
        console.log('[OpenChat] Stream done, accumulated length:', accumulated.length);
        const assistantMsg = { role: 'assistant', content: accumulated || '(empty response)', timestamp: new Date().toISOString() };
        const finalMessages = [...updatedMessages, assistantMsg];
        setMessages(finalMessages);
        setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: finalMessages, updatedAt: new Date().toISOString() } : c));
        setIsGenerating(false);
        setStreamingContent('');
        scrollToBottom();
      },
      onError: (err) => {
        console.error('[OpenChat] Stream error:', err);
        showToast(err.message, 'error');
        setIsGenerating(false);
        setStreamingContent('');
      }
    });
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
    a.download = `openchat-export-${new Date().toISOString().slice(0, 10)}.json`;
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

  const modelName = getModelName(currentModel, currentProvider, fetchedModels);
  const showWelcome = !activeChatId && messages.length === 0;

  const suggestions = [
    { title: 'Explain quantum computing', desc: 'in simple terms', prompt: 'Explain quantum computing in simple terms' },
    { title: 'Write a coding solution', desc: 'longest common subsequence in Python', prompt: 'Write a Python function to find the longest common subsequence' },
    { title: 'Best practices for REST APIs', desc: 'design patterns and security', prompt: 'What are the best practices for building REST APIs?' },
  ];

  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('openchat_sidebar_width');
    return saved ? parseInt(saved, 10) : 260;
  });
  const isResizing = useRef(false);
  const appRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing.current) return;
      let newWidth = e.clientX;
      if (newWidth < 200) newWidth = 200;
      if (newWidth > 400) newWidth = 400;
      
      // Mutate DOM directly to avoid React re-renders on every pixel move (60fps smooth)
      if (appRef.current) {
        appRef.current.style.setProperty('--sidebar-width', `${newWidth}px`);
      }
    };
    
    const handleMouseUp = (e) => {
      if (isResizing.current) {
        isResizing.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        if (appRef.current) appRef.current.classList.remove('is-resizing');
        
        let finalWidth = e.clientX;
        if (finalWidth < 200) finalWidth = 200;
        if (finalWidth > 400) finalWidth = 400;
        
        // Save to state and local storage once drag is complete
        setSidebarWidth(finalWidth);
        localStorage.setItem('openchat_sidebar_width', finalWidth.toString());
      }
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div ref={appRef} className={`app${sidebarCollapsed ? ' sidebar-collapsed' : ''}`} style={{ '--sidebar-width': `${sidebarWidth}px` }}>
      <Sidebar
        chats={chats} activeChatId={activeChatId} sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(s => !s)}
        onNewChat={handleNewChat} onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat} onRenameChat={handleRenameChat}
        onTogglePinChat={handleTogglePinChat}
        onOpenSettings={() => setSettingsOpen(true)}
        searchQuery={searchQuery} onSearchChange={setSearchQuery}
        onDream={handleDreamConsolidation} isDreaming={isDreaming}
        onResizeStart={() => {
          isResizing.current = true;
          document.body.style.cursor = 'col-resize';
          document.body.style.userSelect = 'none';
          if (appRef.current) appRef.current.classList.add('is-resizing');
        }}
      />

      <main className="main-area">
        <div className="topbar">
          <div className="topbar-left" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button className="topbar-toggle-btn" onClick={() => setSidebarCollapsed(s => !s)} title="Toggle sidebar">
              <Menu size={20} />
            </button>
            <select className="settings-input" style={{ width: 'auto', padding: '6px 10px', fontSize: '13px', margin: 0, cursor: 'pointer' }}
              value={currentProvider} onChange={e => handleSelectProvider(e.target.value)}>
              {Object.values(getProviders()).filter(p => apiKeys[p.id]).length === 0 && <option value="">No API Keys Configured</option>}
              {Object.values(getProviders()).filter(p => apiKeys[p.id]).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select className="settings-input" style={{ width: 'auto', padding: '6px 10px', fontSize: '13px', margin: 0, cursor: 'pointer' }}
              value={currentModel} onChange={e => handleSelectModel(e.target.value, currentProvider)} disabled={!currentProvider}>
              {getAvailableModels(apiKeys, fetchedModels, modelPricingMode)
                .filter(m => m.providerId === currentProvider)
                .map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div className="topbar-right">
            <button className="topbar-btn" onClick={handleNewChat} title="New chat">
              <Plus size={18} />
            </button>
          </div>
        </div>

        <div className="chat-container" ref={chatContainerRef}>
          {showWelcome ? (
            <div className="welcome-screen">
              <div className="welcome-logo">
                <img src="/favicon-96x96.png" alt="App Icon" style={{ width: 48, height: 48 }} />
              </div>
              <h1 className="welcome-model-name">{modelName || 'OpenChat'}</h1>
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
                <Message key={`${activeChatId}-${i}`} role={msg.role} content={msg.content} attachments={msg.attachments} timestamp={msg.timestamp}
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
        memory={memory} onMemoryChange={setMemory}
        onDream={handleDreamConsolidation} isDreaming={isDreaming}
        fetchedModels={fetchedModels}
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
  const [attachments, setAttachments] = useState([]);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleInput = (e) => {
    setText(e.target.value);
  };

  const send = () => {
    if ((text.trim() || attachments.length > 0) && !isGenerating) {
      onSend(text, attachments);
      setText('');
      setAttachments([]);
    }
  };

  const resizeImage = (file, maxWidth = 1024, maxHeight = 1024) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processFiles = async (files) => {
    const newAttachments = [];
    const ALLOWED_EXTS = ['.js', '.jsx', '.ts', '.tsx', '.py', '.html', '.css', '.md', '.json', '.txt', '.csv'];
    for (let file of files) {
      if (file.webkitRelativePath && (file.webkitRelativePath.includes('.git/') || file.webkitRelativePath.includes('node_modules/'))) continue;
      if (file.size > 5 * 1024 * 1024) continue; // 5MB limit
      
      const isImage = file.type.startsWith('image/');
      
      if (isImage) {
        try {
          const base64 = await resizeImage(file);
          newAttachments.push({ type: 'image', name: file.name, content: base64, size: file.size });
        } catch (err) {
          console.error("Failed to process image", err);
        }
      } else {
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        if (file.type.startsWith('text/') || ALLOWED_EXTS.includes(ext) || file.type === '') {
          const reader = new FileReader();
          const textContent = await new Promise(r => { reader.onload = e => r(e.target.result); reader.readAsText(file); });
          if (typeof textContent === 'string' && !textContent.includes('\x00')) {
            newAttachments.push({ type: 'text', name: file.webkitRelativePath || file.name, content: textContent, size: file.size });
          }
        }
      }
    }
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  return (
    <div className="input-area">
      <div className="input-bar">
        {attachments.length > 0 && (
          <div className="attachment-preview-area">
            {attachments.map((att, i) => (
              <div key={i} className="attachment-item">
                {att.type === 'image' ? <ImageIcon size={14}/> : <File size={14}/>}
                <span className="attachment-item-name">{att.name}</span>
                <button className="attachment-remove-btn" onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}><X size={10}/></button>
              </div>
            ))}
          </div>
        )}
        <div className="input-row">
          <input type="file" multiple ref={fileInputRef} style={{display: 'none'}} onChange={e => { processFiles(e.target.files); e.target.value = null; }} />
          
          <div className="input-actions">
            <button className="input-attach-btn" onClick={() => fileInputRef.current?.click()} title="Attach File"><Paperclip size={18} /></button>
          </div>
          <div className="input-col">
            <TextareaAutosize
              ref={textareaRef}
              className="input-textarea"
              placeholder="Message OpenChat..."
              minRows={1}
              maxRows={8}
              value={text}
              onChange={handleInput}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              autoFocus
            />
          </div>
          <div className="input-actions">
            {isGenerating ? (
              <button className="input-stop-btn" onClick={onStop} title="Stop generating">
                <Square size={20} fill="currentColor" />
              </button>
            ) : (
              <button
                className="input-send-btn"
                onClick={send}
                disabled={!text.trim() && attachments.length === 0}
                title="Send (Enter)"
              >
                <Send size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="input-footer">
        OpenChat can make mistakes. Check important info.
      </div>
    </div>
  );
}
