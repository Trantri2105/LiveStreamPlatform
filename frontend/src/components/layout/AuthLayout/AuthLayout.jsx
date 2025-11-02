import React from 'react';
import './AuthLayout.css';

const AuthLayout = ({ children }) => {
    return (
        <div className="auth-layout">
            <div className="auth-container">
                <div className="auth-logo">
                    <h2>🎥 Livestream App</h2>
                </div>

                <div className="auth-content">
                    {children}
                </div>

                <div className="auth-footer">
                    <p>&copy; 2025 Livestream App. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;