import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Auth from './component/Auth';
import Sidebar from './component/Sidebar';
import Dashboard from './component/Dashboard';
import Chat from './component/Chat';
import Profile from './component/Profile';

const API = 'http://localhost:8000';
export const socket = io(API, {
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
  transports: ['websocket', 'polling'],
  forceNew: false,
});

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [username, setUsername] = useState(() => localStorage.getItem('username') || 'Researcher');
  const [view, setView] = useState(token ? 'dashboard' : 'auth');
  const [rooms, setRooms] = useState([]);
  const [team, setTeam] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (token) {
      console.log('[Socket] Connecting...');
      socket.connect();
      
      socket.on('connect', () => {
        console.log('[Socket] ✅ Connected with ID:', socket.id);
      });
      
      socket.on('disconnect', (reason) => {
        console.log('[Socket] ❌ Disconnected -', reason);
      });
      
      socket.on('connect_error', (err) => {
        console.error('[Socket] ⚠️ Connection error:', err.message || err);
      });
      
      socket.on('error', (err) => {
        console.error('[Socket] ⚠️ Socket error:', err);
      });
    }
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('error');
      socket.disconnect();
    };
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API}/rooms`, { headers }).then(r => r.ok ? r.json() : []),
      fetch(`${API}/users/team`, { headers }).then(r => r.ok ? r.json() : []),
      fetch(`${API}/users/me`, { headers }).then(r => r.ok ? r.json() : null),
    ]).then(([r, t, p]) => { setRooms(r); setTeam(t); setProfile(p); });
  }, [token]);

  const handleLoginSuccess = (tok, uname) => {
    localStorage.setItem('token', tok);
    localStorage.setItem('username', uname);
    setToken(tok);
    setUsername(uname);
    setView('dashboard');
  };

  const handleLogout = () => {
    localStorage.clear();
    socket.disconnect();
    setToken(null);
    setRooms([]);
    setView('auth');
  };

  const handleEnterRoom = (room) => { setActiveRoom(room); setView('chat'); };

  // Called after creating a room — adds it to local list
  const handleRoomCreated = (room) => setRooms(prev => [...prev, room]);

  // Called after joining a room
  const handleRoomJoined = (room) => {
    setRooms(prev => [...prev, room]);
    setActiveRoom(room);
    setView('chat');
  };

  const handleProfileSaved = (updated) => setProfile(prev => ({ ...prev, ...updated }));

  if (view === 'auth') return <Auth onLoginSuccess={handleLoginSuccess} />;

  return (
    <div className="flex h-screen bg-[#080c14] text-slate-300 overflow-hidden">
      <Sidebar
        view={view}
        setView={setView}
        rooms={rooms}
        activeRoom={activeRoom}
        onEnterRoom={handleEnterRoom}
        onLogout={handleLogout}
        profile={profile}
        username={username}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        {view === 'dashboard' && (
          <Dashboard
            rooms={rooms}
            team={team}
            token={token}
            username={username}
            onEnterRoom={handleEnterRoom}
            onRoomCreated={handleRoomCreated}
            onRoomJoined={handleRoomJoined}
          />
        )}
        {view === 'chat' && activeRoom && (
          <Chat room={activeRoom} token={token} username={username} />
        )}
        {view === 'profile' && (
          <Profile token={token} profile={profile} onSaved={handleProfileSaved} />
        )}
      </main>
    </div>
  );
}
