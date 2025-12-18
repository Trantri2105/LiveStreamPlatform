import React from 'react';
import {Routes, Route, Navigate, useLocation} from 'react-router-dom';
import { useAuth} from "../hooks/useAuth.js";

import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import HomePage from '../pages/home/HomePage';
import CreateChannelPage from "../pages/channel/CreateChannelPage.jsx";
import ProfilePage from "../pages/profile/ProfilePage.jsx";
import StreamSetupPage from "../pages/stream/StreamSetupPage.jsx";
import StreamRoomPage from "../pages/stream/StreamRoomPage.jsx";
import SearchPage from "../pages/search/SearchPage.jsx";
import PaymentHandlePage from "../pages/payment/PaymentHandlePage.jsx";
import UserListPage from "../pages/admin/UserListPage.jsx";
import UserDetailPage from "../pages/admin/UserDetailPage.jsx";
import CategoryListPage from "../pages/admin/CategoryListPage.jsx";
import RevenuePage from "../pages/studio/RevenuePage.jsx";
import ChannelProfilePage from "../pages/channel/ChannelProfilePage.jsx";

const PublicRoute = ({ children }) => {
    const { isAuthenticated, loading, channel } = useAuth();
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-500"></div>
            </div>
        );
    }
    if (isAuthenticated) {
        if (!channel) {
            return <Navigate to="/create-channel" replace />;
        }
    }
    return children;
}

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading, channel } = useAuth();
    const location = useLocation();
    const currentPath = location.pathname;
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-500"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if(!channel && currentPath !== '/create-channel'){
        return <Navigate to="/create-channel" replace />;
    }

    if(channel && currentPath === '/create-channel'){
        return <Navigate to="/" replace />;
    }
    return children;
};

const AppRoutes = () => {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<PublicRoute><HomePage /></PublicRoute>} />
            <Route path="/stream/:id" element={<PublicRoute><StreamRoomPage /></PublicRoute>} />
            <Route path="/search" element={<PublicRoute><SearchPage /></PublicRoute>} />
            <Route path="/channel/:id" element={<PublicRoute><ChannelProfilePage /></PublicRoute>} />
            {/* Protected Routes */}
            <Route
                path="/create-channel"
                element={<ProtectedRoute><CreateChannelPage/></ProtectedRoute>}
            />
            <Route
                path="/profile"
                element={<ProtectedRoute><ProfilePage/></ProtectedRoute>}
            />
            <Route
                path="/stream-setup"
                element={<ProtectedRoute><StreamSetupPage/></ProtectedRoute>}
            />
            <Route
                path="/payment-result"
                element={<ProtectedRoute><PaymentHandlePage></PaymentHandlePage></ProtectedRoute>}
            />
            <Route
                path="/studio/revenue"
                element={<ProtectedRoute><RevenuePage /></ProtectedRoute>}
            />
            <Route
                path="/admin/users"
                element={<ProtectedRoute><UserListPage /></ProtectedRoute>}
            />
            <Route
                path="/admin/users/:id"
                element={<ProtectedRoute><UserDetailPage /></ProtectedRoute>}
            />
            <Route
                path="/admin/categories"
                element={<ProtectedRoute><CategoryListPage /></ProtectedRoute>}
            />
                {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
};

export default AppRoutes;