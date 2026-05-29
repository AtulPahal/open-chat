import {  memo, useState } from 'react';
import ReactMarkdown, { defaultUrlTransform } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion } from 'framer-motion';
import { Copy, Check, RefreshCw, Bot, User, File, Image as ImageIcon, Volume2, Square } from 'lucide-react';

function formatTime(dateStr) {
  if (!dateStr) return '';
  try { return new Date(dateStr).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true }); }
  catch { return ''; }
}



const CodeBlock = ({  inline, className, children, ...props }) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const codeString = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!inline && match) {
    return (
      <div className="code-block-wrapper">
        <div className="code-block-header">
          <span className="code-lang">{match[1]}</span>
          <button className="code-copy-btn" onClick={handleCopy}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy code'}</span>
          </button>
        </div>
        <SyntaxHighlighter
          style={oneDark}
          language={match[1]}
          PreTag="div"
          customStyle={{ margin: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
          {...props}
        >
          {codeString}
        </SyntaxHighlighter>
      </div>
    );
  }
  return <code className={`inline-code ${className || ''}`} {...props}>{children}</code>;
};

const downloadAttachment = (att) => {
  let url = att.content;
  let revoke = false;
  if (att.type !== 'image' && !att.content.startsWith('data:')) {
    const blob = new Blob([att.content], { type: 'text/plain' });
    url = URL.createObjectURL(blob);
    revoke = true;
  }
  const a = document.createElement('a');
  a.href = url;
  a.download = att.name.split('/').pop();
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  if (revoke) URL.revokeObjectURL(url);
};

const Message = memo(function Message({ role, content, attachments, timestamp, modelName, onRegenerate, voiceURI, voiceSpeed }) {
  const isAssistant = role === 'assistant';
  const [isCopied, setIsCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleListen = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      const utterance = new SpeechSynthesisUtterance(content);
      utterance.rate = voiceSpeed || 1;
      if (voiceURI) {
        const voices = window.speechSynthesis.getVoices();
        const selectedVoice = voices.find(v => v.voiceURI === voiceURI);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`message ${role}`}
    >
      <div className="message-inner">
        <div className="message-avatar">
          {isAssistant ? <Bot size={20} /> : <User size={20} />}
        </div>
        <div className="message-content">
          <div className="message-header">
            <span className="message-role">{isAssistant ? (modelName || 'Assistant') : 'You'}</span>
            {timestamp && <span className="message-timestamp">{formatTime(timestamp)}</span>}
          </div>
          <div className="message-body markdown-body">
            {isAssistant ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSanitize]}
                components={{ code: CodeBlock }}
                urlTransform={defaultUrlTransform}
              >
                {content}
              </ReactMarkdown>
            ) : (
              <div className="user-message-container">
                <div className="user-text">{content}</div>
                {attachments?.length > 0 && (
                  <div className="user-attachments">
                    {attachments.map((att, i) => (
                      att.type === 'image' 
                        ? <img key={i} src={att.content} className="attachment-thumbnail" alt={att.name} onClick={() => downloadAttachment(att)} style={{ cursor: 'pointer' }} title="Click to download image" />
                        : <div key={i} className="attachment-file-pill" title={`Download ${att.name}`} onClick={() => downloadAttachment(att)} style={{ cursor: 'pointer' }}><File size={14}/> {att.name.split('/').pop()}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          {isAssistant && (
            <div className="message-actions">
              <button className="message-action-btn" title="Copy response" onClick={handleCopy}>
                {isCopied ? <Check size={14} /> : <Copy size={14} />}
              </button>
              <button className="message-action-btn" title={isSpeaking ? "Stop listening" : "Listen to response"} onClick={handleListen}>
                {isSpeaking ? <Square size={14} /> : <Volume2 size={14} />}
              </button>
              {onRegenerate && (
                <button className="message-action-btn" title="Regenerate response" onClick={onRegenerate}>
                  <RefreshCw size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

export default Message;

export const StreamingMessage = memo(function StreamingMessage({ content, modelName }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="message assistant streaming"
    >
      <div className="message-inner">
        <div className="message-avatar">
          <Bot size={20} />
        </div>
        <div className="message-content">
          <div className="message-header">
            <span className="message-role">{modelName || 'Assistant'}</span>
          </div>
          <div className="message-body markdown-body">
            {content ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSanitize]}
                components={{ code: CodeBlock }}
                urlTransform={defaultUrlTransform}
              >
                {content + ' ▍'}
              </ReactMarkdown>
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
    </motion.div>
  );
});
