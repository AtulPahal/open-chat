import { useMemo, memo } from 'react';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

// Configure marked renderer
const renderer = new marked.Renderer();

renderer.code = function ({ text, lang }) {
  const codeText = text || '';
  const codeLang = lang || '';

  let highlighted;
  try {
    highlighted = codeLang && hljs.getLanguage(codeLang)
      ? hljs.highlight(codeText, { language: codeLang }).value
      : hljs.highlightAuto(codeText).value;
  } catch {
    highlighted = codeText.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  const langLabel = codeLang || 'code';
  const encoded = btoa(unescape(encodeURIComponent(codeText)));

  return `<pre><div class="code-block-header"><span>${langLabel}</span><button class="code-copy-btn" onclick="window.__copyCode(this, '${encoded}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy</button></div><code class="hljs language-${langLabel}">${highlighted}</code></pre>`;
};

marked.setOptions({ renderer, breaks: true, gfm: true });

// Global copy helper
if (typeof window !== 'undefined') {
  window.__copyCode = async (btn, encoded) => {
    try {
      const text = decodeURIComponent(escape(atob(encoded)));
      await navigator.clipboard.writeText(text);
      btn.textContent = '✓ Copied!';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy';
        btn.classList.remove('copied');
      }, 2000);
    } catch { /* ignore */ }
  };
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  try { return new Date(dateStr).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true }); }
  catch { return ''; }
}

const Message = memo(function Message({ role, content, timestamp, modelName, onCopy, onRegenerate }) {
  const html = useMemo(() => {
    if (!content) return '';
    if (role === 'assistant') {
      try { return marked.parse(content); }
      catch { return content.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>'); }
    }
    return content.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
  }, [content, role]);

  return (
    <div className="message">
      <div className={`message-avatar ${role}`}>
        {role === 'user' ? 'U' : '⚡'}
      </div>
      <div className="message-content">
        <div className="message-header">
          <span className="message-role">{role === 'user' ? 'You' : (modelName || 'Assistant')}</span>
          {timestamp && <span className="message-timestamp">{formatTime(timestamp)}</span>}
        </div>
        <div className="message-body" dangerouslySetInnerHTML={{ __html: html }} />
        <div className="message-actions">
          <button className="message-action-btn" title="Copy" onClick={() => onCopy?.(content)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          </button>
          {role === 'assistant' && onRegenerate && (
            <button className="message-action-btn" title="Regenerate" onClick={onRegenerate}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

export default Message;

export const StreamingMessage = memo(function StreamingMessage({ content, modelName }) {
  const html = useMemo(() => {
    if (!content) return '';
    try { return marked.parse(content + '\n'); }
    catch { return content.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>'); }
  }, [content]);

  return (
    <div className="message">
      <div className="message-avatar assistant">⚡</div>
      <div className="message-content">
        <div className="message-header">
          <span className="message-role">{modelName || 'Assistant'}</span>
        </div>
        <div className="message-body">
          {content ? (
            <div dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <div className="typing-indicator">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
