import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import { Check, CheckCheck, Send } from "lucide-react";


export default function ChatWindow() {

    const { user } = useAuth();
    const { activeChat, messages, loadingMessages, fetchMessages, sendMessage, markAsRead, typingUsers, handleTyping } = useChat();

    const [text, setText] = useState("");

    const partnerId = activeChat?.participant?._id;

    const isPartnerTyping = partnerId && typingUsers.includes(partnerId);

    useEffect(() => {
        if (activeChat?.id) {
            console.log(messages);
            fetchMessages(activeChat?.id);
        }
        markAsRead();
    }, [activeChat]);

    const chatName = activeChat?.type === 'direct'
        ? activeChat?.participant.username
        : activeChat?.group.name;

    return (
        <div className="h-screen flex flex-col">
            {/* Header */}
            {activeChat ? (
                <div className="flex items-center gap-3 p-4 border-b border-gray-800 bg-slate-900">
                    <div className="flex items-center justify-center size-10 uppercase font-bold border rounded-full text-xl text-slate-200 border-slate-800 bg-indigo-500/80">
                        {chatName?.[0]}
                    </div>
                    <div className="flex flex-col text-sm">
                        <span className="font-semibold">{chatName}</span>

                        {activeChat.type === 'direct' && (
                            <p className={`text-xs ${activeChat.participant.status === 'Online' ? 'text-green-500' : 'text-gray-500'}`}>
                                {activeChat.participant.status}
                            </p>
                        )}
                    </div>
                </div>) : (
                <div className="h-screen flex flex-col items-center justify-center text-sm text-gray-500">Select a chat</div>
            )}

            {/* Message List */}
            <div className="flex flex-col flex-1 overflow-y-auto px-5 py-4 gap-2">
                {loadingMessages ? (
                    <div className="flex justify-center items-center h-24">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                    </div>
                ) : messages?.length === 0 ? (
                    <p className="text-center text-sm text-slate-600 mt-8">No messages yet. Say hello!</p>
                ) : (
                    messages?.map((message) => {

                        const isMe = message.sender === user?._id;

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
                                className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${isMe ? 'bg-indigo-600 text-white ml-auto rounded-br-sm' : 'bg-gray-700 text-slate-200 mr-auto rounded-bl-sm'}`}
                            >
                                {message.content}
                                <span className="text-xs opacity-70 ml-2 mt-1 float-right">{time}</span>

                                {isMe && message.status === 'Sent' ?
                                    (<Check className="text-slate-200 size-4" />) :
                                    (isMe && message.status === 'Delivered' ?
                                        (<CheckCheck className="text-slate-200 size-4" />) :
                                        (isMe && message.status === 'Read' ?
                                            (<CheckCheck className="text-blue-300 size-4" />) : null))
                                }
                            </div>
                        )
                    })
                )}
            </div>

            {/* typing indicator */}
            {isPartnerTyping && (
                <div className="px-5 py-2 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
                    <div className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-gray-400">
                        {chatName} is typing...
                    </span>
                </div>
            )}

            {/* Input Area */}
            <div className="px-4 py-3 border-t border-slate-800 bg-slate-900">
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
                            className="size-10 rounded-full flex items-center justify-center text-white border-slate-700 shrink-0 font-semibold cursor-pointer bg-indigo-600 hover:bg-indigo-700"
                        >
                            <Send size={20} />
                        </button>

                    </form>
                </div>

            </div>
        </div>
    );
}