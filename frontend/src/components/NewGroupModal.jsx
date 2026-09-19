import React, { useState, useEffect } from 'react';
import { X, Users, Check } from 'lucide-react';
import api from '../services/api';
import Avatar from './Avatar';

export const NewGroupModal = ({ isOpen, onClose, onGroupCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const fetchContacts = async () => {
      setLoading(true);
      try {
        const res = await api.get('/users/search');
        setUsers(res.data);
      } catch (err) {
        console.error('Failed to load contacts', err);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
    setName('');
    setDescription('');
    setSelectedIds(new Set());
    setError('');
  }, [isOpen]);

  const toggleSelect = (userId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a group name');
      return;
    }
    if (selectedIds.size === 0) {
      setError('Please select at least 1 member');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await api.post('/conversations/group', {
        name: name.trim(),
        description: description.trim(),
        memberIds: Array.from(selectedIds),
      });
      onGroupCreated(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create group');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/40">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-slate-100">Create New Group</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form & List */}
        <form onSubmit={handleCreate} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 space-y-3 bg-slate-900 border-b border-slate-800">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-3 py-2 rounded-lg">
                {error}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Group Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Engineering Squad"
                required
                className="w-full bg-slate-800 text-slate-100 text-sm px-3.5 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-slate-700/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Group Description (Optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Project announcements and chat"
                className="w-full bg-slate-800 text-slate-100 text-sm px-3.5 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-slate-700/50"
              />
            </div>
          </div>

          <div className="px-4 py-2 bg-slate-800/30 text-xs font-semibold text-slate-400 flex justify-between">
            <span>Select Members ({selectedIds.size} selected)</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50 p-2">
            {loading ? (
              <div className="py-8 text-center text-sm text-slate-400">Loading contacts...</div>
            ) : users.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">No contacts available</div>
            ) : (
              users.map((u) => {
                const selected = selectedIds.has(u.id);
                return (
                  <div
                    key={u.id}
                    onClick={() => toggleSelect(u.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition select-none ${
                      selected ? 'bg-emerald-500/15 border border-emerald-500/30' : 'hover:bg-slate-800/60'
                    }`}
                  >
                    <Avatar name={u.name} avatarUrl={u.avatarUrl} size="md" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-slate-100 truncate">{u.name}</h4>
                      <p className="text-xs text-slate-400 truncate">{u.email}</p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                        selected
                          ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                          : 'border-slate-600 bg-slate-800'
                      }`}
                    >
                      {selected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-slate-800 bg-slate-900 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim() || selectedIds.size === 0}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition ${
                submitting || !name.trim() || selectedIds.size === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-md shadow-emerald-500/20 active:scale-95'
              }`}
            >
              {submitting ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default NewGroupModal;
