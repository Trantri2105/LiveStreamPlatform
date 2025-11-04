import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import userService from '../../../../services/userService';
import './UserList.css';

const UserList = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await userService.getAllUsers();
            setUsers(response);
        } catch (error) {
            console.error('Error fetching users:', error);
            setError(error.message || error.detail || 'Failed to load users. You may not have permission.');
        } finally {
            setLoading(false);
        }
    };

    const getRoleBadge = (role) => {
        if (!role) return '👤 User';
        if (role === 'admin') return 'Admin';
        return '👤 User';
    };

    const getRoleClass = (role) => {
        if (!role) return 'user';
        return role.toLowerCase();
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner-large"></div>
                <p>Loading users...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <p className="error-message">{error}</p>
            </div>
        );
    }

    return (
        <div className="user-list">
            <div className="user-list-header">
                <h2>All Users ({users.length})</h2>
            </div>

            <div className="user-table-container">
                <table className="user-table">
                    <thead>
                    <tr>
                        <th>Avatar</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>User ID</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {users.map((user) => (
                        <tr key={user.id}>
                            <td>
                                <div className="user-avatar-small">
                                    <div className="avatar-placeholder-small">
                                        {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div className="user-name">
                                    {user.first_name} {user.last_name}
                                </div>
                            </td>
                            <td>{user.email}</td>
                            <td>
                  <span className={`role-badge-small role-${getRoleClass(user.role)}`}>
                    {getRoleBadge(user.role)}
                  </span>
                            </td>
                            <td>
                                <code className="user-id-text">{user.id.slice(0, 8)}...</code>
                            </td>
                            <td>
                                <button
                                    className="btn-view-details"
                                    onClick={() => navigate(`/admin/users/${user.id}`)}
                                >
                                    View Details
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                {users.length === 0 && (
                    <div className="empty-state">
                        <p>No users found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserList;