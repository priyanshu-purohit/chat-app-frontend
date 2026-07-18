import ChatWindow from "../chat/ChatWindow";
import Sidebar from "../chat/Sidebar";

export default function AppLayout() {
    return (
        <div className="flex h-screen bg-slate-950 text-slate-100">
            {/* Left Panel: Sidebar */}
            <div className="w-80 shrink-0 flex flex-col">
                <Sidebar />
            </div>


            {/* Right Panel: Chat Window */}
            <div className="flex-1 flex flex-col">
                <ChatWindow />
            </div>
        </div>
    )
};