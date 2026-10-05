import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, Paperclip, X, Image, FileText, Film, Music } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import api from '../services/api';

// Helper: determine icon and label for file type
const getFileInfo = (file) => {
  const type = file.type;
  if (type.startsWith('image/'))  return { icon: Image,    label: 'Image',    isImage: true  };
  if (type.startsWith('video/'))  return { icon: Film,     label: 'Video',    isImage: false };
  if (type.startsWith('audio/'))  return { icon: Music,    label: 'Audio',    isImage: false };
  return                                  { icon: FileText, label: 'Document', isImage: false };
};

export const MessageInput = ({ onSendMessage, onTyping }) => {
  const [content, setContent]         = useState('');
  const [showEmoji, setShowEmoji]     = useState(false);
  const [pendingFile, setPendingFile] = useState(null);   // { file, previewUrl, isImage }
  const [uploading, setUploading]     = useState(false);
  const [uploadError, setUploadError] = useState('');

  const typingTimeoutRef    = useRef(null);
  const isTypingStateRef    = useRef(false);
  const emojiPickerRef      = useRef(null);
  const fileInputRef        = useRef(null);

  // Close emoji picker on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clean up object URL when pending file changes/clears
  useEffect(() => {
    return () => {
      if (pendingFile?.previewUrl) URL.revokeObjectURL(pendingFile.previewUrl);
    };
  }, [pendingFile]);

  // ── Text typing handlers ──────────────────────────────────────────────────
  const handleTextChange = (e) => {
    const val = e.target.value;
    setContent(val);

    if (!isTypingStateRef.current && val.trim().length > 0) {
      isTypingStateRef.current = true;
      onTyping(true);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
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

  // ── File selection ────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 20 MB client-side guard
    if (file.size > 20 * 1024 * 1024) {
      setUploadError('File is too large. Maximum size is 20 MB.');
      return;
    }

    const { isImage } = getFileInfo(file);
    const previewUrl  = isImage ? URL.createObjectURL(file) : null;
    setPendingFile({ file, previewUrl, isImage });
    setUploadError('');
    // Reset file input so same file can be re-selected if cancelled
    e.target.value = '';
  };

  const cancelFile = () => {
    if (pendingFile?.previewUrl) URL.revokeObjectURL(pendingFile.previewUrl);
    setPendingFile(null);
    setUploadError('');
  };

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    // If there is a file pending, upload it first then send as IMAGE message
    if (pendingFile) {
      setUploading(true);
      setUploadError('');
      try {
        const formData = new FormData();
        formData.append('file', pendingFile.file);

        const res = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const fileUrl = res.data.url;                             // e.g. /api/files/uuid.jpg
        const fileType = pendingFile.isImage ? 'IMAGE' : 'FILE';
        const originalName = res.data.originalName || pendingFile.file.name;
        const fileSize = pendingFile.file.size;

        let payload = '';
        if (pendingFile.isImage) {
          payload = content.trim() ? `${fileUrl}\n${content.trim()}` : fileUrl;
        } else {
          const meta = `${fileUrl}|${originalName}|${fileSize}`;
          payload = content.trim() ? `${meta}\n${content.trim()}` : meta;
        }

        onSendMessage(payload, fileType);

        setPendingFile(null);
        setContent('');
      } catch (err) {
        setUploadError(err.response?.data?.error || 'Upload failed. Try again.');
      } finally {
        setUploading(false);
      }
      return;
    }

    // Plain text message
    if (!content.trim()) return;
    onSendMessage(content.trim(), 'TEXT');
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

  // ── Derived state ─────────────────────────────────────────────────────────
  const canSend = !uploading && (!!pendingFile || content.trim().length > 0);

  return (
    <div className="bg-slate-900 border-t border-slate-800 px-4 py-3 relative select-none">
      {/* Emoji Picker */}
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

      {/* File Preview Banner */}
      {pendingFile && (
        <div className="mb-2 flex items-center gap-3 bg-slate-800 rounded-xl px-3 py-2 border border-slate-700">
          {pendingFile.isImage && pendingFile.previewUrl ? (
            <img
              src={pendingFile.previewUrl}
              alt="preview"
              className="w-14 h-14 object-cover rounded-lg border border-slate-600 flex-shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-lg border border-slate-600 bg-slate-700 flex items-center justify-center flex-shrink-0">
              <FileText className="w-7 h-7 text-emerald-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-200 truncate font-medium">{pendingFile.file.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {(pendingFile.file.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <button
            onClick={cancelFile}
            className="text-slate-400 hover:text-red-400 transition-colors flex-shrink-0 p-1 rounded-full hover:bg-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload Error */}
      {uploadError && (
        <p className="text-red-400 text-xs mb-2 px-1">{uploadError}</p>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
      />

      <div className="flex items-center gap-2 max-w-6xl mx-auto">
        {/* Emoji Button */}
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

        {/* Paperclip / Attach Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="p-2 rounded-full transition-colors text-slate-400 hover:text-emerald-400 hover:bg-slate-800/60 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Attach file"
        >
          <Paperclip className="w-6 h-6" />
        </button>

        {/* Text Input */}
        <textarea
          rows={1}
          value={content}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder={pendingFile ? 'Add a caption (optional)…' : 'Type a message…'}
          disabled={uploading}
          className="flex-1 bg-slate-800 text-slate-100 placeholder-slate-400 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none max-h-32 transition-all disabled:opacity-60"
        />

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className={`p-2.5 rounded-full transition-all duration-200 ${
            canSend
              ? uploading
                ? 'bg-emerald-700 text-slate-300 cursor-wait'
                : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-lg shadow-emerald-500/20 active:scale-95'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
          title="Send message"
        >
          {uploading ? (
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
