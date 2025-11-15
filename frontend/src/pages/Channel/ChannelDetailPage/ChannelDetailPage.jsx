import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../../../components/layout/MainLayout/MainLayout';
import ChannelInfo from '../../../components/feature/channel/ChannelInfo/ChannelInfo';
import LivestreamCard from '../../../components/feature/livestream/LivestreamCard/LivestreamCard';
import Button from '../../../components/common/Button/Button';
import Loading from '../../../components/common/Loading/Loading';
import channelService from '../../../services/channelService';
import streamService from '../../../services/streamService';
import './ChannelDetailPage.css';

const ChannelDetailPage = () => {
    const { channelId } = useParams();
    const navigate = useNavigate();

    const [channel, setChannel] = useState(null);
    const [streams, setStreams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadChannelData();
    }, [channelId]);

    const loadChannelData = async () => {
        try {
            const channelData = await channelService.getChannelById(channelId);
            setChannel(channelData);

            const streamsData = await streamService.getStreamsByChannel(channelId);
            setStreams(streamsData || []);
        } catch (error) {
            console.error('Error loading channel:', error);
            setError('Failed to load channel.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <MainLayout>
                <Loading fullScreen text="Loading channel..." />
            </MainLayout>
        );
    }

    if (error || !channel) {
        return (
            <MainLayout>
                <div className="error-page">
                    <div className="error-content">
                        <span className="error-icon">📺</span>
                        <h2>Channel Not Found</h2>
                        <p>{error || 'The channel you are looking for does not exist.'}</p>
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
            <div className="channel-detail-page">
                <ChannelInfo channel={channel} />

                <div className="channel-streams-section">
                    <h2>Streams ({streams.length})</h2>

                    {streams.length === 0 ? (
                        <div className="empty-streams">
                            <span className="empty-icon">🎬</span>
                            <h3>No streams yet</h3>
                            <p>This channel hasn't created any streams.</p>
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

export default ChannelDetailPage;