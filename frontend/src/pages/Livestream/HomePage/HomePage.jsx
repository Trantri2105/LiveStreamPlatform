import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../../components/layout/MainLayout/MainLayout';
import LivestreamCard from '../../../components/feature/livestream/LivestreamCard/LivestreamCard';
import Loading from '../../../components/common/Loading/Loading';
import streamService from '../../../services/streamService';
import './HomePage.css';

const HomePage = () => {
    const navigate = useNavigate();

    const [streams, setStreams] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStreams();
    }, []);

    const loadStreams = async () => {
        try {
            const data = await streamService.getAllStreams(100, 0);
            setStreams(data || []);
        } catch (error) {
            console.error('Error loading streams:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <MainLayout>
                <Loading fullScreen text="Loading streams..." />
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="home-page">
                <div className="hero-section">
                    <h1>🔴 Discover Live Streams</h1>
                    <p>Watch live streams from creators around the world</p>
                </div>

                <div className="streams-section">
                    {streams.length === 0 ? (
                        <div className="empty-state">
                            <span className="empty-icon">📺</span>
                            <h3>No streams available</h3>
                            <p>Be the first to create a stream!</p>
                        </div>
                    ) : (
                        <>
                            <div className="section-header">
                                <h2>All Streams ({streams.length})</h2>
                            </div>

                            <div className="livestream-grid">
                                {streams.map((stream) => (
                                    <LivestreamCard
                                        key={stream.id}
                                        stream={stream}
                                        onClick={() => navigate(`/stream/${stream.id}`)}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </MainLayout>
    );
};

export default HomePage;