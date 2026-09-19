import React, { useState, useEffect } from 'react';
import { X, Search, UserCheck } from 'lucide-react';
import api from '../services/api';
import Avatar from './Avatar';

export const NewChatModal = ({ isOpen, onClose, onSelectUser }) => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/users/search${query ? `?q=${encodeURIComponent(query)}` : ''}`);
        setUsers(res.data);
      } catch (err) {
        console.error('Failed to load users', err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchUsers, 200);
    return () => clearTimeout(debounce);
  }, [query, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/40">
          <h2 className="text-base font-bold text-slate-100">New Direct Chat</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-slate-800 bg-slate-900">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email..."
              autoFocus
              className="w-full bg-slate-800 text-slate-100 text-sm pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-slate-700/50"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50 p-2">
          {loading ? (
            <div className="py-8 text-center text-sm text-slate-400">Loading contacts...</div>
          ) : users.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">No users found</div>
          ) : (
            users.map((u) => (
              <div
                key={u.id}
                onClick={() => {
                  onSelectUser(u);
                  onClose();
                }}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/70 cursor-pointer transition"
              >
                <Avatar name={u.name} avatarUrl={u.avatarUrl} isOnline={u.online} size="md" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-slate-100 truncate">{u.name}</h4>
                  <p className="text-xs text-slate-400 truncate">{u.about || u.email}</p>
                </div>
                <UserCheck className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
export default NewChatModal;
