import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MainLayout from '../../../components/layout/MainLayout/MainLayout';
import LivestreamCard from '../../../components/feature/livestream/LivestreamCard/LivestreamCard';
import Loading from '../../../components/common/Loading/Loading';
import streamService from '../../../services/streamService';
import categoryService from '../../../services/categoryService';
import channelService from '../../../services/channelService';
import ChannelAvatar from '../../../components/common/ChannelAvatar/ChannelAvatar'
import './SearchPage.css';

const SearchPage = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const queryText = searchParams.get('q') || '';

    const [activeTab, setActiveTab] = useState('streams');
    const [loading, setLoading] = useState(false);
    const [loadingCategoryStreams, setLoadingCategoryStreams] = useState({});

    // Filters
    const [filters, setFilters] = useState({
        search_text: queryText,
        status: 'all',
        category_id: 'all',
    });

    // Results
    const [streams, setStreams] = useState([]);
    const [channels, setChannels] = useState([]);
    const [categories, setCategories] = useState([]);
    const [categoryStreams, setCategoryStreams] = useState({}); // { categoryId: [streams] }

    // Categories for filter dropdown
    const [allCategories, setAllCategories] = useState([]);

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        if (queryText) {
            setFilters(prev => ({ ...prev, search_text: queryText }));
            performSearch(queryText);
        }
    }, [queryText]);

    // Load streams for categories khi switch sang Categories tab
    useEffect(() => {
        if (activeTab === 'categories' && categories.length > 0) {
            loadStreamsForCategories();
        }
    }, [activeTab, categories]);

    const loadCategories = async () => {
        try {
            const data = await categoryService.getAllCategories();
            setAllCategories(data || []);
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    };

    const performSearch = async (searchText = filters.search_text) => {
        if (!searchText.trim()) return;

        setLoading(true);

        try {
            // Search streams
            const streamParams = {
                search_text: searchText,
                limit: 100,
                offset: 0,
            };

            if (filters.status !== 'all') {
                streamParams.status = filters.status;
            }

            const streamResults = await streamService.searchStreams(streamParams);

            let filteredStreams = streamResults || [];
            if (filters.category_id !== 'all') {
                filteredStreams = filteredStreams.filter(s => s.category?.id === filters.category_id);
            }

            setStreams(filteredStreams);

            const channelResults = await channelService.searchChannels({
                search_text: searchText,
                limit: 50,
                offset: 0,
            });
            setChannels(channelResults || []);

            // Search categories
            const categoryResults = await categoryService.searchCategories({
                search_text: searchText,
                limit: 50,
                offset: 0,
            });
            setCategories(categoryResults || []);

        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Load streams cho tất cả categories tìm được
    const loadStreamsForCategories = async () => {
        const newCategoryStreams = {};

        for (const category of categories) {
            // Set loading state cho từng category
            setLoadingCategoryStreams(prev => ({ ...prev, [category.id]: true }));

            try {
                // Search streams có category này
                const categoryStreamResults = await streamService.searchStreams({
                    search_text: '', // Empty để lấy tất cả
                    limit: 10, // Giới hạn 10 streams per category
                    offset: 0,
                });

                // Filter streams theo category ID
                const filtered = categoryStreamResults.filter(s => s.category?.id === category.id);
                newCategoryStreams[category.id] = filtered;

            } catch (error) {
                console.error(`Error loading streams for category ${category.id}:`, error);
                newCategoryStreams[category.id] = [];
            } finally {
                setLoadingCategoryStreams(prev => ({ ...prev, [category.id]: false }));
            }
        }

        setCategoryStreams(newCategoryStreams);
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleApplyFilters = () => {
        performSearch();
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();

        if (filters.search_text.trim()) {
            setSearchParams({ q: filters.search_text.trim() });
            performSearch(filters.search_text);
        }
    };

    const handleChannelClick = (channelId) => {
        navigate(`/channel/${channelId}`);
    };

    const handleCategoryClick = (categoryId) => {
        // Filter streams by this category
        setActiveTab('streams');
        setFilters(prev => ({ ...prev, category_id: categoryId }));
        performSearch();
    };

    const handleViewAllCategory = (categoryId) => {
        // Navigate to streams filtered by category
        setActiveTab('streams');
        setFilters(prev => ({ ...prev, category_id: categoryId, search_text: '' }));
        setSearchParams({ q: '' });
        performSearch('');
    };

    return (
        <MainLayout>
            <div className="search-page">
                {/* Search Header */}
                <div className="search-header">
                    <form className="search-form-large" onSubmit={handleSearchSubmit}>
                        <input
                            type="text"
                            className="search-input-large"
                            placeholder="Search streams, channels, categories..."
                            value={filters.search_text}
                            onChange={(e) => handleFilterChange('search_text', e.target.value)}
                        />
                        <button type="submit" className="search-btn-large">
                            🔍 Search
                        </button>
                    </form>
                </div>

                {/* Tabs */}
                <div className="search-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'streams' ? 'active' : ''}`}
                        onClick={() => setActiveTab('streams')}
                    >
                        Streams ({streams.length})
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'channels' ? 'active' : ''}`}
                        onClick={() => setActiveTab('channels')}
                    >
                        Channels ({channels.length})
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
                        onClick={() => setActiveTab('categories')}
                    >
                        Categories ({categories.length})
                    </button>
                </div>

                {/* Filters (Only for Streams tab) */}
                {activeTab === 'streams' && (
                    <div className="filters-section">
                        <div className="filter-group">
                            <label>Status:</label>
                            <select
                                className="filter-select"
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                            >
                                <option value="all">All</option>
                                <option value="live">🔴 Live</option>
                                <option value="init">⏸️ Starting Soon</option>
                                <option value="end">⏹️ Ended</option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Category:</label>
                            <select
                                className="filter-select"
                                value={filters.category_id}
                                onChange={(e) => handleFilterChange('category_id', e.target.value)}
                            >
                                <option value="all">All Categories</option>
                                {allCategories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button className="apply-filters-btn" onClick={handleApplyFilters}>
                            Apply Filters
                        </button>
                    </div>
                )}

                {/* Results */}
                <div className="search-results">
                    {loading ? (
                        <Loading text="Searching..." />
                    ) : (
                        <>
                            {/* Streams Tab */}
                            {activeTab === 'streams' && (
                                <div className="results-grid">
                                    {streams.length === 0 ? (
                                        <div className="empty-results">
                                            <span className="empty-icon">🔍</span>
                                            <h3>No streams found</h3>
                                            <p>Try different keywords or filters</p>
                                        </div>
                                    ) : (
                                        streams.map((stream) => (
                                            <LivestreamCard
                                                key={stream.id}
                                                stream={stream}
                                                onClick={() => navigate(`/stream/${stream.id}`)}
                                            />
                                        ))
                                    )}
                                </div>
                            )}

                            {/* Channels Tab */}
                            {activeTab === 'channels' && (
                                <div className="channels-list">
                                    {channels.length === 0 ? (
                                        <div className="empty-results">
                                            <span className="empty-icon">📺</span>
                                            <h3>No channels found</h3>
                                            <p>Try different keywords</p>
                                        </div>
                                    ) : (
                                        channels.map((channel) => (
                                            <div
                                                key={channel.id}
                                                className="channel-card"
                                                onClick={() => handleChannelClick(channel.id)}
                                            >
                                                <ChannelAvatar
                                                    avatarUrl={channel.avatar_url}
                                                    channelName={channel.title}
                                                    size="large"
                                                />
                                                <div className="channel-info">
                                                    <h3 className="channel-title">{channel.title}</h3>
                                                    <p className="channel-description">{channel.description}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* Categories Tab with Streams */}
                            {activeTab === 'categories' && (
                                <div className="categories-with-streams">
                                    {categories.length === 0 ? (
                                        <div className="empty-results">
                                            <span className="empty-icon">🎮</span>
                                            <h3>No categories found</h3>
                                            <p>Try different keywords</p>
                                        </div>
                                    ) : (
                                        categories.map((category) => (
                                            <div key={category.id} className="category-section">
                                                {/* Category Header */}
                                                <div className="category-section-header">
                                                    <div className="category-header-left">
                                                        <div className="category-icon-small">🎮</div>
                                                        <h2 className="category-section-title">{category.title}</h2>
                                                    </div>
                                                    <button
                                                        className="view-all-btn"
                                                        onClick={() => handleViewAllCategory(category.id)}
                                                    >
                                                        View All →
                                                    </button>
                                                </div>

                                                {/* Streams for this category */}
                                                <div className="category-streams">
                                                    {loadingCategoryStreams[category.id] ? (
                                                        <div className="category-loading">
                                                            <Loading size="small" text="Loading streams..." />
                                                        </div>
                                                    ) : categoryStreams[category.id]?.length > 0 ? (
                                                        <div className="category-streams-grid">
                                                            {categoryStreams[category.id].slice(0, 4).map((stream) => (
                                                                <LivestreamCard
                                                                    key={stream.id}
                                                                    stream={stream}
                                                                    onClick={() => navigate(`/stream/${stream.id}`)}
                                                                />
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="category-no-streams">
                                                            <p>No streams in this category yet</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </MainLayout>
    );
};

export default SearchPage;