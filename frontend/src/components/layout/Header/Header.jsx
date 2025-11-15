import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';
import useChannel from '../../../hooks/useChannel';
import ChannelAvatar from '../../common/ChannelAvatar/ChannelAvatar'
import './Header.css';

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout, isAuthenticated, isAdmin } = useAuth();
    const { channel, hasChannel } = useChannel();
    const [searchValue, setSearchValue] = useState('');

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchValue.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchValue.trim())}`);
        }
    };

    return (
        <header className="header">
            <div className="header-container">
                <div className="header-logo" onClick={() => navigate('/')}>
                    <h2>🎥 Livestream</h2>
                </div>

                {isAuthenticated && !location.pathname.startsWith('/search') && (
                    <form className="header-search" onSubmit={handleSearch}>
                        <input
                            type="text"
                            placeholder="Search streams..."
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                        />
                        <button type="submit">🔍</button>
                    </form>
                )}

                <div className="header-actions">
                    {isAuthenticated ? (
                        <>
                            {hasChannel && !isAdmin() && (
                                <button
                                    className="btn-live"
                                    onClick={() => navigate('/create-stream')}
                                >
                                    🔴 Go Live
                                </button>
                            )}

                            <div className="user-menu">
                                {hasChannel && channel ? (
                                    <button className="user-avatar-btn">
                                        <ChannelAvatar
                                            avatarUrl={channel.avatar_url}
                                            channelName={channel.title}
                                            size="small"
                                        />
                                    </button>
                                ) : (
                                    <button className="user-avatar">
                                        {user?.first_name?.charAt(0) || '👤'}
                                    </button>
                                )}

                                <div className="user-dropdown">
                                    <div className="user-info">
                                        <strong>{user?.first_name} {user?.last_name}</strong>
                                        <span>{user?.email}</span>
                                    </div>

                                    <hr />

                                    <div className="menu-item" onClick={() => navigate('/profile')}>
                                        👤 Profile
                                    </div>

                                    {!isAdmin() && hasChannel && (
                                        <div className="menu-item" onClick={() => navigate('/my-channel')}>
                                            📺 My Channel
                                        </div>
                                    )}

                                    {!isAdmin() && !hasChannel && (
                                        <div className="menu-item" onClick={() => navigate('/create-channel')}>
                                            ➕ Create Channel
                                        </div>
                                    )}

                                    {isAdmin() && (
                                        <>
                                            <hr />
                                            <div className="menu-item" onClick={() => navigate('/admin/users')}>
                                                👥 Manage Users
                                            </div>
                                        </>
                                    )}

                                    <hr />
                                    <div className="menu-item" onClick={handleLogout}>
                                        🚪 Logout
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <button className="btn-secondary" onClick={() => navigate('/login')}>
                                Sign In
                            </button>
                            <button className="btn-primary" onClick={() => navigate('/register')}>
                                Sign Up
                            </button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;