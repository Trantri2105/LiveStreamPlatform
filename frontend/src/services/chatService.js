import axios from 'axios';
import { API_ENDPOINTS, TOKEN_KEY, CHAT_API_BASE_URL } from '../config/api.config';

class ChatService {
    createChatAxios() {
        const token = localStorage.getItem(TOKEN_KEY);

        return axios.create({
            baseURL: CHAT_API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
            },
        });
    }

    async getMessages(streamId) {
        try {
            const chatAxios = this.createChatAxios();
            const response = await chatAxios.get(`/api/chat/thread/${streamId}/messages`);

            return response.data || [];
        } catch (error) {
            console.error('Error fetching messages:', error);
            throw error.response?.data || error;
        }
    }

    createWebSocket(streamId) {
        const token = localStorage.getItem(TOKEN_KEY);

        if (!token) {
            throw new Error('No access token found');
        }

        const wsUrl = `${API_ENDPOINTS.CHAT.WS_CONNECT(streamId)}?token=${token}`;
        console.log('Connecting to WebSocket:', wsUrl);

        const ws = new WebSocket(wsUrl);

        ws.addEventListener('open', () => {
            console.log('WebSocket connected, sending auth...');
        }, { once: true });

        return ws;
    }

    formatMessage(content) {
        return JSON.stringify({
            content: content.trim(),
        });
    }

    parseMessage(data) {
        try {
            return JSON.parse(data);
        } catch (error) {
            console.error('Error parsing message:', error);
            return null;
        }
    }
}

export default new ChatService();