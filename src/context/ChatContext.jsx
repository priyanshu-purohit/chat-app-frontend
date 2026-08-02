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
          console.log("conv", conv);
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
      const currentActive = activeChatRef.current;

      const isForActiveChat = currentActive && (
        (currentActive.type === 'direct' &&
          (senderId === currentActive.participant._id)) ||
        (currentActive.type === 'group' &&
          senderId === currentActive.group._id)
      );

      if (isForActiveChat) {
        setTypingUsers((prev) => {
          if (prev.includes(senderId)) return prev;
          return [...prev, senderId];
        });
      }
    };

    const handleTypingStop = ({ senderId }) => {
      const currentActive = activeChatRef.current;

      const isForActiveChat = currentActive && (
        (currentActive.type === 'direct' &&
          (senderId === currentActive.participant._id)) ||
        (currentActive.type === 'group' &&
          senderId === currentActive.group._id)
      );

      if (isForActiveChat) {
        console.log(isForActiveChat);
        setTypingUsers((prev) => prev.filter((id) => id !== senderId));
      }
    };

    const handleMessageEdited = (message) => {
      const currentActive = activeChatRef.current;

      const isForActiveChat = currentActive && (
        (currentActive.type === 'direct' &&
          (message.sender === currentActive.participant._id || message.receiver === currentActive.participant._id)) ||
        (currentActive.type === 'group' &&
          message.group === currentActive.group._id)
      );

      // Update active chat feed
      if (isForActiveChat) {
        setMessages((prev) =>
          prev?.map((msg) => (msg._id === message._id ? message : msg))
        );
      }

      // Update last message in sidebar
      setConversations((prev) => {
        return prev?.map((conv) => {
          const isMatch = (conv.type === 'direct' && (message.sender === conv.participant._id || message.receiver === conv.participant._id))
            || (conv.type === 'group' && message.group === conv.group._id);

          if (isMatch) {
            return {
              ...conv,
              lastMessage: message,
            };
          }
          return conv;
        });
      });
    };

    const handleMessageDeleted = ({ messageId }) => {
      // Remove from active chat feed
      setMessages((prev) => prev?.filter((msg) => msg._id !== messageId));

      // Update last message preview in sidebar
      setConversations((prev) => {
        return prev?.map((conv) => {
          if (conv.lastMessage?._id === messageId) {
            return {
              ...conv,
              lastMessage: null, // Clear preview since it was deleted
            };
          }
          return conv;
        });
      });
    };

    const handleMessageReaction = ({ messageId, reactions }) => {
      // Update reaction list in active chat feed
      console.log("inside handle message", messageId, reactions);
      setMessages((prev) =>
        prev?.map((msg) => (msg._id === messageId ? { ...msg, reactions } : msg))
      );

      // Update reaction list for preview in sidebar
      setConversations((prev) => {
        return prev?.map((conv) => {
          if (conv.lastMessage?._id === messageId) {
            return {
              ...conv,
              lastMessage: { ...conv.lastMessage, reactions },
            };
          }
          return conv;
        });
      });
    };


    socket.on('new_message', handleNewMessage);
    socket.on('message_read', handleMessageRead);
    socket.on('typing_started', handleTypingStarted);
    socket.on('typing_stop', handleTypingStop);
    socket.on('message_edited', handleMessageEdited);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('message_reaction', handleMessageReaction);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_read', handleMessageRead);
      socket.off('typing_started', handleTypingStarted);
      socket.off('typing_stop', handleTypingStop);
      socket.off('message_edited', handleMessageEdited);
      socket.off('message_deleted', handleMessageDeleted);
      socket.off('message_reaction', handleMessageReaction);
    }

  }, [isConnected, socket, user]);

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
      console.log("typing started");
      socket.emit("typing_started", { receiverId });
    }

    clearTimeout(timeoutTimerRef.current);

    timeoutTimerRef.current = setTimeout(() => {
      console.log("typing stopped");
      socketService.emit("typing_stop", { receiverId });
      isCurrentUserTypingRef.current = false;
    }, 2000);
  };

  const editMessage = async (messageId, newContent) => {
    try {
      const response = await api.patch(`/messages/${messageId}`, { content: newContent });
      const updatedMsg = response.data; // Backend returns the updated message object

      // 1. Update message inside the active messages feed
      setMessages((prev) =>
        prev?.map((msg) => (msg._id === messageId ? updatedMsg : msg))
      );

      // 2. Update sidebar preview if this was the last message
      setConversations((prev) => {
        return prev.map((conv) => {
          if (conv.lastMessage?._id === messageId) {
            return { ...conv, lastMessage: updatedMsg };
          }
          return conv;
        });
      });
    } catch (error) {
      console.error('Failed to edit message:', error);
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      await api.delete(`/messages/${messageId}`);

      // 1. Remove message from active feed
      setMessages((prev) => prev?.filter((msg) => msg._id !== messageId));

      // 2. Remove last message preview from sidebar if needed
      setConversations((prev) => {
        return prev.map((conv) => {
          console.log("messageId", messageId);
          console.log("lastMessage", conv.lastMessage._id);
          if (conv.lastMessage?._id === messageId) {
            console.log("Conversation", conv);
            return { ...conv, lastMessage: null };
          }
          return conv;
        })
      });
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const reactToMessage = async (messageId, emoji) => {
    try {
      const response = await api.post(`/messages/${messageId}/react`, { emoji });
      const reactions = response.data.reactions;

      // 1. Update reaction list locally in the message feed
      setMessages((prev) =>
        prev?.map((msg) => (msg._id === messageId ? { ...msg, reactions } : msg))
      );

      // 2. Sync reactions with sidebar preview if this was the last message
      setConversations((prev) => {
        return prev.map((conv) => {
          if (conv.lastMessage?._id === messageId) {
            return {
              ...conv,
              lastMessage: { ...conv.lastMessage, reactions },
            };
          }
          return conv;
        });
      });
    } catch (error) {
      console.error('Failed to toggle reaction:', error);
    }
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
    handleTyping,
    editMessage,
    deleteMessage,
    reactToMessage,
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
