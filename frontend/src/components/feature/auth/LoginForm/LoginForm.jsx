import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../../../common/Input/Input';
import Button from '../../../common/Button/Button';
import useAuth from '../../../../hooks/useAuth';
import { validateEmail, validatePassword } from '../../../../utils/validators/authValidators';
import './LoginForm.css';

const LoginForm = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState('');

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

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError('');

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);

        try {
            await login({
                email: formData.email,
                password: formData.password,
            });

            navigate('/');
        } catch (error) {
            console.error('Login error:', error);
            setServerError(error.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-form">
            <form onSubmit={handleSubmit}>
                {serverError && (
                    <div className="alert alert-error">
                        {serverError}
                    </div>
                )}

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
                    placeholder="Enter your password"
                    error={errors.password}
                    required
                    icon="🔒"
                    showPasswordToggle
                />

                <div className="form-options">
                    <label className="checkbox-label">
                        <input type="checkbox" />
                        <span>Remember me</span>
                    </label>

                    <a href="/forgot-password" className="forgot-password-link">
                        Forgot password?
                    </a>
                </div>

                <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    loading={loading}
                >
                    Sign In
                </Button>

                <div className="form-footer">
                    <p>
                        Don't have an account?{' '}
                        <a href="/register" className="link">Sign Up</a>
                    </p>
                </div>
            </form>
        </div>
    );
};

export default LoginForm;