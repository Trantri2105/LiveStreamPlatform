import axios from 'axios';
import { CHAT_API_URL } from '../utils/constants.js';

const chatAxiosClient = axios.create({
    baseURL: CHAT_API_URL,
    headers:{
        'Content-Type': 'application/json',
    },
});

chatAxiosClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if(token){
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

chatAxiosClient.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error) => {
        return Promise.reject(error);
    }
)

export default chatAxiosClient;