import React from 'react';
import { useLocation } from 'react-router-dom';
import MainLayout from '../../../components/layout/MainLayout/MainLayout';
import CreateChannelForm from '../../../components/feature/channel/CreateChannelForm/CreateChannelForm';
import './CreateChannelPage.css';

const CreateChannelPage = () => {
    const location = useLocation();
    const isRequired = location.state?.required || false;

    return (
        <MainLayout>
            <div className="create-channel-page">
                <div className="create-channel-container">
                    <div className="page-header">
                        <h1>🎬 Create Your Channel</h1>
                        <p>
                            {isRequired
                                ? 'Set up your channel to start using the platform'
                                : 'Create a new channel to start streaming'
                            }
                        </p>
                    </div>

                    <CreateChannelForm isRequired={isRequired} />
                </div>
            </div>
        </MainLayout>
    );
};

export default CreateChannelPage;