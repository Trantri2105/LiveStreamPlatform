import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import streamApi from "../../api/streamApi.js";
import channelApi from "../../api/channelApi.js";
import Button from "../../components/common/Button.jsx";
import OvenPlayerWrapper from "../../components/common/OvenPlayerWrapper.jsx";
import { Heart, Gift, ChevronLeft, Bell, BellOff, Calendar, PlayCircle, Loader2 } from "lucide-react";
import ChatBox from "../../components/common/ChatBox.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import DonateModal from "../../components/common/DonateModal.jsx";
import { useToast } from "../../context/ToastContext.jsx";

const StreamRoomPage = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const toast = useToast();

    // Stream Info State
    const [stream, setStream] = useState(null);
    const [loadingStream, setLoadingStream] = useState(true);
    // Subscription State
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [notificationEnabled, setNotificationEnabled] = useState(false);
    const [loadingSub, setLoadingSub] = useState(false);
    const [showDonateModal, setShowDonateModal] = useState(false);

    // Recommendation State (Infinite Scroll)
    const [recommendations, setRecommendations] = useState([]);
    const [loadingRecs, setLoadingRecs] = useState(false);
    const [hasMoreRecs, setHasMoreRecs] = useState(true);
    const [recPage, setRecPage] = useState(0);

    // Ref cho Infinite Scroll
    const observer = useRef();
    const lastRecElementRef = useCallback(node => {
        if (loadingRecs) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMoreRecs) {
                setRecPage(prevPage => prevPage + 1);
            }
        });

        if (node) observer.current.observe(node);
    }, [loadingRecs, hasMoreRecs]);

    // 1. Fetch Stream Info (Reset state khi ID thay đổi)
    useEffect(() => {
        // Reset toàn bộ state khi đổi video
        setStream(null);
        setLoadingStream(true);
        setRecommendations([]);
        setRecPage(0);
        setHasMoreRecs(true);
        window.scrollTo(0, 0);

        const fetchInfo = async () => {
            try {
                const streamData = await streamApi.getById(id);
                if (streamData && streamData.channel && streamData.channel.id) {
                    try {
                        const channelData = await channelApi.getById(streamData.channel.id);
                        streamData.channel.avatar_url = channelData.avatar_url;
                    } catch (err) {
                        console.error("Failed to load channel info", err);
                    }

                    if (user) {
                        try {
                            const sub = await channelApi.checkSubscription(streamData.channel.id);
                            if (sub) {
                                setIsSubscribed(true);
                                setNotificationEnabled(sub.notification_enabled);
                            } else {
                                setIsSubscribed(false);
                                setNotificationEnabled(false);
                            }
                            // eslint-disable-next-line no-unused-vars
                        } catch (e) { /* ignore */ }
                    }
                }
                setStream(streamData);
            } catch (e) {
                console.error(e);
                toast.error("Không thể tải thông tin luồng phát.");
            } finally {
                setLoadingStream(false);
            }
        };
        fetchInfo();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, user]);

    // 2. Fetch Recommendations (ĐÃ SỬA LỖI DUPLICATE)
    useEffect(() => {
        let isMounted = true; // Cờ kiểm tra component còn mount không

        const fetchRecs = async () => {
            if (!stream) return;
            setLoadingRecs(true);
            try {
                const query = `${stream.title} ${stream.category?.title || ""}`.trim();
                const limitPerType = 2;
                const offset = recPage * limitPerType;

                const [liveRes, endRes] = await Promise.all([
                    streamApi.search({
                        searchText: query,
                        status: 'live',
                        limit: limitPerType,
                        offset: offset
                    }),
                    streamApi.search({
                        searchText: query,
                        status: 'end',
                        limit: limitPerType,
                        offset: offset
                    })
                ]);

                if (!isMounted) return; // Nếu component unmount thì không làm gì cả

                // Lọc kết quả rỗng
                const liveItems = liveRes || [];
                const endItems = endRes || [];

                // Gộp và lọc bỏ stream đang xem
                const newItems = [...liveItems, ...endItems].filter(s => s.id !== stream.id);

                // Nếu cả 2 nguồn đều không trả về dữ liệu -> Hết dữ liệu
                if (liveItems.length === 0 && endItems.length === 0) {
                    setHasMoreRecs(false);
                } else {
                    // [QUAN TRỌNG] Logic sửa lỗi Duplicate:
                    if (recPage === 0) {
                        // Nếu là trang đầu tiên, GHI ĐÈ hoàn toàn (tránh nối đuôi dữ liệu cũ hoặc chạy 2 lần strict mode)
                        setRecommendations(newItems);
                    } else {
                        // Nếu là trang 2, 3... thì mới NỐI THÊM
                        setRecommendations(prev => [...prev, ...newItems]);
                    }
                }

            } catch (error) {
                console.error("Error fetching recommendations:", error);
            } finally {
                if (isMounted) setLoadingRecs(false);
            }
        };

        if (stream) {
            fetchRecs();
        }

        // Cleanup function
        return () => {
            isMounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [recPage, stream]);

    // Handlers
    const handleSubscribe = async () => {
        if (!user) return toast.warning("Vui lòng đăng nhập để theo dõi kênh.");
        if (!stream?.channel?.id) return;
        setLoadingSub(true);
        try {
            if (isSubscribed) {
                await channelApi.unsubscribe(stream.channel.id);
                setIsSubscribed(false);
                setNotificationEnabled(false);
                toast.info("Đã hủy theo dõi kênh.");
            } else {
                await channelApi.subscribe(stream.channel.id, false);
                setIsSubscribed(true);
                setNotificationEnabled(false);
                toast.success("Đăng ký thành công!");
            }
        } catch (e) {
            toast.error("Lỗi: " + e.message);
        } finally {
            setLoadingSub(false);
        }
    };

    const handleToggleNotification = async () => {
        if (!stream?.channel?.id) return;
        try {
            const newStatus = !notificationEnabled;
            await channelApi.updateSubscription(stream.channel.id, newStatus);
            setNotificationEnabled(newStatus);
            toast.success(newStatus ? "Đã bật thông báo." : "Đã tắt thông báo.");
            // eslint-disable-next-line no-unused-vars
        } catch (error) {
            toast.error("Lỗi cập nhật thông báo.");
        }
    };

    if (loadingStream || !stream) return (
        <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            <p className="text-gray-400 text-sm">Đang tải...</p>
        </div>
    );

    const activeStreamUrl = stream.status === 'end'
        ? (stream.record_url || stream.hls_url)
        : stream.hls_url;

    const createdDate = stream.created_at
        ? new Date(stream.created_at).toLocaleString('vi-VN', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : '';

    return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col">
            <header className="h-16 bg-gray-900 flex items-center px-6 border-b border-gray-800 sticky top-0 z-50">
                <Link to="/" className="flex items-center gap-2 font-bold text-xl hover:text-violet-400 transition-colors">
                    <ChevronLeft /> Quay lại
                </Link>
            </header>

            <div className="flex-1 p-6">
                <div className="max-w-[1600px] mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        {/* Cột Trái: Video & Info */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="aspect-video bg-black rounded-xl overflow-hidden border border-gray-800 shadow-2xl relative">
                                <OvenPlayerWrapper key={id} streamUrl={activeStreamUrl} />
                                {stream.status === 'end' && (
                                    <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded text-xs font-bold border border-white/20 backdrop-blur-md">
                                        VOD
                                    </div>
                                )}
                            </div>

                            {/* Info Section */}
                            <div>
                                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                                    <div className="flex-1">
                                        <h1 className="text-2xl font-bold mb-2 text-white line-clamp-2">{stream.title}</h1>
                                        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                                            <Calendar size={14} /> <span>{createdDate}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Link to={`/channel/${stream.channel?.id}`} className="block w-12 h-12 flex-shrink-0">
                                                <div className="w-full h-full bg-gray-800 rounded-full border border-gray-700 flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-violet-500 transition-all">
                                                    <img
                                                        src={stream.channel?.avatar_url || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"}
                                                        className="w-full h-full object-cover"
                                                        alt="Channel Avatar"
                                                    />
                                                </div>
                                            </Link>
                                            <div>
                                                <Link to={`/channel/${stream.channel?.id}`} className="font-bold text-violet-400 text-lg hover:underline block">
                                                    {stream.channel?.title}
                                                </Link>
                                                <p className="text-sm text-gray-400">Danh mục: <span className="text-white font-medium">{stream.category?.title}</span></p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 mt-1 items-center flex-shrink-0">
                                        {isSubscribed ? (
                                            <>
                                                <button onClick={handleToggleNotification} className={`p-2.5 rounded-lg border transition-colors ${notificationEnabled ? 'bg-gray-800 text-yellow-400 border-gray-600' : 'bg-transparent text-gray-400 border-gray-700 hover:text-white'}`}>
                                                    {notificationEnabled ? <Bell size={20} fill="currentColor" /> : <BellOff size={20} />}
                                                </button>
                                                <Button variant="secondary" className="bg-gray-800 text-gray-300 border-gray-700" onClick={handleSubscribe} isLoading={loadingSub}>Đang theo dõi</Button>
                                            </>
                                        ) : (
                                            <Button icon={Heart} variant="primary" onClick={handleSubscribe} isLoading={loadingSub}>Theo dõi</Button>
                                        )}
                                        <Button icon={Gift} variant="success" onClick={() => setShowDonateModal(true)} className="animate-pulse hover:animate-none">Ủng hộ</Button>
                                    </div>
                                </div>
                                <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-800">
                                    <h4 className="font-bold mb-3 text-sm uppercase text-gray-500 tracking-wider">Giới thiệu</h4>
                                    <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{stream.description || "Không có mô tả."}</p>
                                </div>
                            </div>
                        </div>

                        {/* Cột Phải: Chat & Recommendations */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="h-[400px] lg:h-[500px] rounded-xl overflow-hidden border border-gray-800 shadow-lg bg-gray-900">
                                <ChatBox key={id} streamId={id} currentUserId={user?.id} streamStatus={stream.status} />
                            </div>

                            {/* Recommendations with Infinite Scroll */}
                            <div className="bg-gray-900/30 rounded-xl border border-gray-800 p-4">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <PlayCircle size={20} className="text-violet-400" />
                                    Recommend
                                </h3>

                                <div className="flex flex-col gap-4">
                                    {recommendations.map((rec, index) => {
                                        // Kiểm tra xem đây có phải là phần tử cuối cùng không để gắn ref
                                        if (recommendations.length === index + 1) {
                                            return (
                                                <div ref={lastRecElementRef} key={`${rec.id}-${index}`}>
                                                    <RecItem rec={rec} />
                                                </div>
                                            );
                                        } else {
                                            return <RecItem key={`${rec.id}-${index}`} rec={rec} />;
                                        }
                                    })}
                                </div>

                                {/* Loading Indicator at bottom */}
                                {loadingRecs && (
                                    <div className="py-4 flex justify-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                                    </div>
                                )}

                                {!hasMoreRecs && recommendations.length > 0 && (
                                    <div className="text-center py-4 text-xs text-gray-600">Đã hiển thị hết danh sách</div>
                                )}

                                {!loadingRecs && recommendations.length === 0 && (
                                    <div className="text-center py-8 text-gray-500 text-sm">Không tìm thấy nội dung tương tự.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <DonateModal isOpen={showDonateModal} onClose={() => setShowDonateModal(false)} channelId={stream.channel?.id} streamId={stream.id} />
        </div>
    );
};

const RecItem = ({ rec }) => (
    <Link to={`/stream/${rec.id}`} className="group flex gap-3 items-start hover:bg-white/5 p-2 rounded-lg transition-colors">
        <div className="relative w-36 aspect-video bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 border border-gray-800 group-hover:border-violet-500/50 transition-all">
            <img
                src={rec.thumbnail_url || "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=300&q=80"}
                className="w-full h-full object-cover"
                alt={rec.title}
                onError={(e) => { e.target.src = "https://via.placeholder.com/300x169?text=No+Thumb"; }}
            />
            {rec.status === 'live' ? (
                <div className="absolute top-1 left-1 bg-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded text-white flex items-center gap-1">
                    <span className="animate-pulse">●</span> LIVE
                </div>
            ) : (
                <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 rounded text-[10px] font-medium text-white">VOD</div>
            )}
        </div>
        <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-gray-200 group-hover:text-violet-400 line-clamp-2 leading-snug mb-1 transition-colors">{rec.title}</h4>
            <p className="text-xs text-gray-400 truncate hover:text-gray-300">{rec.channel?.title}</p>
            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-gray-500">
                <Calendar size={12} className="text-gray-500" />
                <span>
                    {rec.created_at
                        ? new Date(rec.created_at).toLocaleDateString('vi-VN')
                        : "Vừa xong"}
                </span>
            </div>
        </div>
    </Link>
);

export default StreamRoomPage;