import { useState, useRef, useEffect, useCallback } from 'react';
import { getAvailableModels, getModelName } from '../lib/providers';

export default function ModelSelector({ apiKeys, currentModel, currentProvider, onSelectModel }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const models = getAvailableModels(apiKeys);
  const displayName = getModelName(currentModel, currentProvider);

  // Group by provider
  const grouped = {};
  models.forEach(m => {
    if (!grouped[m.provider]) grouped[m.provider] = [];
    grouped[m.provider].push(m);
  });

  const handleSelect = useCallback((model) => {
    onSelectModel(model.id, model.providerId);
    setOpen(false);
  }, [onSelectModel]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className={`model-selector${open ? ' open' : ''}`} ref={ref} onClick={() => setOpen(o => !o)}>
      <span className="model-selector-name">{displayName}</span>
      <svg className="model-selector-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
      {open && (
        <div className="model-dropdown visible" onClick={e => e.stopPropagation()}>
          {models.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center' }}>
              <p style={{ color: 'var(--color-text-tertiary)', fontSize: '14px', marginBottom: '8px' }}>No models available</p>
              <p style={{ color: 'var(--color-text-tertiary)', fontSize: '12px' }}>Add API keys in Settings or .env</p>
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
      )}
    </div>
  );
}
