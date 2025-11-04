import React from 'react';
import './ProfileCard.css';

const ProfileCard = ({ user }) => {
    const getRoleBadge = () => {
        if (!user?.role || user.role === '') return '👤 User';
        if (user.role === 'admin') return '👑 Admin';
        return '👤 User';
    };

    const getRoleClass = () => {
        if (!user?.role || user.role === '') return 'user';
        return user.role.toLowerCase();
    };

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

                    <span className={`role-badge role-${getRoleClass()}`}>
            {getRoleBadge()}
          </span>
                </div>
            </div>

            <div className="profile-stats">
                <div className="stat-item">
                    <span className="stat-label">User ID</span>
                    <span className="stat-value">{user?.id}</span>
                </div>

                <div className="stat-item">
                    <span className="stat-label">Role</span>
                    <span className="stat-value">{user?.role || 'user'}</span>
                </div>
            </div>
        </div>
    );
};

export default ProfileCard;