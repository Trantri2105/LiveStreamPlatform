import React from 'react';
import useAuth from '../../../../hooks/useAuth';
import './ChannelInfo.css';

const ChannelInfo = ({ channel }) => {
    const { user } = useAuth();

    if (!channel) {
        return (
            <div className="channel-info empty">
                <p>No channel information available</p>
            </div>
        );
    }

    return (
        <div className="channel-info">
            <div className="channel-header">
                <div className="channel-icon">📺</div>
                <div className="channel-details">
                    <h2 className="channel-title">{channel.title}</h2>
                    <p className="channel-owner">Owner: {user?.first_name} {user?.last_name}</p>
                </div>
            </div>

            <div className="channel-stats">
                <div className="stat-item">
                    <span className="stat-label">Channel ID</span>
                    <code className="stat-value">{channel.id}</code>
                </div>

                <div className="stat-item">
                    <span className="stat-label">Note</span>
                    <span className="stat-value">Channel ID = Your User ID</span>
                </div>
            </div>

            <div className="channel-description">
                <h3>About this channel</h3>
                <p>{channel.description}</p>
            </div>
        </div>
    );
};

export default ChannelInfo;