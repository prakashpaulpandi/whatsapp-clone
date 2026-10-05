import React, { useEffect, useRef, useState } from 'react';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import {
  Check,
  CheckCheck,
  FileText,
  Download,
  ExternalLink,
  X,
  File,
  Film,
  Music,
  Maximize2
} from 'lucide-react';

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

const formatBytes = (bytes) => {
  const num = Number(bytes);
  if (!num || isNaN(num)) return '';
  if (num < 1024) return num + ' B';
  if (num < 1024 * 1024) return (num / 1024).toFixed(1) + ' KB';
  return (num / (1024 * 1024)).toFixed(1) + ' MB';
};

// Parse message content to detect images, documents, audio, video, or plain text
const parseMessage = (msg) => {
  if (!msg || !msg.content) return { type: 'TEXT', text: '' };

  if (msg.messageType === 'SYSTEM') {
    return { type: 'SYSTEM', text: msg.content };
  }

  const raw = msg.content;
  const lines = raw.split('\n');
  const firstLine = lines[0].trim();
  const caption = lines.slice(1).join('\n').trim();

  let fileUrl = firstLine;
  let fileName = '';
  let fileSize = '';

  if (firstLine.includes('|')) {
    const parts = firstLine.split('|');
    fileUrl = parts[0].trim();
    fileName = parts[1]?.trim() || '';
    fileSize = parts[2]?.trim() || '';
  }

  const isUrl =
    fileUrl.startsWith('/api/files/') ||
    fileUrl.startsWith('http://') ||
    fileUrl.startsWith('https://');

  const lowerUrl = fileUrl.toLowerCase();
  const isImageExt = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg'].some((ext) =>
    lowerUrl.endsWith(ext)
  );
  const isVideoExt = ['.mp4', '.webm', '.mov', '.avi'].some((ext) => lowerUrl.endsWith(ext));
  const isAudioExt = ['.mp3', '.wav', '.ogg', '.m4a'].some((ext) => lowerUrl.endsWith(ext));
  const isPdfExt = lowerUrl.endsWith('.pdf');

  // 1. Image
  if (msg.messageType === 'IMAGE' || (isUrl && isImageExt)) {
    return {
      type: 'IMAGE',
      url: fileUrl,
      fileName: fileName || fileUrl.split('/').pop(),
      caption,
    };
  }

  // 2. Video
  if (isVideoExt) {
    return {
      type: 'VIDEO',
      url: fileUrl,
      fileName: fileName || fileUrl.split('/').pop(),
      caption,
    };
  }

  // 3. Audio
  if (isAudioExt) {
    return {
      type: 'AUDIO',
      url: fileUrl,
      fileName: fileName || fileUrl.split('/').pop(),
      caption,
    };
  }

  // 4. File / Document
  if (msg.messageType === 'FILE' || (isUrl && (isPdfExt || fileUrl.startsWith('/api/files/')))) {
    let cleanName = fileName;
    if (!cleanName) {
      const rawName = fileUrl.split('/').pop();
      if (isPdfExt) cleanName = 'Document.pdf';
      else cleanName = rawName || 'Document';
    }

    let ext = '';
    const lastDot = cleanName.lastIndexOf('.');
    if (lastDot > 0) ext = cleanName.substring(lastDot + 1).toUpperCase();
    if (!ext && isPdfExt) ext = 'PDF';

    return {
      type: 'FILE',
      url: fileUrl,
      fileName: cleanName,
      fileSize: fileSize ? formatBytes(fileSize) : isPdfExt ? 'PDF Document' : 'Document',
      ext: ext || 'FILE',
      isPdf: isPdfExt || ext === 'PDF',
      caption,
    };
  }

  // 5. Normal Text
  return {
    type: 'TEXT',
    text: raw,
  };
};

export const MessageList = ({ messages, currentUserId, isGroup, typingUsersList }) => {
  const scrollRef = useRef(null);
  const [lightboxImage, setLightboxImage] = useState(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsersList]);

  // Handle ESC key to close lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setLightboxImage(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

        const parsed = parseMessage(msg);

        // System message
        if (parsed.type === 'SYSTEM') {
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
                  {parsed.text}
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
                className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-2.5 shadow-md relative transition-all duration-150 ${
                  isMine ? 'chat-bubble-sent' : 'chat-bubble-received'
                }`}
              >
                {/* Sender Name in Group */}
                {isGroup && !isMine && msg.sender && (
                  <p className="text-[11px] font-bold text-emerald-400 mb-1 px-1 leading-tight">
                    {msg.sender.name}
                  </p>
                )}

                {/* 1. IMAGE BUBBLE */}
                {parsed.type === 'IMAGE' && (
                  <div className="space-y-1.5">
                    <div
                      onClick={() => setLightboxImage(parsed)}
                      className="relative group cursor-pointer overflow-hidden rounded-xl border border-slate-700/40 bg-slate-950/40"
                    >
                      <img
                        src={parsed.url}
                        alt={parsed.fileName || 'Shared photo'}
                        className="max-h-80 w-full object-cover transition-transform duration-200 group-hover:scale-[1.01]"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <span className="p-2 rounded-full bg-slate-900/80 text-white shadow-lg">
                          <Maximize2 className="w-5 h-5" />
                        </span>
                      </div>
                    </div>
                    {parsed.caption && (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words px-1 pt-1 text-slate-100">
                        {parsed.caption}
                      </p>
                    )}
                  </div>
                )}

                {/* 2. VIDEO BUBBLE */}
                {parsed.type === 'VIDEO' && (
                  <div className="space-y-1.5">
                    <video
                      controls
                      src={parsed.url}
                      className="max-h-80 w-full rounded-xl border border-slate-700/50 bg-black"
                    />
                    {parsed.caption && (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words px-1 pt-1 text-slate-100">
                        {parsed.caption}
                      </p>
                    )}
                  </div>
                )}

                {/* 3. AUDIO BUBBLE */}
                {parsed.type === 'AUDIO' && (
                  <div className="space-y-1.5">
                    <audio controls src={parsed.url} className="w-full max-w-xs" />
                    {parsed.caption && (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words px-1 pt-1 text-slate-100">
                        {parsed.caption}
                      </p>
                    )}
                  </div>
                )}

                {/* 4. FILE / DOCUMENT BUBBLE */}
                {parsed.type === 'FILE' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-700/60 hover:bg-slate-950/60 transition-colors">
                      {/* Document Icon / Badge */}
                      <div
                        className={`w-11 h-11 rounded-lg flex flex-col items-center justify-center shrink-0 border font-bold text-[9px] ${
                          parsed.isPdf
                            ? 'bg-red-500/15 border-red-500/30 text-red-400'
                            : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                        }`}
                      >
                        <FileText className="w-5 h-5 mb-0.5" />
                        <span>{parsed.ext.substring(0, 4)}</span>
                      </div>

                      {/* File Details */}
                      <div className="flex-1 min-w-0 pr-1">
                        <p className="text-sm font-semibold text-slate-100 truncate" title={parsed.fileName}>
                          {parsed.fileName}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <span>{parsed.fileSize}</span>
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={parsed.url}
                          download={parsed.fileName}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-lg bg-slate-800/80 hover:bg-emerald-500 hover:text-slate-950 text-slate-300 transition-colors"
                          title="Download file"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </div>

                    {parsed.caption && (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words px-1 pt-1 text-slate-100">
                        {parsed.caption}
                      </p>
                    )}
                  </div>
                )}

                {/* 5. PLAIN TEXT BUBBLE */}
                {parsed.type === 'TEXT' && (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words px-1">
                    {parsed.text}
                  </p>
                )}

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

      {/* LIGHTBOX MODAL FOR FULL-SCREEN IMAGE VIEWING */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-between p-4 animate-fade-in"
        >
          {/* Top Bar */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-5xl flex items-center justify-between py-2 text-slate-200"
          >
            <div className="flex items-center gap-2 min-w-0">
              <p className="text-sm font-medium truncate max-w-md">
                {lightboxImage.fileName || 'Photo'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href={lightboxImage.url}
                download={lightboxImage.fileName || 'image.png'}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-full bg-slate-800/80 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 transition"
                title="Download Image"
              >
                <Download className="w-5 h-5" />
              </a>
              <button
                onClick={() => setLightboxImage(null)}
                className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Centered Image */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex-1 flex items-center justify-center max-w-5xl max-h-[80vh] w-full p-2"
          >
            <img
              src={lightboxImage.url}
              alt={lightboxImage.fileName || 'Full photo preview'}
              className="max-h-full max-w-full object-contain rounded-xl shadow-2xl border border-slate-800"
            />
          </div>

          {/* Bottom Caption if any */}
          {lightboxImage.caption && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="max-w-xl text-center text-sm text-slate-200 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-700 mt-2"
            >
              {lightboxImage.caption}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageList;
