import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../../components/layout/MainLayout/MainLayout';
import CreateStreamForm from '../../../components/feature/livestream/CreateStreamForm/CreateStreamForm';
import Button from '../../../components/common/Button/Button';
import './CreateStreamPage.css';

const CreateStreamPage = () => {
    const navigate = useNavigate();

    return (
        <MainLayout>
            <div className="create-stream-page">
                <div className="create-stream-container">
                    <div className="page-header">
                        <Button
                            variant="secondary"
                            onClick={() => navigate('/')}
                        >
                            ← Back
                        </Button>
                        <h1>🎬 Create Livestream</h1>
                        <p>Set up your stream and start broadcasting to your audience</p>
                    </div>

                    <CreateStreamForm />
                </div>
            </div>
        </MainLayout>
    );
};

export default CreateStreamPage;