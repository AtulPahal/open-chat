import { useState, useRef, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { getAvailableModels, testConnection, getProviders } from '../lib/providers';
import { showToast } from '../lib/toast';

export default function Settings({
  isOpen, onClose,
  apiKeys, onApiKeysChange,
  systemPrompt, onSystemPromptChange,
  memory, onMemoryChange,
  onDream, isDreaming,
  fetchedModels, pricingMode, onPricingModeChange,
  currentModel, currentProvider, onSelectModel,
  onExportChats, onImportChats, onClearChats,
  voiceURI, onVoiceChange, voiceSpeed, onVoiceSpeedChange
}) {
  const [activeTab, setActiveTab] = useState('api-keys');
  const [testState, setTestState] = useState({});
  const [modelSearch, setModelSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState('all');
  const importRef = useRef(null);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [voiceSearch, setVoiceSearch] = useState('');

  useEffect(() => {
    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      const noveltyVoices = ['Albert', 'Bad News', 'Bahh', 'Bells', 'Boing', 'Bubbles', 'Cellos', 'Deranged', 'Good News', 'Hysterical', 'Pipe Organ', 'Trinoids', 'Whisper', 'Zarvox', 'Superstar', 'Jester'];
      
      const goodVoices = allVoices.filter(v => 
        (v.lang.startsWith('en') || v.lang.startsWith('hi')) && 
        !noveltyVoices.some(nv => v.name.includes(nv))
      ).sort((a, b) => {
        const aIsIn = a.lang.includes('IN');
        const bIsIn = b.lang.includes('IN');
        if (aIsIn && !bIsIn) return -1;
        if (!aIsIn && bIsIn) return 1;
        
        const aIsPremium = a.name.includes('Premium') || a.name.includes('Enhanced') || a.name.includes('Google') || a.name.includes('Neural');
        const bIsPremium = b.name.includes('Premium') || b.name.includes('Enhanced') || b.name.includes('Google') || b.name.includes('Neural');
        if (aIsPremium && !bIsPremium) return -1;
        if (!aIsPremium && bIsPremium) return 1;
        
        return a.name.localeCompare(b.name);
      });
      setAvailableVoices(goodVoices);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  if (!isOpen) return null;

  const handleKeyChange = (provider, value) => {
    onApiKeysChange({ ...apiKeys, [provider]: value });
  };

  const handleDeleteKey = (providerId) => {
    const newKeys = { ...apiKeys };
    delete newKeys[providerId]; // Completely remove the key
    onApiKeysChange(newKeys);
    showToast(`${getProviders()[providerId].name} API key deleted.`, 'info');
  };

  const handleTest = async (providerId) => {
    setTestState(s => ({ ...s, [providerId]: 'testing' }));
    const result = await testConnection(providerId, apiKeys);
    setTestState(s => ({ ...s, [providerId]: result.success ? 'success' : 'error' }));
    showToast(result.success ? `${providerId} connected!` : result.error, result.success ? 'success' : 'error');
    setTimeout(() => setTestState(s => ({ ...s, [providerId]: null })), 3000);
  };

  const models = getAvailableModels(apiKeys, fetchedModels, pricingMode)
    .filter(m => m.name.toLowerCase().includes(modelSearch.toLowerCase()) || m.id.toLowerCase().includes(modelSearch.toLowerCase()))
    .filter(m => providerFilter === 'all' || m.provider === providerFilter);
  const grouped = {};
  models.forEach(m => { if (!grouped[m.provider]) grouped[m.provider] = []; grouped[m.provider].push(m); });

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (file) { onImportChats(file); e.target.value = ''; }
  };

  const handlePreviewVoice = () => {
    if (!voiceURI) return showToast('Please select a voice first', 'error');
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance("Hello! I am ready to assist you.");
    utterance.rate = voiceSpeed || 1;
    const selectedVoice = availableVoices.find(v => v.voiceURI === voiceURI);
    if (selectedVoice) utterance.voice = selectedVoice;
    window.speechSynthesis.speak(utterance);
  };

  const filteredVoices = availableVoices.filter(v => 
    v.name.toLowerCase().includes(voiceSearch.toLowerCase()) || 
    v.lang.toLowerCase().includes(voiceSearch.toLowerCase())
  );

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-dialog" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <h2 className="settings-title">Settings</h2>
          <button className="settings-close-btn" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="settings-tabs">
          {['api-keys', 'models', 'general', 'memory', 'tts'].map(tab => (
            <button key={tab} className={`settings-tab${activeTab === tab ? ' active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab === 'api-keys' ? 'API Keys' : tab === 'models' ? 'Models' : tab === 'memory' ? 'Memory' : tab === 'tts' ? 'TTS' : 'General'}
            </button>
          ))}
        </div>

        <div className="settings-body">
          {activeTab === 'api-keys' && (
            <div className="settings-api-keys-list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)' }}>
              {Object.values(getProviders()).map(provider => (
                <div className="settings-section" key={provider.id}>
                  <h3 className="settings-section-title">{provider.name}</h3>
                  <div className="settings-field">
                    <label className="settings-label">API Key</label>
                    <div className="settings-input-group">
                      <input type="password" className="settings-input" placeholder={`Enter ${provider.name} API Key...`}
                        value={apiKeys[provider.id] || ''} onChange={e => handleKeyChange(provider.id, e.target.value)} />
                      <button className={`btn-test${testState[provider.id] === 'success' ? ' success' : testState[provider.id] === 'error' ? ' error' : ''}`}
                        onClick={() => handleTest(provider.id)}>
                        {testState[provider.id] === 'testing' ? 'Testing…' : testState[provider.id] === 'success' ? '✓ OK' : testState[provider.id] === 'error' ? '✗ Failed' : 'Test'}
                      </button>
                      {apiKeys[provider.id] && (
                        <button className="btn-test error" onClick={() => handleDeleteKey(provider.id)} title={`Delete ${provider.name} API Key`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    {provider.link && (
                      <p className="settings-hint">Get your key at <a href={provider.link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-info)', textDecoration: 'underline' }}>{provider.link.replace('https://', '')}</a></p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'models' && (
            <div className="settings-section">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)', marginBottom: 'var(--space-16)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <h3 className="settings-section-title" style={{ marginBottom: 0 }}>Available Models</h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select className="settings-input" style={{ width: 'auto', padding: '4px 8px', fontSize: '13px' }}
                      value={providerFilter} onChange={e => setProviderFilter(e.target.value)}>
                      <option value="all">All APIs</option>
                      {Object.values(getProviders()).filter(p => apiKeys[p.id]).map(p => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                    <select className="settings-input" style={{ width: 'auto', padding: '4px 8px', fontSize: '13px' }}
                      value={pricingMode} onChange={e => onPricingModeChange(e.target.value)}>
                      <option value="all">All Models</option>
                      <option value="free">Free Models Only</option>
                      <option value="paid">Paid Models Only</option>
                    </select>
                  </div>
                </div>
                <input 
                  type="text" 
                  className="settings-input" 
                  placeholder="Search models..." 
                  value={modelSearch} 
                  onChange={e => setModelSearch(e.target.value)} 
                />
              </div>
              
              {models.length === 0 ? (
                <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-body-sm)' }}>No models available. Configure API keys or change the pricing filter.</p>
              ) : (
                Object.entries(grouped).map(([provider, providerModels]) => (
                  <div key={provider} style={{ marginBottom: 'var(--space-16)' }}>
                    <h4 style={{ fontSize: 'var(--text-body-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-8)' }}>{provider}</h4>
                    {providerModels.map(m => (
                      <div key={m.id} 
                        className={`model-option${m.id === currentModel && m.providerId === currentProvider ? ' selected' : ''}`}
                        onClick={() => { onSelectModel(m.id, m.providerId); showToast(`Selected ${m.name}`, 'success'); }}
                      >
                        <span className="model-option-name">{m.name}</span>
                        <span className="model-option-id">{m.id}</span>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'general' && (
            <>
              <div className="settings-section">
                <h3 className="settings-section-title">System Prompt</h3>
                <div className="settings-field">
                  <label className="settings-label">Default system prompt for new chats</label>
                  <textarea className="settings-textarea" placeholder="You are a helpful assistant…" rows={4}
                    value={systemPrompt || ''} onChange={e => onSystemPromptChange(e.target.value)} />
                </div>
              </div>
              <div className="settings-section">
                <h3 className="settings-section-title">Data</h3>
                <div className="settings-field" style={{ display: 'flex', gap: 'var(--space-8)', flexWrap: 'wrap' }}>
                  <button className="btn-secondary btn-sm" onClick={onExportChats}>Export All Chats</button>
                  <button className="btn-secondary btn-sm" onClick={() => importRef.current?.click()}>Import Chats</button>
                  <button className="btn-secondary btn-sm" style={{ color: 'var(--color-error)' }} onClick={onClearChats}>Delete All</button>
                  <input ref={importRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportFile} />
                </div>
              </div>
            </>
          )}

          {activeTab === 'memory' && (
            <div className="settings-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
                <h3 className="settings-section-title" style={{ marginBottom: 0 }}>Dream Memory</h3>
                <button 
                  className="btn-secondary btn-sm" 
                  onClick={onDream} 
                  disabled={isDreaming}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)' }}
                >
                  {isDreaming ? 'Consolidating...' : 'Run Dream Consolidation'}
                </button>
              </div>
              <p className="settings-hint" style={{ marginBottom: 'var(--space-12)' }}>
                Dream reads your recent chats and extracts facts, preferences, and important context. This memory is automatically injected into new messages so the AI "remembers" you. You can manually edit it below.
              </p>
              <div className="settings-field">
                <textarea 
                  className="settings-textarea" 
                  placeholder="No memory saved yet. Run Dream or type here..." 
                  rows={10}
                  value={memory || ''} 
                  onChange={e => onMemoryChange(e.target.value)} 
                />
              </div>
            </div>
          )}

          {activeTab === 'tts' && (
            <div className="settings-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-16)' }}>
                <h3 className="settings-section-title" style={{ marginBottom: 0 }}>Text-to-Speech Settings</h3>
                <button className="btn-secondary btn-sm" onClick={handlePreviewVoice} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Preview Voice
                </button>
              </div>
              
              <div className="settings-field" style={{ marginBottom: 'var(--space-16)' }}>
                <input 
                  type="text" 
                  className="settings-input" 
                  placeholder="Search voices by name or language (e.g., 'en-IN')..." 
                  value={voiceSearch} 
                  onChange={e => setVoiceSearch(e.target.value)} 
                />
              </div>

              <div className="settings-field">
                <label className="settings-label">Select Voice</label>
                <select className="settings-input" size={10} style={{ padding: '8px' }} value={voiceURI || ''} onChange={e => onVoiceChange(e.target.value)}>
                  <option value="">Default System Voice</option>
                  {filteredVoices.map(v => (
                    <option key={v.voiceURI} value={v.voiceURI} style={{ padding: '4px' }}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
                {filteredVoices.length === 0 && <p style={{ color: 'var(--color-text-tertiary)', marginTop: '8px', fontSize: '13px' }}>No voices match your search.</p>}
              </div>

              <div className="settings-field" style={{ marginTop: 'var(--space-16)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="settings-label">Voice Speed: {voiceSpeed}x</label>
                  <button className="btn-secondary btn-sm" style={{ padding: '2px 8px', fontSize: '11px' }} onClick={() => onVoiceSpeedChange(1)}>Reset</button>
                </div>
                <input 
                  type="range" 
                  min="0.5" max="2" step="0.1" 
                  value={voiceSpeed} 
                  onChange={e => onVoiceSpeedChange(parseFloat(e.target.value))} 
                  style={{ width: '100%', marginTop: '8px' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
