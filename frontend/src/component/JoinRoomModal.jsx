import React, { useState, useRef, useEffect } from 'react';
import { X, LogIn, Loader2, FlaskConical, ArrowRight } from 'lucide-react';

const API = 'http://localhost:8000';

// Renders 3 separate input boxes: "234" · "344" · "byt"
// Segments are auto-focused and auto-advance on fill
export default function JoinRoomModal({ token, onClose, onJoined }) {
  // Join ID format: "ddd-ddd-lll"
  const [segments, setSegments] = useState(['', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const refs = [useRef(null), useRef(null), useRef(null)];

  useEffect(() => { refs[0].current?.focus(); }, []);

  const handleSegmentChange = (idx, val) => {
    // Sanitize: first two segments are digits, last is letters
    const sanitized = idx < 2
      ? val.replace(/\D/g, '').slice(0, 3)
      : val.replace(/[^a-z]/gi, '').toLowerCase().slice(0, 3);

    const next = [...segments];
    next[idx] = sanitized;
    setSegments(next);
    setError('');

    // Auto-advance
    if (sanitized.length === 3 && idx < 2) {
      refs[idx + 1].current?.focus();
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && segments[idx] === '' && idx > 0) {
      refs[idx - 1].current?.focus();
    }
    if (e.key === 'ArrowRight' && idx < 2) refs[idx + 1].current?.focus();
    if (e.key === 'ArrowLeft' && idx > 0) refs[idx - 1].current?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const raw = e.clipboardData.getData('text').trim();
    // Support pasting a full ID like "234-344-byt"
    const parts = raw.split('-');
    if (parts.length === 3) {
      setSegments([
        parts[0].slice(0, 3),
        parts[1].slice(0, 3),
        parts[2].slice(0, 3).toLowerCase(),
      ]);
      refs[2].current?.focus();
    }
  };

  const joinId = segments.join('-');
  const isComplete = segments[0].length === 3 && segments[1].length === 3 && segments[2].length === 3;

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!isComplete) { setError('Please enter all three parts of the join ID.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/rooms/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ join_id: joinId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || 'Could not join room.'); return; }
      onJoined(data);
    } catch {
      setError('Network error. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-black/60">

        {/* Header */}
        <div className="flex items-center justify-between mb-7">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-500/15 border border-indigo-500/20 rounded-xl flex items-center justify-center">
              <LogIn size={17} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Join a Lab</h2>
              <p className="text-[11px] text-slate-600">Enter the room's join ID</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleJoin} className="space-y-6">
          {/* ID input — 3 boxes */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-4 text-center">
              Room Join ID
            </label>
            <div className="flex items-center justify-center gap-3" onPaste={handlePaste}>
              {segments.map((seg, idx) => (
                <React.Fragment key={idx}>
                  <input
                    ref={refs[idx]}
                    value={seg}
                    onChange={e => handleSegmentChange(idx, e.target.value)}
                    onKeyDown={e => handleKeyDown(idx, e)}
                    placeholder={idx < 2 ? '000' : 'xxx'}
                    maxLength={3}
                    className={`w-20 text-center text-xl font-mono font-bold tracking-[0.2em] bg-slate-950/70 border rounded-xl py-4 outline-none transition-all placeholder:text-slate-800 ${
                      seg.length === 3
                        ? 'border-indigo-500/60 text-indigo-400 ring-1 ring-indigo-500/30'
                        : 'border-slate-800 text-slate-300 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20'
                    }`}
                  />
                  {idx < 2 && (
                    <span className="text-slate-700 font-bold text-lg select-none">—</span>
                  )}
                </React.Fragment>
              ))}
            </div>
            <p className="text-center text-[11px] text-slate-700 mt-3">
              Format: <span className="font-mono text-slate-600">234-344-byt</span> · You can also paste the full ID
            </p>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 text-center">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || !isComplete}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white text-sm font-semibold py-3.5 rounded-xl transition-all disabled:opacity-50"
            >
              {loading
                ? <Loader2 size={16} className="animate-spin" />
                : <><LogIn size={15} /> Join Lab</>
              }
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 text-sm font-medium text-slate-500 hover:text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
            >
              Cancel
            </button>
          </div>
        </form>

        <p className="text-center text-[11px] text-slate-700 mt-5">
          Ask the Group Lead of the room you want to join for their join ID.
        </p>
      </div>
    </div>
  );
}
