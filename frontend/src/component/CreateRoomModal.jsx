import React, { useState } from 'react';
import { X, FlaskConical, Loader2, Plus, Copy, Check, Crown, ArrowRight } from 'lucide-react';

const API = 'http://localhost:8000';

const COLORS = [
  { id: 'indigo',  cls: 'bg-indigo-500'  },
  { id: 'violet',  cls: 'bg-violet-500'  },
  { id: 'cyan',    cls: 'bg-cyan-500'    },
  { id: 'emerald', cls: 'bg-emerald-500' },
  { id: 'amber',   cls: 'bg-amber-500'   },
  { id: 'rose',    cls: 'bg-rose-500'    },
];

export default function CreateRoomModal({ token, onClose, onCreated }) {
  const [step, setStep] = useState('form'); // 'form' | 'success'
  const [form, setForm] = useState({ name: '', description: '', color: 'indigo' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdRoom, setCreatedRoom] = useState(null);
  const [copied, setCopied] = useState(false);

  const update = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Lab name is required.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, name: form.name.trim().replace(/\s+/g, '-') }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || 'Creation failed.'); return; }
      setCreatedRoom(data);
      setStep('success');
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(createdRoom.join_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDone = () => {
    onCreated({ ...createdRoom, doc_count: 0 });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-black/60">

        {/* ── FORM STEP ── */}
        {step === 'form' && (
          <>
            <div className="flex items-center justify-between mb-7">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-500/15 border border-indigo-500/20 rounded-xl flex items-center justify-center">
                  <FlaskConical size={17} className="text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Create Lab Room</h2>
                  <p className="text-[11px] text-slate-600">You'll become the Group Lead</p>
                </div>
              </div>
              <button onClick={onClose} className="text-slate-600 hover:text-slate-300 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2">Lab Name *</label>
                <input
                  value={form.name}
                  onChange={update('name')}
                  placeholder="e.g. NLP-Research"
                  required
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                />
                <p className="text-[11px] text-slate-700 mt-1.5">Spaces become hyphens automatically</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2">Description</label>
                <textarea
                  value={form.description}
                  onChange={update('description')}
                  placeholder="What is this lab for?"
                  rows={2}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-3">Lab Color</label>
                <div className="flex items-center gap-2">
                  {COLORS.map(c => (
                    <button key={c.id} type="button" onClick={() => setForm(f => ({ ...f, color: c.id }))}
                      className={`w-7 h-7 rounded-full ${c.cls} transition-all ${
                        form.color === c.id ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'opacity-50 hover:opacity-80'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white text-sm font-semibold py-3 rounded-xl transition-all disabled:opacity-60">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Create Lab
                </button>
                <button type="button" onClick={onClose}
                  className="px-5 py-3 text-sm font-medium text-slate-500 hover:text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all">
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}

        {/* ── SUCCESS STEP ── */}
        {step === 'success' && createdRoom && (
          <div className="text-center">
            {/* Crown icon */}
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Crown size={30} className="text-amber-400" />
            </div>

            <h2 className="text-xl font-bold text-white mb-1">Lab Created!</h2>
            <p className="text-slate-500 text-sm mb-2">
              You're the <span className="text-amber-400 font-semibold">Group Lead</span> of
            </p>
            <p className="text-indigo-400 font-bold text-lg mb-6">{createdRoom.name}</p>

            {/* Join ID display */}
            <div className="bg-slate-950/80 border border-indigo-500/30 rounded-2xl p-5 mb-6">
              <p className="text-xs text-slate-500 mb-3 uppercase tracking-widest font-semibold">
                Room Join ID — share this with your team
              </p>
              <div className="flex items-center justify-between gap-3">
                <p className="text-2xl font-mono font-bold text-indigo-400 tracking-[0.2em]">
                  {createdRoom.join_id}
                </p>
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all ${
                    copied
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                      : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                  }`}
                >
                  {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-6">
              Others can join by clicking <strong className="text-slate-500">Join Room</strong> on their dashboard and entering this ID.
            </p>

            <button
              onClick={handleDone}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white text-sm font-semibold py-3.5 rounded-xl transition-all"
            >
              Enter Lab <ArrowRight size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
