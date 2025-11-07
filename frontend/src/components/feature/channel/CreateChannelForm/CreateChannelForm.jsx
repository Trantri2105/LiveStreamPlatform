import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../../../common/Input/Input';
import TextArea from '../../../common/TextArea/TextArea';
import Button from '../../../common/Button/Button';
import useChannel from '../../../../hooks/useChannel';
import './CreateChannelForm.css';

const CreateChannelForm = ({ isRequired = false }) => {
    const navigate = useNavigate();
    const { createChannel } = useChannel();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
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

        if (!formData.title.trim()) {
            newErrors.title = 'Channel title is required';
        } else if (formData.title.length < 3) {
            newErrors.title = 'Channel title must be at least 3 characters';
        } else if (formData.title.length > 100) {
            newErrors.title = 'Channel title must not exceed 100 characters';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Channel description is required';
        } else if (formData.description.length < 10) {
            newErrors.description = 'Description must be at least 10 characters';
        } else if (formData.description.length > 500) {
            newErrors.description = 'Description must not exceed 500 characters';
        }

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
            // Response: { message: "channel created successfully" }
            const response = await createChannel({
                title: formData.title.trim(),
                description: formData.description.trim(),
            });
            setMessage({
                type: 'success',
                text: response.message || 'Channel created successfully! Redirecting...',
            });
            // Redirect về trang chủ sau 1.5 giây
            setTimeout(() => {
                navigate('/', { replace: true });
            }, 1500);
        } catch (error) {
            console.error('Create channel error:', error);
            setMessage({
                type: 'error',
                text: error.message || error.detail || 'Failed to create channel. Please try again.',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-channel-form">
            {isRequired && (
                <div className="alert alert-info">
                    <strong>⚠️ Channel Required</strong>
                    <p>You need to create a channel before accessing the platform. Each user can have only one channel.</p>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {message.text && (
                    <div className={`alert alert-${message.type}`}>
                        {message.text}
                    </div>
                )}

                <Input
                    label="Channel Title"
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter your channel title (e.g., Funny channel in the world)"
                    error={errors.title}
                    required
                    icon="📺"
                />

                <TextArea
                    label="Channel Description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe what your channel is about... (e.g., Welcome people come here)"
                    error={errors.description}
                    required
                    rows={5}
                />

                <div className="character-count">
                    <span>Title: {formData.title.length}/100</span>
                    <span>Description: {formData.description.length}/500</span>
                </div>

                <div className="form-actions">
                    <Button
                        type="submit"
                        variant="primary"
                        fullWidth
                        loading={loading}
                    >
                        {isRequired ? 'Create Channel & Continue' : 'Create Channel'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default CreateChannelForm;