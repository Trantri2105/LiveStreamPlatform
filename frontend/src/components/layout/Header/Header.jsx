import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';
import './Header.css';

const Header = () => {
    const navigate = useNavigate();
    const { user, logout, isAuthenticated, isAdmin } = useAuth();

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
                        placeholder="Search livestreams..."
                        className="search-input"
                    />
                    <button className="search-button">🔍</button>
                </div>

                <div className="header-actions">
                    {isAuthenticated ? (
                        <>
                            <button
                                className="btn-create-stream"
                                onClick={() => navigate('/create-livestream')}
                            >
                                ➕ Go Live
                            </button>

                            <div className="user-menu">
                                <button className="user-avatar">
                                    {user?.first_name?.charAt(0) || '👤'}
                                </button>

                                <div className="user-dropdown">
                                    <div className="dropdown-item" onClick={() => navigate('/profile')}>
                                        👤 Profile
                                    </div>
                                    <div className="dropdown-item" onClick={() => navigate('/my-channels')}>
                                        📺 My Channels
                                    </div>

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