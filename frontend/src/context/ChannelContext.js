import React, { createContext, useState, useEffect } from 'react';
import channelService from '../services/channelService';
import useAuth from '../hooks/useAuth';

export const ChannelContext = createContext();

export const ChannelProvider = ({ children }) => {
    const { user, isAuthenticated, isAdmin, loading: authLoading } = useAuth();
    const [channel, setChannel] = useState(null);
    const [hasChannel, setHasChannel] = useState();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchChannel = async () => {
            if (authLoading) return;
            if (!isAuthenticated || !user) {
                setHasChannel(false);
                setLoading(false);
                return;
            }
            if (isAdmin()) {
                setHasChannel(true);
                setLoading(false);
                return;
            }

            try {
                const channelData = await channelService.getChannelById(user.id);
                if (channelData) {
                    setChannel(channelData);
                    setHasChannel(true);
                } else {
                    setChannel(null);
                    setHasChannel(false);
                }
            } catch (error) {
                console.error('Error checking channel:', error);
                setChannel(null);
                setHasChannel(false);
            } finally {
                setLoading(false);
            }
        };
        fetchChannel();
    }, [isAuthenticated, user, authLoading, isAdmin]);

    const createChannel = async (channelData) => {
        try {
            const response = await channelService.createChannel(channelData);
            await new Promise(r => setTimeout(r, 1000));
            const newChannel = await channelService.getChannelById(user.id);
            console.log("newChannel found:", newChannel)
            setChannel(newChannel);
            setHasChannel(true);

            return response;
        } catch (error) {
            throw error;
        }
    };

    const updateChannel = async (channelData) => {
        try {
            const response = await channelService.updateChannel(channelData);

            const updatedChannel = await channelService.getChannelById(user.id);
            setChannel(updatedChannel);

            return response;
        } catch (error) {
            throw error;
        }
    };

    const refreshChannel = async () => {
        if (user?.id) {
            try {
                const channelData = await channelService.getChannelById(user.id);
                setChannel(channelData);
                setHasChannel(true);
            } catch (error) {
                console.error('Error refreshing channel:', error);
                if (error.response?.status === 404) {
                    setChannel(null);
                    setHasChannel(false);
                }
            }
        }
    };

    const value = {
        channel,
        hasChannel,
        loading,
        createChannel,
        updateChannel,
        refreshChannel,
    };

    return (
        <ChannelContext.Provider value={value}>
            {children}
        </ChannelContext.Provider>
    );
};