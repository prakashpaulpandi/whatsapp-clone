import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import api from '../services/api';
import Avatar from '../components/Avatar';
import ChatListItem from '../components/ChatListItem';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import NewChatModal from '../components/NewChatModal';
import NewGroupModal from '../components/NewGroupModal';
import GroupInfoModal from '../components/GroupInfoModal';
import ProfileModal from '../components/ProfileModal';
import {
  MessageSquare,
  Users,
  Search,
  MoreVertical,
  LogOut,
  User,
  Info,
  ChevronLeft,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

export const ChatApp = () => {
  const { user, logout } = useAuth();
  const {
    connected,
    onlineUsers,
    typingUsers,
    subscribeToConversation,
    sendTyping,
    addMessageListener,
    addReadListener,
  } = useWebSocket();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Modals state
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Mobile sidebar toggle
  const [showSidebarMobile, setShowSidebarMobile] = useState(true);

  // Load user's conversations
  const loadConversations = useCallback(async () => {
    try {
      const res = await api.get('/conversations/my');
      setConversations(res.data);
      // Auto-subscribe to all active conversations
      res.data.forEach((c) => subscribeToConversation(c.id));
    } catch (err) {
      console.error('Failed to load conversations', err);
    } finally {
      setLoadingConversations(false);
    }
  }, [subscribeToConversation]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load messages when active conversation changes
  const loadMessages = useCallback(async (convId) => {
    if (!convId) return;
    setLoadingMessages(true);
    try {
      const res = await api.get(`/messages/${convId}`);
      setMessages(res.data);
      // Mark messages as read
      await api.post(`/messages/${convId}/read`);
      // Update unread count locally
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
      );
    } catch (err) {
      console.error('Failed to load messages', err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const handleSelectConversation = (conv) => {
    setActiveConversation(conv);
    setShowSidebarMobile(false);
    subscribeToConversation(conv.id);
    loadMessages(conv.id);
  };

  // Real-time message listener
  useEffect(() => {
    const unsubscribe = addMessageListener((newMsg) => {
      // 1. Update message feed if viewing this conversation
      if (activeConversation && newMsg.conversationId === activeConversation.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        // Mark as read immediately if chat is open
        if (newMsg.sender?.id !== user?.id) {
          api.post(`/messages/${activeConversation.id}/read`);
        }
      }

      // 2. Update conversation list last message preview & unread count
      setConversations((prev) => {
        let found = false;
        const updated = prev.map((c) => {
          if (c.id === newMsg.conversationId) {
            found = true;
            const isCurrentChat = activeConversation?.id === c.id;
            const isFromOther = newMsg.sender?.id !== user?.id;
            return {
              ...c,
              lastMessage: newMsg,
              updatedAt: newMsg.timestamp,
              unreadCount: isCurrentChat || !isFromOther ? c.unreadCount : (c.unreadCount || 0) + 1,
            };
          }
          return c;
        });

        if (!found) {
          // New conversation arrived
          loadConversations();
          return prev;
        }

        // Re-sort conversations by latest activity
        return updated.sort((a, b) => {
          const tA = a.lastMessage?.timestamp || a.updatedAt;
          const tB = b.lastMessage?.timestamp || b.updatedAt;
          return new Date(tB) - new Date(tA);
        });
      });
    });

    return unsubscribe;
  }, [activeConversation, user?.id, addMessageListener, loadConversations]);

  // Real-time read receipt listener
  useEffect(() => {
    const unsubscribe = addReadListener((receipt) => {
      if (activeConversation && receipt.conversationId === activeConversation.id) {
        setMessages((prev) =>
          prev.map((m) => (m.sender?.id === user?.id ? { ...m, read: true } : m))
        );
      }
    });
    return unsubscribe;
  }, [activeConversation, user?.id, addReadListener]);

  const handleSendMessage = async (content) => {
    if (!activeConversation) return;

    try {
      await api.post('/messages/send', {
        conversationId: activeConversation.id,
        content,
        messageType: 'TEXT',
      });
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  const handleTyping = (isTyping) => {
    if (activeConversation) {
      sendTyping(activeConversation.id, isTyping);
    }
  };

  const handleStartDirectChat = async (selectedUser) => {
    try {
      const res = await api.post('/conversations/direct', {
        otherUserId: selectedUser.id,
      });
      const conv = res.data;
      setConversations((prev) => {
        const exists = prev.find((c) => c.id === conv.id);
        if (exists) return prev;
        return [conv, ...prev];
      });
      handleSelectConversation(conv);
    } catch (err) {
      console.error('Failed to create direct chat', err);
    }
  };

  const handleLeaveGroup = async (conversationId) => {
    try {
      await api.post(`/conversations/${conversationId}/leave`);
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      if (activeConversation?.id === conversationId) {
        setActiveConversation(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to leave group', err);
    }
  };

  // Filter conversations by search
  const filteredConversations = conversations.filter((c) => {
    const name = c.type === 'group' ? c.name : c.otherUser?.name || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Calculate active presence status subtitle
  const getPresenceSubtitle = () => {
    if (!activeConversation) return '';
    if (activeConversation.type === 'group') {
      const count = activeConversation.participants?.length || 0;
      return `${count} members`;
    }

    const otherUser = activeConversation.otherUser;
    if (!otherUser) return '';

    const isOnline = onlineUsers.has(otherUser.id) || otherUser.online;
    if (isOnline) return 'Online';

    if (otherUser.lastSeen) {
      const date = new Date(otherUser.lastSeen);
      if (!isNaN(date)) {
        if (isToday(date)) return `Last seen today at ${format(date, 'h:mm a')}`;
        if (isYesterday(date)) return `Last seen yesterday at ${format(date, 'h:mm a')}`;
        return `Last seen ${format(date, 'MM/dd/yy')}`;
      }
    }
    return 'Offline';
  };

  const activeTypingMap = activeConversation ? typingUsers[activeConversation.id] || {} : {};
  const activeTypingList = Object.values(activeTypingMap);

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 flex select-none">
      {/* 1. Left Sidebar */}
      <div
        className={`w-full md:w-96 lg:w-[420px] h-full bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 transition-transform duration-200 z-20 ${
          showSidebarMobile ? 'flex' : 'hidden md:flex'
        }`}
      >
        {/* Sidebar Header */}
        <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
          <div
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-3 cursor-pointer hover:opacity-85 transition group"
            title="View profile"
          >
            <Avatar
              name={user?.name}
              avatarUrl={user?.avatarUrl}
              isOnline={connected}
              size="md"
            />
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-100 truncate group-hover:text-emerald-400 transition">
                {user?.name}
              </h2>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                {connected ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Wifi className="w-3 h-3" /> Connected
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1">
                    <WifiOff className="w-3 h-3" /> Connecting...
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowNewChatModal(true)}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700/60 transition"
              title="New Chat"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowNewGroupModal(true)}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700/60 transition"
              title="New Group"
            >
              <Users className="w-5 h-5" />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowDropdown((prev) => !prev)}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700/60 transition"
                title="Menu"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1 z-50 animate-fade-in">
                  <button
                    onClick={() => {
                      setShowProfileModal(true);
                      setShowDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-medium text-slate-200 hover:bg-slate-700/70 flex items-center gap-2"
                  >
                    <User className="w-4 h-4 text-emerald-400" /> My Profile
                  </button>
                  <button
                    onClick={() => {
                      setShowNewGroupModal(true);
                      setShowDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-medium text-slate-200 hover:bg-slate-700/70 flex items-center gap-2"
                  >
                    <Users className="w-4 h-4 text-emerald-400" /> New Group
                  </button>
                  <div className="h-px bg-slate-700 my-1" />
                  <button
                    onClick={logout}
                    className="w-full px-4 py-2 text-left text-xs font-medium text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-slate-800 bg-slate-900">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search or start new chat"
              className="w-full bg-slate-800 text-slate-100 placeholder-slate-400 text-xs pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 border border-slate-700/40"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {loadingConversations ? (
            <div className="py-12 text-center text-xs text-slate-500">Loading chats...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="py-12 px-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-800/80 text-slate-500 flex items-center justify-center mx-auto">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-300">No conversations yet</p>
              <p className="text-xs text-slate-500">
                Click the message icon above or find contacts to start chatting.
              </p>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="mt-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-xl transition"
              >
                Start New Chat
              </button>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isOtherOnline =
                conv.type === 'direct' &&
                conv.otherUser &&
                (onlineUsers.has(conv.otherUser.id) || conv.otherUser.online);

              const typingMap = typingUsers[conv.id] || {};
              const typingNames = Object.values(typingMap);
              const typingText = typingNames.length > 0 ? `${typingNames.join(', ')} typing...` : null;

              return (
                <ChatListItem
                  key={conv.id}
                  conversation={conv}
                  active={activeConversation?.id === conv.id}
                  currentUserId={user?.id}
                  isOnline={isOtherOnline}
                  typingText={typingText}
                  onClick={() => handleSelectConversation(conv)}
                />
              );
            })
          )}
        </div>
      </div>

      {/* 2. Right Main Chat Panel */}
      <div
        className={`flex-1 h-full flex flex-col bg-[#0b141a] transition-all ${
          showSidebarMobile ? 'hidden md:flex' : 'flex'
        }`}
      >
        {activeConversation ? (
          <>
            {/* Active Chat Header */}
            <div className="px-4 py-3 bg-slate-800/90 border-b border-slate-700/60 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setShowSidebarMobile(true)}
                  className="md:hidden p-1.5 -ml-1 text-slate-400 hover:text-slate-100 rounded-lg"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <Avatar
                  name={
                    activeConversation.type === 'group'
                      ? activeConversation.name
                      : activeConversation.otherUser?.name
                  }
                  avatarUrl={
                    activeConversation.type === 'group'
                      ? activeConversation.avatarUrl
                      : activeConversation.otherUser?.avatarUrl
                  }
                  isGroup={activeConversation.type === 'group'}
                  isOnline={
                    activeConversation.type === 'direct' &&
                    activeConversation.otherUser &&
                    (onlineUsers.has(activeConversation.otherUser.id) ||
                      activeConversation.otherUser.online)
                  }
                  size="md"
                />

                <div className="min-w-0 cursor-pointer" onClick={() => activeConversation.type === 'group' && setShowGroupInfoModal(true)}>
                  <h3 className="text-sm font-bold text-slate-100 truncate flex items-center gap-1.5">
                    {activeConversation.type === 'group'
                      ? activeConversation.name
                      : activeConversation.otherUser?.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 truncate">
                    {activeTypingList.length > 0 ? (
                      <span className="text-emerald-400 font-medium animate-pulse">
                        {activeTypingList.join(', ')} typing...
                      </span>
                    ) : (
                      getPresenceSubtitle()
                    )}
                  </p>
                </div>
              </div>

              {/* Chat Actions */}
              <div className="flex items-center gap-1">
                {activeConversation.type === 'group' && (
                  <button
                    onClick={() => setShowGroupInfoModal(true)}
                    className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700/60 transition"
                    title="Group Details"
                  >
                    <Info className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Message Feed */}
            {loadingMessages ? (
              <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
                Loading messages...
              </div>
            ) : (
              <MessageList
                messages={messages}
                currentUserId={user?.id}
                isGroup={activeConversation.type === 'group'}
                typingUsersList={activeTypingList}
              />
            )}

            {/* Message Input */}
            <MessageInput onSendMessage={handleSendMessage} onTyping={handleTyping} />
          </>
        ) : (
          /* Empty Placeholder (WhatsApp Web style) */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0b141a]">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/5">
              <MessageSquare className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-slate-100 mb-2">ChatSphere for Web</h2>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              Send and receive messages in real time. Choose a contact from the sidebar or start a new conversation to connect.
            </p>
            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setShowNewChatModal(true)}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition"
              >
                Start Direct Chat
              </button>
              <button
                onClick={() => setShowNewGroupModal(true)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl border border-slate-700 transition"
              >
                Create Group
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onSelectUser={handleStartDirectChat}
      />
      <NewGroupModal
        isOpen={showNewGroupModal}
        onClose={() => setShowNewGroupModal(false)}
        onGroupCreated={(newConv) => {
          setConversations((prev) => [newConv, ...prev]);
          handleSelectConversation(newConv);
        }}
      />
      <GroupInfoModal
        isOpen={showGroupInfoModal}
        onClose={() => setShowGroupInfoModal(false)}
        conversation={activeConversation}
        currentUserId={user?.id}
        onLeaveGroup={handleLeaveGroup}
      />
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  );
};
export default ChatApp;
