import React from 'react';
import AuthLayout from '../../../components/layout/AuthLayout/AuthLayout';
import LoginForm from '../../../components/feature/auth/LoginForm/LoginForm';
import './LoginPage.css';

const LoginPage = () => {
    return (
        <AuthLayout>
            <div className="login-page">
                <div className="login-header">
                    <h1>Welcome Back!</h1>
                    <p>Sign in to continue to Livestream App</p>
                </div>

                <LoginForm />
            </div>
        </AuthLayout>
    );
};

export default LoginPage;