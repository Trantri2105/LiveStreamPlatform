import React, { useState } from 'react';
import Modal from '../../../common/Modal/Modal';
import Button from '../../../common/Button/Button';
import './StreamSetup.css';

const StreamSetup = ({ stream, streamKey }) => {
    const [showKeyModal, setShowKeyModal] = useState(false);
    const [copied, setCopied] = useState({});

    const copyToClipboard = (text, field) => {
        console.log(text);
        navigator.clipboard.writeText(text).then(() => {
            setCopied({ ...copied, [field]: true });
            setTimeout(() => {
                setCopied({ ...copied, [field]: false });
            }, 2000);
        });
    };

    return (
        <div className="stream-setup">
            <div className="setup-header">
                <div className="status-badge status-init">
                    🔴 Status: {stream.status.toUpperCase()}
                </div>
                <h2>{stream.title}</h2>
                <p className="stream-category">
                    Category: {stream.category?.title || 'Uncategorized'}
                </p>
            </div>

            <div className="setup-section">
                <h3>📡 Streaming Information</h3>
                <p className="section-description">
                    Use these details to configure your streaming software (OBS, Streamlabs, etc.)
                </p>

                <div className="info-grid">
                    <div className="info-item">
                        <label>SRT Server URL</label>
                        <div className="info-value-container">
                            <code className="info-value">{stream.srt_server_url}</code>
                            <button
                                className="copy-btn"
                                onClick={() => copyToClipboard(stream.srt_server_url, 'srt')}
                            >
                                {copied.srt ? '✓ Copied' : '📋 Copy'}
                            </button>
                        </div>
                    </div>

                    <div className="info-item">
                        <label>Stream Key</label>
                        {streamKey ? (
                            <div className="info-value-container">
                                <code className="info-value info-value-hidden">
                                    ••••••••••••••••
                                </code>
                                <button
                                    className="copy-btn btn-primary"
                                    onClick={() => setShowKeyModal(true)}
                                >
                                    🔑 Show Key
                                </button>
                            </div>
                        ) : (
                            <div className="info-value-container">
                                <code className="info-value info-value-unavailable">
                                    Stream key not available
                                </code>
                                <button className="copy-btn" disabled>
                                    🔒 Unavailable
                                </button>
                            </div>
                        )}
                        <p className="info-hint">
                            {streamKey
                                ? '⚠️ Keep your stream key private!'
                                : '⚠️ Stream key is only shown once during creation'}
                        </p>
                    </div>

                    <div className="info-item">
                        <label>HLS URL (Playback)</label>
                        <div className="info-value-container">
                            <code className="info-value">{stream.hls_url}</code>
                            <button
                                className="copy-btn"
                                onClick={() => copyToClipboard(stream.hls_url, 'hls')}
                            >
                                {copied.hls ? '✓ Copied' : '📋 Copy'}
                            </button>
                        </div>
                    </div>

                    <div className="info-item">
                        <label>Stream ID</label>
                        <div className="info-value-container">
                            <code className="info-value">{stream.id}</code>
                            <button
                                className="copy-btn"
                                onClick={() => copyToClipboard(stream.id, 'id')}
                            >
                                {copied.id ? '✓ Copied' : '📋 Copy'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="setup-section">
                <h3>🎥 How to Start Streaming</h3>
                <ol className="instructions-list">
                    <li>
                        <strong>Open your streaming software</strong> (OBS Studio, Streamlabs, etc.)
                    </li>
                    <li>
                        <strong>Go to Settings → Stream</strong>
                    </li>
                    <li>
                        <strong>Select "Custom" as service</strong>
                    </li>
                    <li>
                        <strong>Paste the SRT Server URL</strong> into the Server field
                    </li>
                    <li>
                        <strong>Paste your Stream Key</strong> into the Stream Key field
                        {!streamKey && <span className="warning-text"> (Not available - create a new stream)</span>}
                    </li>
                    <li>
                        <strong>Click "Start Streaming"</strong> in your software
                    </li>
                    <li>
                        <strong>Your stream will go live!</strong> 🎉
                    </li>
                </ol>
            </div>

            {/* Stream Key Modal */}
            {streamKey && (
                <Modal
                    isOpen={showKeyModal}
                    onClose={() => setShowKeyModal(false)}
                    title="🔑 Stream Key"
                    size="medium"
                >
                    <div className="stream-key-modal">
                        <div className="warning-box">
                            <strong>⚠️ Warning</strong>
                            <p>Never share your stream key with anyone! Anyone with this key can stream to your channel.</p>
                        </div>

                        <div className="key-display">
                            <code>{streamKey}</code>
                        </div>

                        <Button
                            variant="primary"
                            fullWidth
                            onClick={() => {
                                copyToClipboard(streamKey, 'key');
                                setTimeout(() => setShowKeyModal(false), 1000);
                            }}
                        >
                            {copied.key ? '✓ Copied to Clipboard' : '📋 Copy Stream Key'}
                        </Button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default StreamSetup;
