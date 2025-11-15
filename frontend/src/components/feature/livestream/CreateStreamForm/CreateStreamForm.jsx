import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../../../common/Input/Input';
import TextArea from '../../../common/TextArea/TextArea';
import Button from '../../../common/Button/Button';
import streamService from '../../../../services/streamService';
import categoryService from '../../../../services/categoryService';
import './CreateStreamForm.css';

const CreateStreamForm = () => {
    const navigate = useNavigate();

    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category_id: '',
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Load categories từ API
    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const data = await categoryService.getAllCategories();
            setCategories(data || []);

            if (data && data.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    category_id: data[0].id,
                }));
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            setMessage({
                type: 'error',
                text: 'Failed to load categories. Please refresh the page.',
            });
        } finally {
            setLoadingCategories(false);
        }
    };

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
            newErrors.title = 'Stream title is required';
        } else if (formData.title.length < 3) {
            newErrors.title = 'Title must be at least 3 characters';
        } else if (formData.title.length > 100) {
            newErrors.title = 'Title must not exceed 100 characters';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        } else if (formData.description.length < 10) {
            newErrors.description = 'Description must be at least 10 characters';
        } else if (formData.description.length > 500) {
            newErrors.description = 'Description must not exceed 500 characters';
        }

        if (!formData.category_id) {
            newErrors.category_id = 'Please select a category';
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
            const response = await streamService.createStream({
                title: formData.title.trim(),
                description: formData.description.trim(),
                category_id: formData.category_id,
            });

            setMessage({
                type: 'success',
                text: 'Stream created successfully! Redirecting to stream setup...',
            });

            if (response.stream_key) {
                sessionStorage.setItem(`stream_key_${response.id}`, response.stream_key);
            }

            setTimeout(() => {
                navigate(`/stream/${response.id}/setup`, {
                    state: {
                        streamData: response,
                        fromCreate: true
                    }
                });
            }, 1500);
        } catch (error) {
            console.error('Create stream error:', error);
            setMessage({
                type: 'error',
                text: error.message || error.detail || 'Failed to create stream. Please try again.',
            });
        } finally {
            setLoading(false);
        }
    };

    if (loadingCategories) {
        return (
            <div className="create-stream-form">
                <div className="loading-message">Loading categories...</div>
            </div>
        );
    }

    return (
        <div className="create-stream-form">
            <form onSubmit={handleSubmit}>
                {message.text && (
                    <div className={`alert alert-${message.type}`}>
                        {message.text}
                    </div>
                )}

                <Input
                    label="Stream Title"
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter stream title (e.g., First Test Livestream)"
                    error={errors.title}
                    required
                    icon="🎬"
                />

                <div className="input-group">
                    <label htmlFor="category_id" className="input-label">
                        Category <span className="required">*</span>
                    </label>
                    <select
                        id="category_id"
                        name="category_id"
                        value={formData.category_id}
                        onChange={handleChange}
                        className={`select-field ${errors.category_id ? 'select-error' : ''}`}
                    >
                        {categories.length === 0 ? (
                            <option value="">No categories available</option>
                        ) : (
                            categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.title}
                                </option>
                            ))
                        )}
                    </select>
                    {errors.category_id && (
                        <span className="input-error-message">{errors.category_id}</span>
                    )}
                </div>

                <TextArea
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe what your stream is about..."
                    error={errors.description}
                    required
                    rows={5}
                    maxLength={500}
                />

                <div className="form-actions">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => navigate('/')}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        loading={loading}
                        disabled={categories.length === 0}
                    >
                        Create Stream
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default CreateStreamForm;