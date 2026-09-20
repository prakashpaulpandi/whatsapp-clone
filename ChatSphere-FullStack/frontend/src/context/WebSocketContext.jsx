import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState({}); // { [convId]: { [userId]: userName } }
  const stompClientRef = useRef(null);
  const activeSubscriptionsRef = useRef({});
  const messageListenersRef = useRef(new Set());
  const readListenersRef = useRef(new Set());

  const getWsUrl = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl && apiUrl.startsWith('http')) {
      const base = apiUrl.replace('/api', '');
      return `${base}/ws`;
    }
    return '/ws';
  };

  useEffect(() => {
    if (!token || !user) {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
      }
      setConnected(false);
      return;
    }

    const wsUrl = getWsUrl();
    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => {
        // console.log('[STOMP Debug]:', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        // console.log('WebSocket STOMP Connected');
        setConnected(true);

        // Subscribe to global presence channel
        client.subscribe('/topic/presence', (message) => {
          try {
            const data = JSON.parse(message.body);
            setOnlineUsers((prev) => {
              const updated = new Set(prev);
              if (data.online) {
                updated.add(data.userId);
              } else {
                updated.delete(data.userId);
              }
              return updated;
            });
          } catch (e) {
            console.error('Error parsing presence update', e);
          }
        });
      },
      onDisconnect: () => {
        setConnected(false);
      },
      onStompError: (frame) => {
        console.error('STOMP Broker error: ' + frame.headers['message']);
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      if (client) {
        client.deactivate();
      }
    };
  }, [token, user?.id]);

  // Subscribe to a specific conversation's real-time events
  const subscribeToConversation = useCallback((conversationId) => {
    const client = stompClientRef.current;
    if (!client || !connected || !conversationId) return;

    const subKey = `conv_${conversationId}`;
    if (activeSubscriptionsRef.current[subKey]) return; // Already subscribed

    // 1. Messages topic
    const msgSub = client.subscribe(`/topic/conversations/${conversationId}`, (message) => {
      try {
        const data = JSON.parse(message.body);
        messageListenersRef.current.forEach((listener) => listener(data));
      } catch (e) {
        console.error('Error parsing incoming message', e);
      }
    });

    // 2. Typing topic
    const typingSub = client.subscribe(`/topic/conversations/${conversationId}/typing`, (message) => {
      try {
        const data = JSON.parse(message.body);
        if (data.userId === user?.id) return; // Ignore self typing

        setTypingUsers((prev) => {
          const convTyping = { ...(prev[conversationId] || {}) };
          if (data.isTyping) {
            convTyping[data.userId] = data.userName;
          } else {
            delete convTyping[data.userId];
          }
          return { ...prev, [conversationId]: convTyping };
        });
      } catch (e) {
        console.error('Error parsing typing event', e);
      }
    });

    // 3. Read receipt topic
    const readSub = client.subscribe(`/topic/conversations/${conversationId}/read`, (message) => {
      try {
        const data = JSON.parse(message.body);
        readListenersRef.current.forEach((listener) => listener(data));
      } catch (e) {
        console.error('Error parsing read receipt event', e);
      }
    });

    activeSubscriptionsRef.current[subKey] = [msgSub, typingSub, readSub];
  }, [connected, user?.id]);

  // Send typing status
  const sendTyping = useCallback((conversationId, isTyping) => {
    const client = stompClientRef.current;
    if (!client || !connected || !user) return;

    client.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify({
        conversationId,
        userId: user.id,
        userName: user.name,
        isTyping,
      }),
    });
  }, [connected, user]);

  const addMessageListener = useCallback((fn) => {
    messageListenersRef.current.add(fn);
    return () => messageListenersRef.current.delete(fn);
  }, []);

  const addReadListener = useCallback((fn) => {
    readListenersRef.current.add(fn);
    return () => readListenersRef.current.delete(fn);
  }, []);

  return (
    <WebSocketContext.Provider
      value={{
        connected,
        onlineUsers,
        typingUsers,
        subscribeToConversation,
        sendTyping,
        addMessageListener,
        addReadListener,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
