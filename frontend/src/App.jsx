import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import AppRoutes from './routes/AppRoutes';
import {ToastProvider} from './context/ToastContext.jsx';

const App = () => {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ToastProvider>
                    <div className="min-h-screen font-sans bg-gray-950 text-white selection:bg-violet-500 selection:text-white">
                        <AppRoutes />
                    </div>
                </ToastProvider>
            </AuthProvider>
        </BrowserRouter>
    );
};

export default App;
