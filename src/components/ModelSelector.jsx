import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Search } from 'lucide-react';
import { getAvailableModels, getModelName } from '../lib/providers';

export default function ModelSelector({ apiKeys, currentModel, currentProvider, onSelectModel, dynamicModels, pricingMode }) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const ref = useRef(null);
  const searchInputRef = useRef(null);

  const allModels = getAvailableModels(apiKeys, dynamicModels, pricingMode);
  const displayName = getModelName(currentModel, currentProvider);

  // Filter models based on search query
  const models = useMemo(() => {
    if (!searchQuery.trim()) return allModels;
    const lowerQuery = searchQuery.toLowerCase();
    return allModels.filter(m => 
      m.name.toLowerCase().includes(lowerQuery) || 
      m.id.toLowerCase().includes(lowerQuery) ||
      m.provider.toLowerCase().includes(lowerQuery)
    );
  }, [allModels, searchQuery]);

  // Group by provider
  const grouped = useMemo(() => {
    const g = {};
    models.forEach(m => {
      if (!g[m.provider]) g[m.provider] = [];
      g[m.provider].push(m);
    });
    return g;
  }, [models]);

  const handleSelect = useCallback((model) => {
    onSelectModel(model.id, model.providerId);
    setOpen(false);
    setSearchQuery('');
  }, [onSelectModel]);

  // Close on outside click
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      return;
    }
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Focus search input when opened
  useEffect(() => {
    if (open && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [open]);

  return (
    <div className={`model-selector${open ? ' open' : ''}`} ref={ref} onClick={() => !open && setOpen(true)}>
      <span className="model-selector-name">{displayName}</span>
      <svg className="model-selector-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}>
        <polyline points="6 9 12 15 18 9"/>
      </svg>
      {open && (
        <div className="model-dropdown visible" onClick={e => e.stopPropagation()}>
          <div className="model-search-container">
            <Search size={14} className="model-search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="model-search-input"
              placeholder="Search models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="model-dropdown-list">
            {models.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center' }}>
                <p style={{ color: 'var(--color-text-tertiary)', fontSize: '14px', marginBottom: '8px' }}>
                  {allModels.length === 0 ? 'No models available' : 'No models found'}
                </p>
                {allModels.length === 0 && <p style={{ color: 'var(--color-text-tertiary)', fontSize: '12px' }}>Add API keys in Settings or .env</p>}
              </div>
            ) : (
              Object.entries(grouped).map(([providerName, providerModels]) => (
                <div className="model-dropdown-section" key={providerName}>
                  <div className="model-dropdown-section-title">{providerName}</div>
                  {providerModels.map(model => (
                    <div key={model.id + model.providerId}
                      className={`model-option${model.id === currentModel && model.providerId === currentProvider ? ' selected' : ''}`}
                      onClick={() => handleSelect(model)}>
                      <span className="model-option-name">{model.name}</span>
                      <span className="model-option-id">{model.id}</span>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
