import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import adminApi from "../../api/adminApi.js";
import Button from "../../components/common/Button.jsx";
import { ChevronLeft, User, Mail, ShieldCheck, Fingerprint } from "lucide-react";

const UserDetailPage = () => {
    const { id } = useParams();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const data = await adminApi.getUserById(id);
                setUser(data);
            } catch (err) {
                setError("Không tìm thấy người dùng hoặc có lỗi xảy ra.");
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [id]);

    if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Loading...</div>;

    if (error) return (
        <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white gap-4">
            <p className="text-red-400 font-bold text-lg">{error}</p>
            <Link to="/admin/users"><Button variant="secondary">Quay lại danh sách</Button></Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-950 text-white p-8">
            <div className="max-w-3xl mx-auto">
                <Link to="/admin/users" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors font-medium">
                    <ChevronLeft size={20}/> Quay lại danh sách
                </Link>

                <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 shadow-2xl">
                    {/* Header Info */}
                    <div className="flex items-center gap-6 mb-8 border-b border-gray-800 pb-8">
                        <div className="w-24 h-24 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-lg">
                            {user.first_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">{user.first_name} {user.last_name}</h1>
                            <div className="flex items-center gap-2 mt-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                                    user.role === 'admin' ? 'bg-violet-500/20 text-violet-300 border-violet-500/30' : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                }`}>
                                    {user.role}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-gray-800 rounded-xl text-gray-400"><Fingerprint size={20}/></div>
                                <div>
                                    <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">User ID</p>
                                    <p className="text-white font-mono mt-1 text-sm break-all">{user.id}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-gray-800 rounded-xl text-gray-400"><Mail size={20}/></div>
                                <div>
                                    <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Email</p>
                                    <p className="text-white mt-1">{user.email}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-gray-800 rounded-xl text-gray-400"><User size={20}/></div>
                                <div>
                                    <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Họ và tên</p>
                                    <p className="text-white mt-1">{user.first_name} {user.last_name}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-gray-800 rounded-xl text-gray-400"><ShieldCheck size={20}/></div>
                                <div>
                                    <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Vai trò</p>
                                    <p className="text-white mt-1 capitalize">{user.role}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDetailPage;