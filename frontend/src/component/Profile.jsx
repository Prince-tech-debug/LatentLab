import React, { useState, useEffect } from 'react';
import {
  UserCircle2, Save, Loader2, Building2,
  GraduationCap, Calendar, FileText, Mail, User, CheckCircle2,
} from 'lucide-react';

const API = 'http://localhost:8000';

export default function Profile({ token, profile, onSaved }) {
  const [form, setForm] = useState({
    age: '',
    institution: '',
    role: '',
    bio: '',
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile) {
      setForm({
        age: profile.age ?? '',
        institution: profile.institution ?? '',
        role: profile.role ?? '',
        bio: profile.bio ?? '',
      });
    }
  }, [profile]);

  const update = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSaved(false);

    const body = {
      age: form.age ? parseInt(form.age) : null,
      institution: form.institution || null,
      role: form.role || null,
      bio: form.bio || null,
    };

    try {
      const res = await fetch(`${API}/users/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json(); setError(d.detail || 'Update failed.'); return; }
      setSaved(true);
      onSaved?.(body);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Network error. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-10 py-10 space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">My Profile</h1>
          <p className="text-slate-500 text-sm">Manage your researcher identity and credentials</p>
        </div>

        {/* Avatar card */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-3xl font-bold text-indigo-400">
            {(profile?.username || 'R')[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{profile?.username}</h2>
            <p className="text-slate-500 text-sm">{profile?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2.5 py-1 rounded-full">
                {form.role || 'Researcher'}
              </span>
              {form.institution && (
                <span className="text-[11px] bg-slate-800 border border-slate-700 text-slate-400 px-2.5 py-1 rounded-full">
                  {form.institution}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Read-only fields */}
        <div className="grid grid-cols-2 gap-4">
          <ReadField icon={<User size={15} />} label="Username" value={profile?.username} />
          <ReadField icon={<Mail size={15} />} label="Email" value={profile?.email} />
        </div>

        {/* Editable form */}
        <form onSubmit={handleSave} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-5">
          <h3 className="text-sm font-semibold text-slate-300 border-b border-slate-800 pb-4">
            Edit Details
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <Field
              icon={<GraduationCap size={15} />}
              label="Role / Title"
              placeholder="e.g. PhD Student, ML Researcher"
              value={form.role}
              onChange={update('role')}
            />
            <Field
              icon={<Calendar size={15} />}
              label="Age"
              placeholder="Your age"
              type="number"
              min={10}
              max={120}
              value={form.age}
              onChange={update('age')}
            />
          </div>

          <Field
            icon={<Building2 size={15} />}
            label="Institution / Company"
            placeholder="e.g. MIT, DeepMind, Stanford University"
            value={form.institution}
            onChange={update('institution')}
          />

          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-2">
              <FileText size={13} /> Bio
            </label>
            <textarea
              value={form.bio}
              onChange={update('bio')}
              placeholder="A short description of your research interests..."
              rows={3}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all resize-none"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-all disabled:opacity-60"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Save Changes
            </button>

            {saved && (
              <div className="flex items-center gap-1.5 text-emerald-400 text-sm animate-in fade-in duration-300">
                <CheckCircle2 size={15} /> Saved!
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function ReadField({ icon, label, value }) {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl px-4 py-3">
      <div className="flex items-center gap-2 text-xs text-slate-600 mb-1">
        {icon} {label}
      </div>
      <p className="text-sm text-slate-400 font-medium truncate">{value || '—'}</p>
    </div>
  );
}

function Field({ icon, label, ...inputProps }) {
  return (
    <div>
      <label className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-2">
        {icon} {label}
      </label>
      <input
        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all"
        {...inputProps}
      />
    </div>
  );
}
