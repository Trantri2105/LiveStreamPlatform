import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Radio, AlertCircle } from 'lucide-react';
import { useAuth} from "../../hooks/useAuth.js";
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
const LoginPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await login(formData.email, formData.password);
            navigate('/');
        } catch (err) {
            console.error(err);
            setError(err.message || "Email hoặc mật khẩu không đúng");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
            <div className="w-full max-w-md bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700">
                <div className="text-center mb-8">
                    <div className="h-12 w-12 bg-violet-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Radio className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Chào mừng trở lại</h1>
                    <p className="text-gray-400 text-sm mt-1">Đăng nhập để tiếp tục vào LiveHub</p>
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm flex items-center gap-2">
                        <AlertCircle size={16}/> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <Input
                        label="Email" icon={Mail} placeholder="name@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                    />
                    <Input
                        label="Mật khẩu" icon={Lock} type="password" placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        required
                    />

                    <div className="flex justify-end mb-4">
                        <a href="#" className="text-xs text-violet-400 hover:text-violet-300">Quên mật khẩu?</a>
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20"
                        isLoading={isLoading}
                    >
                        Đăng nhập
                    </Button>
                </form>

                <div className="mt-6 relative">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-700"></div></div>
                    <div className="relative flex justify-center text-sm"><span className="px-2 bg-gray-800 text-gray-500">Hoặc</span></div>
                </div>

                <p className="mt-8 text-center text-gray-400 text-sm">
                    Chưa có tài khoản? <Link to="/register" className="text-violet-400 hover:text-violet-300 font-semibold ml-1">Đăng ký ngay</Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;