import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../../../components/layout/MainLayout/MainLayout';
import ProfileCard from '../../../components/feature/profile/ProfileCard/ProfileCard';
import Button from '../../../components/common/Button/Button';
import userService from '../../../services/userService';
import useAuth from '../../../hooks/useAuth';
import './UserDetailPage.css';

const UserDetailPage = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { isAdmin } = useAuth();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isAdmin()) {
            navigate('/');
            return;
        }

        fetchUserDetail();
    }, [userId]);

    const fetchUserDetail = async () => {
        try {
            const response = await userService.getUserById(userId);
            setUser(response.data || response);
        } catch (error) {
            console.error('Error fetching user detail:', error);
            setError('Failed to load user details. You may not have permission.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="loading-container">
                    <div className="spinner-large"></div>
                    <p>Loading user details...</p>
                </div>
            </MainLayout>
        );
    }

    if (error) {
        return (
            <MainLayout>
                <div className="error-container">
                    <p className="error-message">{error}</p>
                    <Button variant="primary" onClick={() => navigate('/admin/users')}>
                        Back to Users
                    </Button>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="user-detail-page">
                <div className="user-detail-container">
                    <div className="page-header">
                        <Button
                            variant="secondary"
                            onClick={() => navigate('/admin/users')}
                        >
                            ← Back to Users
                        </Button>
                        <h1>User Details</h1>
                    </div>

                    {user && <ProfileCard user={user} />}

                    <div className="admin-actions">
                        <div className="info-section">
                            <h3>Admin Information</h3>
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="info-label">User ID:</span>
                                    <span className="info-value">{user?.id}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Status:</span>
                                    <span className="info-value">
                    {user?.is_active ? '✅ Active' : '❌ Inactive'}
                  </span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Email Verified:</span>
                                    <span className="info-value">
                    {user?.email_verified ? '✅ Yes' : '❌ No'}
                  </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default UserDetailPage;