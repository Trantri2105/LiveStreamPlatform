import React, { useState, useEffect, useRef, useCallback } from 'react';
import ChatMessage from '../ChatMessage/ChatMessage';
import Loading from '../../../common/Loading/Loading';
import useWebSocket from '../../../../hooks/useWebSocket';
import useAuth from '../../../../hooks/useAuth';
import chatService from '../../../../services/chatService';
import './ChatBox.css';

const ChatBox = ({ streamId }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);

    useEffect(() => {
        const loadMessages = async () => {
            try {
                const data = await chatService.getMessages(streamId)
                const sorted = data.sort((a, b) => {
                    const timeA = new Date(a.created_at).getTime();
                    const timeB = new Date(b.created_at).getTime();
                    return timeA - timeB;
                });
                setMessages(sorted);
                console.log("cHECK DATA  ", data)
            } catch (error) {
                console.error('Error loading messages:', error);
            } finally {
                setLoading(false);
            }
        };

        loadMessages();
    }, [streamId]);

    const handleNewMessage = useCallback((message) => {
        console.log('📨 New message:', message);

        setMessages((prevMessages) => {
            const formattedMessage = {
                id: Date.now(),
                stream_id: streamId,
                user_id: message.user_id,
                content: message.content,
                created_at: new Date(message.timestamp * 1000).toISOString(),
                username: message.username || null, // Nếu WS đã trả username
            };

            return [...prevMessages, formattedMessage];
        });


    }, [streamId]);

    const { isConnected, error, sendMessage } = useWebSocket(streamId, handleNewMessage);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!inputValue.trim()) return;

        const success = sendMessage(inputValue);

        if (success) {
            setInputValue('');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    if (loading) {
        return (
            <div className="chat-box">
                <div className="chat-header">
                    <h3>💬 Live Chat</h3>
                    <span className="connection-status connecting">Connecting...</span>
                </div>
                <div className="chat-loading">
                    <Loading size="small" text="Loading messages..." />
                </div>
            </div>
        );
    }

    return (
        <div className="chat-box">
            <div className="chat-header">
                <h3>💬 Live Chat</h3>
                <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                    {isConnected ? '● Connected' : '○ Disconnected'}
                </span>
            </div>

            {error && (
                <div className="chat-error">
                    <span>⚠️ {error}</span>
                </div>
            )}

            <div className="chat-messages" ref={chatContainerRef}>
                {messages.length === 0 ? (
                    <div className="chat-empty">
                        <p>No messages yet. Be the first to chat!</p>
                    </div>
                ) : (
                    messages.map((message) => (
                        <ChatMessage
                            key={message.id}
                            message={message}
                            isOwnMessage={message.user_id === user?.id}
                        />
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-form" onSubmit={handleSubmit}>
                <input
                    type="text"
                    className="chat-input"
                    placeholder={isConnected ? 'Type a message...' : 'Connecting...'}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={!isConnected}
                    maxLength={500}
                />
                <button
                    type="submit"
                    className="chat-send-btn"
                    disabled={!isConnected || !inputValue.trim()}
                >
                    Send
                </button>
            </form>
        </div>
    );
};

export default ChatBox;