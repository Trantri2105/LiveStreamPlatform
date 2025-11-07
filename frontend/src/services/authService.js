import axiosInstance from './api/axios.config';
import { API_ENDPOINTS, TOKEN_KEY } from '../config/api.config';

const setAuthCookie = (token) =>{
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);
    document.cookie = `access_token=${token}; expires=${expirationDate.toUTCString()}; path=/; SameSite=Lax;`;
};
const removeAuthCookie = () => {
    document.cookie = `access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax;`;
}
class AuthService {
    async register(userData) {
        try {
            const response = await axiosInstance.post(
                API_ENDPOINTS.AUTH.REGISTER,
                userData
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }

    async login(credentials) {
        try {
            const response = await axiosInstance.post(
                API_ENDPOINTS.AUTH.LOGIN,
                credentials
            );

            if (response.data.access_token) {
                localStorage.setItem(TOKEN_KEY, response.data.access_token);
                setAuthCookie(response.data.access_token)
            }

            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }

    async logout() {
        try {
            const response = await axiosInstance.post(API_ENDPOINTS.AUTH.LOGOUT);

            localStorage.removeItem(TOKEN_KEY);
            removeAuthCookie();
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }

    // Verify token
    async verify() {
        try {
            const response = await axiosInstance.get(API_ENDPOINTS.AUTH.VERIFY);
            const userId = response.headers['x-user-id'];
            const userRole = response.headers['x-user-role'];
            return {
                userId,
                role: userRole,
                isValid: true,
            }
        } catch (error) {
            throw error.response?.data || error;
        }
    }

    async refresh() {
        try {
            const response = await axiosInstance.post(API_ENDPOINTS.AUTH.REFRESH);

            if (response.data.access_token) {
                localStorage.setItem(TOKEN_KEY, response.data.access_token);
                setAuthCookie(response.data.access_token);
            }

            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }

    isAuthenticated() {
        return !!localStorage.getItem(TOKEN_KEY);
    }

    getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }
}

export default new AuthService();