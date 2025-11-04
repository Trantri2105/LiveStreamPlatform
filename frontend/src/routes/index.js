import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

// Auth Pages
import LoginPage from '../pages/Auth/LoginPage/LoginPage';
import RegisterPage from '../pages/Auth/RegisterPage/RegisterPage';

// Livestream Pages
import HomePage from '../pages/Livestream/HomePage/HomePage';

// Profile Pages
import ProfilePage from '../pages/Profile/ProfilePage/ProfilePage';
import EditProfilePage from '../pages/Profile/EditProfilePage/EditProfilePage';
import ChangePasswordPage from '../pages/Profile/ChangePasswordPage/ChangePasswordPage';

// Channel Pages
import CreateChannelPage from '../pages/Channel/CreateChannelPage/CreateChannelPage';
import MyChannelPage from '../pages/Channel/MyChannelPage/MyChannelPage';
import EditChannelPage from '../pages/Channel/EditChannelPage/EditChannelPage';

// Admin Pages
import UsersPage from '../pages/Admin/UsersPage/UsersPage';
import UserDetailPage from '../pages/Admin/UserDetailPage/UserDetailPage';

// Route Components
import ChannelRequiredRoute from './ChannelRequiredRoute';

// Protected Route Component
const PrivateRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner-large"></div>
            </div>
        );
    }

    return isAuthenticated ? children : <Navigate to="/login" />;
};

// Public Route (redirect if authenticated)
const PublicRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner-large"></div>
            </div>
        );
    }

    return !isAuthenticated ? children : <Navigate to="/" />;
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
        return <Navigate to="/login" />;
    }

    if (!isAdmin()) {
        return <Navigate to="/" />;
    }

    return children;
};

const AppRoutes = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public Routes */}
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

                {/* Create Channel Route - Private but before channel check */}
                <Route
                    path="/create-channel"
                    element={
                        <PrivateRoute>
                            <CreateChannelPage />
                        </PrivateRoute>
                    }
                />

                {/* Channel Required Routes */}
                <Route
                    path="/"
                    element={
                        <ChannelRequiredRoute>
                            <HomePage />
                        </ChannelRequiredRoute>
                    }
                />

                {/* Profile Routes - Require Channel */}
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

                {/* Channel Routes - Require Channel */}
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

                {/* Admin Routes */}
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

                {/* Redirect unknown routes */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </BrowserRouter>
    );
};

export default AppRoutes;