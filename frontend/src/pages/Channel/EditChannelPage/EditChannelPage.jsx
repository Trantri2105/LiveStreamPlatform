import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../../components/layout/MainLayout/MainLayout';
import EditChannelForm from '../../../components/feature/channel/EditChannelForm/EditChannelForm';
import Button from '../../../components/common/Button/Button';
import './EditChannelPage.css';

const EditChannelPage = () => {
    const navigate = useNavigate();

    const handleSuccess = () => {
        navigate('/my-channel');
    };

    return (
        <MainLayout>
            <div className="edit-channel-page">
                <div className="edit-channel-container">
                    <div className="page-header">
                        <Button
                            variant="secondary"
                            onClick={() => navigate('/my-channel')}
                        >
                            ← Back
                        </Button>
                        <h1>Edit Channel</h1>
                    </div>

                    <EditChannelForm onSuccess={handleSuccess} />
                </div>
            </div>
        </MainLayout>
    );
};

export default EditChannelPage;