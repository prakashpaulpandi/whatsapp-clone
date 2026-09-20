import React from 'react';
import { X, Users, LogOut, ShieldCheck, UserCheck } from 'lucide-react';
import Avatar from './Avatar';
import { format } from 'date-fns';

export const GroupInfoModal = ({ isOpen, onClose, conversation, currentUserId, onLeaveGroup }) => {
  if (!isOpen || !conversation) return null;

  const participants = conversation.participants || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/40">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-slate-100">Group Info</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Group Profile Card */}
        <div className="p-6 text-center border-b border-slate-800 bg-slate-900 flex flex-col items-center">
          <Avatar
            name={conversation.name}
            avatarUrl={conversation.avatarUrl}
            isGroup={true}
            size="2xl"
          />
          <h3 className="text-lg font-bold text-slate-100 mt-3">{conversation.name}</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            {conversation.description || 'No description provided'}
          </p>
          <p className="text-[11px] text-slate-500 mt-2">
            Created on {conversation.createdAt ? format(new Date(conversation.createdAt), 'MMMM d, yyyy') : 'Unknown'}
          </p>
        </div>

        {/* Members List */}
        <div className="px-4 py-2 bg-slate-800/40 border-b border-slate-800 text-xs font-semibold text-slate-400 flex justify-between">
          <span>Members ({participants.length})</span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40 p-2">
          {participants.map((p) => {
            const isMe = p.user?.id === currentUserId;
            const isAdmin = p.role === 'ADMIN';

            return (
              <div key={p.id || p.user?.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/50">
                <Avatar
                  name={p.user?.name}
                  avatarUrl={p.user?.avatarUrl}
                  isOnline={p.user?.online}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-slate-100 truncate">
                      {p.user?.name} {isMe && '(You)'}
                    </span>
                    {isAdmin && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-medium flex items-center gap-0.5">
                        <ShieldCheck className="w-3 h-3" /> Admin
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate">{p.user?.about || p.user?.email}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Are you sure you want to leave this group?')) {
                onLeaveGroup(conversation.id);
                onClose();
              }
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition"
          >
            <LogOut className="w-4 h-4" />
            Leave Group
          </button>
        </div>
      </div>
    </div>
  );
};
export default GroupInfoModal;
