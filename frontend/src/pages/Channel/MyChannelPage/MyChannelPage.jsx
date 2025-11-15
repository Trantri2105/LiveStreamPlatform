import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../../components/layout/MainLayout/MainLayout';
import ChannelInfo from '../../../components/feature/channel/ChannelInfo/ChannelInfo';
import LivestreamCard from '../../../components/feature/livestream/LivestreamCard/LivestreamCard';
import Button from '../../../components/common/Button/Button';
import Loading from '../../../components/common/Loading/Loading';
import useChannel from '../../../hooks/useChannel';
import streamService from '../../../services/streamService';
import channelService from '../../../services/channelService';
import './MyChannelPage.css';

const MyChannelPage = () => {
    const navigate = useNavigate();
    const { channel, loading: channelLoading, refreshChannel } = useChannel();

    const [streams, setStreams] = useState([]);
    const [loadingStreams, setLoadingStreams] = useState(true);
    const [loadingAvatar, setLoadingAvatar] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (channel?.id) {
            loadStreams();
        }
    }, [channel]);

    const loadStreams = async () => {
        try {
            const data = await streamService.getStreamsByChannel(channel.id);
            setStreams(data || []);
        } catch (error) {
            console.error('Error loading streams:', error);
        } finally {
            setLoadingStreams(false);
        }
    };

    const handleAvatarUpload = async (file) => {
        // Validate file
        if (!file) return;

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            setMessage({
                type: 'error',
                text: 'Image size must be less than 5MB',
            });
            return;
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            setMessage({
                type: 'error',
                text: 'Only JPG, PNG, and GIF images are allowed',
            });
            return;
        }

        setLoadingAvatar(true);
        setMessage({ type: '', text: '' });

        try {
            await channelService.setChannelAvatar(file);

            setMessage({
                type: 'success',
                text: 'Avatar updated successfully!',
            });

            await refreshChannel();
            setTimeout(() => {
                setMessage({ type: '', text: '' });
            }, 3000);

        } catch (error) {
            console.error('Error uploading avatar:', error);
            setMessage({
                type: 'error',
                text: error.message || 'Failed to upload avatar. Please try again.',
            });
        } finally {
            setLoadingAvatar(false);
        }
    };

    if (channelLoading || loadingStreams) {
        return (
            <MainLayout>
                <Loading fullScreen text="Loading channel..." />
            </MainLayout>
        );
    }

    if (!channel) {
        return (
            <MainLayout>
                <div className="error-page">
                    <div className="error-content">
                        <span className="error-icon">📺</span>
                        <h2>No Channel Found</h2>
                        <p>You need to create a channel first.</p>
                        <Button variant="primary" onClick={() => navigate('/create-channel')}>
                            Create Channel
                        </Button>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="my-channel-page">
                <div className="page-header">
                    <h1>My Channel</h1>
                    <div className="header-actions">
                        <Button
                            variant="secondary"
                            onClick={() => navigate('/channel/edit')}
                        >
                            Edit Channel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => navigate('/create-stream')}
                        >
                            ➕ Create Stream
                        </Button>
                    </div>
                </div>

                {message.text && (
                    <div className={`message-alert message-${message.type}`}>
                        {message.text}
                    </div>
                )}

                <ChannelInfo
                    channel={channel}
                    editable={true}
                    onAvatarUpload={handleAvatarUpload}
                    loadingAvatar={loadingAvatar}
                />

                <div className="channel-streams-section">
                    <h2>My Streams ({streams.length})</h2>

                    {streams.length === 0 ? (
                        <div className="empty-streams">
                            <span className="empty-icon">🎬</span>
                            <h3>No streams yet</h3>
                            <p>Create your first stream to get started!</p>
                            <Button
                                variant="primary"
                                onClick={() => navigate('/create-stream')}
                            >
                                Create Stream
                            </Button>
                        </div>
                    ) : (
                        <div className="streams-grid">
                            {streams.map((stream) => (
                                <LivestreamCard
                                    key={stream.id}
                                    stream={stream}
                                    onClick={() => navigate(`/stream/${stream.id}`)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
};

export default MyChannelPage;