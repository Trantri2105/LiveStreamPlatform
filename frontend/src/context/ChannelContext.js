import React, { createContext, useState, useEffect } from 'react';
import channelService from '../services/channelService';
import useAuth from '../hooks/useAuth';

export const ChannelContext = createContext();

export const ChannelProvider = ({ children }) => {
    const { user, isAuthenticated, isAdmin } = useAuth();
    const [channel, setChannel] = useState(null);
    const [hasChannel, setHasChannel] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isAuthenticated && user) {
            checkUserChannel();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated, user]);

    const checkUserChannel = async () => {
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

            if (error.response?.status === 404) {
                setChannel(null);
                setHasChannel(false);
            }
        } finally {
            setLoading(false);
        }
    };

    const createChannel = async (channelData) => {
        try {
            const response = await channelService.createChannel(channelData);

            const newChannel = await channelService.getChannelById(user.id);
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
        checkUserChannel,
    };

    return (
        <ChannelContext.Provider value={value}>
            {children}
        </ChannelContext.Provider>
    );
};