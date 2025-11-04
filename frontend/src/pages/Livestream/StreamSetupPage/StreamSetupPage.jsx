import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import MainLayout from '../../../components/layout/MainLayout/MainLayout';
import StreamSetup from '../../../components/feature/livestream/StreamSetup/StreamSetup';
import Button from '../../../components/common/Button/Button';
import Loading from '../../../components/common/Loading/Loading';
import streamService from '../../../services/streamService';
import './StreamSetupPage.css';

const StreamSetupPage = () => {
    const { streamId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [stream, setStream] = useState(null);
    const [streamKey, setStreamKey] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showKeyWarning, setShowKeyWarning] = useState(false);

    useEffect(() => {
        initializeStreamSetup();
    }, [streamId]);

    const initializeStreamSetup = async () => {
        try {
            const navigationState = location.state;

            if (navigationState?.streamData && navigationState?.fromCreate) {
                setStream(navigationState.streamData);
                setStreamKey(navigationState.streamData.stream_key);
                setShowKeyWarning(false);
            } else {
                const data = await streamService.getStreamById(streamId);
                setStream(data);

                const savedKey = sessionStorage.getItem(`stream_key_${streamId}`);
                if (savedKey) {
                    setStreamKey(savedKey);
                    setShowKeyWarning(false);
                } else {
                    setStreamKey(null);
                    setShowKeyWarning(true);
                }
            }
        } catch (error) {
            console.error('Error fetching stream:', error);
            setError('Failed to load stream information.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <MainLayout>
                <Loading fullScreen text="Loading stream setup..." />
            </MainLayout>
        );
    }

    if (error || !stream) {
        return (
            <MainLayout>
                <div className="error-page">
                    <div className="error-content">
                        <span className="error-icon">⚠️</span>
                        <h2>Stream Not Found</h2>
                        <p>{error || 'The stream you are looking for does not exist.'}</p>
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
            <div className="stream-setup-page">
                <div className="stream-setup-container">
                    <div className="page-header">
                        <div className="header-actions">
                            <Button variant="secondary" onClick={() => navigate('/')}>
                                ← Back to Home
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => navigate(`/stream/${streamId}`)}
                            >
                                View Stream Page →
                            </Button>
                        </div>
                    </div>

                    {/* Warning nếu không có stream key */}
                    {showKeyWarning && (
                        <div className="stream-key-warning">
                            <div className="warning-icon">⚠️</div>
                            <div className="warning-content">
                                <h3>Stream Key Not Available</h3>
                                <p>
                                    The stream key is only available immediately after creating the stream.
                                    If you've refreshed this page or accessed it directly, the stream key is no longer available for security reasons.
                                </p>
                                <p className="warning-note">
                                    <strong>Important:</strong> Stream keys are only shown once during stream creation.
                                    If you've lost your stream key, you'll need to create a new stream.
                                </p>
                            </div>
                        </div>
                    )}

                    <StreamSetup stream={stream} streamKey={streamKey} />
                </div>
            </div>
        </MainLayout>
    );
};

export default StreamSetupPage;