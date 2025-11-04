import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../../components/layout/MainLayout/MainLayout';
import ChannelInfo from '../../../components/feature/channel/ChannelInfo/ChannelInfo';
import Button from '../../../components/common/Button/Button';
import useChannel from '../../../hooks/useChannel';
import './MyChannelPage.css';

const MyChannelPage = () => {
    const navigate = useNavigate();
    const { channel, loading } = useChannel();

    if (loading) {
        return (
            <MainLayout>
                <div className="loading-container">
                    <div className="spinner-large"></div>
                    <p>Loading channel...</p>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="my-channel-page">
                <div className="my-channel-container">
                    <div className="page-header">
                        <h1>My Channel</h1>
                        <Button
                            variant="primary"
                            onClick={() => navigate('/channel/edit')}
                        >
                            ✏️ Edit Channel
                        </Button>
                    </div>

                    <ChannelInfo channel={channel} />
                </div>
            </div>
        </MainLayout>
    );
};

export default MyChannelPage;