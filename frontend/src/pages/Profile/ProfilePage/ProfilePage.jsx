import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../../components/layout/MainLayout/MainLayout';
import ProfileCard from '../../../components/feature/profile/ProfileCard/ProfileCard';
import Button from '../../../components/common/Button/Button';
import useAuth from '../../../hooks/useAuth';
import './ProfilePage.css';

const ProfilePage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    return (
        <MainLayout>
            <div className="profile-page">
                <div className="profile-container">
                    <div className="page-header">
                        <h1>My Profile</h1>
                        <Button
                            variant="primary"
                            onClick={() => navigate('/profile/edit')}
                        >
                            ✏️ Edit Profile
                        </Button>
                    </div>

                    <ProfileCard user={user} />

                    <div className="profile-actions">
                        <Button
                            variant="secondary"
                            onClick={() => navigate('/profile/change-password')}
                        >
                            🔒 Change Password
                        </Button>

                        <Button
                            variant="secondary"
                            onClick={() => navigate('/settings')}
                        >
                            ⚙️ Settings
                        </Button>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default ProfilePage;