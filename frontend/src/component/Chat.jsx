import React, { useState, useEffect, useRef } from 'react';
import {
  Send, Hash, Paperclip, Bot, ChevronLeft,
  Upload, FileText, X, Loader2, Sparkles, Info,
} from 'lucide-react';
import { socket } from '../App';
import UploadModal from './UploadModal';
import ReactMarkdown from 'react-markdown';

const API = 'http://localhost:8000';

export default function Chat({ room, token, username }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [botTyping, setBotTyping] = useState(false);
  const [docs, setDocs] = useState([]);
  const [showDocs, setShowDocs] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  /* ── Load history + join room ──────────────────────── */
  useEffect(() => {
    if (!room) return;
    setMessages([]);
    setBotTyping(false);

    // Fetch history
    fetch(`${API}/chat/history/${room.name}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(setMessages);

    // Fetch docs
    fetch(`${API}/rooms/${room.name}/documents`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : { documents: [] })
      .then(d => setDocs(d.documents || []));

    // Join room
    console.log(`[Socket] Joining room: ${room.name}`);
    socket.emit('join_research', { room: room.name, username });

    // Listen for new messages
    const onUpdate = (msg) => {
      console.log(`[Socket] Received message:`, msg);
      if (msg.room === room.name) {
        setBotTyping(false);
        setMessages(prev => [...prev, { ...msg, time: msg.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      }
    };
    const onBotTyping = ({ room: r }) => { 
      console.log(`[Socket] Bot typing in room: ${r}`);
      if (r === room.name) setBotTyping(true); 
    };
    const onClearHistory = ({ room: r }) => {
      console.log(`[Socket] History cleared in room: ${r}`);
      if (r === room.name) {
        setMessages([]);
        setBotTyping(false);
      }
    };
    const onDocumentRemoved = ({ room: r, document: docName }) => {
      console.log(`[Socket] Document removed from room ${r}:`, docName);
      if (r === room.name) {
        setDocs(prev => prev.filter(doc => doc.name !== docName));
      }
    };

    socket.on('chat_update', onUpdate);
    socket.on('bot_typing', onBotTyping);
    socket.on('clear_history', onClearHistory);
    socket.on('document_removed', onDocumentRemoved);
    return () => { 
      socket.off('chat_update', onUpdate); 
      socket.off('bot_typing', onBotTyping);
      socket.off('clear_history', onClearHistory);
      socket.off('document_removed', onDocumentRemoved);
    };
  }, [room?.name, token]);

  /* ── Auto-scroll ───────────────────────────────────── */
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, botTyping]);

  /* ── Send ──────────────────────────────────────────── */
  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    console.log(`[Socket] Sending message to room "${room.name}":`, input.trim());
    socket.emit('send_message', { room: room.name, username, text: input.trim(), time });
    setInput('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const insertBotMention = () => {
    setInput('@latent ');
    inputRef.current?.focus();
  };

  const handleDocUploaded = (doc) => {
    setDocs(prev => [...prev, doc]);
    setShowUpload(false);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-[72px] border-b border-slate-800/50 flex items-center px-8 justify-between bg-slate-900/30 backdrop-blur shrink-0">
        <div className="flex items-center gap-3">
          <Hash size={16} className="text-indigo-400" />
          <div>
            <h2 className="text-sm font-semibold text-white">{room.name}</h2>
            <p className="text-[11px] text-slate-600">{room.description || 'Research environment'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Doc count badge */}
          <button
            onClick={() => setShowDocs(!showDocs)}
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full transition-all"
          >
            <FileText size={12} />
            {docs.length} doc{docs.length !== 1 ? 's' : ''}
          </button>

          {/* Upload button */}
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-full hover:bg-indigo-500/20 transition-all"
          >
            <Upload size={12} /> Upload
          </button>

          {/* Connected */}
          <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Connected
          </div>
        </div>
      </header>

      {/* Docs panel */}
      {showDocs && docs.length > 0 && (
        <div className="border-b border-slate-800/50 bg-slate-900/20 px-8 py-3 flex items-center gap-3 flex-wrap">
          <span className="text-[11px] text-slate-600 font-semibold uppercase tracking-wider">Knowledge Base:</span>
          {docs.map((doc, i) => (
            <span key={i} className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full">
              <FileText size={10} className="text-indigo-400" /> {doc.name}
            </span>
          ))}
        </div>
      )}

      {/* Bot hint */}
      {messages.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4 max-w-sm">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto">
              <Sparkles size={24} className="text-indigo-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">{room.name}</h3>
              <p className="text-slate-600 text-sm">
                Start the conversation. Type <code className="text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded text-xs">@latent your question</code> to query the AI with your uploaded research.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      {messages.length > 0 && (
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
          {messages.map((msg, i) => (
            <MessageBubble key={msg.id || i} msg={msg} isOwn={msg.username === username} />
          ))}

          {/* Bot typing indicator */}
          {botTyping && (
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <Bot size={13} className="text-violet-400" />
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      )}

      {/* Input */}
      <div className="px-8 pb-8 pt-4 shrink-0">
        <div className="max-w-4xl mx-auto">
          <form
            onSubmit={handleSend}
            className="flex items-end gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-2 focus-within:border-indigo-500/40 focus-within:ring-1 focus-within:ring-indigo-500/20 transition-all"
          >
            <button
              type="button"
              onClick={insertBotMention}
              title="Ask Latent AI"
              className="p-2.5 text-slate-600 hover:text-violet-400 hover:bg-violet-500/10 rounded-xl transition-all shrink-0"
            >
              <Bot size={18} />
            </button>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${room.name}... (use @latent to ask AI)`}
              rows={1}
              className="flex-1 bg-transparent px-2 py-2 outline-none text-sm text-slate-200 placeholder:text-slate-600 resize-none max-h-32"
              style={{ lineHeight: '1.5' }}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed p-2.5 rounded-xl text-white transition-all shrink-0"
            >
              <Send size={16} />
            </button>
          </form>
          <p className="text-center text-[11px] text-slate-700 mt-2">
            Press <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-600">Enter</kbd> to send · <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-600">Shift+Enter</kbd> for new line · <span className="text-slate-600">@latent to activate Latent AI</span>
          </p>
        </div>
      </div>

      {/* Upload modal */}
      {showUpload && (
        <UploadModal
          room={room}
          token={token}
          onClose={() => setShowUpload(false)}
          onUploaded={handleDocUploaded}
        />
      )}
    </div>
  );
}

function MessageBubble({ msg, isOwn }) {
  if (msg.is_bot) {
    return (
      <div className="flex items-start gap-3 max-w-3xl">
        <div className="w-7 h-7 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0 mt-0.5">
          <Bot size={13} className="text-violet-400" />
        </div>
        <div className="bg-slate-900 border border-violet-500/20 rounded-2xl rounded-tl-sm px-4 py-3 max-w-2xl">
          <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">Latent</span>
            <span className="text-[10px] text-slate-700">{msg.time}</span>
          </div>
          <div className="text-sm text-slate-300 leading-relaxed prose prose-invert max-w-none">
            <ReactMarkdown
              components={{
                p: ({ node, ...props }) => <p className="mb-2" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-2" {...props} />,
                li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                strong: ({ node, ...props }) => <strong className="font-bold text-white" {...props} />,
                em: ({ node, ...props }) => <em className="italic text-slate-200" {...props} />,
                code: ({ node, inline, ...props }) => 
                  inline ? 
                    <code className="bg-slate-800 px-1.5 py-0.5 rounded text-xs text-indigo-300 font-mono" {...props} /> :
                    <code className="block bg-slate-800 px-3 py-2 rounded text-xs text-indigo-300 font-mono mb-2 overflow-x-auto" {...props} />,
                pre: ({ node, ...props }) => <pre className="bg-slate-800 p-3 rounded mb-2 overflow-x-auto" {...props} />,
                blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-indigo-500 pl-3 italic text-slate-400 mb-2" {...props} />,
                a: ({ node, ...props }) => <a className="text-indigo-400 hover:text-indigo-300 underline" {...props} />,
                h1: ({ node, ...props }) => <h1 className="text-lg font-bold text-white mb-2 mt-3" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-base font-bold text-white mb-2 mt-2" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-sm font-bold text-white mb-1 mt-2" {...props} />,
              }}
            >
              {msg.text}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  if (isOwn) {
    return (
      <div className="flex justify-end">
        <div className="bg-indigo-600 rounded-2xl rounded-tr-sm px-4 py-3 max-w-xl">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-indigo-200/70 uppercase tracking-wider">{msg.username}</span>
            <span className="text-[10px] text-indigo-300/40">{msg.time}</span>
          </div>
          <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">{msg.text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[11px] font-bold text-slate-400 shrink-0 mt-0.5">
        {msg.username?.[0]?.toUpperCase()}
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 max-w-xl">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{msg.username}</span>
          <span className="text-[10px] text-slate-700">{msg.time}</span>
        </div>
        <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{msg.text}</p>
      </div>
    </div>
  );
}
