import {useNavigate, Link} from "react-router-dom";
import {useAuth} from "../../hooks/useAuth.js";
import {useState} from "react";
import {Lock} from "lucide-react";
import Input from "../../components/common/Input.jsx";
import Button from "../../components/common/Button.jsx";
import {AlertCircle} from "lucide-react";
import { useToast} from "../../context/ToastContext.jsx";

const RegisterPage = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const toast = useToast();

    const [formData, setFormData] = useState({
        email: '', password: '', confirmPassword: '', first_name: '', last_name: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError("Mật khẩu nhập lại không khớp");
            return;
        }

        setIsLoading(true);
        try {
            await register({
                email: formData.email,
                password: formData.password,
                first_name: formData.first_name,
                last_name: formData.last_name
            });
            toast.success("Đăng ký thành công! Vui lòng đăng nhập.");
            navigate('/login');
        } catch (err) {
            console.error(err);
            setError(err.message || "Đăng ký thất bại");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
            <div className="w-full max-w-md bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-white">Tạo tài khoản mới</h1>
                    <p className="text-gray-400 text-sm mt-1">Tham gia cộng đồng LiveHub</p>
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm flex items-center gap-2">
                        <AlertCircle size={16}/> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-4">
                        <Input name="first_name" label="Họ"  value={formData.first_name} onChange={handleChange} required />
                        <Input name="last_name" label="Tên" value={formData.last_name} onChange={handleChange} required />
                    </div>
                    <Input name="email" label="Email"  type="email" value={formData.email} onChange={handleChange} required />
                    <Input name="password" label="Mật khẩu" icon={Lock} type="password" value={formData.password} onChange={handleChange} required />
                    <Input name="confirmPassword" label="Nhập lại mật khẩu" icon={Lock} type="password" value={formData.confirmPassword} onChange={handleChange} required />

                    <Button
                        type="submit"
                        className="w-full bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20 mt-2"
                        isLoading={isLoading}
                    >
                        Đăng ký ngay
                    </Button>
                </form>

                <p className="mt-8 text-center text-gray-400 text-sm">
                    Đã có tài khoản? <Link to="/login" className="text-violet-400 hover:text-violet-300 font-semibold ml-1">Đăng nhập</Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;