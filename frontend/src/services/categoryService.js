import axiosInstance from './api/axios.config';
import { API_ENDPOINTS } from '../config/api.config';

class CategoryService {
    async getCategoryById(categoryId) {
        try {
            const response = await axiosInstance.get(
                API_ENDPOINTS.CATEGORIES.GET_BY_ID(categoryId)
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }

    async searchCategories(params = {}) {
        try {
            const {
                search_text = '',
                limit = 10,
                offset = 0,
            } = params;

            const response = await axiosInstance.post(
                API_ENDPOINTS.CATEGORIES.SEARCH,
                {
                    search_text,
                    limit,
                    offset,
                }
            );
            return response.data || [];
        } catch (error) {
            throw error.response?.data || error;
        }
    }

    async getAllCategories() {
        return this.searchCategories({ search_text: ''});
    }
}

export default new CategoryService();