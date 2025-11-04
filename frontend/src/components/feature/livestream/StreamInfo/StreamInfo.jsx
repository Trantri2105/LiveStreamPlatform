import React from 'react';
import './StreamInfo.css';

const StreamInfo = ({ stream }) => {
    const getStatusBadge = () => {
        switch (stream.status) {
            case 'live':
                return <span className="status-badge status-live">🔴 LIVE</span>;
            case 'init':
                return <span className="status-badge status-init">⏸️ Not Started</span>;
            case 'ended':
                return <span className="status-badge status-ended">⏹️ Ended</span>;
            default:
                return null;
        }
    };

    return (
        <div className="stream-info">
            <div className="stream-header">
                {getStatusBadge()}
                <h1 className="stream-title">{stream.title}</h1>
            </div>

            <div className="stream-meta">
                <div className="channel-info">
                    <div className="channel-avatar">
                        {stream.channel?.title?.charAt(0) || 'C'}
                    </div>
                    <div className="channel-details">
                        <h3 className="channel-name">{stream.channel?.title || 'Unknown Channel'}</h3>
                        <p className="channel-id">Channel ID: {stream.channel?.id?.slice(0, 8)}...</p>
                    </div>
                </div>

                <div className="stream-category">
                    <span className="category-label">Category:</span>
                    <span className="category-value">{stream.category?.title || 'Uncategorized'}</span>
                </div>
            </div>

            <div className="stream-description">
                <h4>About</h4>
                <p>{stream.description}</p>
            </div>
        </div>
    );
};

export default StreamInfo;