import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';
import useChannel from '../../../hooks/useChannel';
import './Header.css';

const Header = () => {
    const navigate = useNavigate();
    const { user, logout, isAuthenticated, isAdmin } = useAuth();
    const { channel, hasChannel } = useChannel();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <header className="header">
            <div className="header-container">
                <div className="header-logo" onClick={() => navigate('/')}>
                    <h2>🎥 Livestream App</h2>
                </div>

                <div className="header-search">
                    <input
                        type="text"
                        placeholder="Search streams..."
                        className="search-input"
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                // Handle search
                                console.log('Search:', e.target.value);
                            }
                        }}
                    />
                    <button className="search-button">🔍</button>
                </div>

                <div className="header-actions">
                    {isAuthenticated ? (
                        <>
                            {hasChannel && !isAdmin() && channel && (
                                <div className="channel-badge" title={channel.title}>
                                    📺 {channel.title.length > 20
                                    ? channel.title.substring(0, 20) + '...'
                                    : channel.title}
                                </div>
                            )}

                            {hasChannel && !isAdmin() && (
                                <button
                                    className="btn-create-stream"
                                    onClick={() => navigate('/create-stream')}
                                >
                                    ➕ Go Live
                                </button>
                            )}

                            <div className="user-menu">
                                <button className="user-avatar">
                                    {user?.first_name?.charAt(0) || '👤'}
                                </button>

                                <div className="user-dropdown">
                                    <div className="dropdown-header">
                                        <div className="dropdown-user-info">
                                            <strong>{user?.first_name} {user?.last_name}</strong>
                                            <span>{user?.email}</span>
                                        </div>
                                    </div>

                                    <div className="dropdown-divider"></div>

                                    <div className="dropdown-item" onClick={() => navigate('/profile')}>
                                        👤 Profile
                                    </div>

                                    {!isAdmin() && hasChannel && (
                                        <div className="dropdown-item" onClick={() => navigate('/my-channel')}>
                                            📺 My Channel
                                        </div>
                                    )}

                                    {!isAdmin() && !hasChannel && (
                                        <div className="dropdown-item" onClick={() => navigate('/create-channel')}>
                                            ➕ Create Channel
                                        </div>
                                    )}
                                    {isAdmin() && (
                                        <>
                                            <div className="dropdown-divider"></div>
                                            <div className="dropdown-section-title">Admin</div>
                                            <div className="dropdown-item" onClick={() => navigate('/admin/users')}>
                                                👥 Manage Users
                                            </div>
                                        </>
                                    )}

                                    <div className="dropdown-divider"></div>
                                    <div className="dropdown-item" onClick={handleLogout}>
                                        🚪 Logout
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <button
                                className="btn-secondary"
                                onClick={() => navigate('/login')}
                            >
                                Sign In
                            </button>
                            <button
                                className="btn-primary"
                                onClick={() => navigate('/register')}
                            >
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