import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../../components/layout/MainLayout/MainLayout';
import LivestreamCard from '../../../components/feature/livestream/LivestreamCard/LivestreamCard';
import Input from '../../../components/common/Input/Input';
import Loading from '../../../components/common/Loading/Loading';
import streamService from '../../../services/streamService';
import './HomePage.css';

const HomePage = () => {
    const navigate = useNavigate();

    const [streams, setStreams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        fetchStreams();
    }, []);

    const fetchStreams = async () => {
        try {
            const data = await streamService.getAllStreams();
            setStreams(data || []);
        } catch (error) {
            console.error('Error fetching streams:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setSearching(true);

        try {
            const data = await streamService.searchStreams(searchText);
            setStreams(data || []);
        } catch (error) {
            console.error('Error searching streams:', error);
        } finally {
            setSearching(false);
        }
    };

    const handleSearchChange = (e) => {
        setSearchText(e.target.value);

        // Auto search khi xóa hết text
        if (e.target.value === '') {
            fetchStreams();
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

                    <form className="search-form" onSubmit={handleSearch}>
                        <Input
                            type="text"
                            name="search"
                            value={searchText}
                            onChange={handleSearchChange}
                            placeholder="Search streams by title..."
                            icon="🔍"
                        />
                        <button type="submit" className="search-btn" disabled={searching}>
                            {searching ? 'Searching...' : 'Search'}
                        </button>
                    </form>
                </div>

                <div className="streams-section">
                    {streams.length === 0 ? (
                        <div className="empty-state">
                            <span className="empty-icon">📺</span>
                            <h3>No streams found</h3>
                            <p>
                                {searchText
                                    ? 'Try a different search term'
                                    : 'Be the first to create a stream!'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="section-header">
                                <h2>
                                    {searchText
                                        ? `Search Results (${streams.length})`
                                        : `All Streams (${streams.length})`}
                                </h2>
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