import React, { useState } from 'react';
import './ChannelAvatar.css';

const ChannelAvatar = ({
                           avatarUrl,
                           channelName,
                           size = 'medium', // small, medium, large, xl
                           editable = false,
                           onUpload,
                           loading = false,
                       }) => {
    const [imageError, setImageError] = useState(false);

    const getInitials = () => {
        if (!channelName) return '?';
        return channelName.charAt(0).toUpperCase();
    };

    const handleImageError = () => {
        setImageError(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file && onUpload) {
            onUpload(file);
        }
    };

    const renderContent = () => {
        if (avatarUrl && !imageError) {
            return (
                <img
                    src={avatarUrl}
                    alt={channelName || 'Channel'}
                    className="channel-avatar-image"
                    onError={handleImageError}
                />
            );
        }
        return <div className="channel-avatar-initials">{getInitials()}</div>;
    };

    return (
        <div className={`channel-avatar channel-avatar-${size} ${editable ? 'editable' : ''}`}>
            {loading ? (
                <div className="channel-avatar-loading">
                    <div className="spinner"></div>
                </div>
            ) : (
                renderContent()
            )}

            {editable && !loading && (
                <label className="channel-avatar-edit-overlay">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                    <span className="channel-avatar-edit-icon">📷</span>
                    <span className="channel-avatar-edit-text">Change Avatar</span>
                </label>
            )}
        </div>
    );
};

export default ChannelAvatar;