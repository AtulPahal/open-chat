import { useState, useRef } from 'react';
import { getAvailableModels, testConnection } from '../lib/providers';
import { showToast } from '../lib/toast';

export default function Settings({
  isOpen, onClose,
  apiKeys, onApiKeysChange,
  customBaseUrl, onCustomBaseUrlChange,
  systemPrompt, onSystemPromptChange,
  onExportChats, onImportChats, onClearChats
}) {
  const [activeTab, setActiveTab] = useState('api-keys');
  const [testState, setTestState] = useState({});
  const importRef = useRef(null);

  if (!isOpen) return null;

  const handleKeyChange = (provider, value) => {
    onApiKeysChange({ ...apiKeys, [provider]: value });
  };

  const handleTest = async (providerId) => {
    setTestState(s => ({ ...s, [providerId]: 'testing' }));
    const result = await testConnection(providerId, apiKeys, customBaseUrl);
    setTestState(s => ({ ...s, [providerId]: result.success ? 'success' : 'error' }));
    showToast(result.success ? `${providerId} connected!` : result.error, result.success ? 'success' : 'error');
    setTimeout(() => setTestState(s => ({ ...s, [providerId]: null })), 3000);
  };

  const models = getAvailableModels(apiKeys);
  const grouped = {};
  models.forEach(m => { if (!grouped[m.provider]) grouped[m.provider] = []; grouped[m.provider].push(m); });

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (file) { onImportChats(file); e.target.value = ''; }
  };

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
          {['api-keys', 'models', 'general'].map(tab => (
            <button key={tab} className={`settings-tab${activeTab === tab ? ' active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab === 'api-keys' ? 'API Keys' : tab === 'models' ? 'Models' : 'General'}
            </button>
          ))}
        </div>

        <div className="settings-body">
          {activeTab === 'api-keys' && (
            <>
              {/* NVIDIA */}
              <div className="settings-section">
                <h3 className="settings-section-title">NVIDIA NIM</h3>
                <div className="settings-field">
                  <label className="settings-label">API Key</label>
                  <div className="settings-input-group">
                    <input type="password" className="settings-input" placeholder="nvapi-…"
                      value={apiKeys.nvidia || ''} onChange={e => handleKeyChange('nvidia', e.target.value)} />
                    <button className={`btn-test${testState.nvidia === 'success' ? ' success' : testState.nvidia === 'error' ? ' error' : ''}`}
                      onClick={() => handleTest('nvidia')}>
                      {testState.nvidia === 'testing' ? 'Testing…' : testState.nvidia === 'success' ? '✓ OK' : testState.nvidia === 'error' ? '✗ Failed' : 'Test'}
                    </button>
                  </div>
                  <p className="settings-hint">Get your key at <a href="https://build.nvidia.com/" target="_blank" rel="noopener" style={{ color: 'var(--color-info)', textDecoration: 'underline' }}>build.nvidia.com</a></p>
                </div>
              </div>

              {/* OpenRouter */}
              <div className="settings-section">
                <h3 className="settings-section-title">OpenRouter</h3>
                <div className="settings-field">
                  <label className="settings-label">API Key</label>
                  <div className="settings-input-group">
                    <input type="password" className="settings-input" placeholder="sk-or-v1-…"
                      value={apiKeys.openrouter || ''} onChange={e => handleKeyChange('openrouter', e.target.value)} />
                    <button className={`btn-test${testState.openrouter === 'success' ? ' success' : testState.openrouter === 'error' ? ' error' : ''}`}
                      onClick={() => handleTest('openrouter')}>
                      {testState.openrouter === 'testing' ? 'Testing…' : testState.openrouter === 'success' ? '✓ OK' : testState.openrouter === 'error' ? '✗ Failed' : 'Test'}
                    </button>
                  </div>
                  <p className="settings-hint">Get your key at <a href="https://openrouter.ai/keys" target="_blank" rel="noopener" style={{ color: 'var(--color-info)', textDecoration: 'underline' }}>openrouter.ai/keys</a></p>
                </div>
              </div>

              {/* Custom */}
              <div className="settings-section">
                <h3 className="settings-section-title">OpenAI-Compatible</h3>
                <div className="settings-field">
                  <label className="settings-label">API Key</label>
                  <div className="settings-input-group">
                    <input type="password" className="settings-input" placeholder="sk-…"
                      value={apiKeys.custom || ''} onChange={e => handleKeyChange('custom', e.target.value)} />
                    <button className={`btn-test${testState.custom === 'success' ? ' success' : testState.custom === 'error' ? ' error' : ''}`}
                      onClick={() => handleTest('custom')}>
                      {testState.custom === 'testing' ? 'Testing…' : testState.custom === 'success' ? '✓ OK' : testState.custom === 'error' ? '✗ Failed' : 'Test'}
                    </button>
                  </div>
                </div>
                <div className="settings-field">
                  <label className="settings-label">Base URL</label>
                  <input type="url" className="settings-input" placeholder="https://api.openai.com/v1"
                    value={customBaseUrl || ''} onChange={e => onCustomBaseUrlChange(e.target.value)} />
                  <p className="settings-hint">Works with OpenAI, Ollama (http://localhost:11434/v1), LM Studio, etc.</p>
                </div>
              </div>
            </>
          )}

          {activeTab === 'models' && (
            <div className="settings-section">
              <h3 className="settings-section-title">Available Models</h3>
              {models.length === 0 ? (
                <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-body-sm)' }}>No models available. Configure API keys first — only providers with a key will show their models.</p>
              ) : (
                Object.entries(grouped).map(([provider, providerModels]) => (
                  <div key={provider} style={{ marginBottom: 'var(--space-16)' }}>
                    <h4 style={{ fontSize: 'var(--text-body-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-8)' }}>{provider}</h4>
                    {providerModels.map(m => (
                      <div key={m.id} className="model-option">
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
        </div>
      </div>
    </div>
  );
}
