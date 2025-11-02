import React from 'react';
import './ProfileCard.css';

const ProfileCard = ({ user }) => {
    return (
        <div className="profile-card">
            <div className="profile-header">
                <div className="profile-avatar">
                    {user?.avatar_url ? (
                        <img src={user.avatar_url} alt={user.first_name} />
                    ) : (
                        <div className="avatar-placeholder">
                            {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
                        </div>
                    )}
                </div>

                <div className="profile-info">
                    <h2 className="profile-name">
                        {user?.first_name} {user?.last_name}
                    </h2>
                    <p className="profile-email">{user?.email}</p>

                    {user?.role && (
                        <span className={`role-badge role-${user.role}`}>
              {user.role === 'admin' ? '👑 Admin' : '👤 User'}
            </span>
                    )}
                </div>
            </div>

            <div className="profile-stats">
                <div className="stat-item">
                    <span className="stat-label">User ID</span>
                    <span className="stat-value">{user?.id?.slice(0, 8)}...</span>
                </div>

                <div className="stat-item">
                    <span className="stat-label">Member Since</span>
                    <span className="stat-value">
            {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
          </span>
                </div>
            </div>
        </div>
    );
};

export default ProfileCard;