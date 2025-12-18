import {useNavigate} from "react-router-dom";
import {useAuth} from "../../hooks/useAuth.js";
import {useState} from "react";
import channelApi from "../../api/channelApi.js";
import Input from "../../components/common/Input.jsx";
import Button from "../../components/common/Button.jsx";
import {Radio} from "lucide-react";
import { useToast } from "../../context/ToastContext.jsx";
const CreateChannelPage = () => {
    const navigate = useNavigate();
    const { refreshChannel} = useAuth();
    const toast = useToast();
    const [formData, setFormData] = useState({ title: '', description: '' });
    const [isLoading, setIsLoading] = useState(false);

    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await channelApi.create(formData);
            await wait(2000);
            await refreshChannel();
            toast.success("Tạo kênh thành công!");
            navigate('/');
        } catch (error) {
            toast.error("Tạo kênh thất bại: " + (error.message || "Lỗi không xác định"));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
            <div className="w-full max-w-lg bg-gray-900 p-8 rounded-3xl border border-gray-800 shadow-2xl">
                <div className="text-center mb-8">
                    <div className="h-16 w-16 bg-violet-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Radio className="text-violet-500" size={32}/>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Tạo Kênh Của Bạn</h1>
                    <p className="text-gray-400 mt-2">Để bắt đầu, hãy đặt tên cho kênh stream của bạn.</p>
                </div>
                <form onSubmit={handleSubmit}>
                    <Input label="Tên kênh" placeholder="Ví dụ: GamerPro Official" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                    <Input label="Mô tả" textarea placeholder="Giới thiệu đôi chút về kênh..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                    <Button type="submit" className="w-full mt-4" isLoading={isLoading}>Tạo Kênh Ngay</Button>
                </form>
            </div>
        </div>
    );
};

export default CreateChannelPage;