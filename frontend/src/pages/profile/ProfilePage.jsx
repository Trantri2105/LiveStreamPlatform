import { useEffect, useState } from "react";
import {Link, useNavigate} from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import channelApi from "../../api/channelApi.js";
import userApi from "../../api/userApi.js";
import streamApi from "../../api/streamApi.js";
import Button from "../../components/common/Button.jsx";
import Input from "../../components/common/Input.jsx";
import {
    Edit3, X, Mail, Calendar, ChevronLeft,
    Wallet, ImageIcon, CheckCircle, Users, Bell, BellOff, Play
} from "lucide-react";
import { useToast} from "../../context/ToastContext.jsx";

const ProfilePage = () => {
    const navigate = useNavigate();
    const { user, channel, refreshChannel, refreshUser } = useAuth();
    const toast = useToast();
    const [tab, setTab] = useState('home'); // home, videos, following, followers, donate-history, revenue, about
    const [showEditModal, setShowEditModal] = useState(false);

    // Stream States
    const [myStreams, setMyStreams] = useState([]); // Live streams
    const [endedStreams, setEndedStreams] = useState([]); // VOD / Ended streams

    // Following & Followers States
    const [following, setFollowing] = useState([]);
    const [followersList, setFollowersList] = useState([]);
    const [loadingFollow, setLoadingFollow] = useState(false);

    // Loading chung cho các action edit
    const [loading, setLoading] = useState(false);

    // 1. Fetch Streams (Live & Ended)
    useEffect(() => {
        const fetchMyStreams = async () => {
            if (channel?.id) {
                try {
                    const streams = await streamApi.getByChannel(channel.id);
                    // Lọc Live stream cho tab Trang chủ
                    setMyStreams(streams.filter(s => s.status === 'live'));
                    // Lọc Ended stream cho tab Video
                    setEndedStreams(streams.filter(s => s.status === 'end'));
                } catch (error) {
                    console.error("Failed to fetch streams", error);
                }
            }
        }
        fetchMyStreams();
    }, [channel]);

    const enrichWithSubStatus = async (channels) => {
        if (!user) return channels.map(ch => ({ ...ch, isSubscribed: false }));
        return await Promise.all(channels.map(async (ch) => {
            try {
                const sub = await channelApi.checkSubscription(ch.id);
                return {
                    ...ch,
                    isSubscribed: !!sub,
                    notificationEnabled: sub ? sub.notification_enabled : false
                };
            } catch {
                return { ...ch, isSubscribed: false, notificationEnabled: false };
            }
        }));
    };

    // Fetch Following & Followers Lists
    useEffect(() => {
        const fetchData = async () => {
            try {
                if (tab === 'following') {
                    setLoadingFollow(true);
                    const list = await channelApi.getFollowing();
                    const enriched = await enrichWithSubStatus(list);
                    setFollowing(enriched);
                    setLoadingFollow(false);
                } else if (tab === 'followers') {
                    setLoadingFollow(true);
                    const list = await channelApi.getFollowers();
                    const enriched = await enrichWithSubStatus(list);
                    setFollowersList(enriched);
                    setLoadingFollow(false);
                }
            } catch (e) { console.error("Error fetching follow data:", e); setLoadingFollow(false); }
        };
        fetchData();
    }, [tab, user]);

    const handleToggleSubscribe = async (channelId, isSubscribed, listType) => {
        if (!user) {
            toast.warning("Vui lòng đăng nhập để thực hiện.");
            return;
        }

        try {
            if (isSubscribed) {
                await channelApi.unsubscribe(channelId);
                toast.success("Đã hủy đăng ký theo dõi.");
            } else {
                await channelApi.subscribe(channelId, false);
                toast.success("Đăng ký theo dõi thành công!");
            }

            const updateList = (prev) => prev.map(ch =>
                ch.id === channelId ? { ...ch, isSubscribed: !isSubscribed, notificationEnabled: false } : ch
            );

            if (listType === 'following') setFollowing(updateList);
            else if (listType === 'followers') setFollowersList(updateList);

        } catch (error) { toast.error("Lỗi: " + (error.message || "Không thể thao tác")); }
    };

    const handleToggleNotification = async (channelId, currentStatus, listType) => {
        try {
            const newStatus = !currentStatus;
            await channelApi.updateSubscription(channelId, newStatus);

            const updateList = (prev) => prev.map(ch =>
                ch.id === channelId ? { ...ch, notificationEnabled: newStatus } : ch
            );

            if (listType === 'following') setFollowing(updateList);
            else if (listType === 'followers') setFollowersList(updateList);

            // eslint-disable-next-line no-unused-vars
        } catch (error) { toast.error("Lỗi cập nhật trạng thái thông báo."); }
    };

    const handleBackgroundChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            setLoading(true);
            await channelApi.setBackground(file);
            await refreshChannel();
            toast.success("Đã cập nhật ảnh bìa thành công!");
        } catch (error) { console.error(error); toast.error("Lỗi upload ảnh bìa: " + error.message); }
        finally { setLoading(false); }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            setLoading(true);
            await channelApi.setAvatar(file);
            await refreshChannel();
            toast.success("Đã cập nhật ảnh đại diện!");
        } catch (error) { console.error(error); toast.error("Lỗi upload avatar: " + error.message); }
        finally { setLoading(false); }
    };

    const handleUpdateInfo = async () => {
        const fname = document.getElementById('edit_fname').value;
        const lname = document.getElementById('edit_lname').value;
        try {
            setLoading(true);
            await userApi.updateProfile({ email: user.email, first_name: fname, last_name: lname });
            await refreshUser();
            toast.success("Cập nhật thông tin cá nhân thành công.");
            setShowEditModal(false);
        } catch(e) { toast.error("Lỗi: " + e.message); } finally { setLoading(false); }
    };
    const handleUpdateChannel = async () => {
        const title = document.getElementById('edit_title').value;
        const desc = document.getElementById('edit_desc').value;
        try {
            setLoading(true);
            await channelApi.update({ title, description: desc });
            await refreshChannel();
            toast.success("Cập nhật thông tin kênh thành công.");
            setShowEditModal(false);
        } catch(e) { toast.error("Lỗi: " + e.message); } finally { setLoading(false); }
    };
    const handleChangePass = async () => {
        const oldP = document.getElementById('old_pass').value;
        const newP = document.getElementById('new_pass').value;
        try {
            setLoading(true);
            await userApi.changePassword({ current_password: oldP, new_password: newP });
            toast.success("Đổi mật khẩu thành công. Vui lòng ghi nhớ mật khẩu mới.");
        } catch(e) { toast.error("Đổi mật khẩu thất bại: " + e.message); } finally { setLoading(false); }
    };


    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* --- Header / Banner Area --- */}
            <div className="w-full h-60 relative group bg-gray-900">
                <div className="absolute inset-0 overflow-hidden">
                    {channel?.background_url ? (
                        <img src={channel.background_url} className="w-full h-full object-cover opacity-90" alt="Channel Background"/>
                    ) : (
                        <div className="w-full h-full bg-gradient-to-r from-violet-900 to-indigo-900"></div>
                    )}
                    <div className="absolute inset-0 bg-black/20"></div>
                </div>
                <Link to="/" className="absolute top-6 left-6 z-20 flex items-center gap-2 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 px-4 py-2 rounded-lg backdrop-blur-sm transition-all font-medium">
                    <ChevronLeft size={20} /> Quay lại trang chủ
                </Link>
                <label className="absolute top-6 right-6 z-20 cursor-pointer bg-black/50 hover:bg-black/70 text-white px-4 py-2 rounded-lg backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 flex items-center gap-2">
                    <ImageIcon size={18} />
                    <span className="text-sm font-medium">Đổi ảnh bìa</span>
                    <input type="file" className="hidden" onChange={handleBackgroundChange} accept="image/*" />
                </label>
                <div className="max-w-7xl mx-auto px-6 h-full relative z-10">
                    <div className="absolute -bottom-12 left-6 flex items-end gap-6">
                        <div className="relative w-32 h-32 rounded-full border-4 border-gray-950 bg-gray-800 overflow-hidden shadow-xl">
                            <img src={channel?.avatar_url || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"} className="w-full h-full object-cover" alt="Avatar"/>
                        </div>
                        <div className="mb-2 pb-1">
                            <h1 className="text-3xl font-bold flex items-center gap-2 text-white drop-shadow-md">
                                {channel?.title}
                                <CheckCircle size={20} className="text-blue-400 fill-current" />
                            </h1>
                            <p className="text-gray-200 drop-shadow-md text-sm font-medium">
                                @{user?.email?.split('@')[0] || 'user'} • {followersList.length || channel?.subscription_count || 0} người theo dõi
                            </p>
                        </div>
                    </div>

                    <div className="absolute bottom-4 right-6 flex gap-3">
                        <Button
                            variant="secondary"
                            className="!py-2 !px-4 !text-sm bg-green-900/50 border-green-800 text-green-400 hover:bg-green-900/80 hover:text-green-300 backdrop-blur"
                            onClick={() => navigate('/studio/revenue')}
                            icon={Wallet}
                        >
                            Quản lý Doanh thu
                        </Button>
                        <Button variant="secondary" className="!py-2 !px-4 !text-sm bg-gray-900/80 backdrop-blur border-gray-600 hover:bg-gray-800 shadow-lg" onClick={() => setShowEditModal(true)} icon={Edit3}>
                            Chỉnh sửa hồ sơ
                        </Button>
                    </div>
                </div>
            </div>

            {/* --- Tabs Navigation --- */}
            <div className="mt-16 max-w-7xl mx-auto px-6 border-b border-gray-800">
                <div className="flex gap-8 overflow-x-auto scrollbar-hide">
                    <button onClick={() => setTab('home')} className={`pb-3 font-medium text-sm whitespace-nowrap ${tab === 'home' ? 'text-violet-400 border-b-2 border-violet-400' : 'text-gray-400 hover:text-white'}`}>Trang chủ</button>
                    <button onClick={() => setTab('videos')} className={`pb-3 font-medium text-sm whitespace-nowrap ${tab === 'videos' ? 'text-violet-400 border-b-2 border-violet-400' : 'text-gray-400 hover:text-white'}`}>Video</button>

                    <button onClick={() => setTab('following')} className={`pb-3 font-medium text-sm whitespace-nowrap ${tab === 'following' ? 'text-violet-400 border-b-2 border-violet-400' : 'text-gray-400 hover:text-white'}`}>Đang theo dõi</button>
                    <button onClick={() => setTab('followers')} className={`pb-3 font-medium text-sm whitespace-nowrap flex items-center gap-2 ${tab === 'followers' ? 'text-violet-400 border-b-2 border-violet-400' : 'text-gray-400 hover:text-white'}`}>
                        <Users size={16}/> Người theo dõi
                    </button>

                    <button onClick={() => setTab('about')} className={`pb-3 font-medium text-sm whitespace-nowrap ${tab === 'about' ? 'text-violet-400 border-b-2 border-violet-400' : 'text-gray-400 hover:text-white'}`}>Giới thiệu</button>
                </div>
            </div>

            {/* --- Content Area --- */}
            <div className="max-w-7xl mx-auto px-6 py-8">

                {/* Tab Home: Live Streams */}
                {tab === 'home' && (
                    <div>
                        <h3 className="text-lg font-bold mb-4">Livestream đang diễn ra</h3>
                        {myStreams.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {myStreams.map(stream => (
                                    <Link to={`/stream/${stream.id}`} key={stream.id} className="block group">
                                        <div className="relative aspect-video bg-gray-800 rounded-xl overflow-hidden mb-2 border border-gray-800 group-hover:border-violet-500/50 transition-all">
                                            <img src={stream.thumbnail_url || "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80"} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-all" onError={(e) => { e.target.src = "https://via.placeholder.com/640x360?text=No+Thumbnail"; }}/>
                                            <div className="absolute top-2 left-2 bg-red-600 text-xs font-bold px-2 py-0.5 rounded text-white">LIVE</div>
                                        </div>
                                        <h4 className="font-bold text-white group-hover:text-violet-400 truncate">{stream.title}</h4>
                                        <p className="text-xs text-gray-400">{stream.category?.title}</p>
                                    </Link>
                                ))}
                            </div>
                        ) : <p className="text-gray-500">Kênh này hiện chưa có buổi livestream nào.</p>}
                    </div>
                )}

                {/* Tab Videos: Ended Streams */}
                {tab === 'videos' && (
                    <div>
                        <h3 className="text-lg font-bold mb-4">Video đã phát</h3>
                        {endedStreams.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {endedStreams.map(stream => (
                                    <Link to={`/stream/${stream.id}`} key={stream.id} className="block group">
                                        <div className="relative aspect-video bg-gray-800 rounded-xl overflow-hidden mb-2 border border-gray-800 group-hover:border-violet-500/50 transition-all">
                                            <img
                                                src={stream.thumbnail_url || "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80"}
                                                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-all"
                                                onError={(e) => { e.target.src = "https://via.placeholder.com/640x360?text=No+Thumbnail"; }}
                                            />
                                            {/* Badge thời lượng (Mock) hoặc trạng thái VOD */}
                                            <div className="absolute bottom-2 right-2 bg-black/80 text-xs font-bold px-1.5 py-0.5 rounded text-white flex items-center gap-1">
                                                <Play size={10} fill="currentColor"/> VOD
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="min-w-0 flex-1">
                                                <h4 className="font-bold text-white group-hover:text-violet-400 truncate leading-tight mb-1">{stream.title}</h4>
                                                <div className="text-xs text-gray-400 flex items-center gap-2">
                                                    <span>{stream.category?.title}</span>
                                                    <span>•</span>
                                                    <span>{new Date(stream.created_at).toLocaleDateString('vi-VN')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : <p className="text-gray-500">Kênh này chưa có video nào được lưu lại.</p>}
                    </div>
                )}

                {/* Tab Following */}
                {tab === 'following' && (
                    <div>
                        <h3 className="text-lg font-bold mb-4">Kênh đang theo dõi</h3>
                        {loadingFollow ? (
                            <div className="p-8 text-center text-gray-500">Đang tải...</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {following.map(ch => (
                                    <div key={ch.id} className="flex items-center gap-4 bg-gray-900 p-4 rounded-xl border border-gray-800 hover:border-gray-600 transition-colors">
                                        <Link to={`/channel/${ch.id}`} className="flex-shrink-0">
                                            <img src={ch.avatar_url || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"} className="w-12 h-12 rounded-full bg-gray-800 object-cover border border-gray-700"/>
                                        </Link>
                                        <div className="flex-1 min-w-0">
                                            <Link to={`/channel/${ch.id}`} className="font-bold text-white truncate hover:text-violet-400 block max-w-[150px]">{ch.title}</Link>
                                            <p className="text-xs text-gray-400">{ch.subscription_count} người theo dõi</p>
                                        </div>
                                        {/* Action Buttons */}
                                        <div className="flex gap-2 shrink-0">
                                            {ch.isSubscribed && (
                                                <button
                                                    onClick={() => handleToggleNotification(ch.id, ch.notificationEnabled, 'following')}
                                                    className={`p-2 rounded-lg border transition-colors ${ch.notificationEnabled ? 'bg-gray-700 text-yellow-400 border-gray-600' : 'bg-transparent text-gray-400 border-gray-700 hover:text-white'}`}
                                                    title={ch.notificationEnabled ? "Tắt thông báo" : "Bật thông báo"}
                                                >
                                                    {ch.notificationEnabled ? <Bell size={16} fill="currentColor" /> : <BellOff size={16} />}
                                                </button>
                                            )}
                                            <Button
                                                variant={ch.isSubscribed ? "secondary" : "primary"}
                                                className="!px-3 !py-1 !text-xs whitespace-nowrap"
                                                onClick={() => handleToggleSubscribe(ch.id, ch.isSubscribed, 'following')}
                                            >
                                                {ch.isSubscribed ? "Đang theo dõi" : "Đăng ký"}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {following.length === 0 && <p className="text-gray-500 col-span-full">Bạn chưa theo dõi kênh nào.</p>}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab Followers */}
                {tab === 'followers' && (
                    <div>
                        <h3 className="text-lg font-bold mb-4">Người theo dõi ({followersList.length})</h3>
                        {loadingFollow ? (
                            <div className="p-8 text-center text-gray-500">Đang tải...</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {followersList.map(ch => (
                                    <div key={ch.id} className="flex items-center gap-4 bg-gray-900 p-4 rounded-xl border border-gray-800 hover:border-gray-600 transition-colors">
                                        <Link to={`/channel/${ch.id}`} className="flex-shrink-0">
                                            <img src={ch.avatar_url || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"} className="w-12 h-12 rounded-full bg-gray-800 object-cover border border-gray-700"/>
                                        </Link>
                                        <div className="flex-1 min-w-0">
                                            <Link to={`/channel/${ch.id}`} className="font-bold text-white truncate hover:text-violet-400 block max-w-[150px]">{ch.title}</Link>
                                            <p className="text-xs text-gray-400">{ch.subscription_count} người theo dõi</p>
                                        </div>

                                        {/* Subscribe Back Button */}
                                        <div className="flex gap-2 shrink-0">
                                            {ch.isSubscribed && (
                                                <button
                                                    onClick={() => handleToggleNotification(ch.id, ch.notificationEnabled, 'followers')}
                                                    className={`p-2 rounded-lg border transition-colors ${ch.notificationEnabled ? 'bg-gray-700 text-yellow-400 border-gray-600' : 'bg-transparent text-gray-400 border-gray-700 hover:text-white'}`}
                                                >
                                                    {ch.notificationEnabled ? <Bell size={16} fill="currentColor" /> : <BellOff size={16} />}
                                                </button>
                                            )}
                                            <Button
                                                variant={ch.isSubscribed ? "secondary" : "primary"}
                                                className="!px-3 !py-1 !text-xs whitespace-nowrap"
                                                onClick={() => handleToggleSubscribe(ch.id, ch.isSubscribed, 'followers')}
                                            >
                                                {ch.isSubscribed ? "Đang theo dõi" : "Đăng ký"}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {followersList.length === 0 && <p className="text-gray-500 col-span-full">Chưa có ai theo dõi kênh của bạn.</p>}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab About */}
                {tab === 'about' && (
                    <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 max-w-2xl">
                        <h3 className="font-bold mb-4">Giới thiệu</h3>
                        <p className="text-gray-300 text-sm leading-relaxed mb-6 whitespace-pre-wrap">
                            {channel?.description || "Chưa có mô tả cho kênh này."}
                        </p>
                        <div className="space-y-3 border-t border-gray-800 pt-4">
                            <div className="flex items-center gap-3 text-gray-400 text-sm">
                                <Mail size={16}/> <span>{user?.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-400 text-sm">
                                <Calendar size={16}/> <span>Tham gia từ 2025</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* EDIT MODAL */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 w-full max-w-2xl rounded-2xl border border-gray-800 max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-gray-800 flex justify-between items-center sticky top-0 bg-gray-900 z-10">
                            <h3 className="text-xl font-bold">Chỉnh sửa hồ sơ</h3>
                            <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-gray-800 rounded-full transition-colors"><X className="text-gray-400 hover:text-white"/></button>
                        </div>
                        <div className="p-6 space-y-8">
                            <section>
                                <h4 className="font-bold mb-4 text-xs text-gray-500 uppercase tracking-wider">Ảnh đại diện</h4>
                                <div className="flex items-center gap-6">
                                    <img src={channel?.avatar_url || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"} className="w-20 h-20 rounded-full bg-gray-800 object-cover border-2 border-gray-700"/>
                                    <div>
                                        <label className="cursor-pointer bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-block">
                                            Tải ảnh mới
                                            <input type="file" className="hidden" onChange={handleAvatarChange} accept="image/*" />
                                        </label>
                                        <p className="text-xs text-gray-500 mt-2">JPG, PNG hoặc GIF. Tối đa 2MB.</p>
                                    </div>
                                </div>
                            </section>
                            <section>
                                <h4 className="font-bold mb-4 text-xs text-gray-500 uppercase tracking-wider">Thông tin cá nhân</h4>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <Input label="Họ" defaultValue={user?.first_name} id="edit_fname" />
                                    <Input label="Tên" defaultValue={user?.last_name} id="edit_lname" />
                                </div>
                                <Button onClick={handleUpdateInfo} className="w-full" isLoading={loading}>Lưu thông tin</Button>
                            </section>
                            <section>
                                <h4 className="font-bold mb-4 text-xs text-gray-500 uppercase tracking-wider">Thông tin Kênh</h4>
                                <Input label="Tiêu đề kênh" defaultValue={channel?.title} id="edit_title" />
                                <Input label="Mô tả kênh" textarea defaultValue={channel?.description} id="edit_desc" />
                                <Button onClick={handleUpdateChannel} className="w-full" isLoading={loading}>Lưu thay đổi kênh</Button>
                            </section>
                            <section className="pt-4 border-t border-gray-800">
                                <h4 className="font-bold mb-4 text-xs text-gray-500 uppercase tracking-wider">Bảo mật</h4>
                                <Input type="password" label="Mật khẩu hiện tại" id="old_pass" />
                                <Input type="password" label="Mật khẩu mới" id="new_pass" />
                                <Button variant="danger" onClick={handleChangePass} className="w-full" isLoading={loading}>Đổi mật khẩu</Button>
                            </section>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;