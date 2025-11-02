import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

import LoginPage from '../pages/Auth/LoginPage/LoginPage';
import RegisterPage from '../pages/Auth/RegisterPage/RegisterPage';

import HomePage from '../pages/Livestream/HomePage/HomePage';

import ProfilePage from "../pages/Profile/ProfilePage/ProfilePage";
import EditProfilePage from "../pages/Profile/EditProfilePage/EditProfilePage";
import ChangePasswordPage from "../pages/Profile/ChangePasswordPage/ChangePasswordPage";

import UsersPage from "../pages/Admin/UsersPage/UsersPage";
import UserDetailPage from "../pages/Admin/UserDetailPage/UserDetailPage";

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

const AdminRoute = ({children}) => {
    const {isAuthenticated, isAdmin, loading} = useAuth();
    if (loading){
        return(
            <div className="loading-container">
                <div className="spinner-large"></div>
            </div>
        );
    }

    if (!isAuthenticated){
        return <Navigate to="/login" />;
    }

    if (!isAdmin()){
        return <Navigate to="/" />;
    }
    return children
}

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
                    path="/"
                    element={
                        <PrivateRoute>
                            <HomePage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/profile"
                    element={
                        <PrivateRoute>
                            <ProfilePage />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/profile/edit"
                    element={
                        <PrivateRoute>
                            <EditProfilePage />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/profile/change-password"
                    element={
                        <PrivateRoute>
                            <ChangePasswordPage />
                        </PrivateRoute>
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
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </BrowserRouter>
    );
};

export default AppRoutes;