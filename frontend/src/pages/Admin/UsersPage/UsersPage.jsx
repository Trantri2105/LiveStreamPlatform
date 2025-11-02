import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../../components/layout/MainLayout/MainLayout';
import UserList from '../../../components/feature/admin/UserList/UserList';
import useAuth from '../../../hooks/useAuth';
import './UsersPage.css';

const UsersPage = () => {
    const navigate = useNavigate();
    const { isAdmin } = useAuth();

    useEffect(() => {
        if (!isAdmin()) {
            navigate('/');
        }
    }, []);

    if (!isAdmin()) {
        return null;
    }

    return (
        <MainLayout>
            <div className="users-page">
                <div className="users-container">
                    <div className="page-header">
                        <h1>👥 User Management</h1>
                        <p>View and manage all users in the system</p>
                    </div>

                    <UserList />
                </div>
            </div>
        </MainLayout>
    );
};

export default UsersPage;