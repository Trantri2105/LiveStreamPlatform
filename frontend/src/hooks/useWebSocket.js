import { useState, useEffect, useRef, useCallback } from 'react';
import chatService from '../services/chatService';

const useWebSocket = (streamId, onMessage) => {
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);

    const MAX_RECONNECT_ATTEMPTS = 5;
    const RECONNECT_DELAY = 3000;

    const connect = useCallback(() => {
        try {
            console.log('Connecting to WebSocket...');
            const ws = chatService.createWebSocket(streamId);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('WebSocket connected');
                setIsConnected(true);
                setError(null);
                reconnectAttemptsRef.current = 0;
            };

            ws.onmessage = (event) => {
                console.log('Message received:', event.data);
                const message = chatService.parseMessage(event.data);

                if (message && onMessage) {
                    onMessage(message);
                }
            };

            ws.onerror = (event) => {
                console.error('WebSocket error:', event);
                setError('Connection error');
            };

            ws.onclose = (event) => {
                console.log('WebSocket closed:', event.code, event.reason);
                setIsConnected(false);
                wsRef.current = null;

                if (event.code !== 1000 && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
                    reconnectAttemptsRef.current += 1;
                    console.log(`Reconnecting... (Attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);

                    reconnectTimeoutRef.current = setTimeout(() => {
                        connect();
                    }, RECONNECT_DELAY);
                } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
                    setError('Connection lost. Please refresh the page.');
                }
            };

        } catch (err) {
            console.error('Failed to create WebSocket:', err);
            setError(err.message);
        }
    }, [streamId, onMessage]);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }

        if (wsRef.current) {
            console.log('🔌 Disconnecting WebSocket...');
            wsRef.current.close(1000, 'Client disconnect');
            wsRef.current = null;
        }

        setIsConnected(false);
    }, []);

    const sendMessage = useCallback((content) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            console.error('WebSocket not connected');
            return false;
        }

        try {
            const message = chatService.formatMessage(content);
            wsRef.current.send(message);
            console.log('Message sent:', content);
            return true;
        } catch (err) {
            console.error('Failed to send message:', err);
            return false;
        }
    }, []);

    useEffect(() => {
        connect();

        return () => {
            disconnect();
        };
    }, [connect, disconnect]);

    return {
        isConnected,
        error,
        sendMessage,
        reconnect: connect,
    };
};

export default useWebSocket;