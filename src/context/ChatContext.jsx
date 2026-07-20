import { createContext, useContext, useState } from 'react';
import api from '../services/api';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [messages, setMessages] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const fetchConversations = async () => {
    setLoadingConversations(true);

    try {
      const response = await api.get('/messages/conversations');
      console.log("Conv:", response.data.conversations);
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
      console.log("messages: ", response.data.messages)
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
          if(conv._id === chatId || conv.id === chatId) {
            return {
              ...conv,
              lastMessage: newMessage,
            };
          }
          return conv;
        });
      });
    }
    catch (error) {
      console.error("Failed to send message", error);
    }
  }

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
    sendMessage
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
