import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../../../common/Input/Input';
import TextArea from '../../../common/TextArea/TextArea';
import Button from '../../../common/Button/Button';
import streamService from '../../../../services/streamService';
import './CreateStreamForm.css';

const CreateStreamForm = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category_id: '1', // Default category
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const categories = [
        { id: '1', title: 'League of Legends' },
        { id: '2', title: 'Valorant' },
        { id: '3', title: 'Counter-Strike 2' },
        { id: '4', title: 'Dota 2' },
        { id: '5', title: 'PUBG: Battlegrounds' },
        { id: '6', title: 'Fortnite' },
        { id: '7', title: 'Apex Legends' },
        { id: '8', title: 'Call of Duty: Warzone' },
        { id: '9', title: 'Minecraft' },
        { id: '10', title: 'Roblox' },
        { id: '11', title: 'Genshin Impact' },
        { id: '12', title: 'Mobile Legends: Bang Bang' },
        { id: '13', title: 'Free Fire' },
        { id: '14', title: 'Among Us' },
        { id: '15', title: 'Grand Theft Auto V (GTA V)' },
        { id: '16', title: 'Red Dead Redemption 2' },
        { id: '17', title: 'FIFA 24' },
        { id: '18', title: 'EA Sports FC 24' },
        { id: '19', title: 'Rocket League' },
        { id: '20', title: 'Overwatch 2' },
        { id: '21', title: 'Destiny 2' },
        { id: '22', title: 'Elden Ring' },
        { id: '23', title: 'Baldur’s Gate 3' },
        { id: '24', title: 'Rust' },
        { id: '25', title: 'ARK: Survival Evolved' },
        { id: '26', title: 'Cyberpunk 2077' },
        { id: '27', title: 'Honkai: Star Rail' },
        { id: '28', title: 'The Sims 4' },
        { id: '29', title: 'Dead by Daylight' },
        { id: '30', title: 'Phasmophobia' },
        { id: '31', title: 'Just Chatting' },
        { id: '32', title: 'Music' },
        { id: '33', title: 'Talk Shows & Podcasts' },
        { id: '34', title: 'ASMR' },
        { id: '35', title: 'Art' },
        { id: '36', title: 'Science & Technology' },
        { id: '37', title: 'Cooking' },
        { id: '38', title: 'Travel & Outdoors' },
        { id: '39', title: 'Fitness & Health' },
        { id: '40', title: 'Education' },
        { id: '41', title: 'Creative Arts' },
        { id: '42', title: 'Esports' },
        { id: '43', title: 'IRL (In Real Life)' },
        { id: '44', title: 'Board Games' },
        { id: '45', title: 'Virtual Reality (VR)' },
        { id: '46', title: 'Retro Gaming' },
        { id: '47', title: 'Indie Games' },
        { id: '48', title: 'Simulation Games' },
        { id: '49', title: 'Speedrunning' },
        { id: '50', title: 'Charity Streams' }
    ];

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

            sessionStorage.setItem(`stream_key_${response.id}`, response.stream_key);

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
                        <option value="">Select a category</option>
                        {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.title}
                            </option>
                        ))}
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
                    >
                        Create Stream
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default CreateStreamForm;