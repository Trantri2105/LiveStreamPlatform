import {createContext, useEffect, useState} from "react";
import authApi from "../api/authApi.js";
import channelApi from "../api/channelApi.js";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [channel, setChannel] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    const loadUserAndChannel = async () => {
        // eslint-disable-next-line no-useless-catch
        try {
            const userData = await authApi.getMe();
            setUser(userData);

            try {
                const channelData = await channelApi.getById(userData.id);
                setChannel(channelData);
                // eslint-disable-next-line no-unused-vars
            } catch (e) {
                setChannel(null);
            }

            setIsAuthenticated(true);
        } catch (error) {
            throw error;
        }
    };

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('access_token');
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                await authApi.verify();
                await loadUserAndChannel();
                // eslint-disable-next-line no-unused-vars
            } catch (error) {
                try {
                    const refreshData = await authApi.refresh();
                    localStorage.setItem('access_token', refreshData.access_token);
                    await loadUserAndChannel();
                    // eslint-disable-next-line no-unused-vars
                } catch (refreshError) {
                    localStorage.removeItem('access_token');
                    setUser(null);
                    setChannel(null);
                    setIsAuthenticated(false);
                }
            } finally {
                setLoading(false);
            }
        };
        initAuth();
    }, []);

    const login = async (email, password) => {
        const res = await authApi.login({ email, password });
        localStorage.setItem('access_token', res.access_token);
        await loadUserAndChannel();
        return true;
    };

    const register = async (formData) => {
        await authApi.register(formData);
        return true;
    };

    const logout = async () => {
        await authApi.logout();
        localStorage.removeItem('access_token');
        setIsAuthenticated(false);
        setUser(null);
        setChannel(null);
    };

    const refreshChannel = async () => {
        if(user?.id) {
            try{
                const data = await channelApi.getById(user.id);
                setChannel(data);
            } catch (error){
                console.log("Failed to refresh channel:", error);
            }
        }
    };

    const updateChannelState = (newChannelData) => {
        setChannel(newChannelData);
    };

    const refreshUser = async () => {
        const data = await authApi.getMe();
        setUser(data);
    }

    return (
        <AuthContext.Provider value={{
            user, channel, isAuthenticated, loading,
            login, register, logout, refreshChannel, refreshUser, updateChannelState
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};