import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../hooks/useAuth.js";
import { Radio, Search, Video, Bell } from "lucide-react";
import notificationApi from "../../api/notificationApi";
import Button from "./Button.jsx";
import { Shield } from "lucide-react";
import { LayoutGrid } from "lucide-react";

const GlobalHeader = () => {
    const { user, channel, logout } = useAuth();
    const navigate = useNavigate();

    // --- States ---
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchInput, setSearchInput] = useState("");

    // Notification States
    const [notifications, setNotifications] = useState([]);
    const [isNotiOpen, setIsNotiOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loadingNoti, setLoadingNoti] = useState(false);

    // Refs
    const notiRef = useRef(null);
    const notiListRef = useRef(null);

    // --- Logic Notification (Giữ nguyên như yêu cầu) ---
    useEffect(() => {
        if (!user) return;

        const checkUnread = async () => {
            try {
                const data = await notificationApi.getNotifications({ limit: 20, offset: 0 });
                const count = data.filter(n => !n.is_read).length;
                setUnreadCount(count);
            } catch (e) { console.error(e); }
        };

        checkUnread();
        const interval = setInterval(checkUnread, 5000);

        return () => clearInterval(interval);
    }, [user]);

    const fetchNotifications = async (currentOffset, isRefresh = false) => {
        setLoadingNoti(true);
        try {
            const data = await notificationApi.getNotifications({ limit: 10, offset: currentOffset });

            if (data.length < 10) setHasMore(false);

            if (isRefresh) {
                setNotifications(data);
            } else {
                setNotifications(prev => [...prev, ...data]);
            }
        } catch (e) {
            console.error("Load noti error", e);
        } finally {
            setLoadingNoti(false);
        }
    };

    const toggleNoti = () => {
        if (!isNotiOpen) {
            setIsNotiOpen(true);
            setOffset(0);
            setHasMore(true);
            fetchNotifications(0, true);
            setIsDropdownOpen(false);
        } else {
            setIsNotiOpen(false);
        }
    };

    const handleScrollNoti = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight - scrollTop <= clientHeight + 10 && hasMore && !loadingNoti) {
            const newOffset = offset + 10;
            setOffset(newOffset);
            fetchNotifications(newOffset, false);
        }
    };

    const handleNotiClick = async (noti) => {
        try {
            if (!noti.is_read) {
                await notificationApi.markAsRead([noti.id]);

                setNotifications(prev => prev.map(n =>
                    n.id === noti.id ? { ...n, is_read: true } : n
                ));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }

            if (noti.data && noti.data.stream_id) {
                navigate(`/stream/${noti.data.stream_id}`);
                setIsNotiOpen(false);
            }
        } catch (e) {
            console.error("Mark read failed", e);
        }
    };

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notiRef.current && !notiRef.current.contains(event.target)) {
                setIsNotiOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearch = (e) => {
        if (e.key === 'Enter' && searchInput.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`);
        }
    };

    return (
        <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 sticky top-0 z-40">
            {/* Logo */}
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/')}>
                <div className="h-8 w-8 bg-violet-600 rounded-lg flex items-center justify-center text-white"><Radio size={20} /></div>
                <span className="text-xl font-bold text-white hidden sm:block">LiveHub</span>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-8 hidden md:block">
                <div className="relative group">
                    <input
                        type="text"
                        placeholder="Tìm kiếm..."
                        className="w-full bg-gray-800 border border-gray-700 rounded-full py-2.5 pl-12 pr-4 text-gray-300 focus:border-violet-500 focus:outline-none"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={handleSearch}
                    />
                    <Search className="absolute left-4 top-3 text-gray-500 cursor-pointer hover:text-white" size={20} onClick={() => searchInput.trim() && navigate(`/search?q=${searchInput}`)} />
                </div>
            </div>

            {/* Action Area */}
            <div className="flex items-center gap-4">
                {user ? (
                    // --- GIAO DIỆN USER ---
                    <>
                        {user.role === 'admin' && (
                            <>
                                <Link to="/admin/users" className="hidden xl:flex items-center gap-2 bg-violet-900/30 hover:bg-violet-900/50 text-violet-300 px-3 py-1.5 rounded-lg text-sm font-medium border border-violet-800 transition-colors">
                                    <Shield size={16} /> User
                                </Link>
                                <Link to="/admin/categories" className="hidden xl:flex items-center gap-2 bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 px-3 py-1.5 rounded-lg text-sm font-medium border border-blue-800 transition-colors">
                                    <LayoutGrid size={16} /> Category
                                </Link>
                            </>
                        )}

                        <Link to="/stream-setup" className="hidden sm:flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-700">
                            <Video size={16} /> Go Live
                        </Link>

                        {/* Notification Bell */}
                        <div className="relative" ref={notiRef}>
                            <button
                                onClick={toggleNoti}
                                className="p-2 text-gray-400 hover:bg-gray-800 hover:text-white rounded-full transition-colors relative"
                            >
                                <Bell size={20} />
                                {/* Badge Unread Count */}
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] flex items-center justify-center">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {isNotiOpen && (
                                <div className="absolute top-full right-0 mt-2 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[400px]">
                                    <div className="p-3 border-b border-gray-800 bg-gray-900 font-bold text-white">Thông báo</div>

                                    <div
                                        ref={notiListRef}
                                        onScroll={handleScrollNoti}
                                        className="flex-1 overflow-y-auto custom-scrollbar"
                                    >
                                        {notifications.length === 0 && !loadingNoti ? (
                                            <div className="p-8 text-center text-gray-500 text-sm">Không có thông báo nào.</div>
                                        ) : (
                                            notifications.map(noti => (
                                                <div
                                                    key={noti.id}
                                                    onClick={() => handleNotiClick(noti)}
                                                    className={`p-3 border-b border-gray-800 hover:bg-gray-800 cursor-pointer transition-colors flex gap-3 ${!noti.is_read ? 'bg-gray-800/60' : ''}`}
                                                >
                                                    <div className="shrink-0 mt-1">
                                                        <div className="w-8 h-8 rounded-full bg-violet-900/50 flex items-center justify-center text-violet-400">
                                                            <Video size={14} />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm ${!noti.is_read ? 'font-bold text-white' : 'text-gray-400'}`}>
                                                            {noti.title}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{noti.body}</p>
                                                        <p className="text-[10px] text-gray-600 mt-1">
                                                            {new Date(noti.created_at).toLocaleString('vi-VN')}
                                                        </p>
                                                    </div>
                                                    {!noti.is_read && (
                                                        <div className="shrink-0 self-center">
                                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                        {loadingNoti && <div className="p-3 text-center text-xs text-gray-500">Đang tải...</div>}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Profile Dropdown */}
                        <div className="relative">
                            <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setIsDropdownOpen(!isDropdownOpen); setIsNotiOpen(false); }}>
                                <div className="text-right hidden sm:block">
                                    <div className="text-sm font-bold text-white">{channel?.title}</div>
                                </div>
                                <img src={channel?.avatar_url || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"} className="h-9 w-9 rounded-full bg-gray-800 border-2 border-gray-700 object-cover" />
                            </div>
                            {isDropdownOpen && (
                                <div className="absolute top-full right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-xl shadow-xl p-1 z-50">
                                    <Link to="/profile" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded">Hồ sơ cá nhân</Link>
                                    <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-800 rounded">Đăng xuất</button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    // --- GIAO DIỆN KHÁCH (GUEST) ---
                    <>
                        <Link to="/login">
                            <Button variant="ghost" className="text-gray-400 hover:text-white font-medium text-sm hidden sm:block">
                                Đăng nhập
                            </Button>
                        </Link>
                        <Link to="/register">
                            <Button variant="primary" className="!px-4 !py-2 text-sm shadow-lg shadow-violet-600/20">
                                Đăng ký
                            </Button>
                        </Link>
                    </>
                )}
            </div>
        </header>
    );
};

export default GlobalHeader;