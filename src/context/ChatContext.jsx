import { createContext, useContext, useEffect, useRef, useState } from 'react';
import api from '../services/api';
import { useSocket } from './SocketContext';
import socketService from '../services/socket';
import { useAuth } from './AuthContext';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {

  const { user } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [messages, setMessages] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);

  const { socket, isConnected } = useSocket();

  const isCurrentUserTypingRef = useRef(false);
  const timeoutTimerRef = useRef(null);

  // Use a ref to store activeChat so the WebSocket listener always reads the fresh value
  const activeChatRef = useRef(activeChat);
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {

    const handleNewMessage = (incomingMsg) => {

      const currentActive = activeChatRef.current;

      // Determine if the incoming message belongs to our currently open chat
      const isForActiveChat = currentActive && (
        (currentActive.type === 'direct' &&
          (incomingMsg.sender === currentActive.participant._id || incomingMsg.receiver === currentActive.participant._id)) ||
        (currentActive.type === 'group' &&
          incomingMsg.group === currentActive.group._id)
      );

      if (isForActiveChat) {
        setMessages((prev) => [...(prev || []), incomingMsg]);
      }

      setConversations((prev) => {
        return prev.map((conv) => {
          const isMatch = conv.type === 'direct'
            ? (incomingMsg.sender === conv.participant._id || incomingMsg.receiver === conv.participant._id)
            : (incomingMsg.group === conv.group._id)


          if (isMatch) {
            return {
              ...conv,
              lastMessage: incomingMsg,
              unreadCount: isForActiveChat ? conv.unreadCount : (conv.unreadCount || 0) + 1,
            };
          }
          return conv;
        })
      })
    };

    const handleMessageRead = ({ readerId }) => {
      const currentActive = activeChatRef.current;
      console.log(activeChatRef.current);
      const activeId = currentActive?.id;

      if (activeId === readerId) {
        setMessages((prev) => {
          return prev?.map((msg) => {
            // Mark our sent messages as Read
            if (msg.sender === user?._id && msg.status !== 'Read') {
              return { ...msg, status: 'Read' };
            }
            return msg;
          })
        })
      }
    };

    const handleTypingStarted = ({ senderId }) => {
      setTypingUsers((prev) => {
        if (prev.includes(senderId)) return prev;
        return [...prev, senderId];
      });
    };

    const handleTypingStop = ({ senderId }) => {
      setTypingUsers((prev) => prev.filter((id) => id !== senderId));
    };


    socket.on('new_message', handleNewMessage);
    socket.on('message_read', handleMessageRead);
    socket.on('typing_started', handleTypingStarted);
    socket.on('typing_stop', handleTypingStop);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_read', handleMessageRead);
      socket.off('typing_started', handleTypingStarted);
      socket.off('typing_stop', handleTypingStop);
    }

  }, [isConnected, socket]);

  const fetchConversations = async () => {
    setLoadingConversations(true);

    try {
      const response = await api.get('/messages/conversations');
      setConversations(response.data.conversations || []);
    }
    catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
    finally {
      setLoadingConversations(false);
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      setLoadingMessages(true);
      const response = await api.get(`/messages/${chatId}`);
      setMessages(response.data.messages || []);
    }
    catch (error) {
      console.error('Failed to fetch messages:', error);
    }
    finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async (content) => {
    if (!activeChat) return;

    try {
      // Post the message to the backend
      const chatId = activeChat.id;
      console.log("chatId", chatId);

      const response = await api.post(`/messages/send/${chatId}`, { content });

      const newMessage = response.data.data;

      // 1. Append the new message to the active messages list
      setMessages((prev) => [...(prev || []), newMessage]);

      // 2. Update the conversations sidebar item to show the new lastMessage
      setConversations((prev) => {
        return prev.map((conv) => {
          if (conv._id === chatId || conv.id === chatId) {
            return {
              ...conv,
              lastMessage: newMessage,
            };
          }
          return conv;
        });
      });

      socketService.emit('send_message', {
        message: newMessage,
        conversationId: chatId,
      });
    }
    catch (error) {
      console.error("Failed to send message", error);
    }
  }

  const markAsRead = async () => {
    if (!activeChat) return;
    const chatId = activeChat.id;
    try {
      const response = await api.patch(`/messages/read/${chatId}`);
      console.log(response);

      // Update our local messages (mark incoming messages from them as Read)
      setMessages((prev) => {
        return prev?.map((msg) => {
          if (msg.sender === chatId && msg.status != 'Read') {
            return { ...msg, status: 'Read' }
          }
          return msg;
        })
      });

      //Reset the unread count in the sidebar conversations list
      setConversations((prev) => {
        return prev?.map((conv) => {
          if (conv.id === chatId) {
            return { ...conv, unreadCount: 0 };
          }
          return conv;
        })
      })
    }
    catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  const handleTyping = () => {
    const currentActive = activeChatRef.current;
    if (!currentActive || !socket) return;

    const receiverId = currentActive.id;

    if (!isCurrentUserTypingRef.current) {
      isCurrentUserTypingRef.current = true;
      socket.emit("typing_started", { receiverId });
    }

    clearTimeout(timeoutTimerRef.current);

    timeoutTimerRef.current = setTimeout(() => {
      console.log("typing stopped");
      socketService.emit("typing_stop", { receiverId });
      isCurrentUserTypingRef.current = false;
    }, 2000);
  };


  const value = {
    conversations,
    activeChat,
    setActiveChat,
    loadingConversations,
    fetchConversations,
    setConversations,
    setMessages,
    messages,
    loadingMessages,
    fetchMessages,
    sendMessage,
    markAsRead,
    typingUsers,
    handleTyping
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
