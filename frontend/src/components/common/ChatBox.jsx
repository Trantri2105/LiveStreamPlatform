import { useEffect, useRef, useState } from "react";
//import chatApi from "../../api/chatApi.js";
import { WS_BASE_URL } from "../../utils/constants.js";
import {MessageSquare, Send, Gift, AlertTriangle} from "lucide-react";
import { formatCurrency } from "../../utils/format.js";
import { useToast } from "../../context/ToastContext.jsx"; // 1. Import Toast

const ChatBox = ({ streamId, currentUserId, streamStatus }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const wsRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const toast = useToast();
    const isLive = streamStatus === 'live' || streamStatus === 'init';
    const isLoggedIn = !!currentUserId || !!localStorage.getItem('access_token');
    const isConnecting = useRef(false);

    const scrollToBottom = () => {
        if (scrollContainerRef.current) {
            const { scrollHeight, clientHeight } = scrollContainerRef.current;
            scrollContainerRef.current.scrollTop = scrollHeight - clientHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);



    // 2. WebSocket Connection
    useEffect(() => {
        if (!streamId) return;
        if (isConnecting.current || wsRef.current?.readyState === WebSocket.OPEN) return;
        const token = localStorage.getItem('access_token');
        const wsURL = `${WS_BASE_URL}/${streamId}${token ? `?token=${token}` : ''}`;
        isConnecting.current = true;
        const ws = new WebSocket(wsURL);
        wsRef.current = ws;
        ws.onopen = () => {
            console.log("WS Connected");
            isConnecting.current = false;
        };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if(msg.type === 'error') {
                    setMessages(prev => [...prev, msg]);
                    return;
                }
                if (!msg.username) return;

                setMessages(prev => [...prev, msg]);
            } catch (e) { console.error("WS Parse Error", e); }
        };

        ws.onerror = (e) => {
            console.error("WS Error", e);
            isConnecting.current = false;
        };

        return () => {
            if (ws.readyState === 1 || ws.readyState === 0) {
                ws.close();
            }
            wsRef.current = null;
            isConnecting.current = false;
        };
    }, [streamId]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if(!isLive){
            toast.info("Livestream đã kết thúc, không thể chat");
            return;
        }
        if (!isLoggedIn) {
            toast.warning("Vui lòng đăng nhập để tham gia chat.");
            return;
        }

        if(!input.trim() || !wsRef.current) return;

        if (wsRef.current.readyState !== WebSocket.OPEN) {
            toast.error("Mất kết nối chat. Vui lòng tải lại trang.");
            return;
        }

        const msgPayload = { content: input };
        wsRef.current.send(JSON.stringify(msgPayload));
        setInput("");
    };

    return (
        <div className="flex flex-col h-full bg-gray-900 w-full relative">
            {/* Header */}
            <div className="p-3 border-b border-gray-800 bg-gray-900 flex items-center justify-between shrink-0 z-10">
                <div className="font-bold text-sm uppercase tracking-wider flex items-center gap-2 text-gray-300">
                    <MessageSquare size={16}/> Trò chuyện
                </div>
                {isLive ? (
                    <div className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span> LIVE
                    </div>
                ) : (
                    <div className="text-[10px] font-bold text-gray-500 bg-gray-500/10 px-2 py-0.5 rounded-full">
                        CHAT
                    </div>
                )}
            </div>

            {/* Messages List */}
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-gray-900/50 scroll-smooth"
            >
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-600 text-xs opacity-70">
                        <MessageSquare size={24} className="mb-2 opacity-50"/>
                        <p>Chưa có tin nhắn nào.</p>
                    </div>
                )}

                {messages.map((msg, idx) => {
                    if (msg.type === 'error') {
                        return (
                            <div key={idx} className="bg-red-900/20 border-l-4 border-red-500 p-3 rounded-r mb-2 animate-in fade-in slide-in-from-bottom-2">
                                <div className="flex items-center gap-2 text-red-500 font-bold text-xs uppercase mb-1">
                                    <AlertTriangle size={14} />
                                    <span>Hệ thống</span>
                                </div>
                                <div className="text-red-200 font-medium text-sm break-words">
                                    {msg.message}
                                </div>
                            </div>
                        );
                    }
                    if (msg.type === 'donate') {
                        return (
                            <div key={idx} className="bg-yellow-900/20 border-l-4 border-yellow-500 p-3 rounded-r mb-2 animate-in fade-in slide-in-from-bottom-2">
                                <div className="flex items-center gap-2 text-yellow-500 font-bold text-xs uppercase mb-1">
                                    <Gift size={14} />
                                    <span>{msg.username} đã ủng hộ {formatCurrency(msg.amount)}</span>
                                </div>
                                <div className="text-white font-medium text-sm break-words">
                                    {msg.content}
                                </div>
                            </div>
                        );
                    }
                    const isCurrentUser = msg.user_id === currentUserId;

                    return (
                        <div key={idx} className="text-sm break-words animate-in fade-in slide-in-from-bottom-1 duration-200">
                            <span
                                className={`font-bold mr-2 cursor-pointer hover:underline ${isCurrentUser ? 'text-yellow-400' : 'text-violet-400'}`}
                                title={msg.user_id}
                            >
                                {msg.username}:
                            </span>
                            <span className="text-gray-300 leading-relaxed">{msg.content}</span>
                        </div>
                    );
                })}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-800 bg-gray-900 shrink-0">
                <div className="relative">
                    <input
                        type="text"
                        disabled={!isLoggedIn || !isLive}
                        className={`w-full bg-black/30 text-white rounded-xl py-2.5 pl-4 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 border border-gray-700 transition-all ${!isLoggedIn ? 'cursor-not-allowed opacity-60' : ''}`}
                        placeholder={
                            !isLive ? "Buổi livestream đã kết thúc" :
                                (!isLoggedIn ? "Đăng nhập để chat" : "Gửi tin nhắn...")
                        }
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <button
                        type="submit"
                        disabled={!isLoggedIn || !input.trim() || !isLive}
                        className="absolute right-1.5 top-1.5 p-1.5 bg-violet-600 rounded-lg text-white hover:bg-violet-700 disabled:bg-gray-800 disabled:text-gray-600 transition-colors"
                    >
                        <Send size={14} />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatBox;