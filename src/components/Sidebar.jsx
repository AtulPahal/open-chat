import { useState, useRef } from 'react';
import { Settings, Star } from 'lucide-react';

function getDateGroup(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((startOfToday - startOfDate) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays <= 7) return 'Previous 7 Days';
  return 'Older';
}

function truncate(str, max = 35) {
  if (!str || str.length <= max) return str || '';
  return str.slice(0, max - 1).trimEnd() + '…';
}

export default function Sidebar({
  chats, activeChatId,
  onToggleSidebar, onNewChat, onSelectChat, onDeleteChat, onRenameChat, onOpenSettings,
  searchQuery, onSearchChange, onResizeStart, onTogglePinChat, onDream, isDreaming
}) {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef(null);

  // Filter
  const filtered = searchQuery
    ? chats.filter(c => c.title?.toLowerCase().includes(searchQuery.toLowerCase()))
    : chats;

  // Separate pinned and unpinned
  const pinnedChats = filtered.filter(c => c.isPinned);
  const unpinnedChats = filtered.filter(c => !c.isPinned);

  // Group unpinned by date
  const groups = {};
  unpinnedChats.forEach(chat => {
    const group = getDateGroup(chat.updatedAt || chat.createdAt);
    if (!groups[group]) groups[group] = [];
    groups[group].push(chat);
  });

  const groupOrder = ['Today', 'Yesterday', 'Previous 7 Days', 'Older'];

  const startRename = (chat, e) => {
    e.stopPropagation();
    setEditingId(chat.id);
    setEditValue(chat.title || '');
    setTimeout(() => inputRef.current?.select(), 10);
  };

  const saveRename = () => {
    if (editingId) {
      onRenameChat(editingId, editValue.trim() || 'Untitled');
      setEditingId(null);
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <img src="/favicon-96x96.png" alt="App Icon" style={{ width: 20, height: 20 }} />
          <span>OpenChat</span>
        </div>
        <button className="icon-btn" onClick={onToggleSidebar} title="Close sidebar (Ctrl+/)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="9" y1="3" x2="9" y2="21"/>
          </svg>
        </button>
      </div>


      <button className="new-chat-btn" onClick={onNewChat} title="New chat (Ctrl+N)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        <span>New Chat</span>
      </button>

      <div className="sidebar-search">
        <div className="sidebar-search-input">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" placeholder="Search chats…" value={searchQuery} onChange={e => onSearchChange(e.target.value)} autoComplete="off" />
        </div>
      </div>

      <div className="sidebar-content">
        <div className="sidebar-section">
          {pinnedChats.length > 0 && (
            <div key="Pinned">
              <div className="sidebar-section-label"><span>Pinned</span></div>
              {pinnedChats.map(chat => (
                <div key={chat.id}
                  className={`chat-item${chat.id === activeChatId ? ' active' : ''}`}
                  onClick={() => onSelectChat(chat.id)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  {editingId === chat.id ? (
                    <input ref={inputRef} type="text" value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onBlur={saveRename}
                      onKeyDown={e => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') setEditingId(null); }}
                      onClick={e => e.stopPropagation()}
                      style={{ flex: 1, background: 'var(--color-surface-active)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text)', fontSize: 'var(--text-body-sm)', padding: '2px 6px', outline: 'none', minWidth: 0 }}
                      autoFocus
                    />
                  ) : (
                    <span className="chat-item-title">{truncate(chat.title || 'Untitled')}</span>
                  )}
                  <div className="chat-item-actions">
                    <button className="chat-item-action-btn" title="Unpin" onClick={e => { e.stopPropagation(); onTogglePinChat(chat.id); }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.68V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3v4.68a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/>
                      </svg>
                    </button>
                    <button className="chat-item-action-btn" title="Rename" onClick={e => startRename(chat, e)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                      </svg>
                    </button>
                    <button className="chat-item-action-btn" title="Delete" onClick={e => { e.stopPropagation(); onDeleteChat(chat.id); }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}



          {groupOrder.map(groupName => {
            const groupChats = groups[groupName];
            if (!groupChats || groupChats.length === 0) return null;
            return (
              <div key={groupName}>
                <div className="sidebar-section-label"><span>{groupName}</span></div>
                {groupChats.map(chat => (
                  <div key={chat.id}
                    className={`chat-item${chat.id === activeChatId ? ' active' : ''}`}
                    onClick={() => onSelectChat(chat.id)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    {editingId === chat.id ? (
                      <input ref={inputRef} type="text" value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={saveRename}
                        onKeyDown={e => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') setEditingId(null); }}
                        onClick={e => e.stopPropagation()}
                        style={{ flex: 1, background: 'var(--color-surface-active)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text)', fontSize: 'var(--text-body-sm)', padding: '2px 6px', outline: 'none', minWidth: 0 }}
                        autoFocus
                      />
                    ) : (
                      <span className="chat-item-title">{truncate(chat.title || 'Untitled')}</span>
                    )}
                    <div className="chat-item-actions">
                      <button className="chat-item-action-btn" title={chat.isPinned ? "Unpin" : "Pin"} onClick={e => { e.stopPropagation(); onTogglePinChat(chat.id); }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill={chat.isPinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.68V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3v4.68a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/>
                        </svg>
                      </button>
                      <button className="chat-item-action-btn" title="Rename" onClick={e => startRename(chat, e)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                        </svg>
                      </button>
                      <button className="chat-item-action-btn" title="Delete" onClick={e => { e.stopPropagation(); onDeleteChat(chat.id); }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ padding: 'var(--space-md) var(--space-sm)', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-body-sm)' }}>
              {searchQuery ? 'No chats found' : 'No chats yet'}
            </div>
          )}
        </div>
      </div>


      <div className="sidebar-footer">
        {/* Dream button */}
        <button
          className={`sidebar-footer-button ${isDreaming ? 'is-dreaming' : ''}`}
          onClick={onDream}
          title="Consolidate Memory (Dream)"
        >
          <div className="sidebar-footer-button-icon">
            <Star size={16} color="#E8D2CF" strokeWidth={1} />
          </div>
          <span className="sidebar-footer-button-text">
            {isDreaming ? 'Dreaming...' : 'Dream'}
          </span>
        </button>

        {/* Settings button */}
        <button
          className="sidebar-footer-button"
          onClick={onOpenSettings}
          title="Settings"
        >
          <div className="sidebar-footer-button-icon">
            <Settings size={16} color="#F7EFEE" strokeWidth={2} />
          </div>
          <span className="sidebar-footer-button-text">
            Settings
          </span>
        </button>
      </div>
      {/* side bar risizer */}
      <div
        className="sidebar-resizer"
        onMouseDown={onResizeStart}
        title="Drag to resize"
      />
    </aside>
  );
}
