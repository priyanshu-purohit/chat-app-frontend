import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import { Check, CheckCheck, Send, Edit2, Trash2 } from "lucide-react";
import { useSocket } from "../../context/SocketContext";

export default function ChatWindow() {
    const { user } = useAuth();
    const { onlineUsers } = useSocket();
    const {
        activeChat,
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
    } = useChat();

    const [text, setText] = useState("");
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editText, setEditText] = useState("");

    const partnerId = activeChat?.participant?._id;
    const isPartnerTyping = partnerId && typingUsers.includes(partnerId);

    const status = onlineUsers[partnerId] || 'Offline';

    useEffect(() => {
        if (activeChat?.id) {
            fetchMessages(activeChat?.id);
        }
        markAsRead();
    }, [activeChat]);

    const chatName = activeChat?.type === 'direct'
        ? activeChat?.participant.username
        : activeChat?.group.name;

    const handleEditSubmit = async (messageId) => {
        if (!editText.trim()) return;
        await editMessage(messageId, editText);
        setEditingMessageId(null);
        setEditText("");
    };

    return (
        <div className="h-screen flex flex-col bg-slate-950 text-slate-100">
            {/* Header */}
            {activeChat ? (
                <div className="flex items-center gap-3 p-4 border-b border-gray-800 bg-slate-900 shrink-0">
                    <div className="flex items-center justify-center size-10 uppercase font-bold border rounded-full text-xl text-slate-200 border-slate-800 bg-indigo-500/80">
                        {chatName?.[0]}
                    </div>
                    <div className="flex flex-col text-sm">
                        <span className="font-semibold">{chatName}</span>
                        {activeChat.type === 'direct' && (
                            <p className="text-xs">
                                {isPartnerTyping ? (
                                    <span className="text-indigo-400 animate-pulse">typing...</span>
                                ) : (
                                    <span className={status === 'Online' ? 'text-green-500' : 'text-gray-500'}>
                                        {status}
                                    </span>
                                )}
                            </p>
                        )}
                    </div>
                </div>
            ) : (
                <div className="h-screen flex flex-col items-center justify-center text-sm text-gray-500">
                    Select a chat to start messaging
                </div>
            )}

            {/* Message List */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {loadingMessages ? (
                    <div className="flex justify-center items-center h-24">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                    </div>
                ) : messages?.length === 0 ? (
                    <p className="text-center text-sm text-slate-600 mt-8">No messages yet. Say hello!</p>
                ) : (
                    messages?.map((message) => {
                        const isMe = message.sender === user?._id;
                        const isEditing = editingMessageId === message._id;

                        const options = {
                            timeZone: "Asia/Kolkata",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true
                        };
                        const time = new Date(message.updatedAt).toLocaleTimeString("en-IN", options);

                        return (
                            <div
                                key={message._id}
                                className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}
                            >
                                <div className="group flex items-center gap-2 max-w-[70%] relative">

                                    {/* Outgoing Message Option Actions (Hover Menu) */}
                                    {isMe && !isEditing && (
                                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity duration-200 mr-1 bg-slate-900/80 rounded-lg p-1 border border-slate-800">
                                            <button
                                                onClick={() => {
                                                    setEditingMessageId(message._id);
                                                    setEditText(message.content);
                                                }}
                                                className="p-1 hover:text-indigo-400 cursor-pointer rounded"
                                                title="Edit"
                                            >
                                                <Edit2 size={12} />
                                            </button>
                                            <button
                                                onClick={() => deleteMessage(message._id)}
                                                className="p-1 hover:text-red-400 cursor-pointer rounded"
                                                title="Delete"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    )}

                                    {/* Message Bubble Body */}
                                    <div
                                        className={`px-4 py-2.5 rounded-2xl text-sm relative ${isMe
                                            ? 'bg-indigo-600 text-white rounded-br-sm'
                                            : 'bg-slate-800 text-slate-200 rounded-bl-sm'
                                            }`}
                                    >
                                        {isEditing ? (
                                            <div className="flex flex-col gap-2 min-w-50">
                                                <input
                                                    type="text"
                                                    value={editText}
                                                    onChange={(e) => setEditText(e.target.value)}
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1 text-slate-100 focus:outline-none text-xs"
                                                    autoFocus
                                                />
                                                <div className="flex justify-end gap-1.5">
                                                    <button
                                                        onClick={() => setEditingMessageId(null)}
                                                        className="px-2 py-0.5 rounded bg-slate-700 text-[10px] hover:bg-slate-600 cursor-pointer"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditSubmit(message._id)}
                                                        className="px-2 py-0.5 rounded bg-indigo-500 text-[10px] hover:bg-indigo-400 cursor-pointer"
                                                    >
                                                        Save
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <span>{message.content}</span>
                                                <span className="text-[9px] opacity-60 ml-2 mt-1 block text-right">
                                                    {message.isEdited && "(edited) "}{time}
                                                </span>
                                            </div>
                                        )}

                                        {/* Status Checkmarks (Only for Me) */}
                                        {isMe && !isEditing && (
                                            <span className="absolute -bottom-4 right-1 flex items-center text-[10px] opacity-70">
                                                {message.status === 'Sent' && <Check className="text-slate-500 size-3" />}
                                                {message.status === 'Delivered' && <CheckCheck className="text-slate-500 size-3" />}
                                                {message.status === 'Read' && <CheckCheck className="text-blue-400 size-3" />}
                                            </span>
                                        )}
                                    </div>

                                    {/* Incoming Message Option Actions (Reaction Drawer Popover) */}
                                    {!isMe && (
                                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity duration-200 ml-1 bg-slate-900/80 rounded-lg p-1 border border-slate-800">
                                            {['👍', '❤️', '😂', '😮', '🙏'].map((emoji) => (
                                                <button
                                                    key={emoji}
                                                    onClick={() => reactToMessage(message._id, emoji)}
                                                    className="hover:scale-125 transition-transform cursor-pointer text-xs p-0.5"
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Render Active Message Reaction Badges */}
                                {message.reactions?.length > 0 && (
                                    <div className="flex gap-1 mt-0.5 px-2">
                                        {message.reactions.map((react, index) => {
                                            console.log(message.reactions)
                                            return <span
                                                key={index}
                                                className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded-full border border-slate-700/50"
                                                title={`User: ${react.user}`}
                                            >
                                                {react.emoji}
                                            </span>
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Typing indicators */}
            {/* <div className="pb-3 px-4">
                {activeChat?.type === 'direct' ? (
                    typingUsers.length === 1 && (
                        <div className="flex items-center gap-2 bg-slate-900/20 rounded-lg">
                            <div className="rounded-full bg-green-500 size-2 animate-pulse"></div>
                            <span
                                className="text-sm text-slate-400 bg-slate-900/20 rounded-lg"
                            >
                                typing...
                            </span>
                        </div>
                    )
                ) : (
                    typingUsers.length > 0 && typingUsers.map((user) => (
                        <span
                            key={user._id}
                            className="mx-4 pb-3 text-sm text-slate-400 bg-gray-800"
                        >
                            {user.name} is typing...
                        </span>
                    ))
                )} */}
            </div>

            {/* Input Area */}
            {activeChat && (
                <div className="px-4 py-3 border-t border-slate-800 bg-slate-900 shrink-0">
                    <div className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 w-full">
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                if (!text.trim()) return;
                                await sendMessage(text);
                                setText("");
                            }}
                            className="w-full flex items-center gap-3"
                        >
                            <input
                                type="text"
                                placeholder="Type a message..."
                                className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                onKeyDown={() => handleTyping()}
                            />
                            <button
                                type="submit"
                                className="size-10 rounded-full flex items-center justify-center text-white shrink-0 font-semibold cursor-pointer bg-indigo-600 hover:bg-indigo-700"
                            >
                                <Send size={20} />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
