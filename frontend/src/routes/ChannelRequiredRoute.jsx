import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useChannel from '../hooks/useChannel';

const ChannelRequiredRoute = ({ children }) => {
    const { isAuthenticated, loading: authLoading, isAdmin } = useAuth();
    const { hasChannel, loading: channelLoading } = useChannel();

    if (authLoading || channelLoading) {
        return (
            <div className="loading-container">
                <div className="spinner-large"></div>
                <p>Loading...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (isAdmin()) {
        return children;
    }

    if (!hasChannel) {
        return <Navigate to="/create-channel" state={{ required: true }} replace />;
    }

    return children;
};

export default ChannelRequiredRoute;