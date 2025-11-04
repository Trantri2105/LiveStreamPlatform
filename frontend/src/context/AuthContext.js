import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import userService from '../services/userService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            if (authService.isAuthenticated()) {
                const userInfo = await userService.getMe()
                setUser(userInfo)
                setIsAuthenticated(true);
            }
        } catch (error) {
            console.error('Auth verification failed:', error);
            setIsAuthenticated(false);
            setUser(null);
            localStorage.removeItem('access_token');
        } finally {
            setLoading(false);
        }
    };

    const login = async (credentials) => {
        try {
            const loginResponse = await authService.login(credentials);
            const userInfo = await userService.getMe();
            setUser(userInfo);
            setIsAuthenticated(true);

            return loginResponse;
        } catch (error) {
            throw error;
        }
    };

    const register = async (userData) => {
        try {
            const response = await authService.register(userData);
            return response;
        } catch (error) {
            throw error;
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
            setUser(null);
            setIsAuthenticated(false);
        } catch (error) {
            console.error('Logout failed:', error);
            setUser(null);
            setIsAuthenticated(false);
        }
    };

    const updateUserProfile = (updatedUser) => {
        setUser(prevUser => ({
            ...prevUser,
            ...updatedUser,
        }));
    };

    const isAdmin = () => {
        return user?.role === 'admin';
    };

    const value = {
        user,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
        updateUserProfile,
        isAdmin,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};