import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../../../common/Input/Input';
import Button from '../../../common/Button/Button';
import useAuth from '../../../../hooks/useAuth';
import {
    validateEmail,
    validatePassword,
    validateConfirmPassword,
    validateName,
} from '../../../../utils/validators/authValidators';
import './RegisterForm.css';

const RegisterForm = () => {
    const navigate = useNavigate();
    const { register } = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        first_name: '',
        last_name: '',
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

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
        setServerError('');
    };

    const validate = () => {
        const newErrors = {};

        const emailError = validateEmail(formData.email);
        if (emailError) newErrors.email = emailError;

        const passwordError = validatePassword(formData.password);
        if (passwordError) newErrors.password = passwordError;

        const confirmPasswordError = validateConfirmPassword(
            formData.password,
            formData.confirmPassword
        );
        if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;

        const firstNameError = validateName(formData.first_name, 'First name');
        if (firstNameError) newErrors.first_name = firstNameError;

        const lastNameError = validateName(formData.last_name, 'Last name');
        if (lastNameError) newErrors.last_name = lastNameError;

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError('');
        setSuccessMessage('');

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);

        try {
            const response = await register({
                email: formData.email,
                password: formData.password,
                first_name: formData.first_name,
                last_name: formData.last_name,
            });

            setSuccessMessage('Registration successful! Redirecting to login...');

            navigate('/login');
        } catch (error) {
            console.error('Registration error:', error);
            setServerError(error.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-form">
            <form onSubmit={handleSubmit}>
                {serverError && (
                    <div className="alert alert-error">
                        {serverError}
                    </div>
                )}

                {successMessage && (
                    <div className="alert alert-success">
                        {successMessage}
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

                <Input
                    label="Password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    error={errors.password}
                    required
                    icon="🔒"
                    showPasswordToggle
                />

                <Input
                    label="Confirm Password"
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    error={errors.confirmPassword}
                    required
                    icon="🔒"
                    showPasswordToggle
                />

                <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    loading={loading}
                >
                    Create Account
                </Button>

                <div className="form-footer">
                    <p>
                        Already have an account?{' '}
                        <a href="/login" className="link">Sign In</a>
                    </p>
                </div>
            </form>
        </div>
    );
};

export default RegisterForm;