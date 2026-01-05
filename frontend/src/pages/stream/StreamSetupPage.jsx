import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import streamApi from "../../api/streamApi.js";
import categoryApi from "../../api/categoryApi.js";
import Input from "../../components/common/Input.jsx";
import Button from "../../components/common/Button.jsx";
import { CheckCircle, ChevronLeft, Link as LinkIcon, Search, UploadCloud } from "lucide-react";
import { useToast } from "../../context/ToastContext.jsx";
// import ToxicitySlider from "../../components/stream/ToxicitySlider.jsx";

const StreamSetupPage = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [step, setStep] = useState(1); // 1: Form, 2: Result
    const [formData, setFormData] = useState({ title: '', description: '', category_id: ''});

    // State cho tìm kiếm category
    const [categorySearch, setCategorySearch] = useState('');
    const [categories, setCategories] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);

    const [streamResult, setStreamResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState(null);

    useEffect(() => {
        if (!categorySearch.trim() || (selectedCategory && categorySearch === selectedCategory.title)) {
            setCategories([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await categoryApi.search(categorySearch);
                setCategories(Array.isArray(res) ? res : []);
            } catch (error) {
                console.error(error);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [categorySearch, selectedCategory]);

    const handleThumbnailChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setThumbnailFile(file);
            setThumbnailPreview(URL.createObjectURL(file));
        }
    };

    const handleCreateStream = async () => {
        if (!formData.title) return toast.warning("Vui lòng nhập tiêu đề phiên live");
        if (!formData.category_id) return toast.warning("Vui lòng chọn một danh mục từ danh sách gợi ý");

        setLoading(true);
        try {
            const res = await streamApi.create(formData);
            if (thumbnailFile) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                try {
                    await streamApi.setThumbnail(res.id, thumbnailFile);
                    console.log("Thumbnail uploaded successfully");
                } catch (thumbError) {
                    console.error("Thumbnail upload failed:", thumbError);
                    toast.error("Tạo stream thành công nhưng lỗi tải ảnh bìa.");
                }
            }
            toast.success("Khởi tạo phiên Live thành công!");
            setStreamResult(res);
            setStep(2);
        } catch (e) {
            toast.error("Lỗi tạo stream: " + (e.response?.data?.message || e.message));
        } finally {
            setLoading(false);
        }
    };

    const handleSelectCategory = (cat) => {
        setFormData({ ...formData, category_id: cat.id });
        setSelectedCategory(cat);
        setCategorySearch(cat.title);
        setCategories([]);
    };

    const handleInputChange = (e) => {
        const text = e.target.value;
        setCategorySearch(text);

        if (selectedCategory && text !== selectedCategory.title) {
            setSelectedCategory(null);
            setFormData({ ...formData, category_id: '' });
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.info("Đã sao chép vào bộ nhớ tạm");
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-gray-900 p-8 rounded-3xl border border-gray-800 shadow-2xl">
                <div className="flex items-center gap-4 mb-6">
                    <Link to="/" className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                        <ChevronLeft />
                    </Link>
                    <h1 className="text-2xl font-bold">Thiết lập Livestream</h1>
                </div>

                {step === 1 ? (
                    <div className="space-y-6">
                        <Input
                            label="Tiêu đề phiên Live"
                            placeholder="Hôm nay chơi game gì?"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />

                        <Input
                            label="Mô tả"
                            textarea
                            placeholder="Mô tả nội dung buổi stream..."
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />

                        {/* Category Search UI */}
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-400 mb-1">Danh mục (Game/Chủ đề)</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors pr-10"
                                    placeholder="Nhập tên game để tìm kiếm (VD: League...)"
                                    value={categorySearch}
                                    onChange={handleInputChange}
                                />
                                <div className="absolute right-3 top-3 text-gray-500">
                                    {isSearching ? (
                                        <div className="animate-spin h-5 w-5 border-2 border-violet-500 border-t-transparent rounded-full"></div>
                                    ) : (
                                        <Search size={20} />
                                    )}
                                </div>
                            </div>

                            {categories.length > 0 && (
                                <div className="absolute z-20 w-full bg-gray-800 border border-gray-700 rounded-xl mt-2 max-h-60 overflow-y-auto shadow-2xl custom-scrollbar">
                                    {categories.map(cat => (
                                        <div
                                            key={cat.id}
                                            className="px-4 py-3 hover:bg-violet-600/20 hover:text-violet-400 cursor-pointer text-sm border-b border-gray-700/50 last:border-0 transition-colors flex justify-between items-center"
                                            onClick={() => handleSelectCategory(cat)}
                                        >
                                            <span>{cat.title}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {categorySearch && !isSearching && categories.length === 0 && !selectedCategory && (
                                <div className="absolute mt-2 text-sm text-gray-500 italic px-1">
                                    Không tìm thấy kết quả phù hợp.
                                </div>
                            )}
                        </div>

                        {/* --- [NEW] UI Upload Thumbnail --- */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1.5">Ảnh bìa (Thumbnail)</label>
                            <div className="border-2 border-dashed border-gray-700 rounded-xl h-48 flex flex-col items-center justify-center text-gray-500 hover:border-violet-500 hover:text-violet-500 cursor-pointer transition-colors bg-gray-900/50 relative overflow-hidden group">
                                {thumbnailPreview ? (
                                    <>
                                        <img src={thumbnailPreview} alt="Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-white font-bold flex items-center gap-2">
                                                <UploadCloud size={20}/> Nhấn để thay đổi
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <UploadCloud size={32} className="mb-2" />
                                        <span className="text-sm font-medium">Kéo thả hoặc bấm để tải ảnh lên (1280x720)</span>
                                    </>
                                )}
                                <input
                                    type="file"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={handleThumbnailChange}
                                    accept="image/*"
                                />
                            </div>
                        </div>

                        {/*/!* Toxicity Threshold Slider *!/*/}
                        {/*<ToxicitySlider*/}
                        {/*    value={formData.toxic_threshold}*/}
                        {/*    onChange={(value) => setFormData({ ...formData, toxic_threshold: value })}*/}
                        {/*/>*/}

                        <Button className="w-full py-4 mt-4 font-bold text-lg" onClick={handleCreateStream} isLoading={loading}>
                            Tạo Phiên Live
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl text-green-400 flex items-center gap-3">
                            <CheckCircle size={24} />
                            <div>
                                <span className="font-bold">Tạo phiên live thành công!</span>
                                <p className="text-xs text-green-300/80">Hãy copy thông tin dưới đây vào OBS Studio</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-gray-400 block mb-1 font-semibold">Server URL</label>
                                <div className="flex gap-2">
                                    <input readOnly value={streamResult?.srt_server_url || ''} className="flex-1 bg-black/30 border border-gray-700 rounded-lg px-3 py-2 text-sm font-mono text-violet-300" />
                                    <Button variant="secondary" className="!py-1" onClick={() => copyToClipboard(streamResult.srt_server_url)}>Copy</Button>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 block mb-1 font-semibold">Stream Key</label>
                                <div className="flex gap-2">
                                    <input readOnly value={streamResult?.stream_key || ''} className="flex-1 bg-black/30 border border-gray-700 rounded-lg px-3 py-2 text-sm font-mono text-violet-300" />
                                    <Button variant="secondary" className="!py-1" onClick={() => copyToClipboard(streamResult.stream_key)}>Copy</Button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
                            <h4 className="font-bold text-white mb-2 flex items-center gap-2"><LinkIcon size={16}/> Hướng dẫn nhanh:</h4>
                            <ul className="text-sm text-gray-400 space-y-1 list-disc pl-5">
                                <li>Mở OBS Studio &rarr; <strong>Settings</strong> &rarr; <strong>Stream</strong>.</li>
                                <li>Chọn Service: <strong>Custom...</strong></li>
                                <li>Paste Server URL và Stream Key.</li>
                                <li>Bấm <strong>Start Streaming</strong> trên OBS.</li>
                            </ul>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button variant="secondary" className="flex-1" onClick={() => navigate('/')}>Về trang chủ</Button>
                            <Button variant="primary" className="flex-1" onClick={() => navigate(`/stream/${streamResult.id}`)}>Đến phòng Live</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StreamSetupPage;