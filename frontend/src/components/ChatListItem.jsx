import React from 'react';
import Avatar from './Avatar';
import { format, isToday, isYesterday } from 'date-fns';
import { Check, CheckCheck, Camera, FileText, Video, Music } from 'lucide-react';

const renderLastMessageContent = (lastMsg) => {
  if (!lastMsg || !lastMsg.content) return '';
  const lines = lastMsg.content.split('\n');
  const firstLine = lines[0].trim();
  const caption = lines.slice(1).join(' ').trim();
  const lower = firstLine.toLowerCase();

  const isImageExt = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg'].some((ext) => lower.endsWith(ext));
  const isVideoExt = ['.mp4', '.webm', '.mov', '.avi'].some((ext) => lower.endsWith(ext));
  const isAudioExt = ['.mp3', '.wav', '.ogg', '.m4a'].some((ext) => lower.endsWith(ext));

  if (lastMsg.messageType === 'IMAGE' || (lower.startsWith('/api/files/') && isImageExt)) {
    return (
      <span className="flex items-center gap-1 text-slate-300">
        <Camera className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="truncate">{caption || 'Photo'}</span>
      </span>
    );
  }

  if (isVideoExt) {
    return (
      <span className="flex items-center gap-1 text-slate-300">
        <Video className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="truncate">{caption || 'Video'}</span>
      </span>
    );
  }

  if (isAudioExt) {
    return (
      <span className="flex items-center gap-1 text-slate-300">
        <Music className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="truncate">{caption || 'Audio'}</span>
      </span>
    );
  }

  if (lastMsg.messageType === 'FILE' || lower.startsWith('/api/files/')) {
    let name = 'Document';
    if (firstLine.includes('|')) {
      name = firstLine.split('|')[1] || 'Document';
    } else if (lower.endsWith('.pdf')) {
      name = 'PDF Document';
    }
    return (
      <span className="flex items-center gap-1 text-slate-300">
        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="truncate">{caption || name}</span>
      </span>
    );
  }

  return <span className="truncate">{lastMsg.content}</span>;
};

const formatChatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (isNaN(date)) return '';
  if (isToday(date)) {
    return format(date, 'h:mm a');
  }
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  return format(date, 'MM/dd/yy');
};

export const ChatListItem = ({ conversation, active, currentUserId, onClick, isOnline, typingText }) => {
  const isGroup = conversation.type === 'group';
  const chatName = isGroup ? conversation.name : (conversation.otherUser?.name || 'Unknown User');
  const chatAvatar = isGroup ? conversation.avatarUrl : conversation.otherUser?.avatarUrl;

  const lastMsg = conversation.lastMessage;
  const lastMsgTime = lastMsg?.timestamp || conversation.updatedAt || conversation.createdAt;
  const isMine = lastMsg?.sender?.id === currentUserId;
  const unreadCount = conversation.unreadCount || 0;

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-3 cursor-pointer transition-all duration-150 border-b border-slate-800/60 select-none ${
        active
          ? 'bg-slate-800/90 border-l-4 border-l-emerald-500 pl-2.5'
          : 'hover:bg-slate-800/40 bg-slate-900/50'
      }`}
    >
      <Avatar
        name={chatName}
        avatarUrl={chatAvatar}
        isOnline={isOnline}
        isGroup={isGroup}
        size="lg"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-slate-100 truncate flex items-center gap-1.5">
            {chatName}
            {isGroup && (
              <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-medium">
                Group
              </span>
            )}
          </h3>
          <span className={`text-xs ${unreadCount > 0 ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
            {formatChatTime(lastMsgTime)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-1">
          <div className="text-xs text-slate-400 truncate flex items-center gap-1 flex-1">
            {typingText ? (
              <span className="text-emerald-400 font-medium animate-pulse flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping inline-block" />
                {typingText}
              </span>
            ) : lastMsg ? (
              <>
                {isMine && (
                  <span>
                    {lastMsg.read ? (
                      <CheckCheck className="w-3.5 h-3.5 text-blue-400 inline shrink-0" />
                    ) : (
                      <Check className="w-3.5 h-3.5 text-slate-400 inline shrink-0" />
                    )}
                  </span>
                )}
                {isGroup && !isMine && lastMsg.sender && (
                  <span className="text-slate-300 font-medium">
                    {lastMsg.sender.name?.split(' ')[0]}:
                  </span>
                )}
                {renderLastMessageContent(lastMsg)}
              </>
            ) : (
              <span className="italic text-slate-500">No messages yet</span>
            )}
          </div>

          {unreadCount > 0 && (
            <span className="min-w-[18px] h-[18px] px-1 bg-emerald-500 text-slate-950 font-bold text-[11px] rounded-full flex items-center justify-center shrink-0 shadow-sm animate-bounce-short">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
export default ChatListItem;
