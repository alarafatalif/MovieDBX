import React, { useEffect, useRef, useState } from 'react';
import { useUser } from '../context/UserContext';
import { aiChat } from '../services/api';

function ChatWidget() {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! Ask me about MovieDBX titles, ratings, or recommendations.'
    }
  ]);
  const listRef = useRef(null);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open]);

  if (!user) return null;

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiChat(user.user_id, text);
      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I could not respond right now.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-widget">
      {open && (
        <div className="chat-panel">
          <div className="chat-header">
            <span>MovieDBX AI</span>
            <button className="chat-close" onClick={() => setOpen(false)} aria-label="Close">
              ×
            </button>
          </div>
          <div className="chat-messages" ref={listRef}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.role}`}>
                <div className="chat-bubble">{msg.content}</div>
              </div>
            ))}
            {loading && (
              <div className="chat-message assistant">
                <div className="chat-bubble">Thinking...</div>
              </div>
            )}
          </div>
          <div className="chat-input">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about movies, series, or recommendations..."
              rows={2}
            />
            <button onClick={handleSend} disabled={loading || !input.trim()}>
              Send
            </button>
          </div>
        </div>
      )}
      <button className="chat-toggle" onClick={() => setOpen((prev) => !prev)}>
        {open ? '×' : 'AI'}
      </button>
    </div>
  );
}

export default ChatWidget;
