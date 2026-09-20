import React, { useState } from 'react';
import { X, User, Check, Edit2 } from 'lucide-react';
import Avatar from './Avatar';
import { useAuth } from '../context/AuthContext';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
];

export const ProfileModal = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [about, setAbout] = useState(user?.about || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSavedSuccess(false);

    try {
      await updateProfile({ name, about, avatarUrl });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/40">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-slate-100">My Profile</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-3 py-2 rounded-lg">
              {error}
            </div>
          )}
          {savedSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3 py-2 rounded-lg flex items-center gap-1.5">
              <Check className="w-4 h-4" /> Profile updated successfully!
            </div>
          )}

          {/* Current Avatar */}
          <div className="flex flex-col items-center gap-3">
            <Avatar name={name || user.name} avatarUrl={avatarUrl} size="2xl" />
            <span className="text-xs text-slate-400">Choose an Avatar preset or enter image URL</span>

            {/* Presets */}
            <div className="flex gap-2 justify-center flex-wrap">
              {PRESET_AVATARS.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt="preset"
                  onClick={() => setAvatarUrl(url)}
                  className={`w-9 h-9 rounded-full object-cover cursor-pointer transition border-2 ${
                    avatarUrl === url ? 'border-emerald-500 scale-110' : 'border-transparent hover:border-slate-500'
                  }`}
                />
              ))}
              <button
                type="button"
                onClick={() => setAvatarUrl('')}
                className="w-9 h-9 rounded-full bg-slate-800 text-[10px] text-slate-300 font-semibold flex items-center justify-center border border-slate-700 hover:bg-slate-700 transition"
              >
                Initials
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Custom Avatar URL
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className="w-full bg-slate-800 text-slate-100 text-sm px-3.5 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-slate-700/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-slate-800 text-slate-100 text-sm px-3.5 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-slate-700/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              About Status
            </label>
            <input
              type="text"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="Hey there! I am using ChatSphere."
              className="w-full bg-slate-800 text-slate-100 text-sm px-3.5 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-slate-700/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Email (Account ID)
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full bg-slate-800/50 text-slate-500 text-sm px-3.5 py-2 rounded-xl cursor-not-allowed border border-slate-800"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-md shadow-emerald-500/20 active:scale-95 transition"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default ProfileModal;
