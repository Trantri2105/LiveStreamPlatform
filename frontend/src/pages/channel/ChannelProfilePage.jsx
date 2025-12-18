import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import channelApi from "../../api/channelApi.js";
import streamApi from "../../api/streamApi.js";
import Button from "../../components/common/Button.jsx";
import { CheckCircle, Mail, Calendar, ChevronLeft, Bell, BellOff, Heart, PlayCircle, Clock } from "lucide-react";
import { useAuth } from "../../hooks/useAuth.js";
import { useToast } from "../../context/ToastContext.jsx";

const ChannelProfilePage = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const toast = useToast();

    const [channelData, setChannelData] = useState(null);
    const [tab, setTab] = useState('home');

    // Tách state cho Live và Video cũ
    const [liveStreams, setLiveStreams] = useState([]);
    const [pastStreams, setPastStreams] = useState([]);

    const [loading, setLoading] = useState(true);

    const [isSubscribed, setIsSubscribed] = useState(false);
    const [notificationEnabled, setNotificationEnabled] = useState(false);
    const [loadingSub, setLoadingSub] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const chData = await channelApi.getById(id);
                setChannelData(chData);

                if (chData) {
                    const sData = await streamApi.getByChannel(id);

                    // Lọc Live stream
                    setLiveStreams(sData.filter(s => s.status === 'live'));

                    // Lọc Video đã kết thúc (Lưu ý: status là 'end')
                    setPastStreams(sData.filter(s => s.status === 'end'));
                    if (user) {
                        try {
                            const sub = await channelApi.checkSubscription(id);
                            if (sub) {
                                setIsSubscribed(true);
                                setNotificationEnabled(sub.notification_enabled);
                            } else {
                                setIsSubscribed(false);
                                setNotificationEnabled(false);
                            }
                            // eslint-disable-next-line no-unused-vars
                        } catch (e) {
                            // Không log lỗi 404 nếu chưa đăng ký để tránh rác console
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching channel:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, user]);

    const handleToggleSubscribe = async () => {
        if (!user) return toast.error("Vui lòng đăng nhập để đăng ký kênh.");
        setLoadingSub(true);
        try {
            if (isSubscribed) {
                await channelApi.unsubscribe(id);
                setIsSubscribed(false);
                setNotificationEnabled(false);
                toast.success("Đã hủy đăng ký.");
            } else {
                await channelApi.subscribe(id, false);
                setIsSubscribed(true);
                setNotificationEnabled(false);
                toast.success("Đăng ký thành công!");
            }
        } catch (error) {
            toast.error("Lỗi: " + error.message);
        } finally {
            setLoadingSub(false);
        }
    };

    const handleToggleNotification = async () => {
        if (!isSubscribed) return;
        try {
            const newStatus = !notificationEnabled;
            await channelApi.updateSubscription(id, newStatus);
            setNotificationEnabled(newStatus);
            toast.success(newStatus ? "Đã bật thông báo" : "Đã tắt thông báo");
            // eslint-disable-next-line no-unused-vars
        } catch (error) {
            toast.error("Lỗi cập nhật thông báo");
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Loading...</div>;
    if (!channelData) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Không tìm thấy kênh.</div>;

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* --- Header / Banner Area --- */}
            <div className="w-full h-60 relative bg-gray-900">
                {/* Background Image */}
                <div className="absolute inset-0 overflow-hidden">
                    {channelData.background_url ? (
                        <img src={channelData.background_url} className="w-full h-full object-cover opacity-90" alt="Channel Background"/>
                    ) : (
                        <div className="w-full h-full bg-gradient-to-r from-violet-900 to-indigo-900"></div>
                    )}
                    <div className="absolute inset-0 bg-black/20"></div>
                </div>

                <Link to="/" className="absolute top-6 left-6 z-20 flex items-center gap-2 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 px-4 py-2 rounded-lg backdrop-blur-sm transition-all font-medium">
                    <ChevronLeft size={20} /> Quay lại
                </Link>

                <div className="max-w-7xl mx-auto px-6 h-full relative z-10">
                    <div className="absolute -bottom-12 left-6 flex items-end gap-6">
                        {/* Avatar */}
                        <div className="relative w-32 h-32 rounded-full border-4 border-gray-950 bg-gray-800 overflow-hidden shadow-xl">
                            <img
                                src={channelData.avatar_url || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"}
                                className="w-full h-full object-cover"
                                alt="Avatar"
                            />
                        </div>

                        {/* Info */}
                        <div className="mb-2 pb-1">
                            <h1 className="text-3xl font-bold flex items-center gap-2 text-white drop-shadow-md">
                                {channelData.title}
                                <CheckCircle size={20} className="text-blue-400 fill-current" />
                            </h1>
                            <p className="text-gray-200 drop-shadow-md text-sm font-medium">
                                {channelData.subscription_count || 0} người theo dõi
                            </p>
                        </div>
                    </div>

                    {/* Subscribe Buttons */}
                    <div className="absolute bottom-4 right-6 flex gap-2">
                        {isSubscribed && (
                            <button
                                onClick={handleToggleNotification}
                                className={`p-2.5 rounded-lg border transition-colors backdrop-blur-sm ${notificationEnabled ? 'bg-gray-900/80 text-yellow-400 border-gray-600' : 'bg-black/20 text-gray-300 border-white/20 hover:bg-black/40'}`}
                                title={notificationEnabled ? "Tắt thông báo" : "Bật thông báo"}
                            >
                                {notificationEnabled ? <Bell size={20} fill="currentColor" /> : <BellOff size={20} />}
                            </button>
                        )}
                        <Button
                            variant={isSubscribed ? "secondary" : "primary"}
                            className={`!px-6 !py-2 shadow-lg ${isSubscribed ? 'bg-gray-900/80 backdrop-blur border-gray-600 text-gray-300 hover:text-red-400' : ''}`}
                            onClick={handleToggleSubscribe}
                            isLoading={loadingSub}
                            icon={!isSubscribed ? Heart : undefined}
                        >
                            {isSubscribed ? "Đang theo dõi" : "Đăng ký"}
                        </Button>
                    </div>
                </div>
            </div>

            {/* --- Tabs Navigation --- */}
            <div className="mt-16 max-w-7xl mx-auto px-6 border-b border-gray-800">
                <div className="flex gap-8 overflow-x-auto scrollbar-hide">
                    <button onClick={() => setTab('home')} className={`pb-3 font-medium text-sm whitespace-nowrap transition-colors ${tab === 'home' ? 'text-violet-400 border-b-2 border-violet-400' : 'text-gray-400 hover:text-white'}`}>Trang chủ</button>
                    <button onClick={() => setTab('videos')} className={`pb-3 font-medium text-sm whitespace-nowrap transition-colors ${tab === 'videos' ? 'text-violet-400 border-b-2 border-violet-400' : 'text-gray-400 hover:text-white'}`}>Video</button>
                    <button onClick={() => setTab('about')} className={`pb-3 font-medium text-sm whitespace-nowrap transition-colors ${tab === 'about' ? 'text-violet-400 border-b-2 border-violet-400' : 'text-gray-400 hover:text-white'}`}>Giới thiệu</button>
                </div>
            </div>

            {/* --- Content Area --- */}
            <div className="max-w-7xl mx-auto px-6 py-8">

                {/* Tab Home: Shows Live Streams + Preview of Videos */}
                {tab === 'home' && (
                    <div className="space-y-8">
                        {/* Section: Live Now */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                Livestream đang diễn ra
                            </h3>
                            {liveStreams.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {liveStreams.map(stream => (
                                        <Link to={`/stream/${stream.id}`} key={stream.id} className="block group">
                                            <div className="relative aspect-video bg-gray-800 rounded-xl overflow-hidden mb-2 border border-gray-800 group-hover:border-violet-500/50 transition-all shadow-lg">
                                                <img
                                                    src={stream.thumbnail_url || "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80"}
                                                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-all group-hover:scale-105"
                                                    onError={(e) => { e.target.src = "https://via.placeholder.com/640x360?text=No+Thumbnail"; }}
                                                    alt={stream.title}
                                                />
                                                <div className="absolute top-2 left-2 bg-red-600 text-xs font-bold px-2 py-0.5 rounded text-white shadow-sm flex items-center gap-1">
                                                    <span className="animate-pulse">●</span> LIVE
                                                </div>

                                            </div>
                                            <div className="flex gap-3">
                                                <div>
                                                    <h4 className="font-bold text-white group-hover:text-violet-400 line-clamp-2 leading-snug">{stream.title}</h4>
                                                    <p className="text-xs text-gray-400 mt-1">{stream.category?.title || "Tổng hợp"}</p>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 bg-gray-900/50 rounded-xl border border-gray-800 text-center">
                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-800 mb-3 text-gray-500">
                                        <BellOff size={24} />
                                    </div>
                                    <p className="text-gray-400">Hiện tại kênh này không livestream.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Tab Videos: Shows Past Streams (status="end") */}
                {tab === 'videos' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <PlayCircle size={20} className="text-violet-400"/>
                            Video đã phát
                        </h3>
                        {pastStreams.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6">
                                {pastStreams.map(stream => (
                                    <Link to={`/stream/${stream.id}`} key={stream.id} className="block group">
                                        <div className="relative aspect-video bg-gray-800 rounded-xl overflow-hidden mb-2 border border-gray-800 group-hover:border-gray-600 transition-all">
                                            <img
                                                src={stream.thumbnail_url || "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80"}
                                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all"
                                                onError={(e) => { e.target.src = "https://via.placeholder.com/640x360?text=No+Thumbnail"; }}
                                                alt={stream.title}
                                            />
                                            {/* Duration Placeholder (Since API usually provides this) */}
                                            <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 rounded text-[10px] font-medium text-white">
                                                VOD
                                            </div>
                                        </div>
                                        <div className="pr-2">
                                            <h4 className="font-semibold text-sm text-gray-100 group-hover:text-white line-clamp-2 leading-snug mb-1">
                                                {stream.title}
                                            </h4>
                                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                                <span>{formatDate(stream.ended_at || stream.created_at)}</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 bg-gray-900/30 rounded-xl border border-dashed border-gray-800">
                                <PlayCircle size={48} className="text-gray-700 mb-3" />
                                <p className="text-gray-500 font-medium">Chưa có video nào.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab About */}
                {tab === 'about' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 bg-gray-900 p-6 rounded-xl border border-gray-800">
                            <h3 className="font-bold mb-4 text-lg">Giới thiệu</h3>
                            <p className="text-gray-300 text-sm leading-relaxed mb-6 whitespace-pre-wrap">
                                {channelData.description || "Chưa có mô tả cho kênh này."}
                            </p>

                            <h4 className="font-bold mb-3 text-base pt-4 border-t border-gray-800">Chi tiết</h4>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-gray-400 text-sm">
                                    <Calendar size={16}/>
                                    <span>Tham gia: {formatDate(channelData.created_at || new Date())}</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-400 text-sm">
                                    <Clock size={16} />
                                    <span>Tổng số video: {pastStreams.length}</span>
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
};

export default ChannelProfilePage;