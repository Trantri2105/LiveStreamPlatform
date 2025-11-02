import axiosInstance from './api/axios.config';
import { API_ENDPOINTS, TOKEN_KEY } from '../config/api.config';

class AuthService {
    // Đăng ký
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

    // Đăng nhập
    async login(credentials) {
        try {
            const response = await axiosInstance.post(
                API_ENDPOINTS.AUTH.LOGIN,
                credentials
            );

            // Lưu token vào localStorage
            if (response.data.access_token) {
                localStorage.setItem(TOKEN_KEY, response.data.access_token);
            }

            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }

    // Đăng xuất
    async logout() {
        try {
            const response = await axiosInstance.post(API_ENDPOINTS.AUTH.LOGOUT);

            // Xóa token khỏi localStorage
            localStorage.removeItem(TOKEN_KEY);

            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }

    // Verify token
    async verify() {
        try {
            const response = await axiosInstance.get(API_ENDPOINTS.AUTH.VERIFY);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }

    // Refresh token
    async refresh() {
        try {
            const response = await axiosInstance.post(API_ENDPOINTS.AUTH.REFRESH);

            if (response.data.token) {
                localStorage.setItem(TOKEN_KEY, response.data.token);
            }

            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }

    // Kiểm tra đã đăng nhập chưa
    isAuthenticated() {
        return !!localStorage.getItem(TOKEN_KEY);
    }

    // Lấy token
    getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }
}

export default new AuthService();