import { useState, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import { getAvailableModels, testConnection, getProviders } from '../lib/providers';
import { showToast } from '../lib/toast';

export default function Settings({
  isOpen, onClose,
  apiKeys, onApiKeysChange,
  customBaseUrl, onCustomBaseUrlChange,
  systemPrompt, onSystemPromptChange,
  fetchedModels, pricingMode, onPricingModeChange,
  currentModel, currentProvider, onSelectModel,
  onExportChats, onImportChats, onClearChats
}) {
  const [activeTab, setActiveTab] = useState('api-keys');
  const [testState, setTestState] = useState({});
  const [modelSearch, setModelSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState('all');
  const importRef = useRef(null);

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
        </div>
      </div>
    </div>
  );
}
