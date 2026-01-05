import { useEffect, useState } from "react";
import streamApi from "../../api/streamApi.js";
import categoryApi from "../../api/categoryApi.js";
import Button from "../../components/common/Button.jsx";
import { Link } from "react-router-dom";
import GlobalHeader from "../../components/common/GlobalHeader.jsx";
import channelApi from "../../api/channelApi.js";
import CategorySidebar from "../../components/common/CategorySidebar.jsx";

const POPULAR_GAMES = [
    "Dota 2",
    "PUBG: Battlegrounds",
    "Fortnite",
    "Apex Legends",
    "Call of Duty: Warzone",
    "Minecraft",
    "League of Legends"
];

const ITEM_LIMIT = 4;

const HomePage = () => {
    // --- State cho Live Streams ---
    const [streams, setStreams] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);

    // --- State cho Past Streams ---
    const [pastStreams, setPastStreams] = useState([]);
    const [pastPage, setPastPage] = useState(1);
    const [hasMorePast, setHasMorePast] = useState(true);
    const [loadingPast, setLoadingPast] = useState(false);

    // --- State cho Categories ---
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);

    // 1. Fetch Popular Categories
    const fetchPopularCategories = async () => {
        setLoadingCategories(true);
        try {
            const promises = POPULAR_GAMES.map(gameName =>
                categoryApi.getList({ searchText: gameName, limit: 1 })
            );

            const results = await Promise.all(promises);
            const validCategories = results
                .map(res => res && res.length > 0 ? res[0] : null)
                .filter(item => item !== null);

            setCategories(validCategories);
        } catch (error) {
            console.error("Failed to fetch popular categories:", error);
        } finally {
            setLoadingCategories(false);
        }
    };

    // Helper function để lấy avatar kênh (dùng chung)
    const attachChannelAvatar = async (streamList) => {
        return await Promise.all(streamList.map(async (stream) => {
            if (stream.channel && stream.channel.id) {
                try {
                    const channelInfo = await channelApi.getById(stream.channel.id);
                    if (channelInfo) {
                        return {
                            ...stream,
                            channel: {
                                ...stream.channel,
                                avatar_url: channelInfo.avatar_url
                            }
                        };
                    }
                } catch (err) {
                    console.error(`Lỗi lấy info kênh ${stream.channel.id}`, err);
                }
            }
            return stream;
        }));
    };

    // 2. Fetch Live Streams
    const fetchStreams = async (pageIdx) => {
        setLoading(true);
        try {
            const offset = (pageIdx - 1) * ITEM_LIMIT;
            // Thay đổi limit thành ITEM_LIMIT (4)
            const data = await streamApi.search({ searchText: "", status: "live", limit: ITEM_LIMIT, offset });

            if (data.length < ITEM_LIMIT) setHasMore(false);

            const streamsWithAvatar = await attachChannelAvatar(data);

            setStreams(prev => pageIdx === 1 ? streamsWithAvatar : [...prev, ...streamsWithAvatar]);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // 3. Fetch Past Streams (Cập nhật logic phân trang)
    const fetchPastStreams = async (pageIdx) => {
        setLoadingPast(true);
        try {
            const offset = (pageIdx - 1) * ITEM_LIMIT;
            // Thay đổi limit thành ITEM_LIMIT (4) và thêm offset
            const data = await streamApi.search({ searchText: "", status: "end", limit: ITEM_LIMIT, offset });

            if (data.length < ITEM_LIMIT) setHasMorePast(false);

            const streamsWithAvatar = await attachChannelAvatar(data);

            setPastStreams(prev => pageIdx === 1 ? streamsWithAvatar : [...prev, ...streamsWithAvatar]);
        } catch (e) {
            console.error("Failed to fetch past streams:", e);
        } finally {
            setLoadingPast(false);
        }
    };

    // Initial Load
    useEffect(() => {
        fetchPopularCategories();
        fetchStreams(1);
        fetchPastStreams(1);
    }, []);

    // Handlers Load More
    const handleLoadMoreLive = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchStreams(nextPage);
    };

    const handleLoadMorePast = () => {
        const nextPage = pastPage + 1;
        setPastPage(nextPage);
        fetchPastStreams(nextPage);
    };

    // Helper format date
    const formatDate = (dateString) => {
        if (!dateString) return "Đã kết thúc";
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    return (
        <div className="min-h-screen bg-gray-950">
            {/* Category Sidebar */}
            <CategorySidebar />
            
            {/* Header Section */}
            <GlobalHeader />

            {/* Main content with left margin to accommodate sidebar */}
            <main className="p-8 max-w-screen-2xl mx-auto ml-20 transition-all duration-300">
                {/* --- Section: Danh mục phổ biến --- */}
                <section className="mb-10">
                    <h2 className="text-2xl font-bold text-white mb-6">Danh mục phổ biến</h2>

                    {loadingCategories ? (
                        <div className="flex gap-4 overflow-hidden">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="w-[150px] h-[200px] bg-gray-800 rounded-lg animate-pulse flex-shrink-0" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-4">
                            {categories.map((cat) => (
                                <Link
                                    key={cat.id}
                                    to={`/search?q=${encodeURIComponent(cat.title)}`}
                                    className="block group flex-shrink-0" // Đã loại bỏ class định nghĩa độ rộng cố định
                                >
                                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-800 mb-2 border border-gray-800 group-hover:border-violet-500 transition-all shadow-lg">
                                        <img
                                            src={cat.image_url || `https://ui-avatars.com/api/?name=${cat.title}&background=random&size=200`}
                                            alt={cat.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = "https://via.placeholder.com/150x200?text=No+Image";
                                            }}
                                        />
                                    </div>
                                    <h3 className="text-gray-300 font-semibold text-sm truncate group-hover:text-violet-400 text-center">
                                        {cat.title}
                                    </h3>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>

                {/* --- Section: Đang phát trực tiếp --- */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-white mb-6">Đang phát trực tiếp</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {streams.map((item) => (
                            <div key={item.id} className="group block">
                                <Link to={`/stream/${item.id}`} className="cursor-pointer">
                                    <div className="relative aspect-video bg-gray-800 rounded-xl overflow-hidden mb-3 border border-gray-800 group-hover:border-violet-500/50 transition-all">
                                        <img src={item.thumbnail_url || `https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80`}
                                             className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all" alt={item.title} />
                                        <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">LIVE</div>
                                    </div>
                                </Link>

                                <div className="flex gap-3">
                                    <Link to={`/channel/${item.channel?.id}`} className="h-10 w-10 rounded-full bg-gray-700 flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-violet-500 transition-all">
                                        <img
                                            src={item.channel.avatar_url || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"}
                                            alt={item.channel.title}
                                            className="h-full w-full rounded-full object-cover" />
                                    </Link>

                                    <div className="min-w-0">
                                        <Link to={`/stream/${item.id}`} className="cursor-pointer">
                                            <h3 className="text-white font-bold text-sm truncate group-hover:text-violet-400">{item.title}</h3>
                                        </Link>

                                        <Link to={`/channel/${item.channel?.id}`} className="block w-fit">
                                            <p className="text-gray-400 text-xs mt-1 truncate hover:text-violet-400 hover:underline transition-colors">
                                                {item.channel?.title}
                                            </p>
                                        </Link>
                                        <p className="text-gray-500 text-xs mt-0.5">{item.category?.title}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Nút Xem thêm cho Live Stream */}
                    {hasMore && (
                        <div className="mt-8 flex justify-center">
                            <Button variant="secondary" onClick={handleLoadMoreLive} isLoading={loading}>Xem thêm</Button>
                        </div>
                    )}
                </section>

                {/* --- Section: Khám phá các LiveStream trước đây --- */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-white mb-6">Khám phá các LiveStream trước đây</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {pastStreams.map((item) => (
                            <div key={item.id} className="group block">
                                {/* Link cho Thumbnail */}
                                <Link to={`/stream/${item.id}`} className="cursor-pointer">
                                    <div className="relative aspect-video bg-gray-800 rounded-xl overflow-hidden mb-3 border border-gray-800 group-hover:border-violet-500/50 transition-all">
                                        <img src={item.thumbnail_url || `https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80`}
                                             className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all" alt={item.title} />

                                        {/* Badge cho Past Stream */}
                                        <div className="absolute top-2 left-2 bg-gray-900/90 text-gray-300 text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-sm">
                                            {formatDate(item.created_at)}
                                        </div>
                                    </div>
                                </Link>

                                <div className="flex gap-3">
                                    <Link to={`/channel/${item.channel?.id}`} className="h-10 w-10 rounded-full bg-gray-700 flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-violet-500 transition-all">
                                        <img src={item.channel.avatar_url || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"}
                                             alt={item.channel.title}
                                             className="h-full w-full rounded-full object-cover" />
                                    </Link>

                                    <div className="min-w-0">
                                        <Link to={`/stream/${item.id}`} className="cursor-pointer">
                                            <h3 className="text-white font-bold text-sm truncate group-hover:text-violet-400">{item.title}</h3>
                                        </Link>

                                        <Link to={`/channel/${item.channel?.id}`} className="block w-fit">
                                            <p className="text-gray-400 text-xs mt-1 truncate hover:text-violet-400 hover:underline transition-colors">
                                                {item.channel?.title}
                                            </p>
                                        </Link>
                                        <p className="text-gray-500 text-xs mt-0.5">{item.category?.title}</p>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Loading skeleton khi load more cho Past Streams */}
                        {loadingPast && pastStreams.length > 0 && (
                            [...Array(4)].map((_, i) => (
                                <div key={`skel-past-${i}`} className="aspect-video bg-gray-800/50 rounded-xl animate-pulse"></div>
                            ))
                        )}
                    </div>

                    {loadingPast && pastStreams.length === 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="aspect-video bg-gray-800 rounded-xl animate-pulse"></div>
                            ))}
                        </div>
                    )}

                    {pastStreams.length === 0 && !loadingPast && (
                        <div className="text-gray-500 text-center py-8">Chưa có video nào.</div>
                    )}

                    {/* Nút Xem thêm cho Past Stream */}
                    {hasMorePast && pastStreams.length > 0 && (
                        <div className="mt-8 flex justify-center">
                            <Button variant="secondary" onClick={handleLoadMorePast} isLoading={loadingPast}>Xem thêm</Button>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default HomePage;