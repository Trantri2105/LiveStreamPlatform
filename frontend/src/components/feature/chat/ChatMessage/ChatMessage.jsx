import React from 'react';
import './ChatMessage.css';

const ChatMessage = ({ message, isOwnMessage }) => {
    const formatTime = (createdAt) => {
        const date = new Date(createdAt);

        if (isNaN(date.getTime())) {
            return '';
        }

        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDate = (createdAt) => {
        const date = new Date(createdAt);
        const today = new Date();

        if (isNaN(date.getTime())) {
            return '';
        }

        if (date.toDateString() === today.toDateString()) {
            return formatTime(createdAt);
        }

        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className={`chat-message ${isOwnMessage ? 'own-message' : ''}`}>
            <div className="message-header">
        <span className="message-username">
          {message.username || 'Anonymous'}
        </span>
                <span className="message-time">
          {formatDate(message.created_at)}
        </span>
            </div>
            <div className="message-content">{message.content}</div>
        </div>
    );
};

export default ChatMessage;