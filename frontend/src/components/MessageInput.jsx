import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, Paperclip } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';

export const MessageInput = ({ onSendMessage, onTyping }) => {
  const [content, setContent] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const typingTimeoutRef = useRef(null);
  const isTypingStateRef = useRef(false);
  const emojiPickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTextChange = (e) => {
    const val = e.target.value;
    setContent(val);

    if (!isTypingStateRef.current && val.trim().length > 0) {
      isTypingStateRef.current = true;
      onTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingStateRef.current) {
        isTypingStateRef.current = false;
        onTyping(false);
      }
    }, 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!content.trim()) return;

    onSendMessage(content.trim());
    setContent('');
    setShowEmoji(false);

    if (isTypingStateRef.current) {
      isTypingStateRef.current = false;
      onTyping(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleEmojiClick = (emojiData) => {
    setContent((prev) => prev + emojiData.emoji);
  };

  return (
    <div className="bg-slate-900 border-t border-slate-800 px-4 py-3 relative select-none">
      {showEmoji && (
        <div
          ref={emojiPickerRef}
          className="absolute bottom-16 left-4 z-50 shadow-2xl rounded-2xl overflow-hidden border border-slate-700"
        >
          <EmojiPicker
            theme="dark"
            onEmojiClick={handleEmojiClick}
            lazyLoadEmojis={true}
            searchDisabled={false}
          />
        </div>
      )}

      <div className="flex items-center gap-2 max-w-6xl mx-auto">
        <button
          type="button"
          onClick={() => setShowEmoji((prev) => !prev)}
          className={`p-2 rounded-full transition-colors ${
            showEmoji ? 'text-emerald-400 bg-slate-800' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
          title="Emoji"
        >
          <Smile className="w-6 h-6" />
        </button>

        <textarea
          rows={1}
          value={content}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 bg-slate-800 text-slate-100 placeholder-slate-400 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none max-h-32 transition-all"
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={!content.trim()}
          className={`p-2.5 rounded-full transition-all duration-200 ${
            content.trim()
              ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-lg shadow-emerald-500/20 active:scale-95'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
          title="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
export default MessageInput;
