import React, { useEffect, useRef, useState } from 'react';
import './VideoPlayer.css';

const VideoPlayer = ({ hlsUrl, isLive = false }) => {
    const containerRef = useRef(null);
    const playerRef = useRef(null);
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(true);
    const [playerLoaded, setPlayerLoaded] = useState(false);

    useEffect(() => {
        const checkOvenPlayer = () => {
            if (window.OvenPlayer) {
                console.log('OvenPlayer loaded from CDN');
                setPlayerLoaded(true);
                return true;
            }
            return false;
        };
        if (checkOvenPlayer()) {
            return;
        }

        let attempts = 0;
        const maxAttempts = 50;
        const checkInterval = setInterval(() => {
            attempts++;

            if (checkOvenPlayer()) {
                clearInterval(checkInterval);
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                console.error('OvenPlayer failed to load from CDN after 5 seconds');
                setError(true);
                setLoading(false);
            }
        }, 100);

        return () => clearInterval(checkInterval);
    }, []);

    useEffect(() => {
        if (!playerLoaded || !hlsUrl || !containerRef.current) {
            return;
        }

        const cleanup = () => {
            if (playerRef.current) {
                try {
                    playerRef.current.remove();
                    playerRef.current = null;
                } catch (err) {
                    console.warn('Error removing player:', err);
                }
            }
        };

        setError(false);
        setLoading(true);

        console.log('Creating OvenPlayer with URL:', hlsUrl);

        try {
            const player = window.OvenPlayer.create(containerRef.current, {
                sources: [
                    {
                        type: 'hls',
                        file: hlsUrl,
                    }
                ],
                autoStart: false,
                controls: true,
                showBigPlayButton: true,
                width: '100%',
                aspectRatio: '16:9',
                mute: false,
                volume: 100,
                playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
                hlsConfig: {
                    maxBufferLength: 30,
                    maxMaxBufferLength: 60,
                },
            });

            playerRef.current = player;
            console.log('OvenPlayer created successfully');
            player.on('ready', () => {
                console.log('✅ OvenPlayer ready');
                setLoading(false);
                setError(false);
            });

            player.on('stateChanged', (state) => {
                console.log('📊 Player state:', state);
                if (state.newstate === 'playing') {
                    setLoading(false);
                }
                if (state.newstate === 'error') {
                    setError(true);
                    setLoading(false);
                }
            });

            player.on('error', (err) => {
                console.error('OvenPlayer error:', err);
                setError(true);
                setLoading(false);
            });

        } catch (err) {
            console.error('Failed to create OvenPlayer:', err);
            setError(true);
            setLoading(false);
        }

        return cleanup;
    }, [playerLoaded, hlsUrl]);

    if (error) {
        return (
            <div className="video-player video-error">
                <div className="error-content">
                    <span className="error-icon">⚠️</span>
                    <h3>Unable to load stream</h3>
                    <p>The stream may not be available or has ended.</p>
                    {!playerLoaded && (
                        <p className="error-hint">
                            OvenPlayer failed to load from CDN.
                            <br />
                            Please check your internet connection.
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="video-player">
            {loading && (
                <div className="video-loading">
                    <div className="spinner-large"></div>
                    <p>{playerLoaded ? 'Loading stream...' : 'Loading player...'}</p>
                </div>
            )}

            {isLive && (
                <div className="live-indicator">
                    <span className="live-dot"></span>
                    LIVE
                </div>
            )}

            <div ref={containerRef} className="ovenplayer-container" />
        </div>
    );
};

export default VideoPlayer;