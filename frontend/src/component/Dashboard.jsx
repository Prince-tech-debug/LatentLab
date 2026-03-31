import React, { useState } from 'react';
import {
  FlaskConical, Plus, ArrowRight, Users2, FileText,
  Search, LogIn, Crown, User, Hash,
} from 'lucide-react';
import CreateRoomModal from './CreateRoomModal';
import JoinRoomModal from './JoinRoomModal';

const COLOR_MAP = {
  indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20', dot: 'bg-indigo-500', glow: 'shadow-indigo-500/10' },
  violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20', dot: 'bg-violet-500', glow: 'shadow-violet-500/10' },
  cyan:   { bg: 'bg-cyan-500/10',   text: 'text-cyan-400',   border: 'border-cyan-500/20',   dot: 'bg-cyan-500',   glow: 'shadow-cyan-500/10' },
  emerald:{ bg: 'bg-emerald-500/10',text: 'text-emerald-400',border: 'border-emerald-500/20',dot: 'bg-emerald-500',glow: 'shadow-emerald-500/10' },
  amber:  { bg: 'bg-amber-500/10',  text: 'text-amber-400',  border: 'border-amber-500/20',  dot: 'bg-amber-500',  glow: 'shadow-amber-500/10' },
  rose:   { bg: 'bg-rose-500/10',   text: 'text-rose-400',   border: 'border-rose-500/20',   dot: 'bg-rose-500',   glow: 'shadow-rose-500/10' },
};

export default function Dashboard({ rooms, team, token, username, onEnterRoom, onRoomCreated, onRoomJoined }) {
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = rooms.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalDocs = rooms.reduce((a, r) => a + (r.doc_count || 0), 0);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-6xl mx-auto px-10 py-10 space-y-10">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Research Dashboard</h1>
            <p className="text-slate-500 text-sm">
              Welcome back, <span className="text-slate-300">{username}</span>
            </p>
          </div>

          {/* Primary CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowJoin(true)}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-slate-200 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all border border-slate-700"
            >
              <LogIn size={15} /> Join Room
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20"
            >
              <Plus size={15} /> Create Room
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard icon={<FlaskConical size={18} />} label="My Labs"           value={rooms.length}  color="indigo" />
          <StatCard icon={<Users2 size={18} />}       label="Total Researchers" value={team.length}   color="violet" />
          <StatCard icon={<FileText size={18} />}     label="Docs Indexed"      value={totalDocs}     color="cyan"   />
        </div>

        {/* Empty state */}
        {rooms.length === 0 && (
          <div className="border-2 border-dashed border-slate-800 rounded-3xl p-16 flex flex-col items-center gap-5 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center">
              <FlaskConical size={28} className="text-slate-600" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg mb-2">No labs yet</h3>
              <p className="text-slate-600 text-sm max-w-xs">
                Create your own research lab or join an existing one using a room's join ID.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowJoin(true)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all border border-slate-700">
                <LogIn size={15} /> Join with ID
              </button>
              <button onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all">
                <Plus size={15} /> Create a Lab
              </button>
            </div>
          </div>
        )}

        {/* Search + Rooms grid */}
        {rooms.length > 0 && (
          <>
            <div className="relative">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search your labs..."
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all"
              />
            </div>

            <div>
              <h2 className="text-xs font-semibold text-slate-600 uppercase tracking-widest mb-4">
                My Labs · {filtered.length}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map(room => (
                  <RoomCard key={room._id} room={room} onEnter={onEnterRoom} />
                ))}
                {/* Quick-add tiles */}
                <ActionTile
                  icon={<Plus size={20} />}
                  label="Create new lab"
                  sublabel="Start a private research room"
                  onClick={() => setShowCreate(true)}
                />
                <ActionTile
                  icon={<LogIn size={20} />}
                  label="Join a lab"
                  sublabel="Enter a room ID to join"
                  onClick={() => setShowJoin(true)}
                />
              </div>
            </div>
          </>
        )}

        {/* Team */}
        {team.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-slate-600 uppercase tracking-widest mb-4">
              Researchers · {team.length}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {team.slice(0, 8).map(member => (
                <div key={member._id}
                  className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm shrink-0">
                    {member.username[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-300 truncate">{member.username}</p>
                    <p className="text-[11px] text-slate-600 truncate">{member.role || 'Researcher'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateRoomModal
          token={token}
          onClose={() => setShowCreate(false)}
          onCreated={(room) => { onRoomCreated(room); setShowCreate(false); }}
        />
      )}
      {showJoin && (
        <JoinRoomModal
          token={token}
          onClose={() => setShowJoin(false)}
          onJoined={(room) => { onRoomJoined(room); setShowJoin(false); }}
        />
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────

function RoomCard({ room, onEnter }) {
  const c = COLOR_MAP[room.color] || COLOR_MAP.indigo;
  const isLead = room.my_role === 'group_lead';

  return (
    <div
      onClick={() => onEnter(room)}
      className={`group bg-slate-900/40 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 ${c.bg} rounded-xl flex items-center justify-center border ${c.border} group-hover:scale-105 transition-transform`}>
          <FlaskConical className={c.text} size={20} />
        </div>
        {/* Role badge */}
        {isLead ? (
          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-full">
            <Crown size={10} /> Group Lead
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] text-slate-600 bg-slate-800 border border-slate-700 px-2 py-1 rounded-full">
            <User size={10} /> Member
          </span>
        )}
      </div>

      <h3 className="text-sm font-bold text-white mb-1.5 leading-tight">{room.name}</h3>
      <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">
        {room.description || 'Active research environment'}
      </p>

      {/* Meta row */}
      <div className="flex items-center justify-between text-[11px] text-slate-600 mb-4">
        <span className="flex items-center gap-1"><Users2 size={11} /> {room.member_count || 1} member{(room.member_count || 1) !== 1 ? 's' : ''}</span>
        <span className="flex items-center gap-1"><FileText size={11} /> {room.doc_count || 0} docs</span>
      </div>

      {/* Join ID — only visible to group lead */}
      {isLead && room.join_id && (
        <div
          className="mb-4 bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2.5 flex items-center justify-between"
          onClick={e => e.stopPropagation()}
        >
          <div>
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-0.5">Room Join ID</p>
            <p className="text-sm font-mono font-bold text-indigo-400 tracking-widest">{room.join_id}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(room.join_id); }}
            className="text-[10px] text-slate-600 hover:text-indigo-400 transition-colors px-2 py-1 hover:bg-indigo-500/10 rounded-lg"
          >
            Copy
          </button>
        </div>
      )}

      <span className={`flex items-center gap-1.5 text-xs font-semibold ${c.text} group-hover:gap-2.5 transition-all`}>
        Enter Lab <ArrowRight size={13} />
      </span>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  const c = COLOR_MAP[color] || COLOR_MAP.indigo;
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-11 h-11 ${c.bg} border ${c.border} rounded-xl flex items-center justify-center ${c.text}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function ActionTile({ icon, label, sublabel, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group border-2 border-dashed border-slate-800 hover:border-indigo-500/30 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 transition-all min-h-[180px] w-full"
    >
      <div className="w-10 h-10 rounded-xl bg-slate-800 group-hover:bg-indigo-500/10 flex items-center justify-center transition-all">
        <span className="text-slate-600 group-hover:text-indigo-400 transition-colors">{icon}</span>
      </div>
      <div className="text-center">
        <p className="text-sm text-slate-500 group-hover:text-slate-300 transition-colors font-medium">{label}</p>
        <p className="text-[11px] text-slate-700 mt-0.5">{sublabel}</p>
      </div>
    </button>
  );
}
