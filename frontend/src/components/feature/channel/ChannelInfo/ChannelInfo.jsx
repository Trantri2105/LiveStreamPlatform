import React from 'react';
import ChannelAvatar from '../../../common/ChannelAvatar/ChannelAvatar';
import './ChannelInfo.css';

const ChannelInfo = ({ channel, editable = false, onAvatarUpload, loadingAvatar = false }) => {
    return (
        <div className="channel-info-card">
            <div className="channel-info-header">
                <ChannelAvatar
                    avatarUrl={channel.avatar_url}
                    channelName={channel.title}
                    size="xl"
                    editable={editable}
                    onUpload={onAvatarUpload}
                    loading={loadingAvatar}
                />

                <div className="channel-info-details">
                    <h1 className="channel-info-title">{channel.title}</h1>
                    <p className="channel-info-id">Channel ID: {channel.id}</p>

                    {channel.description && (
                        <p className="channel-info-description">{channel.description}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChannelInfo;