import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import userService from '../services/userService';
import { USER_ROLES} from "../config/api.config";

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
                const response = await userService.getMe();
                setUser(response.data || response);
                setIsAuthenticated(true);
            }
        } catch (error) {
            console.error('Auth verification failed:', error);
            setIsAuthenticated(false);
            setUser(null);
            await authService.logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (credentials) => {
        try {
            const response = await authService.login(credentials);
            const userInfo = await userService.getMe()
            setUser(userInfo.data || userInfo)
            setIsAuthenticated(true);
            return response;
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
        }
    };

    const updateUserProfile = (updatedUser) => {
        setUser(updatedUser);
    }

    const isAdmin = () => {
        return user?.role === USER_ROLES.ADMIN
    }

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