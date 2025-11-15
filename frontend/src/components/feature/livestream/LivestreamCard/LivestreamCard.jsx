import React from 'react';
import './LivestreamCard.css';
import ChannelAvatar from "../../../common/ChannelAvatar/ChannelAvatar";

const LivestreamCard = ({ stream, onClick }) => {
    const getStatusBadge = () => {
        switch (stream.status) {
            case 'live':
                return (
                    <div className="live-badge">
                        <span className="live-dot"></span>
                        LIVE
                    </div>
                );
            case 'init':
                return <div className="status-badge status-init">Starting Soon</div>;
            case 'end':
                return <div className="status-badge status-ended">Ended</div>;
            default:
                return null;
        }
    };

    const getThumbnail = () => {
        return 'https://via.placeholder.com/400x225?text=Stream+Thumbnail';
    };

    return (
        <div className="livestream-card" onClick={onClick}>
            <div className="card-thumbnail">
                <img src={getThumbnail()} alt={stream.title} />
                {getStatusBadge()}
            </div>

            <div className="card-content">
                <h3 className="card-title">{stream.title}</h3>

                <div className="card-channel">
                    <ChannelAvatar
                        avatarUrl={stream.channel?.avatar_url}
                        channelName={stream.channel?.title}
                        size="medium"
                    />
                    <div className="channel-info">
                        <p className="channel-name">{stream.channel?.title || 'Unknown'}</p>
                        <p className="channel-category">{stream.category?.title || 'Uncategorized'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LivestreamCard;