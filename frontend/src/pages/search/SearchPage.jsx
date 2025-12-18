import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import streamApi from "../../api/streamApi.js";
import channelApi from "../../api/channelApi.js";
import GlobalHeader from "../../components/common/GlobalHeader.jsx";
import Button from "../../components/common/Button.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { Bell, BellOff } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast} from "../../context/ToastContext.jsx";

const ITEM_LIMIT = 4; // Giới hạn item mỗi lần tải

const SearchPage = () => {
    const { user } = useAuth();
    const toast = useToast();
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';

    const [tab, setTab] = useState('all');

    const [channels, setChannels] = useState([]);
    const [streams, setStreams] = useState([]);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(false);

    // Quản lý phân trang riêng cho từng mục
    const [pageChannel, setPageChannel] = useState(1);
    const [hasMoreChannel, setHasMoreChannel] = useState(true);

    const [pageStream, setPageStream] = useState(1);
    const [hasMoreStream, setHasMoreStream] = useState(true);

    const [pageVideo, setPageVideo] = useState(1);
    const [hasMoreVideo, setHasMoreVideo] = useState(true);

    // Reset state khi query hoặc tab thay đổi
    useEffect(() => {
        setChannels([]);
        setStreams([]);
        setVideos([]);
        setPageChannel(1);
        setPageStream(1);
        setPageVideo(1);
        setHasMoreChannel(true);
        setHasMoreStream(true);
        setHasMoreVideo(true);

        fetchData(
            1,
            tab === 'all' || tab === 'channel',
            tab === 'all' || tab === 'stream',
            tab === 'all' || tab === 'video'
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, tab]);

    // Hàm fetch chung, nhận page cụ thể cho loại dữ liệu cần fetch
    const fetchData = async (page, fetchCh, fetchStr, fetchVid) => {
        setLoading(true);
        const offset = (page - 1) * ITEM_LIMIT; // Sử dụng ITEM_LIMIT = 4

        try {
            // --- Fetch Channels ---
            if (fetchCh) {
                let chData = await channelApi.search({ searchText: query, limit: ITEM_LIMIT, offset });

                if (user) {
                    chData = await Promise.all(chData.map(async (ch) => {
                        try {
                            const sub = await channelApi.checkSubscription(ch.id);
                            return {
                                ...ch,
                                isSubscribed: !!sub,
                                notificationEnabled: sub ? sub.notification_enabled : false
                            };
                        } catch (e) {
                            return { ...ch, isSubscribed: false, notificationEnabled: false };
                        }
                    }));
                }

                if (chData.length < ITEM_LIMIT) setHasMoreChannel(false);
                setChannels(prev => page === 1 ? chData : [...prev, ...chData]);
            }

            // --- Fetch Streams (Live) ---
            if (fetchStr) {
                const strData = await streamApi.search({ searchText: query, status: "live", limit: ITEM_LIMIT, offset });

                if (strData.length < ITEM_LIMIT) setHasMoreStream(false);

                const streamsWithAvatar = await Promise.all(strData.map(async (stream) => {
                    if (stream.channel?.id) {
                        try {
                            const c = await channelApi.getById(stream.channel.id);
                            if(c) return { ...stream, channel: { ...stream.channel, avatar_url: c.avatar_url } };
                        } catch (err) { /* empty */ }
                    }
                    return stream;
                }));
                setStreams(prev => page === 1 ? streamsWithAvatar : [...prev, ...streamsWithAvatar]);
            }

            // --- Fetch Videos (End) ---
            if (fetchVid) {
                const vidData = await streamApi.search({ searchText: query, status: "end", limit: ITEM_LIMIT, offset });

                if (vidData.length < ITEM_LIMIT) setHasMoreVideo(false);

                const videosWithAvatar = await Promise.all(vidData.map(async (video) => {
                    if (video.channel?.id) {
                        try {
                            const c = await channelApi.getById(video.channel.id);
                            if(c) return { ...video, channel: { ...video.channel, avatar_url: c.avatar_url } };
                        } catch (err) { /* empty */ }
                    }
                    return video;
                }));
                setVideos(prev => page === 1 ? videosWithAvatar : [...prev, ...videosWithAvatar]);
            }

        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    // --- Handlers Đăng ký ---
    const handleSubscribe = async (channelId) => {
        if (!user) return toast.warning("Vui lòng đăng nhập để đăng ký kênh.");
        try {
            await channelApi.subscribe(channelId, false);
            setChannels(prev => prev.map(ch =>
                ch.id === channelId ? { ...ch, isSubscribed: true, notificationEnabled: false } : ch
            ));
            toast.success("Đăng ký kênh thành công!");
        } catch (error) { toast.error("Đăng ký thất bại: " + error.message); }
    };

    const handleUnsubscribe = async (channelId) => {
        try {
            await channelApi.unsubscribe(channelId);
            setChannels(prev => prev.map(ch =>
                ch.id === channelId ? { ...ch, isSubscribed: false, notificationEnabled: false } : ch
            ));
            toast.success("Đã hủy đăng ký.");
        } catch (error) { toast.error("Hủy đăng ký thất bại: " + error.message); }
    };

    const handleToggleNotification = async (channelId, currentStatus) => {
        try {
            const newStatus = !currentStatus;
            await channelApi.updateSubscription(channelId, newStatus);
            setChannels(prev => prev.map(ch =>
                ch.id === channelId ? { ...ch, notificationEnabled: newStatus } : ch
            ));
            toast.success(newStatus ? "Đã bật thông báo." : "Đã tắt thông báo.");
        } catch (error) { toast.error("Lỗi cập nhật thông báo: " + error.message); }
    };

    // --- Handlers Load More Riêng Biệt ---
    const handleLoadMoreChannel = () => {
        const next = pageChannel + 1;
        setPageChannel(next);
        fetchData(next, true, false, false);
    };

    const handleLoadMoreStream = () => {
        const next = pageStream + 1;
        setPageStream(next);
        fetchData(next, false, true, false);
    };

    const handleLoadMoreVideo = () => {
        const next = pageVideo + 1;
        setPageVideo(next);
        fetchData(next, false, false, true);
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col">
            <GlobalHeader />
            <div className="flex-1 p-8 max-w-screen-2xl mx-auto w-full">
                <h2 className="text-2xl font-bold mb-6">Kết quả tìm kiếm cho "{query}"</h2>

                <div className="flex gap-6 border-b border-gray-800 mb-8">
                    {['all', 'channel', 'stream', 'video'].map(t => (
                        <button key={t} onClick={() => setTab(t)} className={`pb-3 font-medium text-sm capitalize ${tab === t ? 'text-violet-400 border-b-2 border-violet-400' : 'text-gray-400 hover:text-white'}`}>
                            {t === 'all' ? 'Tất cả' : t === 'channel' ? 'Kênh' : t === 'stream' ? 'Livestream' : 'Video'}
                        </button>
                    ))}
                </div>

                <div className="space-y-10">
                    {/* --- Channels Section --- */}
                    {(tab === 'all' || tab === 'channel') && channels.length > 0 && (
                        <section>
                            <h3 className="text-lg font-bold mb-4 text-gray-300">Kênh</h3>
                            <div className="space-y-4">
                                {channels.map(ch => (
                                    <div key={ch.id} className="flex items-center gap-4 bg-gray-900 p-4 rounded-xl border border-gray-800 hover:border-gray-600 transition-all">
                                        <Link to={`/channel/${ch.id}`} className="flex-shrink-0">
                                            <img
                                                src={ch.avatar_url || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"}
                                                className="w-16 h-16 rounded-full object-cover bg-gray-800 hover:opacity-80 transition-opacity"
                                                onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${ch.title}`; }}
                                                alt={ch.title}
                                            />
                                        </Link>
                                        <div className="flex-1">
                                            <Link to={`/channel/${ch.id}`}>
                                                <h4 className="font-bold text-lg hover:text-violet-400 transition-colors inline-block">{ch.title}</h4>
                                            </Link>
                                            <p className="text-sm text-gray-400">{ch.subscription_count || 0} người đăng ký</p>
                                            <p className="text-sm text-gray-500 truncate mt-1">{ch.description}</p>
                                        </div>

                                        <div className="flex gap-2">
                                            {ch.isSubscribed ? (
                                                <>
                                                    <button
                                                        onClick={() => handleToggleNotification(ch.id, ch.notificationEnabled)}
                                                        className={`p-2 rounded-lg border ${ch.notificationEnabled ? 'bg-gray-700 text-yellow-400 border-gray-600' : 'bg-transparent text-gray-400 border-gray-700 hover:text-white'}`}
                                                        title={ch.notificationEnabled ? "Tắt thông báo" : "Bật thông báo"}
                                                    >
                                                        {ch.notificationEnabled ? <Bell size={20} fill="currentColor" /> : <BellOff size={20} />}
                                                    </button>
                                                    <Button
                                                        variant="secondary"
                                                        onClick={() => handleUnsubscribe(ch.id)}
                                                        className="bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-red-400"
                                                    >
                                                        Đang theo dõi
                                                    </Button>
                                                </>
                                            ) : (
                                                <Button variant="primary" onClick={() => handleSubscribe(ch.id)}>
                                                    Đăng ký
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* Nút Xem thêm cho Kênh */}
                            {hasMoreChannel && (
                                <div className="mt-6 text-center">
                                    <Button variant="ghost" onClick={handleLoadMoreChannel} isLoading={loading}>Xem thêm kênh</Button>
                                </div>
                            )}
                        </section>
                    )}

                    {/* --- Streams Section --- */}
                    {(tab === 'all' || tab === 'stream') && streams.length > 0 && (
                        <section>
                            <h3 className="text-lg font-bold mb-4 text-gray-300">Livestream</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {streams.map(s => (
                                    <div key={s.id} className="group block">
                                        <Link to={`/stream/${s.id}`} className="cursor-pointer">
                                            <div className="relative aspect-video bg-gray-800 rounded-xl overflow-hidden mb-3 border border-gray-800 group-hover:border-violet-500/50 transition-all">
                                                <img src={s.thumbnail_url || "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80"} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all" onError={(e) => { e.target.src = "https://via.placeholder.com/640x360?text=No+Thumbnail"; }} alt={s.title}/>
                                                <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">LIVE</div>
                                            </div>
                                        </Link>

                                        <div className="flex gap-3">
                                            <Link to={`/channel/${s.channel?.id}`} className="h-10 w-10 rounded-full bg-gray-700 flex-shrink-0 overflow-hidden hover:ring-2 hover:ring-violet-500 transition-all">
                                                <img src={s.channel?.avatar_url || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"} className="h-full w-full object-cover" onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${s.channel?.title}`; }} alt={s.channel?.title}/>
                                            </Link>
                                            <div className="min-w-0">
                                                <Link to={`/stream/${s.id}`}>
                                                    <h3 className="text-white font-bold text-sm truncate group-hover:text-violet-400 cursor-pointer">{s.title}</h3>
                                                </Link>
                                                <Link to={`/channel/${s.channel?.id}`} className="block w-fit">
                                                    <p className="text-gray-400 text-xs mt-1 truncate hover:text-violet-400 hover:underline transition-colors">{s.channel?.title}</p>
                                                </Link>
                                                <p className="text-gray-500 text-xs mt-0.5">{s.category?.title}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* Nút Xem thêm cho Stream */}
                            {hasMoreStream && (
                                <div className="mt-6 text-center">
                                    <Button variant="ghost" onClick={handleLoadMoreStream} isLoading={loading}>Xem thêm stream</Button>
                                </div>
                            )}
                        </section>
                    )}

                    {/* --- Videos Section --- */}
                    {(tab === 'all' || tab === 'video') && videos.length > 0 && (
                        <section>
                            <h3 className="text-lg font-bold mb-4 text-gray-300">Video</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {videos.map(v => (
                                    <div key={v.id} className="group block">
                                        <Link to={`/stream/${v.id}`} className="cursor-pointer">
                                            <div className="relative aspect-video bg-gray-800 rounded-xl overflow-hidden mb-3 border border-gray-800 group-hover:border-violet-500/50 transition-all">
                                                <img src={v.thumbnail_url || "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80"} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all" onError={(e) => { e.target.src = "https://via.placeholder.com/640x360?text=No+Thumbnail"; }} alt={v.title}/>
                                                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded">VOD</div>
                                            </div>
                                        </Link>

                                        <div className="flex gap-3">
                                            <Link to={`/channel/${v.channel?.id}`} className="h-10 w-10 rounded-full bg-gray-700 flex-shrink-0 overflow-hidden hover:ring-2 hover:ring-violet-500 transition-all">
                                                <img src={v.channel?.avatar_url || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"} className="h-full w-full object-cover" onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${v.channel?.title}`; }} alt={v.channel?.title}/>
                                            </Link>

                                            <div className="min-w-0">
                                                <Link to={`/stream/${v.id}`}>
                                                    <h3 className="text-white font-bold text-sm truncate group-hover:text-violet-400 cursor-pointer">{v.title}</h3>
                                                </Link>
                                                <Link to={`/channel/${v.channel?.id}`} className="block w-fit">
                                                    <p className="text-gray-400 text-xs mt-1 truncate hover:text-violet-400 hover:underline transition-colors">{v.channel?.title}</p>
                                                </Link>

                                                <p className="text-gray-500 text-xs mt-0.5">{v.category?.title}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* Nút Xem thêm cho Video */}
                            {hasMoreVideo && (
                                <div className="mt-6 text-center">
                                    <Button variant="ghost" onClick={handleLoadMoreVideo} isLoading={loading}>Xem thêm video</Button>
                                </div>
                            )}
                        </section>
                    )}

                    {!loading && channels.length === 0 && streams.length === 0 && videos.length === 0 && <div className="text-center text-gray-500 py-10">Không tìm thấy kết quả nào.</div>}
                </div>
            </div>
        </div>
    );
};

export default SearchPage;