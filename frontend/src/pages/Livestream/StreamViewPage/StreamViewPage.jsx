import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../../../components/layout/MainLayout/MainLayout';
import VideoPlayer from '../../../components/feature/livestream/VideoPlayer/VideoPlayer';
import StreamInfo from '../../../components/feature/livestream/StreamInfo/StreamInfo';
import Button from '../../../components/common/Button/Button';
import Loading from '../../../components/common/Loading/Loading';
import streamService from '../../../services/streamService';
import './StreamViewPage.css';

const StreamViewPage = () => {
    const { streamId } = useParams();
    const navigate = useNavigate();

    const [stream, setStream] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchStream();

        // Auto refresh stream info every 30 seconds
        const interval = setInterval(fetchStream, 30000);
        return () => clearInterval(interval);
    }, [streamId]);

    const fetchStream = async () => {
        try {
            const data = await streamService.getStreamById(streamId);
            setStream(data);
        } catch (error) {
            console.error('Error fetching stream:', error);
            setError('Failed to load stream.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <MainLayout>
                <Loading fullScreen text="Loading stream..." />
            </MainLayout>
        );
    }

    if (error || !stream) {
        return (
            <MainLayout>
                <div className="error-page">
                    <div className="error-content">
                        <span className="error-icon">😕</span>
                        <h2>Stream Not Available</h2>
                        <p>{error || 'The stream you are looking for is not available.'}</p>
                        <Button variant="primary" onClick={() => navigate('/')}>
                            Back to Home
                        </Button>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="stream-view-page">
                <div className="stream-view-container">
                    <div className="stream-player-section">
                        <VideoPlayer
                            hlsUrl={stream.hls_url}
                            isLive={stream.status === 'live'}
                        />
                    </div>

                    <div className="stream-info-section">
                        <StreamInfo stream={stream} />
                    </div>

                    {/* Chat Section - Placeholder for future */}
                    <div className="stream-chat-section">
                        <div className="chat-placeholder">
                            <h3>💬 Live Chat</h3>
                            <p>Chat feature coming soon!</p>
                            <p className="chat-url">Chat URL: {stream.live_chat_url}</p>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default StreamViewPage;