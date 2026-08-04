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



  const isForActiveChat = (message) => {
    const currentActive = activeChatRef.current;

    if (!currentActive) return false;

    return (currentActive.type === 'direct' && ((message?.sender === currentActive.participant._id) || (message?.receiver === currentActive.participant._id))) ||
      (currentActive.type === 'group' && (message?.group === currentActive.group._id));
  };
  const isForConversation = (conversation, message) => {
    if (conversation.type === "direct") {
      return (
        message.sender === conversation.participant._id ||
        message.receiver === conversation.participant._id
      );
    }

    return message.group === conversation.group._id;
  };

  // Use a ref to store activeChat so the WebSocket listener always reads the fresh value
  const activeChatRef = useRef(activeChat);
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {

    const handleNewMessage = (incomingMsg) => {
      const active = isForActiveChat(incomingMsg);

      if (active) {
        setMessages((prev) => [...(prev || []), incomingMsg]);
      }

      setConversations(prev =>
        prev.map(conv => {
          if (!isForConversation(conv, incomingMsg))
            return conv;

          return {
            ...conv,
            lastMessage: incomingMsg,
            unreadCount: active
              ? conv.unreadCount
              : (conv.unreadCount || 0) + 1,
          };
        })
      );
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
      const message = {
        sender: senderId,
      }

      if (isForActiveChat(message)) {
        setTypingUsers((prev) => {
          if (prev.includes(senderId)) return prev;
          return [...prev, senderId];
        });
      }
    };

    const handleTypingStop = ({ senderId }) => {
      const message = {
        sender: senderId,
      };

      if (isForActiveChat(message)) {
        setTypingUsers((prev) => prev.filter((id) => id !== senderId));
      }
    };

    // Socket listener: when a message is edited by the other user
    const handleMessageEdited = (updatedMsg) => {
      if (isForActiveChat(updatedMsg)) {
        setMessages((prev) =>
          prev?.map((msg) => (msg._id === updatedMsg._id ? updatedMsg : msg))
        );
      }

      setConversations((prev) => prev?.map((conv) => {
        if (
          conv.lastMessage?._id !== updatedMsg._id ||
          !isForConversation(conv, updatedMsg)
        ) {
          return conv;
        }

        return {
          ...conv,
          lastMessage: updatedMsg,
        };
      }));
    };

    // Socket listener: when a message is deleted by the other user
    const handleMessageDeleted = ({messageId, sender, receiver, group}) => {
      const message = {
        sender: sender,
        receiver: receiver,
        group: group,
      }

      if (isForActiveChat(message)) {
        setMessages((prev) => prev?.filter((msg) => msg._id !== messageId));
      }


      setConversations((prev) => prev?.map((conv) => {
        const isMatch =
          conv.lastMessage?._id === messageId &&
          isForConversation(conv, message);

        if (isMatch) {
          return { ...conv, lastMessage: { ...conv.lastMessage, content: 'Message deleted' } }
        }
        return conv;
      }))
    };

    // Socket listener: when a reaction is updated on a message
    const handleMessageReaction = ({ messageId, sender, receiver, group, reactions }) => {
      const message = {
        sender: sender,
        receiver: receiver,
        group: group,
      };

      if (isForActiveChat(message)) {
        setMessages((prev) =>
          prev?.map((msg) =>
            msg._id === messageId ? { ...msg, reactions } : msg
          )
        );
      }
      
      setConversations(prev =>
        prev.map(conv => {
          if (
            conv.lastMessage?._id !== messageId ||
            !isForConversation(conv, message)
          ) {
            return conv;
          }

          return {
            ...conv,
            lastMessage: {
              ...conv.lastMessage,
              reactions,
            },
          };
        })
      );
    };


    socket.on('new_message', handleNewMessage);
    socket.on('message_read', handleMessageRead);
    socket.on('typing_started', handleTypingStarted);
    socket.on('typing_stop', handleTypingStop);
    socket.on('message_edited', handleMessageEdited);
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
      socketService.emit("typing_stop", { receiverId });
      isCurrentUserTypingRef.current = false;
    }, 2000);
  };

  const editMessage = async (messageId, newContent) => {
    try {
      const response = await api.patch(`/messages/${messageId}`, { content: newContent });
      const updatedMsg = response.data; // Backend returns the updated message object

      // Update locally
      setMessages((prev) =>
        prev?.map((msg) => (msg._id === messageId ? updatedMsg : msg))
      );

      setConversations((prev) => prev?.map((conv) => {
        if (conv.lastMessage._id === updatedMsg._id) {
          return { ...conv, lastMessage: updatedMsg }
        }
        return conv;
      }));

    } catch (error) {
      console.error('Failed to edit message:', error);
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      await api.delete(`/messages/${messageId}`);

      // Remove locally
      setMessages((prev) => prev?.filter((msg) => msg._id !== messageId));

      setConversations((prev) => prev?.map((conv) => {
        if (conv.lastMessage._id === messageId) {
          return { ...conv, lastMessage: { ...conv.lastMessage, content: 'Message deleted' } }
        }
        return conv;
      }));

    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const reactToMessage = async (messageId, emoji) => {
    try {
      const response = await api.post(`/messages/${messageId}/react`, { emoji });
      const reactions = response.data.reactions; // Backend returns updated reactions array

      // Update locally
      setMessages((prev) =>
        prev?.map((msg) =>
          msg._id === messageId ? { ...msg, reactions } : msg
        )
      );

      // setConversations((prev) => prev?.map((conv) => {
      //   if (conv.lastMessage._id === messageId) {
      //     return { ...conv, lastMessage: reactions }
      //   }
      //   return conv;
      // }));

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
    reactToMessage
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
