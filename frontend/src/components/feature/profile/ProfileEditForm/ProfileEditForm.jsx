import React, { useState, useEffect } from 'react';
import Input from '../../../common/Input/Input';
import Button from '../../../common/Button/Button';
import userService from '../../../../services/userService';
import useAuth from '../../../../hooks/useAuth';
import { validateEmail, validateName } from '../../../../utils/validators/authValidators';
import './ProfileEditForm.css';

const ProfileEditForm = ({ onSuccess }) => {
    const { user, updateUserProfile } = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        first_name: '',
        last_name: '',
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (user) {
            setFormData({
                email: user.email || '',
                first_name: user.first_name || '',
                last_name: user.last_name || '',
            });
        }
    }, [user]);

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

        const emailError = validateEmail(formData.email);
        if (emailError) newErrors.email = emailError;

        const firstNameError = validateName(formData.first_name, 'First name');
        if (firstNameError) newErrors.first_name = firstNameError;

        const lastNameError = validateName(formData.last_name, 'Last name');
        if (lastNameError) newErrors.last_name = lastNameError;

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
            const response = await userService.updateProfile(formData);

            // Cập nhật user context
            updateUserProfile(response.data || response);

            setMessage({
                type: 'success',
                text: 'Profile updated successfully!',
            });

            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            console.error('Update profile error:', error);
            setMessage({
                type: 'error',
                text: error.message || 'Failed to update profile. Please try again.',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="profile-edit-form">
            <form onSubmit={handleSubmit}>
                {message.text && (
                    <div className={`alert alert-${message.type}`}>
                        {message.text}
                    </div>
                )}

                <div className="form-row">
                    <Input
                        label="First Name"
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        placeholder="First name"
                        error={errors.first_name}
                        required
                        icon="👤"
                    />

                    <Input
                        label="Last Name"
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        placeholder="Last name"
                        error={errors.last_name}
                        required
                        icon="👤"
                    />
                </div>

                <Input
                    label="Email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    error={errors.email}
                    required
                    icon="📧"
                />

                <div className="form-actions">
                    <Button
                        type="submit"
                        variant="primary"
                        loading={loading}
                    >
                        Save Changes
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default ProfileEditForm;