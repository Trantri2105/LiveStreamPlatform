const Button = ({ children, onClick, className = '', isLoading, disabled, variant = 'primary', icon: Icon, ...props }) => {
    const variants = {
        primary: "bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20",
        secondary: "bg-gray-800 hover:bg-gray-700 text-white border border-gray-700",
        outline: "bg-transparent border-2 border-gray-700 hover:border-gray-500 text-gray-300",
        ghost: "bg-transparent hover:bg-white/10 text-gray-300 hover:text-white",
        danger: "bg-red-600 hover:bg-red-700 text-white",
        success: "bg-green-600 hover:bg-green-700 text-white"
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled || isLoading}
            className={`flex items-center justify-center px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ${variants[variant]} ${className}`}
            {...props}
        >
            {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
            ) : Icon ? <Icon size={18} className="mr-2"/> : null}
            {children}
        </button>
    );
};

export default Button;
