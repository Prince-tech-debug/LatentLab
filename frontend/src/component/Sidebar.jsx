import React from 'react';
import {
  FlaskConical, LayoutDashboard, Users, Hash,
  LogOut, UserCircle2, ChevronRight,
} from 'lucide-react';

export default function Sidebar({ view, setView, rooms, activeRoom, onEnterRoom, onLogout, profile, username }) {
  return (
    <aside className="w-64 flex-shrink-0 bg-slate-900/40 border-r border-slate-800/50 flex flex-col">

      {/* Logo */}
      <div
        className="h-[72px] flex items-center px-5 gap-3 border-b border-slate-800/50 cursor-pointer select-none"
        onClick={() => setView('dashboard')}
      >
        <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
          <FlaskConical size={18} className="text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-sm tracking-tight">LatentLab</p>
          <p className="text-slate-600 text-[10px]">Research OS</p>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
        <section className="space-y-0.5">
          <NavItem
            icon={<LayoutDashboard size={16} />}
            label="Dashboard"
            active={view === 'dashboard'}
            onClick={() => setView('dashboard')}
          />
          <NavItem
            icon={<Users size={16} />}
            label="Team Directory"
            active={view === 'team'}
            onClick={() => setView('team')}
          />
          <NavItem
            icon={<UserCircle2 size={16} />}
            label="My Profile"
            active={view === 'profile'}
            onClick={() => setView('profile')}
          />
        </section>

        {/* Active Labs */}
        <section>
          <p className="px-3 text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-2">
            Active Labs
          </p>
          <div className="space-y-0.5">
            {rooms.map(r => (
              <NavItem
                key={r._id}
                icon={<Hash size={14} />}
                label={r.name}
                active={activeRoom?.name === r.name && view === 'chat'}
                onClick={() => onEnterRoom(r)}
              />
            ))}
          </div>
        </section>
      </div>

      {/* User footer */}
      <div className="p-3 border-t border-slate-800/50">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-xs font-bold">
            {(profile?.username || username || 'R')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-300 truncate">{profile?.username || username}</p>
            <p className="text-[10px] text-slate-600 truncate">{profile?.role || 'Researcher'}</p>
          </div>
          <button
            onClick={onLogout}
            title="Sign out"
            className="text-slate-600 hover:text-red-400 transition-colors"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
        active
          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
          : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-200'
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="text-sm font-medium truncate flex-1">{label}</span>
      {active && <ChevronRight size={13} className="shrink-0 opacity-60" />}
    </button>
  );
}
