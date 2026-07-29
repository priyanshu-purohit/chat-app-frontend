import { Search, MessageSquare } from "lucide-react";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import { useEffect } from "react";

export default function Sidebar() {

    const { user, logout } = useAuth();

    const { conversations, activeChat, setActiveChat, loadingConversations, fetchConversations, setConversations, setMessages } = useChat();

    useEffect(() => {
        fetchConversations();
    }, []);

    const handleLogout = () => {
        setMessages(null);
        setConversations([]);
        setActiveChat(null);
        logout();
    };

    return (
        <div className="h-screen w-80 flex flex-col bg-gray-900 border-r border-gray-800">

            {/* Header: Logged-in user info + logout */}
            <div className="flex items-center justify-between border-b border-gray-800 p-4">
                <div className="flex items-center">
                    <img className="w-8 h-8 rounded-full" src={user?.avatar || "https://img.magnific.com/premium-vector/default-avatar-profile-icon-social-media-user-image-gray-avatar-icon-blank-profile-silhouette-vector-illustration_561158-3396.jpg?semt=ais_hybrid&w=740&q=80"} alt="" />
                    <span className="text-sm ml-2 font-semibold text-gray-200 uppercase">{user?.username}</span>
                </div>
                <button
                    onClick={handleLogout}
                    className="text-sm text-gray-400 cursor-pointer hover:text-red-400 transition-colors"
                >
                    Sign out
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative border-b border-gray-800 p-4">
                <Search className="absolute size-5 text-gray-400 top-7 left-7 shrink-0" />
                <input
                    type="text"
                    className="w-full pl-10 bg-gray-800 rounded-2xl text-sm text-gray-300 p-3 border border-gray-700 focus:outline-none focus:border-gray-400"
                    placeholder="Search conversations..."
                />
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
                {loadingConversations ? (
                    <div className="flex justify-center items-center h-24">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                    </div>
                ) : conversations?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <MessageSquare className="size-9 mb-2 opacity-50" />
                        <p className="text-sm opacity-50">No conversation yet</p>
                    </div>
                ) : (
                    conversations.map((conv) => (

                        // render direct conversations
                        conv.type === 'direct' ? (
                            <button
                                key={conv._id}
                                onClick={() => setActiveChat(conv)}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-700/70 transition-colors cursor-pointer border-b border-slate-800/50
                ${activeChat?._id === conv._id ? 'bg-slate-800 border-l-2 border-l-indigo-500' : ''}`}
                            >
                                {/* Avatar */}
                                <div className="relative h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-300 uppercase shrink-0">
                                    <img src={conv.participant.avatar || "https://img.magnific.com/premium-vector/default-avatar-profile-icon-social-media-user-image-gray-avatar-icon-blank-profile-silhouette-vector-illustration_561158-3396.jpg?semt=ais_hybrid&w=740&q=80"} alt="" className="rounded-full" />

                                    {conv.participant.status === 'Online' ?
                                        <div className="border border-slate-900 size-2.5 rounded-full absolute right-0 bottom-0 bg-green-400"></div> : ""}
                                </div>

                                {/* Conversation Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-slate-200 truncate">{conv.participant.username}</span>
                                    </div>
                                    <p className="text-xs text-slate-400 truncate mt-0.5">
                                        {conv.lastMessage?.content || 'No messages yet'}
                                    </p>
                                </div>

                                {/* unread messages */}
                                {conv.unreadCount > 0 ? (
                                    <span className="size-5 flex items-center justify-center rounded-full bg-green-500 text-xs font-semibold text-white">
                                        {conv.unreadCount}
                                    </span>
                                ) :
                                    ""
                                }
                            </button>
                        ) :
                            (
                                // render groups
                                <button
                                    key={conv.id}
                                    onClick={() => setActiveChat(conv)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-700/70 transition-colors cursor-pointer border-b border-slate-800/50
                ${activeChat?._id === conv._id ? 'bg-slate-800 border-l-2 border-l-indigo-500' : ''}`}
                                >
                                    {/* Avatar */}
                                    <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-300 uppercase shrink-0">
                                        <img src={conv.group.avatar || "https://img.magnific.com/premium-vector/default-avatar-profile-icon-social-media-user-image-gray-avatar-icon-blank-profile-silhouette-vector-illustration_561158-3396.jpg?semt=ais_hybrid&w=740&q=80"} alt="" className="rounded-full" />
                                    </div>

                                    {/* Conversation Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold text-slate-200 truncate">{conv.group.name}</span>
                                        </div>
                                        <p className="text-xs text-slate-400 truncate mt-0.5">
                                            {conv.lastMessage || 'No messages yet'}
                                        </p>
                                    </div>

                                    {/* unread messages */}
                                    {conv.unreadCount > 0 ? (
                                        <span className="size-5 flex items-center justify-center rounded-full bg-indigo-500 text-xs font-semibold text-white">
                                            {conv.unreadCount}
                                        </span>
                                    ) :
                                        ""
                                    }

                                </button>
                            )

                    ))
                )}

            </div>
        </div>
    )
};