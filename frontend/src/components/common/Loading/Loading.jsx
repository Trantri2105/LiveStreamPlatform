import React from 'react';
import Spinner from './Spinner';
import './Loading.css';

const Loading = ({
                     text = 'Loading...',
                     fullScreen = false,
                     size = 'medium', // small, medium, large
                     overlay = false
                 }) => {
    const containerClass = fullScreen
        ? 'loading-container loading-fullscreen'
        : overlay
            ? 'loading-container loading-overlay'
            : 'loading-container';

    return (
        <div className={containerClass}>
            <div className="loading-content">
                <Spinner size={size} />
                {text && <p className="loading-text">{text}</p>}
            </div>
        </div>
    );
};

export default Loading;