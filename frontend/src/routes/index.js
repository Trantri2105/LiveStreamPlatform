import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

import LoginPage from '../pages/Auth/LoginPage/LoginPage';
import RegisterPage from '../pages/Auth/RegisterPage/RegisterPage';

import HomePage from '../pages/Livestream/HomePage/HomePage';
import CreateStreamPage from '../pages/Livestream/CreateStreamPage/CreateStreamPage';
import StreamSetupPage from '../pages/Livestream/StreamSetupPage/StreamSetupPage';
import StreamViewPage from '../pages/Livestream/StreamViewPage/StreamViewPage';

import ProfilePage from '../pages/Profile/ProfilePage/ProfilePage';
import EditProfilePage from '../pages/Profile/EditProfilePage/EditProfilePage';
import ChangePasswordPage from '../pages/Profile/ChangePasswordPage/ChangePasswordPage';

import CreateChannelPage from '../pages/Channel/CreateChannelPage/CreateChannelPage';
import MyChannelPage from '../pages/Channel/MyChannelPage/MyChannelPage';
import EditChannelPage from '../pages/Channel/EditChannelPage/EditChannelPage';

import UsersPage from '../pages/Admin/UsersPage/UsersPage';
import UserDetailPage from '../pages/Admin/UserDetailPage/UserDetailPage';

import ChannelRequiredRoute from './ChannelRequiredRoute';

const PrivateRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner-large"></div>
            </div>
        );
    }

    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner-large"></div>
            </div>
        );
    }

    return !isAuthenticated ? children : <Navigate to="/" replace />;
};

// Admin Route
const AdminRoute = ({ children }) => {
    const { isAuthenticated, isAdmin, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner-large"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!isAdmin()) {
        return <Navigate to="/" replace />;
    }

    return children;
};

const AppRoutes = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/login"
                    element={
                        <PublicRoute>
                            <LoginPage />
                        </PublicRoute>
                    }
                />
                <Route
                    path="/register"
                    element={
                        <PublicRoute>
                            <RegisterPage />
                        </PublicRoute>
                    }
                />

                <Route
                    path="/create-channel"
                    element={
                        <PrivateRoute>
                            <CreateChannelPage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/"
                    element={
                        <ChannelRequiredRoute>
                            <HomePage />
                        </ChannelRequiredRoute>
                    }
                />

                <Route
                    path="/create-stream"
                    element={
                        <ChannelRequiredRoute>
                            <CreateStreamPage />
                        </ChannelRequiredRoute>
                    }
                />
                <Route
                    path="/stream/:streamId/setup"
                    element={
                        <ChannelRequiredRoute>
                            <StreamSetupPage />
                        </ChannelRequiredRoute>
                    }
                />
                <Route
                    path="/stream/:streamId"
                    element={
                        <ChannelRequiredRoute>
                            <StreamViewPage />
                        </ChannelRequiredRoute>
                    }
                />

                <Route
                    path="/profile"
                    element={
                        <ChannelRequiredRoute>
                            <ProfilePage />
                        </ChannelRequiredRoute>
                    }
                />
                <Route
                    path="/profile/edit"
                    element={
                        <ChannelRequiredRoute>
                            <EditProfilePage />
                        </ChannelRequiredRoute>
                    }
                />
                <Route
                    path="/profile/change-password"
                    element={
                        <ChannelRequiredRoute>
                            <ChangePasswordPage />
                        </ChannelRequiredRoute>
                    }
                />

                <Route
                    path="/my-channel"
                    element={
                        <ChannelRequiredRoute>
                            <MyChannelPage />
                        </ChannelRequiredRoute>
                    }
                />
                <Route
                    path="/channel/edit"
                    element={
                        <ChannelRequiredRoute>
                            <EditChannelPage />
                        </ChannelRequiredRoute>
                    }
                />

                <Route
                    path="/admin/users"
                    element={
                        <AdminRoute>
                            <UsersPage />
                        </AdminRoute>
                    }
                />
                <Route
                    path="/admin/users/:userId"
                    element={
                        <AdminRoute>
                            <UserDetailPage />
                        </AdminRoute>
                    }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
};

export default AppRoutes;