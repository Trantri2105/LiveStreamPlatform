import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const Toast = ({ id, message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, 3000); // Tự tắt sau 3 giây
        return () => clearTimeout(timer);
    }, [id, onClose]);

    const icons = {
        success: <CheckCircle size={20} className="text-green-400" />,
        error: <AlertCircle size={20} className="text-red-400" />,
        info: <Info size={20} className="text-blue-400" />,
        warning: <AlertTriangle size={20} className="text-yellow-400" />
    };

    const styles = {
        success: 'bg-gray-800 border-green-500/50',
        error: 'bg-gray-800 border-red-500/50',
        info: 'bg-gray-800 border-blue-500/50',
        warning: 'bg-gray-800 border-yellow-500/50'
    };

    return (
        <div className={`flex items-center gap-3 p-4 rounded-lg border shadow-2xl mb-3 animate-in slide-in-from-right fade-in duration-300 min-w-[300px] max-w-md backdrop-blur-md ${styles[type] || styles.info}`}>
            {icons[type]}
            <p className="text-sm text-white flex-1 font-medium">{message}</p>
            <button onClick={() => onClose(id)} className="text-gray-400 hover:text-white transition-colors">
                <X size={16} />
            </button>
        </div>
    );
};

export const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className="fixed top-20 right-4 z-[9999] flex flex-col pointer-events-none">
            <div className="pointer-events-auto">
                {toasts.map(toast => (
                    <Toast key={toast.id} {...toast} onClose={removeToast} />
                ))}
            </div>
        </div>
    );
};