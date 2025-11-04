import React, { useEffect, useRef, useState } from 'react';
import './VideoPlayer.css';

const VideoPlayer = ({ hlsUrl, isLive = false }) => {
    const videoRef = useRef(null);
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!hlsUrl || !videoRef.current) return;

        // Check if HLS.js is supported
        if (window.Hls && window.Hls.isSupported()) {
            const hls = new window.Hls({
                enableWorker: true,
                lowLatencyMode: isLive,
            });

            hls.loadSource(hlsUrl);
            hls.attachMedia(videoRef.current);

            hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
                setLoading(false);
                videoRef.current.play().catch(err => {
                    console.log('Autoplay prevented:', err);
                });
            });

            hls.on(window.Hls.Events.ERROR, (event, data) => {
                console.error('HLS Error:', data);
                if (data.fatal) {
                    setError(true);
                    setLoading(false);
                }
            });

            return () => {
                hls.destroy();
            };
        }
        // For Safari/iOS (native HLS support)
        else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
            videoRef.current.src = hlsUrl;
            videoRef.current.addEventListener('loadedmetadata', () => {
                setLoading(false);
                videoRef.current.play().catch(err => {
                    console.log('Autoplay prevented:', err);
                });
            });
        } else {
            setError(true);
            setLoading(false);
        }
    }, [hlsUrl, isLive]);

    if (error) {
        return (
            <div className="video-player video-error">
                <div className="error-content">
                    <span className="error-icon">⚠️</span>
                    <h3>Unable to load stream</h3>
                    <p>The stream may not be available or has ended.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="video-player">
            {loading && (
                <div className="video-loading">
                    <div className="spinner-large"></div>
                    <p>Loading stream...</p>
                </div>
            )}

            {isLive && (
                <div className="live-indicator">
                    <span className="live-dot"></span>
                    LIVE
                </div>
            )}

            <video
                ref={videoRef}
                controls
                className="video-element"
                playsInline
            />
        </div>
    );
};

export default VideoPlayer;