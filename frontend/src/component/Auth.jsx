import React, { useState } from 'react';
import { Command, Mail, Lock, User, ArrowRight, Loader2, FlaskConical } from 'lucide-react';

const API = 'http://localhost:8000';

export default function Auth({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ username: '', email: '', password: '' });

  const update = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/login' : '/register';
      const body = isLogin
        ? new URLSearchParams({ username: form.username, password: form.password })
        : JSON.stringify(form);
      const headers = isLogin
        ? { 'Content-Type': 'application/x-www-form-urlencoded' }
        : { 'Content-Type': 'application/json' };

      const res = await fetch(`${API}${endpoint}`, { method: 'POST', headers, body });
      const data = await res.json();

      if (!res.ok) { setError(data.detail || 'Authentication failed.'); return; }

      if (isLogin) {
        onLoginSuccess(data.access_token, form.username);
      } else {
        setIsLogin(true);
        setError('');
        setForm({ username: '', email: '', password: '' });
        // Show success briefly
        alert('Account created! Please sign in.');
      }
    } catch {
      setError('Cannot reach server. Is FastAPI running on port 8000?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-700/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-10 shadow-2xl shadow-black/60">

          {/* Header */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center mb-5 shadow-xl shadow-indigo-600/30">
              <FlaskConical className="text-white" size={30} />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              {isLogin ? 'Welcome back' : 'Join the Lab'}
            </h1>
            <p className="text-slate-500 text-sm mt-2">
              {isLogin ? 'Sign in to your research workspace' : 'Create your researcher profile'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <InputField
                icon={<Mail size={17} />}
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={update('email')}
                required
              />
            )}
            <InputField
              icon={<User size={17} />}
              type="text"
              placeholder="Username"
              value={form.username}
              onChange={update('username')}
              required
            />
            <InputField
              icon={<Lock size={17} />}
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={update('password')}
              required
            />

            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading
                ? <Loader2 size={20} className="animate-spin" />
                : <>{isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={16} /></>
              }
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            {isLogin ? "Don't have an account?" : 'Already have one?'}{' '}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          LatentLab Research OS — Private Research Environment
        </p>
      </div>
    </div>
  );
}

function InputField({ icon, ...props }) {
  return (
    <div className="relative group">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
        {icon}
      </span>
      <input
        className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 outline-none transition-all placeholder:text-slate-600"
        {...props}
      />
    </div>
  );
}
