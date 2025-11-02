import axiosInstance from "./api/axios.config";
import { API_ENDPOINTS} from "../config/api.config";

class UserService{
    async getMe(){
        try{
            const response  = await axiosInstance.get(API_ENDPOINTS.USERS.GET_ME)
            return response.data
        } catch (error){
            throw error.response?.data || error;
        }
    }

    async updateProfile(userData){
        try{
            const response = await axiosInstance.patch(
                API_ENDPOINTS.USERS.UPDATE_ME,
                userData
            );
            return response.data
        } catch (error) {
            throw error.response?.data || error;
        }
    }

    async changePassword(passwordData) {
        try {
            const response = await axiosInstance.put(
                API_ENDPOINTS.USERS.CHANGE_PASSWORD,
                passwordData
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }

    async getAllUsers() {
        try {
            const response = await axiosInstance.get(API_ENDPOINTS.USERS.GET_ALL);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }

    async getUserById(userId) {
        try {
            const response = await axiosInstance.get(
                API_ENDPOINTS.USERS.GET_BY_ID(userId)
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }
}

export default new UserService();