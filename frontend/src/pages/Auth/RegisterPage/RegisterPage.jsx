import React from 'react';
import AuthLayout from '../../../components/layout/AuthLayout/AuthLayout';
import RegisterForm from '../../../components/feature/auth/RegisterForm/RegisterForm';
import './RegisterPage.css';

const RegisterPage = () => {
    return (
        <AuthLayout>
            <div className="register-page">
                <div className="register-header">
                    <h1>Create Account</h1>
                    <p>Join Livestream App today!</p>
                </div>

                <RegisterForm />
            </div>
        </AuthLayout>
    );
};

export default RegisterPage;