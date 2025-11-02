import React, { useState, useEffect } from 'react';
import userService from '../../../../services/userService';
import './UserList.css';

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await userService.getAllUsers();
            setUsers(response.data || response);
        } catch (error) {
            console.error('Error fetching users:', error);
            setError('Failed to load users. You may not have permission.');
        } finally {
            setLoading(false);
        }
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
                        <th>Created At</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {users.map((user) => (
                        <tr key={user.id}>
                            <td>
                                <div className="user-avatar-small">
                                    {user.avatar_url ? (
                                        <img src={user.avatar_url} alt={user.first_name} />
                                    ) : (
                                        <div className="avatar-placeholder-small">
                                            {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                                        </div>
                                    )}
                                </div>
                            </td>
                            <td>
                                <div className="user-name">
                                    {user.first_name} {user.last_name}
                                </div>
                            </td>
                            <td>{user.email}</td>
                            <td>
                  <span className={`role-badge-small role-${user.role}`}>
                    {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                  </span>
                            </td>
                            <td>
                                {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                            </td>
                            <td>
                                <button
                                    className="btn-view-details"
                                    onClick={() => window.open(`/admin/users/${user.id}`, '_blank')}
                                >
                                    View Details
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserList;