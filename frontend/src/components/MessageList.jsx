import React, { useEffect, useRef } from 'react';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';

const formatMessageTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return isNaN(date) ? '' : format(date, 'h:mm a');
};

const formatDateSeparator = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (isNaN(date)) return '';
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMMM d, yyyy');
};

export const MessageList = ({ messages, currentUserId, isGroup, typingUsersList }) => {
  const scrollRef = useRef(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsersList]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 py-4 space-y-3 chat-pattern-dark relative"
    >
      {messages.map((msg, index) => {
        const isMine = msg.sender?.id === currentUserId;
        const prevMsg = index > 0 ? messages[index - 1] : null;
        const showDateSeparator =
          !prevMsg || !isSameDay(new Date(msg.timestamp), new Date(prevMsg.timestamp));

        if (msg.messageType === 'SYSTEM') {
          return (
            <React.Fragment key={msg.id || index}>
              {showDateSeparator && (
                <div className="flex justify-center my-3">
                  <span className="bg-slate-800/90 text-slate-300 text-xs px-3 py-1 rounded-full shadow-sm border border-slate-700/50">
                    {formatDateSeparator(msg.timestamp)}
                  </span>
                </div>
              )}
              <div className="flex justify-center my-2">
                <span className="bg-slate-800/60 text-slate-400 text-[11px] px-3 py-1 rounded-md border border-slate-700/30 text-center max-w-md">
                  {msg.content}
                </span>
              </div>
            </React.Fragment>
          );
        }

        return (
          <React.Fragment key={msg.id || index}>
            {showDateSeparator && (
              <div className="flex justify-center my-3">
                <span className="bg-slate-800/90 text-slate-300 text-xs px-3 py-1 rounded-full shadow-sm border border-slate-700/50 font-medium">
                  {formatDateSeparator(msg.timestamp)}
                </span>
              </div>
            )}

            <div className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] md:max-w-[65%] rounded-xl px-3.5 py-2 shadow-md relative transition-all duration-150 ${
                  isMine ? 'chat-bubble-sent' : 'chat-bubble-received'
                }`}
              >
                {/* Sender Name in Group */}
                {isGroup && !isMine && msg.sender && (
                  <p className="text-[11px] font-bold text-emerald-400 mb-1 leading-tight">
                    {msg.sender.name}
                  </p>
                )}

                {/* Message Content */}
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words pr-2">
                  {msg.content}
                </p>

                {/* Timestamp & Read Status */}
                <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-300/80 float-right ml-3 -mr-1 mb--0.5">
                  <span>{formatMessageTime(msg.timestamp)}</span>
                  {isMine && (
                    <span>
                      {msg.read ? (
                        <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </React.Fragment>
        );
      })}

      {/* Real-time Typing Bubble */}
      {typingUsersList && typingUsersList.length > 0 && (
        <div className="flex justify-start my-2">
          <div className="chat-bubble-received rounded-xl px-3.5 py-2 text-xs text-slate-300 flex items-center gap-2 shadow-md">
            <span className="font-semibold text-emerald-400">
              {typingUsersList.join(', ')}
            </span>
            <span className="text-slate-400">is typing</span>
            <span className="flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
export default MessageList;
