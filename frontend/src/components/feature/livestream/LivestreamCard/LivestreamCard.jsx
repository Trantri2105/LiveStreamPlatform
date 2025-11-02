import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LivestreamCard.css';

const LivestreamCard = ({ stream }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/livestream/${stream.id}`);
    };

    return (
        <div className="livestream-card" onClick={handleClick}>
            <div className="card-thumbnail">
                <img src={stream.thumbnail} alt={stream.title} />

                {stream.isLive && (
                    <div className="live-badge">
                        <span className="live-dot"></span>
                        LIVE
                    </div>
                )}

                <div className="viewer-count">
                    <span>👁️ {stream.viewers.toLocaleString()}</span>
                </div>
            </div>

            <div className="card-content">
                <h3 className="card-title">{stream.title}</h3>
                <p className="card-channel">{stream.channel}</p>
            </div>
        </div>
    );
};

export default LivestreamCard;