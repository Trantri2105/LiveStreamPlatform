import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import categoryApi from "../../api/categoryApi.js";
import { Search, LayoutGrid, Trash2, ChevronLeft, ChevronRight, Plus, X, Loader2, Image as ImageIcon, UploadCloud } from "lucide-react";
import Input from "../../components/common/Input.jsx";
import Button from "../../components/common/Button.jsx";
import { useToast } from "../../context/ToastContext.jsx";

const CategoryListPage = () => {
    const navigate = useNavigate();
    const toast = useToast();

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState("");
    const [offset, setOffset] = useState(0);
    const limit = 10;
    const [hasMore, setHasMore] = useState(true);

    // Modal States
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [selectedCategory, setSelectedCategory] = useState(null);

    // Form States
    const [categoryTitle, setCategoryTitle] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const [processing, setProcessing] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const fetchCategories = async (currentOffset) => {
        setLoading(true);
        try {
            const data = await categoryApi.getList({
                searchText: searchTerm,
                limit,
                offset: currentOffset
            });

            const list = Array.isArray(data) ? data : [];
            setCategories(list);

            if (list.length < limit) setHasMore(false);
            else setHasMore(true);

        } catch (error) {
            console.error("Failed to fetch categories", error);
            toast.error("Lỗi tải danh sách danh mục");
            setCategories([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setOffset(0);
            fetchCategories(0);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const openCreateModal = () => {
        setModalMode('create');
        setCategoryTitle("");
        setSelectedFile(null);
        setPreviewUrl(null);
        setShowModal(true);
    };

    const openEditImageModal = (category) => {
        setModalMode('edit_image');
        setSelectedCategory(category);
        setCategoryTitle(category.title);
        setSelectedFile(null);
        setPreviewUrl(category.image_url);
        setShowModal(true);
    };

    // Submit Handler
    const handleSubmit = async () => {
        if (modalMode === 'create' && !categoryTitle.trim()) return toast.error("Vui lòng nhập tên danh mục");
        if (modalMode === 'edit_image' && !selectedFile) return toast.error("Vui lòng chọn ảnh mới");

        setProcessing(true);
        try {
            if (modalMode === 'create') {
                await categoryApi.create({ title: categoryTitle });
                toast.success("Tạo danh mục thành công");
                await new Promise(resolve => setTimeout(resolve, 2000));
            } else {
                await categoryApi.setImage(selectedCategory.id, selectedFile);
                toast.success("Cập nhật ảnh thành công");
            }

            setOffset(0);
            fetchCategories(0);
            setShowModal(false);

            setCategoryTitle("");
            setSelectedFile(null);
            setPreviewUrl(null);

        } catch (error) {
            toast.error("Thao tác thất bại: " + (error.response?.data?.message || error.message));
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async (id) => {
        setDeletingId(id);
        try {
            await categoryApi.delete(id);
            await new Promise(resolve => setTimeout(resolve, 2000));
            toast.success("Đã xóa danh mục");
            await fetchCategories(offset);
        } catch (error) {
            toast.error("Xóa thất bại: " + (error.response?.data?.message || error.message));
        } finally {
            setDeletingId(null);
        }
    };

    const handlePrevPage = () => {
        const newOffset = Math.max(offset - limit, 0);
        setOffset(newOffset);
        fetchCategories(newOffset);
    };

    const handleNextPage = () => {
        if (hasMore) {
            const newOffset = offset + limit;
            setOffset(newOffset);
            fetchCategories(newOffset);
        }
    };

    const currentPage = Math.floor(offset / limit) + 1;

    return (
        <div className="min-h-screen bg-gray-950 text-white p-8">
            <div className="max-w-7xl mx-auto">
                {/* Back Button */}
                <div className="mb-6">
                    <button onClick={() => navigate('/')} className="flex items-center text-gray-400 hover:text-white transition-colors font-medium">
                        <ChevronLeft size={20} className="mr-1" /> Quay lại Trang chủ
                    </button>
                </div>

                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
                        <LayoutGrid className="text-violet-500"/> Quản lý Danh mục
                    </h1>
                    <div className="flex gap-4">
                        <div className="w-80">
                            <Input placeholder="Tìm kiếm danh mục..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} icon={Search} />
                        </div>
                        <Button icon={Plus} onClick={openCreateModal} className="h-[42px]">Thêm mới</Button>
                    </div>
                </div>

                <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-xl flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-800 text-gray-400 font-medium uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 w-16">STT</th>
                                <th className="px-6 py-4 w-24">Ảnh</th>
                                <th className="px-6 py-4">Tên Danh Mục</th>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4 text-right">Hành động</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                            {loading ? (
                                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Đang tải dữ liệu...</td></tr>
                            ) : categories.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Không tìm thấy danh mục nào.</td></tr>
                            ) : (
                                categories.map((cat, index) => (
                                    <tr key={cat.id} className="hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4 text-gray-500">{offset + index + 1}</td>
                                        <td className="px-6 py-4">
                                            <div className="w-12 h-12 rounded-lg bg-gray-800 border border-gray-700 overflow-hidden flex items-center justify-center">
                                                {cat.image_url ? (
                                                    <img src={cat.image_url} alt={cat.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <ImageIcon size={20} className="text-gray-600" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-white text-base">{cat.title}</td>
                                        <td className="px-6 py-4 font-mono text-xs text-gray-500 truncate max-w-[150px]" title={cat.id}>{cat.id}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {/* Button Upload Image */}
                                                <button
                                                    onClick={() => openEditImageModal(cat)}
                                                    className="p-2 hover:bg-blue-500/10 rounded-lg text-gray-400 hover:text-blue-400 transition-colors"
                                                    title="Cập nhật ảnh"
                                                >
                                                    <ImageIcon size={18}/>
                                                </button>
                                                {/* Button Delete */}
                                                <button
                                                    onClick={() => handleDelete(cat.id)}
                                                    disabled={deletingId === cat.id}
                                                    className={`p-2 rounded-lg transition-colors ${deletingId === cat.id ? 'text-gray-500 cursor-not-allowed' : 'text-gray-400 hover:bg-red-500/10 hover:text-red-500'}`}
                                                    title="Xóa danh mục"
                                                >
                                                    {deletingId === cat.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18}/>}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination Controls */}
                    <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between bg-gray-900 mt-auto">
                        <span className="text-sm text-gray-500">Trang {currentPage} (Offset: {offset})</span>
                        <div className="flex items-center gap-2">
                            <Button variant="secondary" className="!px-3 !py-1.5" disabled={offset === 0 || loading} onClick={handlePrevPage}><ChevronLeft size={16} /> Trước</Button>
                            <Button variant="secondary" className="!px-3 !py-1.5" disabled={!hasMore || loading} onClick={handleNextPage}>Sau <ChevronRight size={16} /></Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Create / Edit Image */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-gray-900 w-full max-w-md rounded-2xl border border-gray-800 shadow-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">
                                {modalMode === 'create' ? "Thêm Danh Mục Mới" : "Cập Nhật Ảnh Danh Mục"}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
                        </div>

                        <div className="space-y-4">
                            {/* Input Title (Disabled nếu đang edit image) */}
                            <Input
                                label="Tên danh mục"
                                placeholder="Ví dụ: FPS Games"
                                value={categoryTitle}
                                onChange={(e) => setCategoryTitle(e.target.value)}
                                disabled={modalMode === 'edit_image'} // Không cho sửa tên khi đang update ảnh
                                autoFocus={modalMode === 'create'}
                            />

                            {/* Image Upload Area - CHỈ HIỆN KHI EDIT IMAGE */}
                            {modalMode === 'edit_image' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Ảnh minh họa (Bắt buộc)</label>
                                    <div className="border-2 border-dashed border-gray-700 rounded-xl h-40 flex flex-col items-center justify-center text-gray-500 hover:border-violet-500 hover:text-violet-500 cursor-pointer transition-colors bg-gray-800/50 relative overflow-hidden group">
                                        {previewUrl ? (
                                            <>
                                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="text-white font-bold text-xs flex items-center gap-1"><ImageIcon size={16}/> Đổi ảnh</span>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <UploadCloud size={24} className="mb-2" />
                                                <span className="text-xs font-medium">Chọn ảnh để tải lên</span>
                                            </>
                                        )}
                                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} accept="image/*" />
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-2">
                                <Button variant="ghost" onClick={() => setShowModal(false)}>Hủy</Button>
                                <Button onClick={handleSubmit} isLoading={processing}>
                                    {modalMode === 'create' ? "Tạo mới" : "Lưu ảnh"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoryListPage;