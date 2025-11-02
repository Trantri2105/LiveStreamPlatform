import React, { useState } from 'react';
import Input from '../../../common/Input/Input';
import Button from '../../../common/Button/Button';
import userService from '../../../../services/userService';
import { validatePassword, validateConfirmPassword } from '../../../../utils/validators/authValidators';
import './ChangePasswordForm.css';

const ChangePasswordForm = () => {
    const [formData, setFormData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));

        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: '',
            }));
        }
        setMessage({ type: '', text: '' });
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.current_password) {
            newErrors.current_password = 'Current password is required';
        }

        const newPasswordError = validatePassword(formData.new_password);
        if (newPasswordError) newErrors.new_password = newPasswordError;

        const confirmPasswordError = validateConfirmPassword(
            formData.new_password,
            formData.confirm_password
        );
        if (confirmPasswordError) newErrors.confirm_password = confirmPasswordError;

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);

        try {
            await userService.changePassword({
                current_password: formData.current_password,
                new_password: formData.new_password,
            });

            setMessage({
                type: 'success',
                text: 'Password changed successfully!',
            });

            // Reset form
            setFormData({
                current_password: '',
                new_password: '',
                confirm_password: '',
            });
        } catch (error) {
            console.error('Change password error:', error);
            setMessage({
                type: 'error',
                text: error.message || 'Failed to change password. Please check your current password.',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="change-password-form">
            <h3>Change Password</h3>

            <form onSubmit={handleSubmit}>
                {message.text && (
                    <div className={`alert alert-${message.type}`}>
                        {message.text}
                    </div>
                )}

                <Input
                    label="Current Password"
                    type="password"
                    name="current_password"
                    value={formData.current_password}
                    onChange={handleChange}
                    placeholder="Enter current password"
                    error={errors.current_password}
                    required
                    icon="🔒"
                    showPasswordToggle
                />

                <Input
                    label="New Password"
                    type="password"
                    name="new_password"
                    value={formData.new_password}
                    onChange={handleChange}
                    placeholder="Enter new password"
                    error={errors.new_password}
                    required
                    icon="🔒"
                    showPasswordToggle
                />

                <Input
                    label="Confirm New Password"
                    type="password"
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    placeholder="Confirm new password"
                    error={errors.confirm_password}
                    required
                    icon="🔒"
                    showPasswordToggle
                />

                <div className="form-actions">
                    <Button
                        type="submit"
                        variant="primary"
                        loading={loading}
                    >
                        Change Password
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default ChangePasswordForm;