import {AlertCircle} from "lucide-react";
import {useState} from "react";
import {Eye, EyeOff} from "lucide-react";
const Input = ({ label, icon: Icon, error, type = "text", textarea = false, ...props }) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
        <div className="mb-4">
            {label && <label className="block text-sm font-medium text-gray-400 mb-1.5">{label}</label>}
            <div className="relative group">
                {Icon && (
                    <div className="absolute left-3 top-3 text-gray-500 group-focus-within:text-violet-500 transition-colors">
                        <Icon size={18} />
                    </div>
                )}
                {textarea ? (
                    <textarea
                        className={`w-full bg-gray-900/50 border ${error ? 'border-red-500' : 'border-gray-700'} rounded-xl py-3 ${Icon ? 'pl-10' : 'pl-4'} text-white placeholder-gray-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all min-h-[100px]`}
                        {...props}
                    />
                ) : (
                    <input
                        type={inputType}
                        className={`w-full bg-gray-900/50 border ${error ? 'border-red-500' : 'border-gray-700'} rounded-xl py-3 ${Icon ? 'pl-10' : 'pl-4'} ${isPassword ? 'pr-10' : 'pr-4'} text-white placeholder-gray-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all`}
                        {...props}
                    />
                )}

                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white transition-colors"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
            </div>
            {error && (
                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1 animate-pulse">
                    <AlertCircle size={12} /> {error}
                </p>
            )}
        </div>
    );
};

export default Input;