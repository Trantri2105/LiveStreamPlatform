import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../../components/layout/MainLayout/MainLayout';
import ProfileEditForm from "../../../components/feature/profile/ProfileEditForm/ProfileEditForm";
import Button from '../../../components/common/Button/Button';
import './EditProfilePage.css';

const EditProfilePage = () => {
    const navigate = useNavigate();

    const handleSuccess = () => {
        setTimeout(() => {
            navigate('/profile');
        }, 1500);
    };

    return (
        <MainLayout>
            <div className="edit-profile-page">
                <div className="edit-profile-container">
                    <div className="page-header">
                        <Button
                            variant="secondary"
                            onClick={() => navigate('/profile')}
                        >
                            ← Back
                        </Button>
                        <h1>Edit Profile</h1>
                    </div>

                    <ProfileEditForm onSuccess={handleSuccess} />
                </div>
            </div>
        </MainLayout>
    );
};

export default EditProfilePage;