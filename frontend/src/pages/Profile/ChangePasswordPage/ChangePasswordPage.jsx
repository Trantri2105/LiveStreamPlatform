import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../../components/layout/MainLayout/MainLayout';
import ChangePasswordForm from '../../../components/feature/profile/ChangePasswordForm/ChangePasswordForm';
import Button from '../../../components/common/Button/Button';
import './ChangePasswordPage.css';

const ChangePasswordPage = () => {
    const navigate = useNavigate();

    return (
        <MainLayout>
            <div className="change-password-page">
                <div className="change-password-container">
                    <div className="page-header">
                        <Button
                            variant="secondary"
                            onClick={() => navigate('/profile')}
                        >
                            ← Back
                        </Button>
                        <h1>Security Settings</h1>
                    </div>

                    <ChangePasswordForm />
                </div>
            </div>
        </MainLayout>
    );
};

export default ChangePasswordPage;