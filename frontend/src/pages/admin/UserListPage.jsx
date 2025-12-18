import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import adminApi from "../../api/adminApi.js";
import { Shield, Eye, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import Button from "../../components/common/Button.jsx";

const UserListPage = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Pagination States cho Server-side
    const [offset, setOffset] = useState(0);
    const limit = 5;
    const [hasMore, setHasMore] = useState(true); // Kiểm tra còn dữ liệu trang sau không

    // Hàm fetch dữ liệu theo offset
    const fetchUsers = async (currentOffset) => {
        setLoading(true);
        try {
            const data = await adminApi.getUsers({ limit, offset: currentOffset });
            const userList = Array.isArray(data) ? data : [];

            setUsers(userList);

            // Nếu số lượng trả về < limit => Đã hết dữ liệu trang sau
            if (userList.length < limit) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    // Gọi API khi offset thay đổi
    useEffect(() => {
        fetchUsers(offset);
    }, [offset]);

    const handlePrevPage = () => {
        setOffset(prev => Math.max(prev - limit, 0));
    };

    const handleNextPage = () => {
        if (hasMore) {
            setOffset(prev => prev + limit);
        }
    };

    const currentPage = Math.floor(offset / limit) + 1;

    return (
        <div className="min-h-screen bg-gray-950 text-white p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center text-gray-400 hover:text-white transition-colors font-medium"
                    >
                        <ChevronLeft size={20} className="mr-1" />
                        Quay lại Trang chủ
                    </button>
                </div>

                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
                        <Shield className="text-violet-500"/> Quản lý Người dùng
                    </h1>
                </div>

                <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-xl flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-800 text-gray-400 font-medium uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Họ tên</th>
                                <th className="px-6 py-4">Vai trò</th>
                                <th className="px-6 py-4 text-right">Xem chi tiết</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                            {loading ? (
                                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Đang tải dữ liệu...</td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Không tìm thấy người dùng nào.</td></tr>
                            ) : (
                                users.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs text-gray-500 truncate max-w-[120px]" title={user.id}>
                                            {user.id}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-white">{user.email}</td>
                                        <td className="px-6 py-4 text-gray-300">{user.first_name} {user.last_name}</td>
                                        <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                                    user.role === 'admin'
                                                        ? 'bg-violet-500/10 text-violet-300 border-violet-500/20'
                                                        : 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                                                }`}>
                                                    {user.role.toUpperCase()}
                                                </span>
                                        </td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                                            <Link to={`/admin/users/${user.id}`} className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors" title="Xem chi tiết">
                                                <Eye size={18}/>
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>

                    {/* Server-side Pagination Controls */}
                    <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between bg-gray-900">
                        <span className="text-sm text-gray-500">
                            Trang {currentPage}
                        </span>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="secondary"
                                className="!px-3 !py-1.5"
                                disabled={offset === 0 || loading}
                                onClick={handlePrevPage}
                            >
                                <ChevronLeft size={16} /> Trước
                            </Button>
                            <Button
                                variant="secondary"
                                className="!px-3 !py-1.5"
                                disabled={!hasMore || loading}
                                onClick={handleNextPage}
                            >
                                Sau <ChevronRight size={16} />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserListPage;